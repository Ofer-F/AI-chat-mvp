import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import {
  KnowledgeDocument,
  type KnowledgeDocumentDocument,
} from './schemas/knowledge-document.schema';

export interface UpsertKnowledgeDocumentData {
  documentId: string;
  userId: string;
  fileName: string;
  mimeType: string;
  contentHash: string;
  chunkCount: number;
}

@Injectable()
export class KnowledgeDocumentsDbService {
  constructor(
    @InjectModel(KnowledgeDocument.name)
    private readonly documentModel: Model<KnowledgeDocumentDocument>,
  ) {}

  async findDuplicate(
    userId: string,
    contentHash: string,
  ): Promise<KnowledgeDocumentDocument | null> {
    return this.documentModel.findOne({ userId, contentHash }).exec();
  }

  async listForUser(userId: string): Promise<KnowledgeDocumentDocument[]> {
    return this.documentModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  async deleteOwned(userId: string, documentId: string): Promise<boolean> {
    const result = await this.documentModel
      .deleteOne({ _id: documentId, userId })
      .exec();
    return result.deletedCount > 0;
  }

  async upsert(
    data: UpsertKnowledgeDocumentData,
  ): Promise<KnowledgeDocumentDocument> {
    const doc = await this.documentModel
      .findOneAndUpdate(
        { _id: data.documentId },
        {
          $set: {
            _id: data.documentId,
            userId: data.userId,
            name: data.fileName,
            mimeType: data.mimeType,
            contentHash: data.contentHash,
            chunkCount: data.chunkCount,
            status: 'ready',
          },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true, new: true },
      )
      .exec();

    if (!doc) {
      throw new Error('Failed to persist knowledge document');
    }
    return doc;
  }
}
