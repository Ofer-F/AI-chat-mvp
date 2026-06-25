import { Module } from '@nestjs/common';
import { ConversationsModule } from '../conversations/conversations.module';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';
import { LLM_PROVIDER } from './llm/llm.provider';
import { OpenAiProvider } from './llm/openai.provider';
import { ToolRegistry } from './tools/tool-registry';
import { ListConversationsTool } from './tools/list-conversations.tool';

@Module({
  imports: [ConversationsModule],
  controllers: [AssistantController],
  providers: [
    AssistantService,
    ToolRegistry,
    ListConversationsTool,
    { provide: LLM_PROVIDER, useClass: OpenAiProvider },
  ],
})
export class AssistantModule {}
