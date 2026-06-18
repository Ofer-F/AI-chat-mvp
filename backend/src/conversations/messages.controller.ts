import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MessagesService, type MessagesPage } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { GetMessagesQueryDto } from './dto/get-messages-query.dto';
import type { Message, PublicUser } from '../common/types/chat';

@Controller('conversations/:id/messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  async list(
    @CurrentUser() user: PublicUser,
    @Param('id') conversationId: string,
    @Query() query: GetMessagesQueryDto,
  ): Promise<MessagesPage> {
    return this.messagesService.listPage(
      conversationId,
      user.id,
      query.cursor,
      query.limit,
    );
  }

  @Post()
  async create(
    @CurrentUser() user: PublicUser,
    @Param('id') conversationId: string,
    @Body() dto: CreateMessageDto,
  ): Promise<{ message: Message }> {
    return {
      message: await this.messagesService.create(
        conversationId,
        user.id,
        dto.body,
      ),
    };
  }
}
