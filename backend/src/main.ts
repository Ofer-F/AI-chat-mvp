import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { runSeed } from './db/seed/run-seed';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  app.enableCors({
    origin: config.get<string>('CORS_ORIGIN') ?? 'http://localhost:5173',
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());

  // Dev/demo only: opt-in, idempotent, and non-destructive. Off by default.
  if (config.get<string>('SEED_DEMO_DATA') === 'true') {
    const summary = await runSeed(app);
    Logger.log(
      `Demo seed: +${summary.usersInserted} users, ` +
        `+${summary.conversationsInserted} conversations, ` +
        `+${summary.messagesInserted} messages.`,
      'Seed',
    );
  }

  const port = config.get<number>('PORT') ?? 3000;
  await app.listen(port);
}

void bootstrap();
