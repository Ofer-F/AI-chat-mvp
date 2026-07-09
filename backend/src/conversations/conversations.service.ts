import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Conversation, ConversationType } from '../common/types/chat';
import { toConversationDto } from './mappers/conversation.mapper';
import { CreateConversationDto } from './dto/create-conversation.dto';
import {
  ConversationsDbService,
  type LastMessageSnapshot,
} from './conversations.db.service';
import { MessagesDbService } from './messages.db.service';
import type { ConversationDocument } from './schemas/conversation.schema';
import { UsersService } from '../users/users.service';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly conversationsDb: ConversationsDbService,
    private readonly messagesDb: MessagesDbService,
    private readonly users: UsersService,
  ) {}

  async listForUser(userId: string): Promise<Conversation[]> {
    const docs = await this.conversationsDb.listForUser(userId);
    return docs.map((doc) => toConversationDto(doc));
  }

  async create(
    userId: string,
    input: CreateConversationDto,
  ): Promise<Conversation> {
    const title = input.title.trim();

    if (!title) {
      throw new BadRequestException('Conversation title is required');
    }

    const type: ConversationType = input.type ?? 'human';

    if (type === 'assistant' || type === 'tutor') {
      const doc = await this.conversationsDb.create({
        id: `c-${randomUUID()}`,
        title,
        type,
        participantIds: [userId],
      });

      return toConversationDto(doc);
    }

    const requestedParticipantIds = input.participantIds ?? [];
    const participantIds = [...new Set([userId, ...requestedParticipantIds])];

    if (participantIds.length < 2) {
      throw new BadRequestException(
        'A conversation needs at least one other participant',
      );
    }

    for (const id of participantIds) {
      if (!(await this.users.existsById(id))) {
        throw new NotFoundException(`User not found: ${id}`);
      }
    }

    if (participantIds.length === 2) {
      const duplicate =
        await this.conversationsDb.findDirectConversation(participantIds);
      if (duplicate) {
        throw new ConflictException(
          'A direct conversation between these participants already exists',
        );
      }
    }

    const doc = await this.conversationsDb.create({
      id: `c-${randomUUID()}`,
      title: title,
      type: 'human',
      participantIds,
    });

    return toConversationDto(doc);
  }

  async getForParticipant(
    conversationId: string,
    userId: string,
  ): Promise<Conversation> {
    const conversation = await this.conversationsDb.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException(`Conversation not found: ${conversationId}`);
    }
    if (!conversation.participantIds.includes(userId)) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }
    return toConversationDto(conversation);
  }

  async assertParticipant(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    await this.getForParticipant(conversationId, userId);
  }

  async deleteForUser(conversationId: string, userId: string): Promise<void> {
    await this.assertParticipant(conversationId, userId);
    await this.messagesDb.deleteByConversation(conversationId);
    await this.conversationsDb.deleteById(conversationId);
  }

  async setLastMessage(
    conversationId: string,
    snapshot: LastMessageSnapshot,
  ): Promise<ConversationDocument | null> {
    return this.conversationsDb.setLastMessage(conversationId, snapshot);
  }
}
