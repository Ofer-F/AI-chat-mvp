import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import type { ConversationType } from '../../common/types/chat';

@Schema({ _id: false })
export class LastMessage {
  @Prop({ type: String, required: true })
  id!: string;

  @Prop({ type: String, required: true })
  conversationId!: string;

  @Prop({ type: String, required: true })
  senderId!: string;

  @Prop({ type: String, required: true })
  body!: string;

  @Prop({ type: Date, required: true })
  createdAt!: Date;
}

export const LastMessageSchema = SchemaFactory.createForClass(LastMessage);

export type ConversationDocument = HydratedDocument<Conversation>;

@Schema({ collection: 'conversations' })
export class Conversation {
  @Prop({ type: String, required: true })
  _id!: string;

  @Prop({ type: String, required: true })
  title!: string;

  @Prop({ type: String, required: true, default: 'human' })
  type!: ConversationType;

  @Prop({ type: [String], required: true, default: [] })
  participantIds!: string[];

  @Prop({ type: LastMessageSchema, default: null })
  lastMessage!: LastMessage | null;

  @Prop({ type: Date, default: null })
  lastMessageAt!: Date | null;

  @Prop({ type: Date, required: true, default: () => new Date() })
  createdAt!: Date;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

ConversationSchema.index({ participantIds: 1, lastMessageAt: -1 });
