import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  KnowledgeDocument,
  KnowledgeDocumentSchema,
} from './schemas/knowledge-document.schema';
import {
  KnowledgeChunk,
  KnowledgeChunkSchema,
} from './schemas/knowledge-chunk.schema';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeService } from './knowledge.service';
import { IngestionService } from './ingestion.service';
import { RetrievalService } from './retrieval.service';
import { VectorStoreService } from './vector-store';
import { KnowledgeDocumentsDbService } from './knowledge-documents.db.service';
import { KnowledgeChunksDbService } from './knowledge-chunks.db.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: KnowledgeDocument.name, schema: KnowledgeDocumentSchema },
      { name: KnowledgeChunk.name, schema: KnowledgeChunkSchema },
    ]),
  ],
  controllers: [KnowledgeController],
  providers: [
    KnowledgeService,
    IngestionService,
    RetrievalService,
    VectorStoreService,
    KnowledgeDocumentsDbService,
    KnowledgeChunksDbService,
  ],
  exports: [RetrievalService],
})
export class KnowledgeModule {}
