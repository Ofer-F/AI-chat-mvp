import { Module } from '@nestjs/common';
import { ConversationsModule } from '../conversations/conversations.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';
import { LLM_PROVIDER } from './llm/llm.provider';
import { OpenAiProvider } from './llm/openai.provider';
import { ToolRegistry } from './tools/tool-registry';
import { ListConversationsTool } from './tools/list-conversations.tool';
import { TutorService } from './tutor/tutor.service';

@Module({
  imports: [ConversationsModule, KnowledgeModule],
  controllers: [AssistantController],
  providers: [
    AssistantService,
    ToolRegistry,
    ListConversationsTool,
    TutorService,
    { provide: LLM_PROVIDER, useClass: OpenAiProvider },
  ],
})
export class AssistantModule {}
