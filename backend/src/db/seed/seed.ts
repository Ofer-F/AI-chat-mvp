import type { Model } from 'mongoose';
import type { ConversationDocument } from '../schemas/conversation.schema';
import type { MessageDocument } from '../schemas/message.schema';
import type { UserDocument } from '../schemas/user.schema';

export const DEFAULT_SEED_PASSWORD = 'password123';

interface SeedUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface SeedMessage {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
}

interface SeedConversation {
  id: string;
  title: string;
  participantIds: string[];
  createdAt: string;
  lastMessageAt: string;
  lastMessage: SeedMessage;
}

export interface SeedModels {
  userModel: Model<UserDocument>;
  conversationModel: Model<ConversationDocument>;
  messageModel: Model<MessageDocument>;
}

export interface SeedSummary {
  usersInserted: number;
  conversationsInserted: number;
  messagesInserted: number;
}

const seedUsers: SeedUser[] = [
  {
    id: 'u1',
    name: 'Dana',
    email: 'dana@example.com',
    createdAt: '2026-05-28T10:00:00.000Z',
  },
  {
    id: 'u2',
    name: 'Maya',
    email: 'maya@example.com',
    createdAt: '2026-05-28T10:00:00.000Z',
  },
  {
    id: 'u3',
    name: 'Ofer',
    email: 'ofer@example.com',
    createdAt: '2026-05-28T10:00:00.000Z',
  },
];

const seedMessages: SeedMessage[] = [
  {
    id: 'm1',
    conversationId: 'c1',
    senderId: 'u1',
    body: 'Morning! Did you finish the slides for the Q3 review?',
    createdAt: '2026-05-28T09:00:00.000Z',
  },
  {
    id: 'm2',
    conversationId: 'c1',
    senderId: 'u2',
    body: 'Just polishing the closing section now.',
    createdAt: '2026-05-28T09:05:00.000Z',
  },
  {
    id: 'm3',
    conversationId: 'c1',
    senderId: 'u1',
    body: 'Amazing, send me a draft when you can.',
    createdAt: '2026-05-28T09:07:00.000Z',
  },
  {
    id: 'm4',
    conversationId: 'c1',
    senderId: 'u2',
    body: 'Sending the link in two minutes.',
    createdAt: '2026-05-28T09:30:00.000Z',
  },
  {
    id: 'm5',
    conversationId: 'c1',
    senderId: 'u2',
    body: 'https://docs.example.com/q3-review-draft',
    createdAt: '2026-05-28T09:32:00.000Z',
  },
  {
    id: 'm6',
    conversationId: 'c1',
    senderId: 'u1',
    body: 'Reviewing now.',
    createdAt: '2026-05-28T09:45:00.000Z',
  },
  {
    id: 'm7',
    conversationId: 'c1',
    senderId: 'u1',
    body: 'Slide 4 — should the chart be quarterly or monthly?',
    createdAt: '2026-05-28T10:00:00.000Z',
  },
  {
    id: 'm8',
    conversationId: 'c1',
    senderId: 'u2',
    body: "Let's go quarterly. Monthly was too noisy.",
    createdAt: '2026-05-28T10:03:00.000Z',
  },
  {
    id: 'm9',
    conversationId: 'c1',
    senderId: 'u1',
    body: 'Agreed.',
    createdAt: '2026-05-28T10:05:00.000Z',
  },
  {
    id: 'm10',
    conversationId: 'c1',
    senderId: 'u2',
    body: 'Updated slide 4. Take another look?',
    createdAt: '2026-05-28T10:20:00.000Z',
  },
  {
    id: 'm11',
    conversationId: 'c1',
    senderId: 'u1',
    body: 'Looks much cleaner. Approved.',
    createdAt: '2026-05-28T10:40:00.000Z',
  },
  {
    id: 'm12',
    conversationId: 'c1',
    senderId: 'u2',
    body: 'Thanks. Do we have a script for the live demo?',
    createdAt: '2026-05-28T10:42:00.000Z',
  },
  {
    id: 'm13',
    conversationId: 'c1',
    senderId: 'u1',
    body: "I'll write a short one — give me 15 minutes.",
    createdAt: '2026-05-28T10:55:00.000Z',
  },
  {
    id: 'm14',
    conversationId: 'c1',
    senderId: 'u1',
    body: 'Script draft is in the doc, last section.',
    createdAt: '2026-05-28T11:12:00.000Z',
  },
  {
    id: 'm15',
    conversationId: 'c1',
    senderId: 'u2',
    body: 'Reading it now.',
    createdAt: '2026-05-28T11:20:00.000Z',
  },
  {
    id: 'm16',
    conversationId: 'c1',
    senderId: 'u2',
    body: "Can we cut the intro paragraph? It's a bit long.",
    createdAt: '2026-05-28T11:25:00.000Z',
  },
  {
    id: 'm17',
    conversationId: 'c1',
    senderId: 'u1',
    body: 'Sure. Tightened it to two sentences.',
    createdAt: '2026-05-28T11:27:00.000Z',
  },
  {
    id: 'm18',
    conversationId: 'c1',
    senderId: 'u2',
    body: 'Perfect.',
    createdAt: '2026-05-28T11:35:00.000Z',
  },
  {
    id: 'm19',
    conversationId: 'c1',
    senderId: 'u1',
    body: 'Should we do a dry run before lunch?',
    createdAt: '2026-05-28T11:50:00.000Z',
  },
  {
    id: 'm20',
    conversationId: 'c1',
    senderId: 'u2',
    body: 'Yes please. 11:55?',
    createdAt: '2026-05-28T11:52:00.000Z',
  },
  {
    id: 'm21',
    conversationId: 'c1',
    senderId: 'u1',
    body: 'Works. Sending an invite.',
    createdAt: '2026-05-28T11:53:00.000Z',
  },
  {
    id: 'm22',
    conversationId: 'c1',
    senderId: 'u2',
    body: 'Good dry run. The transition to slide 7 still felt rough.',
    createdAt: '2026-05-28T12:30:00.000Z',
  },
  {
    id: 'm23',
    conversationId: 'c1',
    senderId: 'u1',
    body: "I'll add a connector line on slide 6.",
    createdAt: '2026-05-28T12:32:00.000Z',
  },
  {
    id: 'm24',
    conversationId: 'c1',
    senderId: 'u2',
    body: 'Lunch?',
    createdAt: '2026-05-28T13:00:00.000Z',
  },
  {
    id: 'm25',
    conversationId: 'c1',
    senderId: 'u1',
    body: 'Yeah, give me 5.',
    createdAt: '2026-05-28T13:01:00.000Z',
  },
  {
    id: 'm26',
    conversationId: 'c1',
    senderId: 'u1',
    body: 'Back. Let me finish slide 6 and ping you.',
    createdAt: '2026-05-28T13:45:00.000Z',
  },
  {
    id: 'm27',
    conversationId: 'c1',
    senderId: 'u2',
    body: 'Sounds good.',
    createdAt: '2026-05-28T13:46:00.000Z',
  },
  {
    id: 'm28',
    conversationId: 'c1',
    senderId: 'u1',
    body: 'Slide 6 updated. Final pass from you?',
    createdAt: '2026-05-28T14:10:00.000Z',
  },
  {
    id: 'm29',
    conversationId: 'c1',
    senderId: 'u2',
    body: 'Done. Looks great.',
    createdAt: '2026-05-28T14:25:00.000Z',
  },
  {
    id: 'm30',
    conversationId: 'c1',
    senderId: 'u1',
    body: 'Ship it. See you at the review.',
    createdAt: '2026-05-28T14:30:00.000Z',
  },
  {
    id: 'm31',
    conversationId: 'c2',
    senderId: 'u3',
    body: 'Hey team — proposal review tomorrow at 10?',
    createdAt: '2026-05-27T15:00:00.000Z',
  },
  {
    id: 'm32',
    conversationId: 'c2',
    senderId: 'u1',
    body: 'Works for me.',
    createdAt: '2026-05-27T15:30:00.000Z',
  },
  {
    id: 'm33',
    conversationId: 'c2',
    senderId: 'u2',
    body: 'Same here.',
    createdAt: '2026-05-27T16:00:00.000Z',
  },
  {
    id: 'm34',
    conversationId: 'c2',
    senderId: 'u3',
    body: "Great. I'll send the agenda this evening.",
    createdAt: '2026-05-27T16:15:00.000Z',
  },
  {
    id: 'm35',
    conversationId: 'c2',
    senderId: 'u3',
    body: "Let's sync tomorrow",
    createdAt: '2026-05-27T16:30:00.000Z',
  },
];

const seedConversations: SeedConversation[] = [
  {
    id: 'c1',
    title: 'Dana and Maya',
    participantIds: ['u1', 'u2'],
    createdAt: '2026-05-28T09:00:00.000Z',
    lastMessageAt: '2026-05-28T14:30:00.000Z',
    lastMessage: {
      id: 'm30',
      conversationId: 'c1',
      senderId: 'u1',
      body: 'Ship it. See you at the review.',
      createdAt: '2026-05-28T14:30:00.000Z',
    },
  },
  {
    id: 'c2',
    title: 'Team chat',
    participantIds: ['u1', 'u2', 'u3'],
    createdAt: '2026-05-27T15:00:00.000Z',
    lastMessageAt: '2026-05-27T16:30:00.000Z',
    lastMessage: {
      id: 'm35',
      conversationId: 'c2',
      senderId: 'u3',
      body: "Let's sync tomorrow",
      createdAt: '2026-05-27T16:30:00.000Z',
    },
  },
];

export async function seed(
  models: SeedModels,
  hashPassword: (plain: string) => Promise<string>,
): Promise<SeedSummary> {
  const passwordHash = await hashPassword(DEFAULT_SEED_PASSWORD);
  const summary: SeedSummary = {
    usersInserted: 0,
    conversationsInserted: 0,
    messagesInserted: 0,
  };

  for (const user of seedUsers) {
    const result = await models.userModel.updateOne(
      { _id: user.id },
      {
        $setOnInsert: {
          email: user.email,
          name: user.name,
          passwordHash,
          createdAt: new Date(user.createdAt),
        },
      },
      { upsert: true },
    );
    summary.usersInserted += result.upsertedCount;
  }

  for (const conversation of seedConversations) {
    const result = await models.conversationModel.updateOne(
      { _id: conversation.id },
      {
        $setOnInsert: {
          title: conversation.title,
          participantIds: conversation.participantIds,
          lastMessage: {
            ...conversation.lastMessage,
            createdAt: new Date(conversation.lastMessage.createdAt),
          },
          lastMessageAt: new Date(conversation.lastMessageAt),
          createdAt: new Date(conversation.createdAt),
        },
      },
      { upsert: true },
    );
    summary.conversationsInserted += result.upsertedCount;
  }

  for (const message of seedMessages) {
    const result = await models.messageModel.updateOne(
      { _id: message.id },
      {
        $setOnInsert: {
          conversationId: message.conversationId,
          senderId: message.senderId,
          body: message.body,
          createdAt: new Date(message.createdAt),
        },
      },
      { upsert: true },
    );
    summary.messagesInserted += result.upsertedCount;
  }

  return summary;
}
