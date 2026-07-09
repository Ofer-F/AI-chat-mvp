import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type JSX,
} from "react";
import { ApiError, knowledgeApiClient } from "../../api/apiClient";
import type { KnowledgeDocument } from "../../types/chat";

export function KnowledgePanel(): JSX.Element {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDocuments = useCallback(async (): Promise<void> => {
    setError(null);
    try {
      const response = await knowledgeApiClient.listDocuments();
      setDocuments(response.documents);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Could not load documents."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  async function handleUpload(
    event: ChangeEvent<HTMLInputElement>
  ): Promise<void> {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    try {
      const response = await knowledgeApiClient.uploadDocument(file);
      setDocuments((current) => [
        response.document,
        ...current.filter((document) => document.id !== response.document.id),
      ]);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Could not upload document."
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleDelete(documentId: string): Promise<void> {
    setError(null);
    try {
      await knowledgeApiClient.deleteDocument(documentId);
      setDocuments((current) =>
        current.filter((document) => document.id !== documentId)
      );
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Could not delete document."
      );
    }
  }

  return (
    <section className="knowledge-panel">
      <div className="knowledge-panel__header">
        <h3 className="knowledge-panel__title">Knowledge base</h3>
        <label className="btn knowledge-panel__upload">
          {isUploading ? "Uploading…" : "Upload document"}
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.pdf,text/plain,text/markdown,application/pdf"
            className="knowledge-panel__file-input"
            onChange={handleUpload}
            disabled={isUploading}
          />
        </label>
      </div>

      {error ? (
        <p className="auth__error" role="alert">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <p className="auth__hint">Loading documents…</p>
      ) : documents.length === 0 ? (
        <p className="auth__hint">
          No documents yet. Upload a .txt, .md, or .pdf to ground your tutor.
        </p>
      ) : (
        <ul className="knowledge-panel__list">
          {documents.map((document) => (
            <li key={document.id} className="knowledge-panel__item">
              <span className="knowledge-panel__name" title={document.name}>
                {document.name}
              </span>
              <span className="knowledge-panel__meta">
                {document.chunkCount} chunk
                {document.chunkCount === 1 ? "" : "s"}
              </span>
              <button
                type="button"
                className="btn knowledge-panel__delete"
                onClick={() => handleDelete(document.id)}
                aria-label={`Remove ${document.name}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
