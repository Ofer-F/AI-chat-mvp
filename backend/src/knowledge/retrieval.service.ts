import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Citation } from '../common/types/chat';
import { VectorStoreService } from './vector-store';

const DEFAULT_TOP_K = 4;

interface ChunkMetadata {
  _id: string;
  documentId: string;
  documentName: string;
  chunkIndex: number;
  userId: string;
}

@Injectable()
export class RetrievalService {
  private readonly topK: number;

  constructor(
    config: ConfigService,
    private readonly vectorStore: VectorStoreService,
  ) {
    const configured = Number(config.get<string>('RAG_TOP_K'));
    this.topK =
      Number.isFinite(configured) && configured > 0
        ? configured
        : DEFAULT_TOP_K;
  }

  async retrieve(userId: string, query: string): Promise<Citation[]> {
    const store = this.vectorStore.getVectorStore();
    const results = await store.similaritySearchWithScore(query, this.topK, {
      preFilter: { userId },
    });

    return results.map(([document, score]) => {
      const metadata = document.metadata as ChunkMetadata;
      return {
        id: metadata._id,
        documentId: metadata.documentId,
        documentName: metadata.documentName,
        text: document.pageContent,
        score,
      };
    });
  }
}
