import type {
  GenerateStructuredParams,
  StreamChatHandlers,
  StreamChatParams,
  StreamChatResult,
} from './llm.types';

export interface LlmProvider {
  streamChat(
    params: StreamChatParams,
    handlers: StreamChatHandlers,
  ): Promise<StreamChatResult>;
  generateStructured<T>(params: GenerateStructuredParams<T>): Promise<T>;
}

export const LLM_PROVIDER = Symbol('LLM_PROVIDER');
