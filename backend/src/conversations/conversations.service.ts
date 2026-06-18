import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Conversation } from '../common/types/chat';
import { toConversationDto } from '../common/mappers';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { ConversationsDbService } from '../db/services/conversations.db.service';
import { UsersDbService } from '../db/services/users.db.service';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly conversationsDb: ConversationsDbService,
    private readonly usersDb: UsersDbService,
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
    const participantIds = [...new Set([userId, ...input.participantIds])];

    if (!title) {
      throw new BadRequestException('Conversation title is required');
    }

    if (participantIds.length < 2) {
      throw new BadRequestException(
        'A conversation needs at least one other participant',
      );
    }

    for (const id of participantIds) {
      if (!(await this.usersDb.findById(id))) {
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
      title: input.title,
      participantIds,
    });

    return toConversationDto(doc);
  }
}
