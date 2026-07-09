import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

@Schema({ _id: false })
export class MessageCitation {
  @Prop({ type: String, required: true })
  id!: string;

  @Prop({ type: String, required: true })
  documentId!: string;

  @Prop({ type: String, required: true })
  documentName!: string;

  @Prop({ type: String, required: true })
  text!: string;

  @Prop({ type: Number, required: true })
  score!: number;
}

export const MessageCitationSchema =
  SchemaFactory.createForClass(MessageCitation);

export type MessageDocument = HydratedDocument<Message>;

@Schema({ collection: 'messages' })
export class Message {
  @Prop({ type: String, required: true })
  _id!: string;

  @Prop({ type: String, required: true })
  conversationId!: string;

  @Prop({ type: String, required: true })
  senderId!: string;

  @Prop({ type: String, required: true })
  body!: string;

  @Prop({ type: [MessageCitationSchema], default: undefined })
  citations?: MessageCitation[];

  @Prop({ type: Date, required: true, default: () => new Date() })
  createdAt!: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

MessageSchema.index({ conversationId: 1, createdAt: -1, _id: -1 });
