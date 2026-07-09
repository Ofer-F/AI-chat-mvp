import 'reflect-metadata';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { AppModule } from '../src/app.module';
import { AssistantService } from '../src/assistant/assistant.service';
import { ConversationsService } from '../src/conversations/conversations.service';
import { ToolRegistry } from '../src/assistant/tools/tool-registry';
import { Conversation } from '../src/conversations/schemas/conversation.schema';
import type { ConversationDocument } from '../src/conversations/schemas/conversation.schema';
import { Message } from '../src/conversations/schemas/message.schema';
import type { MessageDocument } from '../src/conversations/schemas/message.schema';

interface EvalCase {
  name: string;
  category?: string;
  description?: string;
  messages: string[];
}

// Synthetic, throwaway user. Assistant conversations are scoped purely by
// participantIds, so no real user record is required to exercise the loop.
const EVAL_USER_ID = `eval-user-${randomUUID()}`;

function loadCases(): EvalCase[] {
  const dataPath = join(__dirname, 'assistant-eval.json');
  return JSON.parse(readFileSync(dataPath, 'utf8')) as EvalCase[];
}

async function main(): Promise<void> {
  const cases = loadCases();

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  const assistant = app.get(AssistantService);
  const conversations = app.get(ConversationsService);
  const registry = app.get(ToolRegistry);
  const conversationModel = app.get<Model<ConversationDocument>>(
    getModelToken(Conversation.name),
  );
  const messageModel = app.get<Model<MessageDocument>>(
    getModelToken(Message.name),
  );

  // Eval-only instrumentation: wrap each tool's execute so we can report which
  // tools a given prompt triggered (the service keeps tool calls internal).
  let toolsUsed: string[] = [];
  for (const tool of registry.list()) {
    const original = tool.execute.bind(tool);
    tool.execute = (userId, input) => {
      toolsUsed.push(tool.name);
      return original(userId, input);
    };
  }

  const createdConversationIds: string[] = [];

  try {
    for (const evalCase of cases) {
      // A fresh conversation per case keeps multi-turn context from one case
      // from leaking into the next.
      const conversation = await conversations.create(EVAL_USER_ID, {
        title: `Eval: ${evalCase.name}`,
        type: 'assistant',
        participantIds: [],
      });
      createdConversationIds.push(conversation.id);

      console.log('\n' + '='.repeat(72));
      console.log(`CASE: ${evalCase.name}` +
        (evalCase.category ? `  [${evalCase.category}]` : ''));
      if (evalCase.description) {
        console.log(evalCase.description);
      }

      for (const userMessage of evalCase.messages) {
        toolsUsed = [];
        console.log(`\n  > user: ${userMessage}`);

        try {
          const reply = await assistant.streamReply(
            {
              conversationId: conversation.id,
              userId: EVAL_USER_ID,
              body: userMessage,
            },
            {
              // Deltas/tool events are accumulated server-side; the persisted
              // message body is the full reply, so nothing to do here.
              onDelta: () => {},
              onToolCall: () => {},
              onToolResult: () => {},
            },
          );

          const used = [...new Set(toolsUsed)];
          console.log(`  < assistant: ${reply.body}`);
          console.log(`  tools used: ${used.length ? used.join(', ') : '(none)'}`);
        } catch (error) {
          const detail =
            error instanceof Error ? error.message : 'unknown error';
          console.log(`  ! FAILED: ${detail}`);
        }
      }
    }
  } finally {
    // Remove everything the eval created so re-runs stay clean.
    if (createdConversationIds.length > 0) {
      await messageModel.deleteMany({
        conversationId: { $in: createdConversationIds },
      });
      await conversationModel.deleteMany({
        _id: { $in: createdConversationIds },
      });
    }
    await app.close();
  }

  console.log('\n' + '='.repeat(72));
  console.log(`Eval complete — ran ${cases.length} cases.`);
}

void main().catch((error: unknown) => {
  const detail = error instanceof Error ? error.stack : String(error);
  console.error('Eval run failed:', detail);
  process.exit(1);
});
