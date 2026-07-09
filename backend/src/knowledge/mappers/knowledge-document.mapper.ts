import type { KnowledgeDocument } from '../../common/types/chat';
import type { KnowledgeDocumentDocument } from '../schemas/knowledge-document.schema';

/** Maps a stored knowledge document to its public shape (DB doc in, DTO out). */
export function toKnowledgeDocumentDto(
  doc: KnowledgeDocumentDocument,
): KnowledgeDocument {
  return {
    id: doc._id,
    name: doc.name,
    mimeType: doc.mimeType,
    chunkCount: doc.chunkCount,
    status: doc.status,
    createdAt: doc.createdAt.toISOString(),
  };
}
