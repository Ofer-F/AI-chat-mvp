import { Injectable, NotFoundException } from '@nestjs/common';
import type { KnowledgeDocument } from '../common/types/chat';
import { toKnowledgeDocumentDto } from './mappers/knowledge-document.mapper';
import {
  IngestionService,
  type IngestDocumentInput,
} from './ingestion.service';
import { KnowledgeDocumentsDbService } from './knowledge-documents.db.service';
import { KnowledgeChunksDbService } from './knowledge-chunks.db.service';

@Injectable()
export class KnowledgeService {
  constructor(
    private readonly ingestion: IngestionService,
    private readonly documentsDb: KnowledgeDocumentsDbService,
    private readonly chunksDb: KnowledgeChunksDbService,
  ) {}

  ingestDocument(input: IngestDocumentInput): Promise<KnowledgeDocument> {
    return this.ingestion.ingest(input);
  }

  async listDocuments(userId: string): Promise<KnowledgeDocument[]> {
    const docs = await this.documentsDb.listForUser(userId);
    return docs.map((doc) => toKnowledgeDocumentDto(doc));
  }

  async deleteDocument(userId: string, documentId: string): Promise<void> {
    const deleted = await this.documentsDb.deleteOwned(userId, documentId);
    if (!deleted) {
      throw new NotFoundException(
        `Knowledge document not found: ${documentId}`,
      );
    }
    await this.chunksDb.deleteByDocument(userId, documentId);
  }
}
