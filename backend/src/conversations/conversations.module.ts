import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Conversation,
  ConversationSchema,
} from './schemas/conversation.schema';
import { Message, MessageSchema } from './schemas/message.schema';
import { UsersModule } from '../users/users.module';
import { ConversationsController } from './conversations.controller';
import { MessagesController } from './messages.controller';
import { ConversationsService } from './conversations.service';
import { MessagesService } from './messages.service';
import { ConversationsDbService } from './conversations.db.service';
import { MessagesDbService } from './messages.db.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
    ]),
    UsersModule,
  ],
  controllers: [ConversationsController, MessagesController],
  providers: [
    ConversationsService,
    MessagesService,
    ConversationsDbService,
    MessagesDbService,
  ],
  exports: [ConversationsService, MessagesService],
})
export class ConversationsModule {}
