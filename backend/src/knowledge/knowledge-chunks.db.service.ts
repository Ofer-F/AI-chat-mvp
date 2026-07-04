import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { AnyBulkWriteOperation, Model } from 'mongoose';
import {
  KnowledgeChunk,
  type KnowledgeChunkDocument,
} from './schemas/knowledge-chunk.schema';

export interface KnowledgeChunkData {
  _id: string;
  userId: string;
  documentId: string;
  documentName: string;
  chunkIndex: number;
  text: string;
  embedding: number[];
  createdAt: Date;
}

@Injectable()
export class KnowledgeChunksDbService {
  constructor(
    @InjectModel(KnowledgeChunk.name)
    private readonly chunkModel: Model<KnowledgeChunkDocument>,
  ) {}

  async upsertMany(chunks: KnowledgeChunkData[]): Promise<void> {
    if (chunks.length === 0) {
      return;
    }

    const operations: AnyBulkWriteOperation<KnowledgeChunkDocument>[] =
      chunks.map((chunk) => ({
        updateOne: {
          filter: { _id: chunk._id },
          update: { $set: chunk },
          upsert: true,
        },
      }));

    await this.chunkModel.bulkWrite(operations);
  }

  async deleteByDocument(userId: string, documentId: string): Promise<void> {
    await this.chunkModel.deleteMany({ userId, documentId }).exec();
  }
}
