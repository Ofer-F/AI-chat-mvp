import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';
import { MongoDBAtlasVectorSearch } from '@langchain/mongodb';
import { OpenAIEmbeddings } from '@langchain/openai';

type VectorStoreCollection = ConstructorParameters<
  typeof MongoDBAtlasVectorSearch
>[1]['collection'];

const DEFAULT_EMBEDDING_MODEL = 'text-embedding-3-small';
const DEFAULT_INDEX_NAME = 'knowledge_chunks_index';
const CHUNKS_COLLECTION = 'knowledge_chunks';
const TEXT_KEY = 'text';
const EMBEDDING_KEY = 'embedding';

@Injectable()
export class VectorStoreService {
  private readonly embeddings: OpenAIEmbeddings;
  private readonly indexName: string;

  constructor(
    config: ConfigService,
    @InjectConnection() private readonly connection: Connection,
  ) {
    const apiKey = config.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const model =
      config.get<string>('OPENAI_EMBEDDING_MODEL') ?? DEFAULT_EMBEDDING_MODEL;
    this.embeddings = new OpenAIEmbeddings({ apiKey, model });
    this.indexName =
      config.get<string>('ATLAS_VECTOR_INDEX') ?? DEFAULT_INDEX_NAME;
  }

  getEmbeddings(): OpenAIEmbeddings {
    return this.embeddings;
  }

  private getChunksCollection(): VectorStoreCollection {
    const db = this.connection.db;
    if (!db) {
      throw new Error('MongoDB connection is not initialized');
    }
    return db.collection(CHUNKS_COLLECTION) as unknown as VectorStoreCollection;
  }

  getVectorStore(): MongoDBAtlasVectorSearch {
    return new MongoDBAtlasVectorSearch(this.embeddings, {
      collection: this.getChunksCollection(),
      indexName: this.indexName,
      textKey: TEXT_KEY,
      embeddingKey: EMBEDDING_KEY,
    });
  }
}
