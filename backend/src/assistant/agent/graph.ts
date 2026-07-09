import { randomUUID } from 'node:crypto';
import { StateGraph, START, END } from '@langchain/langgraph';
import type { BaseCheckpointSaver } from '@langchain/langgraph';
import {
  AIMessage,
  SystemMessage,
  ToolMessage,
  isAIMessage,
  type AIMessageChunk,
  type BaseMessage,
  type MessageContentComplex,
  type ToolCall,
} from '@langchain/core/messages';
import type { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import type { Citation } from '../../common/types/chat';
import { AgentStateAnnotation } from './state';
import type { AgentRoute, AgentState, AgentStateUpdate } from './state';
import { AGENT_TOOL_NAMES } from './tools';
import type { AgentTools } from './tools';

export interface AgentGraphDeps {
  llm: ChatOpenAI;
  tools: AgentTools;
  checkpointer: BaseCheckpointSaver;
}

const ROUTE_SYSTEM_PROMPT = [
  'You are the router for a study-tutor agent. Decide the single next action',
  'based on the conversation so far (including any tool results already present).',
  '',
  "- 'retrieve_knowledge': the user needs facts grounded in their uploaded documents.",
  "- 'search_my_messages': the user asks about something they said earlier in their chats.",
  "- 'list_my_conversations': the user asks what conversations they have.",
  "- 'answer': you already have enough information to reply directly.",
  '',
  "Provide 'query' for retrieve_knowledge and search_my_messages.",
].join('\n');

const TUTOR_ANSWER_PROMPT = [
  'You are a study tutor helping the user understand their own uploaded documents.',
  'Answer using ONLY the information in the provided context and any tool results.',
  "If the answer is not contained there, say you couldn't find it in their documents",
  'and do not rely on outside knowledge.',
  'Cite sources by their number (e.g. [1], [2]) where relevant.',
  'Be concise and clear, and explain things in plain language.',
].join('\n');

const ASSISTANT_ANSWER_PROMPT = [
  "You are a helpful assistant with access to the user's own chat data via tools.",
  'Use any tool results already in the conversation to answer accurately and concisely.',
].join('\n');

const routeDecisionSchema = z.object({
  action: z
    .enum([
      AGENT_TOOL_NAMES.retrieveKnowledge,
      AGENT_TOOL_NAMES.searchMyMessages,
      AGENT_TOOL_NAMES.listMyConversations,
      'answer',
    ])
    .describe('The single next action to take.'),
  query: z
    .string()
    .optional()
    .describe(
      'The query for retrieve_knowledge or search_my_messages, if applicable.',
    ),
});

function findPendingToolCall(state: AgentState, name: string) {
  const lastMessage = state.messages.at(-1);
  if (!lastMessage || !isAIMessage(lastMessage)) {
    return undefined;
  }
  return lastMessage.tool_calls?.find((call) => call.name === name);
}

function extractCitations(message: ToolMessage): Citation[] {
  const artifact: unknown = message.artifact;
  return Array.isArray(artifact) ? (artifact as Citation[]) : [];
}

function formatContext(citations: Citation[]): string {
  return citations
    .map(
      (citation, index) =>
        `Source ${index + 1} (${citation.documentName}):\n${citation.text}`,
    )
    .join('\n\n');
}

function getMessageText(message: BaseMessage): string {
  const { content } = message;
  if (typeof content === 'string') {
    return content;
  }
  return (content as MessageContentComplex[])
    .map((part) => {
      const text = (part as { text?: unknown }).text;
      return part.type === 'text' && typeof text === 'string' ? text : '';
    })
    .join('');
}

/**
 * Builds and compiles the tutor agent's LangGraph state graph.
 *
 * Topology (see the PR diagram):
 *   START → route
 *   route ─(retrieve)→ retrieve → answer → END
 *   route ─(tool)────→ tool_call → tool_result → route
 *   route ─(answer)──→ answer → END
 */
export function buildAgentGraph(deps: AgentGraphDeps) {
  const { llm, tools, checkpointer } = deps;

  // C.8 — structured LLM decision. The router chooses one action and, when a
  // tool is needed, emits an AIMessage carrying the tool call so the tool nodes
  // (which read `tool_calls`) can execute it and keep the history OpenAI-valid.
  const routeNode = async (state: AgentState): Promise<AgentStateUpdate> => {
    const router = llm.withStructuredOutput(routeDecisionSchema, {
      name: 'route_decision',
    });
    const decision = await router.invoke([
      new SystemMessage(ROUTE_SYSTEM_PROMPT),
      ...state.messages,
    ]);

    if (decision.action === 'answer') {
      return { route: 'answer', lastToolCall: null };
    }

    const toolName = decision.action;
    const query =
      decision.query && decision.query.trim().length > 0
        ? decision.query
        : state.question;
    const args: Record<string, unknown> =
      toolName === AGENT_TOOL_NAMES.listMyConversations ? {} : { query };

    const toolCall: ToolCall = {
      id: `call_${randomUUID()}`,
      name: toolName,
      args,
      type: 'tool_call',
    };
    const aiMessage = new AIMessage({ content: '', tool_calls: [toolCall] });
    const route: AgentRoute =
      toolName === AGENT_TOOL_NAMES.retrieveKnowledge ? 'retrieve' : 'tool';

    return {
      messages: [aiMessage],
      route,
      lastToolCall: { name: toolName, args },
    };
  };

  const retrieveNode = async (state: AgentState): Promise<AgentStateUpdate> => {
    const toolCall = findPendingToolCall(
      state,
      AGENT_TOOL_NAMES.retrieveKnowledge,
    );
    if (!toolCall) {
      return { route: 'answer' };
    }
    const toolInstance = tools.byName.get(toolCall.name);
    if (!toolInstance) {
      return { route: 'answer' };
    }
    const result: unknown = await toolInstance.invoke(toolCall);
    if (!(result instanceof ToolMessage)) {
      return { route: 'answer', lastToolCall: null };
    }
    const toolMessage = result as ToolMessage;
    return {
      messages: [toolMessage],
      citations: extractCitations(toolMessage),
      lastToolCall: null,
    };
  };

  const toolCallNode = async (state: AgentState): Promise<AgentStateUpdate> => {
    const lastMessage = state.messages.at(-1);
    if (!lastMessage || !isAIMessage(lastMessage)) {
      return {};
    }
    const toolCalls = lastMessage.tool_calls ?? [];
    const messages: BaseMessage[] = [];
    for (const call of toolCalls) {
      const toolInstance = tools.byName.get(call.name);
      if (!toolInstance) {
        continue;
      }
      const result: unknown = await toolInstance.invoke(call);
      if (result instanceof ToolMessage) {
        messages.push(result as ToolMessage);
      }
    }
    return { messages, lastToolCall: null };
  };

  const toolResultNode = (_state: AgentState): AgentStateUpdate => {
    // Join point after tool execution; loops back to `route` so the agent can
    // decide whether it needs another tool or is ready to answer.
    return {};
  };

  // C.9 — streaming answer. Tokens stream through the model call (captured by
  // the outer runner via streamMode: 'messages' in Phase E); citations are
  // formatted into the grounding context and surface on the final message.
  const answerNode = async (state: AgentState): Promise<AgentStateUpdate> => {
    const system =
      state.citations.length > 0
        ? `${TUTOR_ANSWER_PROMPT}\n\nContext:\n${formatContext(state.citations)}`
        : ASSISTANT_ANSWER_PROMPT;
    const messages: BaseMessage[] = [
      new SystemMessage(system),
      ...state.messages,
    ];

    const stream = await llm.stream(messages);
    let accumulated: AIMessageChunk | undefined;
    for await (const chunk of stream) {
      accumulated = accumulated ? accumulated.concat(chunk) : chunk;
    }

    const content = accumulated ? getMessageText(accumulated) : '';
    return { messages: [new AIMessage({ content })] };
  };

  const selectRoute = (
    state: AgentState,
  ): 'retrieve' | 'tool_call' | 'answer' => {
    if (state.route === 'retrieve') {
      return 'retrieve';
    }
    if (state.route === 'tool') {
      return 'tool_call';
    }
    return 'answer';
  };

  const graph = new StateGraph(AgentStateAnnotation)
    .addNode('route', routeNode)
    .addNode('retrieve', retrieveNode)
    .addNode('tool_call', toolCallNode)
    .addNode('tool_result', toolResultNode)
    .addNode('answer', answerNode)
    .addEdge(START, 'route')
    .addConditionalEdges('route', selectRoute, {
      retrieve: 'retrieve',
      tool_call: 'tool_call',
      answer: 'answer',
    })
    .addEdge('retrieve', 'answer')
    .addEdge('tool_call', 'tool_result')
    .addEdge('tool_result', 'route')
    .addEdge('answer', END);

  return graph.compile({ checkpointer });
}
