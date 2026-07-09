import { tool } from '@langchain/core/tools';
import type { StructuredToolInterface } from '@langchain/core/tools';
import { z } from 'zod';
import type { Citation } from '../../common/types/chat';
import type { ConversationsService } from '../../conversations/conversations.service';
import type { MessagesService } from '../../conversations/messages.service';
import type { RetrievalService } from '../../knowledge/retrieval.service';

export const AGENT_TOOL_NAMES = {
  retrieveKnowledge: 'retrieve_knowledge',
  searchMyMessages: 'search_my_messages',
  listMyConversations: 'list_my_conversations',
} as const;

export type AgentToolName =
  (typeof AGENT_TOOL_NAMES)[keyof typeof AGENT_TOOL_NAMES];

/**
 * Everything the agent tools need. `userId` is captured here and bound into
 * each tool closure so it is NEVER a model-controlled argument — this preserves
 * the per-user authorization rule carried forward from earlier weeks.
 */
export interface AgentToolDeps {
  userId: string;
  retrievalService: RetrievalService;
  messagesService: MessagesService;
  conversationsService: ConversationsService;
}

export interface AgentTools {
  all: StructuredToolInterface[];
  byName: Map<string, StructuredToolInterface>;
}

const retrieveKnowledgeSchema = z.object({
  query: z
    .string()
    .min(1)
    .describe('The knowledge question to look up in the user documents.'),
});

const searchMyMessagesSchema = z.object({
  query: z
    .string()
    .min(1)
    .describe('Text to search for across the user own chat messages.'),
  limit: z
    .number()
    .int()
    .positive()
    .max(50)
    .optional()
    .describe('Maximum number of matching messages to return (default 20).'),
});

const listMyConversationsSchema = z.object({});

function formatCitationsForModel(citations: Citation[]): string {
  if (citations.length === 0) {
    return 'No relevant passages were found in the user documents.';
  }
  return citations
    .map(
      (citation, index) =>
        `Source ${index + 1} (${citation.documentName}):\n${citation.text}`,
    )
    .join('\n\n');
}

export function createAgentTools(deps: AgentToolDeps): AgentTools {
  const retrieveKnowledge = tool(
    async ({ query }): Promise<[string, Citation[]]> => {
      const citations = await deps.retrievalService.retrieve(
        deps.userId,
        query,
      );
      return [formatCitationsForModel(citations), citations];
    },
    {
      name: AGENT_TOOL_NAMES.retrieveKnowledge,
      description:
        'Retrieve grounded passages from the user uploaded documents. Use this whenever the question needs factual knowledge from their materials. Returns numbered sources plus citation metadata.',
      schema: retrieveKnowledgeSchema,
      responseFormat: 'content_and_artifact',
    },
  );

  const searchMyMessages = tool(
    async ({ query, limit }): Promise<string> => {
      const messages = await deps.messagesService.searchByUser(
        deps.userId,
        query,
        limit,
      );
      return JSON.stringify({
        messages: messages.map((message) => ({
          id: message.id,
          conversationId: message.conversationId,
          senderId: message.senderId,
          body: message.body,
          createdAt: message.createdAt,
        })),
      });
    },
    {
      name: AGENT_TOOL_NAMES.searchMyMessages,
      description:
        "Search the text of the user's own chat messages across all of their conversations. Use this to recall what the user said earlier.",
      schema: searchMyMessagesSchema,
    },
  );

  const listMyConversations = tool(
    async (): Promise<string> => {
      const conversations = await deps.conversationsService.listForUser(
        deps.userId,
      );
      return JSON.stringify({
        conversations: conversations.map((conversation) => ({
          id: conversation.id,
          title: conversation.title,
          type: conversation.type,
          updatedAt: conversation.updatedAt,
          lastMessage: conversation.lastMessage?.body ?? null,
        })),
      });
    },
    {
      name: AGENT_TOOL_NAMES.listMyConversations,
      description:
        "List the user's conversations (most recently active first), including id, title, type, and last message.",
      schema: listMyConversationsSchema,
    },
  );

  const all: StructuredToolInterface[] = [
    retrieveKnowledge,
    searchMyMessages,
    listMyConversations,
  ];

  return {
    all,
    byName: new Map(
      all.map((toolInstance) => [toolInstance.name, toolInstance]),
    ),
  };
}
