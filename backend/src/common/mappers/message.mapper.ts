import type { Message } from '../types/chat';
import type { LastMessage } from '../../db/schemas/conversation.schema';
import type { MessageDocument } from '../../db/schemas/message.schema';

interface MessageParts {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: Date;
}

/** Single source of truth for the message DTO shape (ISO date, status:'sent'). */
function buildMessageDto(parts: MessageParts): Message {
  return {
    id: parts.id,
    conversationId: parts.conversationId,
    body: parts.body,
    senderId: parts.senderId,
    createdAt: parts.createdAt.toISOString(),
    status: 'sent',
  };
}

export function toMessageDto(doc: MessageDocument): Message {
  return buildMessageDto({
    id: doc._id,
    conversationId: doc.conversationId,
    senderId: doc.senderId,
    body: doc.body,
    createdAt: doc.createdAt,
  });
}

/** Maps the embedded `lastMessage` snapshot (uses `id`, not `_id`). */
export function toLastMessageDto(last: LastMessage): Message {
  return buildMessageDto({
    id: last.id,
    conversationId: last.conversationId,
    senderId: last.senderId,
    body: last.body,
    createdAt: last.createdAt,
  });
}
