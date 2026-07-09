import type { Citation, Message } from '../../common/types/chat';
import type { LastMessage } from '../schemas/conversation.schema';
import type {
  MessageCitation,
  MessageDocument,
} from '../schemas/message.schema';

interface MessageParts {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: Date;
  citations?: MessageCitation[];
}

function toCitationDto(citation: MessageCitation): Citation {
  return {
    id: citation.id,
    documentId: citation.documentId,
    documentName: citation.documentName,
    text: citation.text,
    score: citation.score,
  };
}

function buildMessageDto(parts: MessageParts): Message {
  const dto: Message = {
    id: parts.id,
    conversationId: parts.conversationId,
    body: parts.body,
    senderId: parts.senderId,
    createdAt: parts.createdAt.toISOString(),
    status: 'sent',
  };
  if (parts.citations && parts.citations.length > 0) {
    dto.citations = parts.citations.map(toCitationDto);
  }
  return dto;
}

export function toMessageDto(doc: MessageDocument): Message {
  return buildMessageDto({
    id: doc._id,
    conversationId: doc.conversationId,
    senderId: doc.senderId,
    body: doc.body,
    createdAt: doc.createdAt,
    citations: doc.citations,
  });
}

export function toLastMessageDto(last: LastMessage): Message {
  return buildMessageDto({
    id: last.id,
    conversationId: last.conversationId,
    senderId: last.senderId,
    body: last.body,
    createdAt: last.createdAt,
  });
}
