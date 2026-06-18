import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Message } from '../common/types/chat';
import { toMessageDto } from '../common/mappers';
import { MessagesDbService } from '../db/services/messages.db.service';
import { ConversationsDbService } from '../db/services/conversations.db.service';
import type { ConversationDocument } from '../db/schemas/conversation.schema';

export interface MessagesPage {
  messages: Message[];
  nextCursor: string | null;
}

@Injectable()
export class MessagesService {
  constructor(
    private readonly messagesDb: MessagesDbService,
    private readonly conversationsDb: ConversationsDbService,
  ) {}

  async listPage(
    conversationId: string,
    userId: string,
    cursor?: string,
    limit?: number,
  ): Promise<MessagesPage> {
    await this.assertParticipant(conversationId, userId);

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
    await this.assertParticipant(conversationId, senderId);

    const doc = await this.messagesDb.create({
      id: `m-${randomUUID()}`,
      conversationId,
      senderId,
      body,
    });

    return toMessageDto(doc);
  }

  private async assertParticipant(
    conversationId: string,
    userId: string,
  ): Promise<ConversationDocument> {
    const conversation = await this.conversationsDb.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException(`Conversation not found: ${conversationId}`);
    }
    if (!conversation.participantIds.includes(userId)) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }
    return conversation;
  }
}
