import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Conversation } from './schemas/conversation.schema';
import type { ConversationDocument } from './schemas/conversation.schema';
import type { ConversationType } from '../common/types/chat';

export interface CreateConversationData {
  id: string;
  title: string;
  type: ConversationType;
  participantIds: string[];
}

export interface LastMessageSnapshot {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: Date;
}

@Injectable()
export class ConversationsDbService {
  constructor(
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<ConversationDocument>,
  ) {}

  async listForUser(userId: string): Promise<ConversationDocument[]> {
    return this.conversationModel
      .find({ participantIds: userId })
      .sort({ lastMessageAt: -1 })
      .exec();
  }

  async findById(id: string): Promise<ConversationDocument | null> {
    return this.conversationModel.findById(id).exec();
  }

  async findDirectConversation(
    participantIds: string[],
  ): Promise<ConversationDocument | null> {
    return this.conversationModel
      .findOne({ participantIds: { $all: participantIds, $size: 2 } })
      .exec();
  }

  async create(data: CreateConversationData): Promise<ConversationDocument> {
    const now = new Date();
    return this.conversationModel.create({
      _id: data.id,
      title: data.title,
      type: data.type,
      participantIds: data.participantIds,
      lastMessage: null,
      lastMessageAt: now,
      createdAt: now,
    });
  }

  async setLastMessage(
    conversationId: string,
    message: LastMessageSnapshot,
  ): Promise<ConversationDocument | null> {
    return this.conversationModel
      .findByIdAndUpdate(
        conversationId,
        { $set: { lastMessage: message, lastMessageAt: message.createdAt } },
        { new: true },
      )
      .exec();
  }
}
