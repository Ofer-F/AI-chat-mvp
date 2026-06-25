import type { INestApplicationContext } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import type { Model } from 'mongoose';
import { Conversation } from '../../conversations/schemas/conversation.schema';
import type { ConversationDocument } from '../../conversations/schemas/conversation.schema';
import { Message } from '../../conversations/schemas/message.schema';
import type { MessageDocument } from '../../conversations/schemas/message.schema';
import { User } from '../../users/schemas/user.schema';
import type { UserDocument } from '../../users/schemas/user.schema';
import { seed } from './seed';
import type { SeedSummary } from './seed';

const BCRYPT_SALT_ROUNDS = 10;

/** Resolves the Mongoose models from a Nest context and runs the demo seed. */
export async function runSeed(
  app: INestApplicationContext,
): Promise<SeedSummary> {
  return seed(
    {
      userModel: app.get<Model<UserDocument>>(getModelToken(User.name)),
      conversationModel: app.get<Model<ConversationDocument>>(
        getModelToken(Conversation.name),
      ),
      messageModel: app.get<Model<MessageDocument>>(
        getModelToken(Message.name),
      ),
    },
    (plain) => bcrypt.hash(plain, BCRYPT_SALT_ROUNDS),
  );
}
