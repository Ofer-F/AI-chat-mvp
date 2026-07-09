import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { Message } from '../common/types/chat';
import { ASSISTANT_SENDER_ID } from '../common/constants';
import { ConversationsService } from '../conversations/conversations.service';
import { MessagesService } from '../conversations/messages.service';
import { LLM_PROVIDER } from './llm/llm.provider';
import type { LlmProvider } from './llm/llm.provider';
import type { LlmMessage, LlmToolCall } from './llm/llm.types';
import { SYSTEM_PROMPT } from './prompts/system-prompt';
import { analyzeUserMessage } from './structured/analyze-message';
import { ToolRegistry } from './tools/tool-registry';

const HISTORY_LIMIT = 20;

// Shown when the guardrail refuses but does not supply a usable reason.
const DEFAULT_REFUSAL =
  "I can't help with that. I can answer questions about your conversations in this app and general questions.";

export interface StreamReplyInput {
  conversationId: string;
  userId: string;
  body: string;
}

@Injectable()
export class AssistantService {
  constructor(
    private readonly conversations: ConversationsService,
    private readonly messages: MessagesService,
    private readonly tools: ToolRegistry,
    @Inject(LLM_PROVIDER) private readonly llm: LlmProvider,
  ) {}

  async streamReply(
    input: StreamReplyInput,
    onDelta: (delta: string) => void,
  ): Promise<Message> {
    const { conversationId, userId, body } = input;

    const conversation = await this.conversations.getForParticipant(
      conversationId,
      userId,
    );
    if (conversation.type !== 'assistant') {
      throw new BadRequestException(
        'This conversation is not an AI assistant conversation',
      );
    }

    await this.messages.create(conversationId, userId, body);

    const analysis = await analyzeUserMessage(this.llm, body);

    if (!analysis.withinScope) {
      const refusal = analysis.refusalReason.trim() || DEFAULT_REFUSAL;
      onDelta(refusal);
      return this.messages.createAssistantMessage(
        conversationId,
        userId,
        refusal,
      );
    }

    const history = await this.buildHistory(conversationId, userId);

    const { text } = await this.llm.streamChat(
      {
        messages: history,
        tools: this.tools.getDefinitions(),
      },
      {
        onTextDelta: onDelta,
        onToolCall: (call) => this.executeTool(userId, call),
      },
    );

    return this.messages.createAssistantMessage(conversationId, userId, text);
  }

  private async buildHistory(
    conversationId: string,
    userId: string,
  ): Promise<LlmMessage[]> {
    const { messages } = await this.messages.listPage(
      conversationId,
      userId,
      undefined,
      HISTORY_LIMIT,
    );

    const history: LlmMessage[] = [{ role: 'system', content: SYSTEM_PROMPT }];

    for (const message of messages) {
      history.push({
        role: message.senderId === ASSISTANT_SENDER_ID ? 'assistant' : 'user',
        content: message.body,
      });
    }

    return history;
  }

  private async executeTool(
    userId: string,
    call: LlmToolCall,
  ): Promise<string> {
    const tool = this.tools.get(call.name);
    if (!tool) {
      return JSON.stringify({ error: `Unknown tool: ${call.name}` });
    }

    let rawArgs: unknown;
    try {
      rawArgs = call.arguments ? JSON.parse(call.arguments) : {};
    } catch {
      return JSON.stringify({ error: 'Tool arguments were not valid JSON' });
    }

    const parsedArgs = tool.parameters.safeParse(rawArgs);
    if (!parsedArgs.success) {
      return JSON.stringify({
        error: 'Tool arguments failed validation',
        issues: parsedArgs.error.issues,
      });
    }

    const result = await tool.execute(userId, parsedArgs.data);

    const parsedOutput = tool.output.safeParse(result);
    if (!parsedOutput.success) {
      return JSON.stringify({ error: 'Tool produced invalid output' });
    }

    return JSON.stringify(parsedOutput.data);
  }
}
