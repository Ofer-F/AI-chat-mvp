import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import type { Citation } from '../../common/types/chat';
import { RetrievalService } from '../../knowledge/retrieval.service';

const DEFAULT_MODEL = 'gpt-4o-mini';

const NO_CONTEXT_REPLY =
  "I couldn't find anything about that in your uploaded documents.";

const TUTOR_SYSTEM_PROMPT = [
  'You are a study tutor helping the user understand their own uploaded documents.',
  'Answer the question using ONLY the information in the provided context.',
  "If the answer is not contained in the context, say you couldn't find it in their documents and do not rely on outside knowledge.",
  'Be concise and clear, and explain things in plain language.',
  '',
  'Context:',
  '{context}',
].join('\n');

interface TutorChainInput {
  context: string;
  question: string;
}

export interface TutorReplyInput {
  userId: string;
  body: string;
}

export interface TutorReplyResult {
  text: string;
  citations: Citation[];
}

@Injectable()
export class TutorService {
  private readonly chain: RunnableSequence<TutorChainInput, string>;

  constructor(
    config: ConfigService,
    private readonly retrieval: RetrievalService,
  ) {
    const apiKey = config.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    const model = config.get<string>('OPENAI_MODEL') ?? DEFAULT_MODEL;

    const llm = new ChatOpenAI({ apiKey, model, streaming: true });
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', TUTOR_SYSTEM_PROMPT],
      ['human', '{question}'],
    ]);

    this.chain = RunnableSequence.from<TutorChainInput, string>([
      prompt,
      llm,
      new StringOutputParser(),
    ]);
  }

  async streamReply(
    input: TutorReplyInput,
    onDelta: (delta: string) => void,
  ): Promise<TutorReplyResult> {
    const citations = await this.retrieval.retrieve(input.userId, input.body);

    if (citations.length === 0) {
      onDelta(NO_CONTEXT_REPLY);
      return { text: NO_CONTEXT_REPLY, citations: [] };
    }

    const context = this.formatContext(citations);

    let text = '';
    const stream = await this.chain.stream({ context, question: input.body });
    for await (const token of stream) {
      if (token) {
        text += token;
        onDelta(token);
      }
    }

    return { text, citations };
  }

  private formatContext(citations: Citation[]): string {
    return citations
      .map(
        (citation, index) =>
          `Source ${index + 1} (${citation.documentName}):\n${citation.text}`,
      )
      .join('\n\n');
  }
}
