import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from 'openai/resources/chat/completions';
import type { LlmProvider } from './llm.provider';
import type {
  GenerateStructuredParams,
  LlmMessage,
  LlmToolDefinition,
  StreamChatHandlers,
  StreamChatParams,
  StreamChatResult,
} from './llm.types';

const DEFAULT_MODEL = 'gpt-4o-mini';

@Injectable()
export class OpenAiProvider implements LlmProvider {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(config: ConfigService) {
    const apiKey = config.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    this.client = new OpenAI({ apiKey });
    this.model = config.get<string>('OPENAI_MODEL') ?? DEFAULT_MODEL;
  }

  async streamChat(
    params: StreamChatParams,
    handlers: StreamChatHandlers,
  ): Promise<StreamChatResult> {
    const messages: ChatCompletionMessageParam[] =
      params.messages.map(toOpenAiMessage);
    const tools = (params.tools ?? []).map(toOpenAiTool);
    const onToolCall = handlers.onToolCall;
    const toolsEnabled = tools.length > 0 && Boolean(onToolCall);

    if (toolsEnabled && onToolCall) {
      const decision = await this.client.chat.completions.create({
        model: this.model,
        messages,
        tools,
        stream: false,
      });

      const assistantMessage = decision.choices[0]?.message;
      const toolCalls = assistantMessage?.tool_calls ?? [];

      if (assistantMessage && toolCalls.length > 0) {
        messages.push({
          role: 'assistant',
          content: assistantMessage.content ?? null,
          tool_calls: assistantMessage.tool_calls,
        });

        for (const toolCall of toolCalls) {
          if (toolCall.type !== 'function') {
            continue;
          }

          const result = await onToolCall({
            id: toolCall.id,
            name: toolCall.function.name,
            arguments: toolCall.function.arguments,
          });

          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: result,
          });
        }
      }
    }

    let text = '';

    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages,
      stream: true,
    });

    for await (const chunk of stream) {
      const choice = chunk.choices[0];
      if (!choice) {
        continue;
      }

      const content = choice.delta?.content;
      if (content) {
        text += content;
        handlers.onTextDelta(content);
      }
    }

    return { text };
  }

  async generateStructured<T>(params: GenerateStructuredParams<T>): Promise<T> {
    const messages: ChatCompletionMessageParam[] =
      params.messages.map(toOpenAiMessage);

    const completion = await this.client.chat.completions.parse({
      model: this.model,
      messages,
      response_format: zodResponseFormat(params.schema, params.schemaName),
    });

    const parsed = completion.choices[0]?.message.parsed;
    if (parsed == null) {
      throw new Error('Structured output returned no parsed result');
    }

    return parsed;
  }
}

function toOpenAiMessage(message: LlmMessage): ChatCompletionMessageParam {
  if (message.role === 'tool') {
    throw new Error('tool-role messages are not supported by streamChat input');
  }

  return { role: message.role, content: message.content };
}

function toOpenAiTool(tool: LlmToolDefinition): ChatCompletionTool {
  return {
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  };
}
