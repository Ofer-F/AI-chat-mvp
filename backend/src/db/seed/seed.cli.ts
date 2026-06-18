import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { runSeed } from './run-seed';

/**
 * Standalone entrypoint: `npm run seed`. Boots a headless Nest context (which
 * connects to MongoDB), runs the idempotent demo seed once, and exits.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const summary = await runSeed(app);
    Logger.log(
      `Seed complete — inserted ${summary.usersInserted} users, ` +
        `${summary.conversationsInserted} conversations, ` +
        `${summary.messagesInserted} messages (existing ids left untouched).`,
      'Seed',
    );
  } finally {
    await app.close();
  }
}

void bootstrap();
