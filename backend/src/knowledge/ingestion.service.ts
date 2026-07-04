import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { parseDocument } from './parsers/parse-document';
import { VectorStoreService } from './vector-store';
import { KnowledgeDocumentsDbService } from './knowledge-documents.db.service';
import {
  KnowledgeChunksDbService,
  type KnowledgeChunkData,
} from './knowledge-chunks.db.service';
import type { KnowledgeDocument } from '../common/types/chat';
import { toKnowledgeDocumentDto } from './mappers/knowledge-document.mapper';

const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 150;

export interface IngestDocumentInput {
  userId: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}

@Injectable()
export class IngestionService {
  constructor(
    private readonly documentsDb: KnowledgeDocumentsDbService,
    private readonly chunksDb: KnowledgeChunksDbService,
    private readonly vectorStore: VectorStoreService,
  ) {}

  async ingest(input: IngestDocumentInput): Promise<KnowledgeDocument> {
    const text = await this.extractText(input.mimeType, input.buffer);
    const contentHash = this.computeContentHash(text);

    const existing = await this.documentsDb.findDuplicate(
      input.userId,
      contentHash,
    );
    if (existing) {
      return toKnowledgeDocumentDto(existing);
    }

    const documentId = this.buildDocumentId(input.userId, contentHash);

    const chunks = await this.chunkAndEmbed(
      input.userId,
      documentId,
      input.fileName,
      text,
    );

    await this.chunksDb.upsertMany(chunks);

    const document = await this.documentsDb.upsert({
      documentId,
      userId: input.userId,
      fileName: input.fileName,
      mimeType: input.mimeType,
      contentHash,
      chunkCount: chunks.length,
    });
    return toKnowledgeDocumentDto(document);
  }

  private async chunkAndEmbed(
    userId: string,
    documentId: string,
    documentName: string,
    text: string,
  ): Promise<KnowledgeChunkData[]> {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: CHUNK_SIZE,
      chunkOverlap: CHUNK_OVERLAP,
    });
    const chunkTexts = await splitter.splitText(text);
    if (chunkTexts.length === 0) {
      return [];
    }

    const embeddings = await this.vectorStore
      .getEmbeddings()
      .embedDocuments(chunkTexts);

    const createdAt = new Date();
    return chunkTexts.map((chunkText, chunkIndex) => ({
      _id: `${documentId}-${chunkIndex}`,
      userId,
      documentId,
      documentName,
      chunkIndex,
      text: chunkText,
      embedding: embeddings[chunkIndex],
      createdAt,
    }));
  }

  private buildDocumentId(userId: string, contentHash: string): string {
    const digest = createHash('sha256')
      .update(`${userId}:${contentHash}`)
      .digest('hex')
      .slice(0, 32);
    return `kd-${digest}`;
  }

  private extractText(mimeType: string, buffer: Buffer): Promise<string> {
    return parseDocument(mimeType, buffer);
  }

  private computeContentHash(text: string): string {
    return createHash('sha256').update(text, 'utf8').digest('hex');
  }
}
