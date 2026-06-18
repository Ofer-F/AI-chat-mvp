import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { ConversationsController } from './conversations.controller';
import { MessagesController } from './messages.controller';
import { ConversationsService } from './conversations.service';
import { MessagesService } from './messages.service';

@Module({
  imports: [DbModule],
  controllers: [ConversationsController, MessagesController],
  providers: [ConversationsService, MessagesService],
})
export class ConversationsModule {}
