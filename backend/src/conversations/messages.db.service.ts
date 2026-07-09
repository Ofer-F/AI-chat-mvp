import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model, QueryFilter } from 'mongoose';
import { Message } from './schemas/message.schema';
import type { MessageDocument } from './schemas/message.schema';
import type { Citation } from '../common/types/chat';
import { ConversationsDbService } from './conversations.db.service';

const DEFAULT_MESSAGES_LIMIT = 20;
const DEFAULT_SEARCH_LIMIT = 20;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export interface CreateMessageData {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  citations?: Citation[];
}

export interface MessagesPageResult {
  messages: MessageDocument[];
  nextCursor: string | null;
}

@Injectable()
export class MessagesDbService {
  constructor(
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
    private readonly conversationsDb: ConversationsDbService,
  ) {}

  async listPage(
    conversationId: string,
    cursorId?: string,
    limit?: number,
  ): Promise<MessagesPageResult> {
    const pageSize = limit && limit > 0 ? limit : DEFAULT_MESSAGES_LIMIT;

    const filter: QueryFilter<MessageDocument> = { conversationId };

    if (cursorId) {
      const cursor = await this.messageModel
        .findOne({ _id: cursorId, conversationId })
        .select('createdAt')
        .lean<Pick<Message, '_id' | 'createdAt'>>()
        .exec();
      if (cursor) {
        filter.$or = [
          { createdAt: { $lt: cursor.createdAt } },
          { createdAt: cursor.createdAt, _id: { $lt: cursorId } },
        ];
      }
    }

    const newestFirst = await this.messageModel
      .find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(pageSize + 1)
      .exec();

    const hasMore = newestFirst.length > pageSize;
    const page = hasMore ? newestFirst.slice(0, pageSize) : newestFirst;
    const messages = page.reverse();

    const nextCursor = hasMore && messages.length > 0 ? messages[0]._id : null;

    return { messages, nextCursor };
  }

  async searchByUser(
    userId: string,
    query: string,
    limit?: number,
  ): Promise<MessageDocument[]> {
    const trimmed = query.trim();
    if (!trimmed) {
      return [];
    }

    const conversationIds =
      await this.conversationsDb.listConversationIdsForUser(userId);
    if (conversationIds.length === 0) {
      return [];
    }

    const pageSize = limit && limit > 0 ? limit : DEFAULT_SEARCH_LIMIT;
    const pattern = new RegExp(escapeRegExp(trimmed), 'i');

    return this.messageModel
      .find({ conversationId: { $in: conversationIds }, body: pattern })
      .sort({ createdAt: -1, _id: -1 })
      .limit(pageSize)
      .exec();
  }

  async create(data: CreateMessageData): Promise<MessageDocument> {
    const now = new Date();
    const message = await this.messageModel.create({
      _id: data.id,
      conversationId: data.conversationId,
      senderId: data.senderId,
      body: data.body,
      citations:
        data.citations && data.citations.length > 0
          ? data.citations
          : undefined,
      createdAt: now,
    });

    await this.conversationsDb.setLastMessage(data.conversationId, {
      id: message._id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      body: message.body,
      createdAt: message.createdAt,
    });

    return message;
  }

  async deleteByConversation(conversationId: string): Promise<void> {
    await this.messageModel.deleteMany({ conversationId }).exec();
  }
}
