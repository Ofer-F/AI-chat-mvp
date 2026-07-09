import { AGENT_TOOL_NAMES } from './tools';

const TOOL_LABELS: Record<string, string> = {
  [AGENT_TOOL_NAMES.retrieveKnowledge]: 'Searching your documents…',
  [AGENT_TOOL_NAMES.searchMyMessages]: 'Looking up your messages…',
  [AGENT_TOOL_NAMES.listMyConversations]: 'Listing your conversations…',
};

export function toolLabel(name: string): string {
  return TOOL_LABELS[name] ?? 'Working…';
}
