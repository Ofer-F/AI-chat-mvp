import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import type { KnowledgeDocumentStatus } from '../../common/types/chat';

export type KnowledgeDocumentDocument = HydratedDocument<KnowledgeDocument>;

@Schema({ collection: 'knowledge_documents' })
export class KnowledgeDocument {
  @Prop({ type: String, required: true })
  _id!: string;

  @Prop({ type: String, required: true })
  userId!: string;

  @Prop({ type: String, required: true })
  name!: string;

  @Prop({ type: String, required: true })
  mimeType!: string;

  @Prop({ type: String, required: true })
  contentHash!: string;

  @Prop({ type: Number, required: true, default: 0 })
  chunkCount!: number;

  @Prop({ type: String, required: true, default: 'ready' })
  status!: KnowledgeDocumentStatus;

  @Prop({ type: Date, required: true, default: () => new Date() })
  createdAt!: Date;
}

export const KnowledgeDocumentSchema =
  SchemaFactory.createForClass(KnowledgeDocument);

KnowledgeDocumentSchema.index({ userId: 1, createdAt: -1 });
KnowledgeDocumentSchema.index({ userId: 1, contentHash: 1 });
