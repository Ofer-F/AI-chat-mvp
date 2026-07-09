import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Citation, Message } from '../common/types/chat';
import { ASSISTANT_SENDER_ID } from '../common/constants';
import { toMessageDto } from './mappers/message.mapper';
import { MessagesDbService } from './messages.db.service';
import { ConversationsService } from './conversations.service';

export interface MessagesPage {
  messages: Message[];
  nextCursor: string | null;
}

@Injectable()
export class MessagesService {
  constructor(
    private readonly messagesDb: MessagesDbService,
    private readonly conversationsService: ConversationsService,
  ) {}

  async listPage(
    conversationId: string,
    userId: string,
    cursor?: string,
    limit?: number,
  ): Promise<MessagesPage> {
    await this.conversationsService.assertParticipant(conversationId, userId);

    const { messages, nextCursor } = await this.messagesDb.listPage(
      conversationId,
      cursor,
      limit,
    );

    return { messages: messages.map((doc) => toMessageDto(doc)), nextCursor };
  }

  async create(
    conversationId: string,
    senderId: string,
    body: string,
  ): Promise<Message> {
    await this.conversationsService.assertParticipant(conversationId, senderId);

    const doc = await this.messagesDb.create({
      id: `m-${randomUUID()}`,
      conversationId,
      senderId,
      body,
    });

    return toMessageDto(doc);
  }

  async createAssistantMessage(
    conversationId: string,
    userId: string,
    body: string,
    citations?: Citation[],
  ): Promise<Message> {
    await this.conversationsService.assertParticipant(conversationId, userId);

    const doc = await this.messagesDb.create({
      id: `m-${randomUUID()}`,
      conversationId,
      senderId: ASSISTANT_SENDER_ID,
      body,
      citations,
    });

    return toMessageDto(doc);
  }
}
