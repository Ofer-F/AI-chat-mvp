import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export type KnowledgeChunkDocument = HydratedDocument<KnowledgeChunk>;

@Schema({ collection: 'knowledge_chunks' })
export class KnowledgeChunk {
  @Prop({ type: String, required: true })
  _id!: string;

  @Prop({ type: String, required: true })
  userId!: string;

  @Prop({ type: String, required: true })
  documentId!: string;

  @Prop({ type: String, required: true })
  documentName!: string;

  @Prop({ type: Number, required: true })
  chunkIndex!: number;

  @Prop({ type: String, required: true })
  text!: string;

  @Prop({ type: [Number], required: true })
  embedding!: number[];

  @Prop({ type: Date, required: true, default: () => new Date() })
  createdAt!: Date;
}

export const KnowledgeChunkSchema =
  SchemaFactory.createForClass(KnowledgeChunk);

KnowledgeChunkSchema.index({ userId: 1, documentId: 1 });
