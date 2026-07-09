export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

export type PublicUser = Pick<User, 'id' | 'name' | 'email'>;

export type MessageStatus = 'sent' | 'pending' | 'failed';

export interface Citation {
  id: string;
  documentId: string;
  documentName: string;
  text: string;
  score: number;
}

export interface Message {
  id: string;
  conversationId: string;
  body: string;
  senderId: string;
  createdAt: string;
  status: MessageStatus;
  citations?: Citation[];
}

export type ConversationType = 'human' | 'assistant' | 'tutor';

export interface Conversation {
  id: string;
  title: string;
  type: ConversationType;
  participantIds: string[];
  lastMessage: Message | null;
  updatedAt: string;
}

export type KnowledgeDocumentStatus = 'ready' | 'failed';

export interface KnowledgeDocument {
  id: string;
  name: string;
  mimeType: string;
  chunkCount: number;
  status: KnowledgeDocumentStatus;
  createdAt: string;
}
