import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import type { LlmToolDefinition } from '../llm/llm.types';
import type { AssistantTool } from './tool.types';
import { ListConversationsTool } from './list-conversations.tool';

@Injectable()
export class ToolRegistry {
  private readonly byName: Map<string, AssistantTool>;
  private readonly definitions: LlmToolDefinition[];

  constructor(listConversations: ListConversationsTool) {
    const tools: AssistantTool[] = [listConversations];

    this.byName = new Map(tools.map((tool) => [tool.name, tool]));
    this.definitions = tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: z.toJSONSchema(tool.parameters),
    }));
  }

  get(name: string): AssistantTool | undefined {
    return this.byName.get(name);
  }

  list(): AssistantTool[] {
    return [...this.byName.values()];
  }

  getDefinitions(): LlmToolDefinition[] {
    return this.definitions;
  }
}
