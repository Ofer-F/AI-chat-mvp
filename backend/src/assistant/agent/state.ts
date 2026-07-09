import { Annotation, messagesStateReducer } from '@langchain/langgraph';
import type { BaseMessage } from '@langchain/core/messages';
import type { Citation } from '../../common/types/chat';

export type AgentRoute = 'retrieve' | 'tool' | 'answer';

export interface AgentToolCall {
  name: string;
  args: unknown;
}

export const AgentStateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  userId: Annotation<string>({
    reducer: (_current, update) => update,
    default: () => '',
  }),
  question: Annotation<string>({
    reducer: (_current, update) => update,
    default: () => '',
  }),
  route: Annotation<AgentRoute>({
    reducer: (_current, update) => update,
    default: () => 'answer',
  }),
  citations: Annotation<Citation[]>({
    reducer: (_current, update) => update,
    default: () => [],
  }),
  lastToolCall: Annotation<AgentToolCall | null>({
    reducer: (_current, update) => update,
    default: () => null,
  }),
});

export type AgentState = typeof AgentStateAnnotation.State;
export type AgentStateUpdate = typeof AgentStateAnnotation.Update;
