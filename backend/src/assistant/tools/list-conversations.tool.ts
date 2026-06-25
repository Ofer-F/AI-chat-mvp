import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { ConversationsService } from '../../conversations/conversations.service';
import type { AssistantTool } from './tool.types';

const parameters = z.object({});

const output = z.object({
  conversations: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      type: z.enum(['human', 'assistant']),
      updatedAt: z.string(),
      lastMessage: z.string().nullable(),
    }),
  ),
});

@Injectable()
export class ListConversationsTool implements AssistantTool<
  typeof parameters,
  typeof output
> {
  readonly name = 'list_my_conversations';
  readonly description =
    "List the current user's conversations (most recently active first).";
  readonly parameters = parameters;
  readonly output = output;

  constructor(private readonly conversations: ConversationsService) {}

  async execute(
    userId: string,
    _input: z.infer<typeof parameters>,
  ): Promise<z.infer<typeof output>> {
    const conversations = await this.conversations.listForUser(userId);

    return {
      conversations: conversations.map((conversation) => ({
        id: conversation.id,
        title: conversation.title,
        type: conversation.type,
        updatedAt: conversation.updatedAt,
        lastMessage: conversation.lastMessage?.body ?? null,
      })),
    };
  }
}
