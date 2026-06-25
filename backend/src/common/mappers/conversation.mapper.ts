import type { Conversation } from '../types/chat';
import type { ConversationDocument } from '../../conversations/schemas/conversation.schema';
import { toLastMessageDto } from './message.mapper';

export function toConversationDto(doc: ConversationDocument): Conversation {
  return {
    id: doc._id,
    title: doc.title,
    type: doc.type,
    participantIds: doc.participantIds,
    lastMessage: doc.lastMessage ? toLastMessageDto(doc.lastMessage) : null,
    updatedAt: (doc.lastMessageAt ?? doc.createdAt).toISOString(),
  };
}
