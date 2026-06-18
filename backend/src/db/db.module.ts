import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Conversation,
  ConversationSchema,
} from './schemas/conversation.schema';
import { Message, MessageSchema } from './schemas/message.schema';
import { User, UserSchema } from './schemas/user.schema';
import { ConversationsDbService } from './services/conversations.db.service';
import { MessagesDbService } from './services/messages.db.service';
import { UsersDbService } from './services/users.db.service';

const features = MongooseModule.forFeature([
  { name: User.name, schema: UserSchema },
  { name: Conversation.name, schema: ConversationSchema },
  { name: Message.name, schema: MessageSchema },
]);

@Module({
  imports: [features],
  providers: [UsersDbService, ConversationsDbService, MessagesDbService],
  exports: [
    features,
    UsersDbService,
    ConversationsDbService,
    MessagesDbService,
  ],
})
export class DbModule {}
