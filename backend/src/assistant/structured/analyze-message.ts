import { z } from 'zod';
import type { LlmProvider } from '../llm/llm.provider';
import { ANALYSIS_PROMPT } from '../prompts/analysis-prompt';

export const messageAnalysisSchema = z.object({
  withinScope: z.boolean(),
  refusalReason: z.string(),
});

export type MessageAnalysis = z.infer<typeof messageAnalysisSchema>;

const SAFE_DEFAULT: MessageAnalysis = {
  withinScope: true,
  refusalReason: '',
};

export async function analyzeUserMessage(
  llm: LlmProvider,
  message: string,
): Promise<MessageAnalysis> {
  try {
    return await llm.generateStructured({
      messages: [
        { role: 'system', content: ANALYSIS_PROMPT },
        { role: 'user', content: message },
      ],
      schema: messageAnalysisSchema,
      schemaName: 'message_analysis',
    });
  } catch {
    return SAFE_DEFAULT;
  }
}
