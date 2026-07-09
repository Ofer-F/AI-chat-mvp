import type { ZodType } from 'zod';

export type JsonSchema = Record<string, unknown>;

export type LlmRole = 'system' | 'user' | 'assistant' | 'tool';

export interface LlmMessage {
  role: LlmRole;
  content: string;
}

export interface LlmToolDefinition {
  name: string;
  description: string;
  parameters: JsonSchema;
}

export interface LlmToolCall {
  id: string;
  name: string;
  arguments: string;
}

export interface StreamChatParams {
  messages: LlmMessage[];
  tools?: LlmToolDefinition[];
}

export interface StreamChatHandlers {
  onTextDelta: (delta: string) => void;
  onToolCall?: (call: LlmToolCall) => Promise<string>;
}

export interface StreamChatResult {
  text: string;
}

export interface GenerateStructuredParams<T> {
  messages: LlmMessage[];
  schema: ZodType<T>;
  schemaName: string;
}
