import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import {
  AIMessageChunk,
  HumanMessage,
  type MessageContentComplex,
} from '@langchain/core/messages';
import type { Citation } from '../../common/types/chat';
import { ConversationsService } from '../../conversations/conversations.service';
import { MessagesService } from '../../conversations/messages.service';
import { RetrievalService } from '../../knowledge/retrieval.service';
import { AgentCheckpointerService } from './checkpointer';
import { buildAgentGraph } from './graph';
import type { AgentState } from './state';
import { createAgentTools } from './tools';

const DEFAULT_MODEL = 'gpt-4o-mini';

export interface AgentEmitter {
  emitDelta(text: string): void;
  emitToolCall(toolName: string): void;
  emitToolResult(toolName: string): void;
}

export interface TutorAgentResult {
  text: string;
  citations: Citation[];
}

function chunkText(chunk: AIMessageChunk): string {
  const { content } = chunk;
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

@Injectable()
export class TutorAgentService {
  private readonly llm: ChatOpenAI;

  constructor(
    config: ConfigService,
    private readonly retrieval: RetrievalService,
    private readonly messages: MessagesService,
    private readonly conversations: ConversationsService,
    private readonly checkpointer: AgentCheckpointerService,
  ) {
    const apiKey = config.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    const model = config.get<string>('OPENAI_MODEL') ?? DEFAULT_MODEL;
    this.llm = new ChatOpenAI({ apiKey, model, streaming: true });
  }

  async run(
    conversationId: string,
    userId: string,
    body: string,
    emit: AgentEmitter,
  ): Promise<TutorAgentResult> {
    const tools = createAgentTools({
      userId,
      retrievalService: this.retrieval,
      messagesService: this.messages,
      conversationsService: this.conversations,
    });

    const graph = buildAgentGraph({
      llm: this.llm,
      tools,
      checkpointer: this.checkpointer.getSaver(),
    });

    // thread_id = conversationId so a killed/restarted server resumes here.
    const config = { configurable: { thread_id: conversationId } };
    const input = {
      messages: [new HumanMessage(body)],
      userId,
      question: body,
    };

    let answerText = '';
    const events = graph.streamEvents(input, { ...config, version: 'v2' });
    for await (const event of events) {
      if (event.event === 'on_chat_model_stream') {
        const metadata = event.metadata as { langgraph_node?: unknown };
        if (metadata.langgraph_node !== 'answer') {
          continue;
        }
        const data = event.data as { chunk?: unknown };
        if (data.chunk instanceof AIMessageChunk) {
          const text = chunkText(data.chunk as AIMessageChunk);
          if (text) {
            answerText += text;
            emit.emitDelta(text);
          }
        }
      } else if (event.event === 'on_tool_start') {
        emit.emitToolCall(event.name);
      } else if (event.event === 'on_tool_end') {
        emit.emitToolResult(event.name);
      }
    }

    const snapshot = await graph.getState(config);
    const values = snapshot.values as Partial<AgentState>;
    const citations = Array.isArray(values.citations) ? values.citations : [];

    return { text: answerText, citations };
  }
}
