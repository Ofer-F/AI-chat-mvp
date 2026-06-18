import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import type { Conversation, PublicUser } from '../common/types/chat';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  async list(
    @CurrentUser() user: PublicUser,
  ): Promise<{ conversations: Conversation[] }> {
    return {
      conversations: await this.conversationsService.listForUser(user.id),
    };
  }

  @Post()
  async create(
    @CurrentUser() user: PublicUser,
    @Body() dto: CreateConversationDto,
  ): Promise<{ conversation: Conversation }> {
    return {
      conversation: await this.conversationsService.create(user.id, dto),
    };
  }
}
