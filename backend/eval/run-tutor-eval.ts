import 'reflect-metadata';
import { readFileSync, readdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { AppModule } from '../src/app.module';
import { IngestionService } from '../src/knowledge/ingestion.service';
import { RetrievalService } from '../src/knowledge/retrieval.service';
import { TutorService } from '../src/assistant/tutor/tutor.service';
import { KnowledgeChunk } from '../src/knowledge/schemas/knowledge-chunk.schema';
import type { KnowledgeChunkDocument } from '../src/knowledge/schemas/knowledge-chunk.schema';
import { KnowledgeDocument as KnowledgeDocumentSchema } from '../src/knowledge/schemas/knowledge-document.schema';
import type { KnowledgeDocumentDocument } from '../src/knowledge/schemas/knowledge-document.schema';
import type { Citation } from '../src/common/types/chat';

interface TutorEvalCase {
  name: string;
  question: string;
  // Document (by file name) that should be retrieved for this question.
  // null for out-of-knowledge-base questions that should NOT be answered.
  expectedDocument: string | null;
  // Distinctive substring expected inside one of the retrieved chunks.
  expectedSnippet: string | null;
  // Keywords the grounded answer should cover (case-insensitive substring match).
  expectedKeywords: string[];
  grounded: boolean;
}

interface KnowledgeFile {
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}

interface CaseResult {
  name: string;
  grounded: boolean;
  docHit: boolean;
  chunkHit: boolean;
  keywordCoverage: number;
  refusedCorrectly: boolean;
  citationsOnRefusal: number;
  topDocument: string | null;
  topScore: number | null;
}

// Vector search always returns top-K nearest chunks, so an out-of-KB question
// still yields (irrelevant) citations. Grounding is therefore judged on whether
// the answer TEXT declines, not on whether citations are empty.
const REFUSAL_PATTERN =
  /couldn'?t find|could not find|couldn'?t locate|don'?t have (that|any|enough)|no (relevant )?information|not (in|contained in|found in) (your|the) (uploaded )?documents/i;

// Synthetic, throwaway user so eval chunks never mix with real data. Random per
// run to sidestep the ingestion dedup guard and keep re-runs independent.
const EVAL_USER_ID = `eval-tutor-user-${randomUUID()}`;

const EXTENSION_MIME_TYPES: Record<string, string> = {
  '.md': 'text/markdown',
  '.txt': 'text/plain',
  '.pdf': 'application/pdf',
};

// Atlas Vector Search is eventually consistent: freshly written chunks take a
// short while to become searchable. Poll until a probe query returns, up to this.
const INDEX_READY_TIMEOUT_MS = 60_000;
const INDEX_POLL_INTERVAL_MS = 2_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadCases(): TutorEvalCase[] {
  const dataPath = join(__dirname, 'tutor-eval.json');
  return JSON.parse(readFileSync(dataPath, 'utf8')) as TutorEvalCase[];
}

function loadKnowledgeFiles(): KnowledgeFile[] {
  const dir = join(__dirname, 'knowledge');
  const files: KnowledgeFile[] = [];
  for (const entry of readdirSync(dir)) {
    const mimeType = EXTENSION_MIME_TYPES[extname(entry).toLowerCase()];
    if (!mimeType) {
      continue;
    }
    files.push({ fileName: entry, mimeType, buffer: readFileSync(join(dir, entry)) });
  }
  return files;
}

function includesCI(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

function keywordCoverage(answer: string, keywords: string[]): number {
  if (keywords.length === 0) {
    return 1;
  }
  const matched = keywords.filter((keyword) => includesCI(answer, keyword));
  return matched.length / keywords.length;
}

async function waitForIndex(
  retrieval: RetrievalService,
  probeQuery: string,
): Promise<boolean> {
  const deadline = Date.now() + INDEX_READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const hits = await retrieval.retrieve(EVAL_USER_ID, probeQuery);
    if (hits.length > 0) {
      return true;
    }
    await sleep(INDEX_POLL_INTERVAL_MS);
  }
  return false;
}

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function summarizeCitations(citations: Citation[]): {
  topDocument: string | null;
  topScore: number | null;
} {
  const top = citations[0];
  return {
    topDocument: top ? top.documentName : null,
    topScore: top ? Number(top.score.toFixed(4)) : null,
  };
}

async function evaluateCase(
  evalCase: TutorEvalCase,
  retrieval: RetrievalService,
  tutor: TutorService,
): Promise<CaseResult> {
  const retrieved = await retrieval.retrieve(EVAL_USER_ID, evalCase.question);
  const { topDocument, topScore } = summarizeCitations(retrieved);

  const docHit = evalCase.expectedDocument
    ? retrieved.some((c) => c.documentName === evalCase.expectedDocument)
    : false;
  const chunkHit = evalCase.expectedSnippet
    ? retrieved.some((c) => includesCI(c.text, evalCase.expectedSnippet as string))
    : false;

  const { text, citations } = await tutor.streamReply(
    { userId: EVAL_USER_ID, body: evalCase.question },
    () => {
      // The eval only needs the final answer; per-token deltas are ignored.
    },
  );

  const refusedCorrectly = !evalCase.grounded && REFUSAL_PATTERN.test(text);
  const citationsOnRefusal = !evalCase.grounded ? citations.length : 0;
  const coverage = evalCase.grounded ? keywordCoverage(text, evalCase.expectedKeywords) : 1;

  console.log('\n' + '-'.repeat(72));
  console.log(`CASE: ${evalCase.name}  [${evalCase.grounded ? 'grounded' : 'out-of-kb'}]`);
  console.log(`  > ${evalCase.question}`);
  console.log(
    `  retrieved: ${
      retrieved.length
        ? retrieved.map((c) => c.documentName).join(', ')
        : '(none)'
    }`,
  );
  if (evalCase.grounded) {
    console.log(
      `  doc hit: ${docHit ? 'YES' : 'NO'} (expected ${evalCase.expectedDocument})` +
        ` | chunk hit: ${chunkHit ? 'YES' : 'NO'} | keyword coverage: ${pct(coverage)}`,
    );
  } else {
    console.log(
      `  declined to answer: ${refusedCorrectly ? 'YES' : 'NO'}` +
        ` | citations attached to refusal: ${citationsOnRefusal}`,
    );
  }
  console.log(`  < ${text.replace(/\s+/g, ' ').trim().slice(0, 200)}`);

  return {
    name: evalCase.name,
    grounded: evalCase.grounded,
    docHit,
    chunkHit,
    keywordCoverage: coverage,
    refusedCorrectly,
    citationsOnRefusal,
    topDocument,
    topScore,
  };
}

function printSummary(results: CaseResult[]): void {
  const grounded = results.filter((r) => r.grounded);
  const outOfKb = results.filter((r) => !r.grounded);

  const docRecall =
    grounded.filter((r) => r.docHit).length / (grounded.length || 1);
  const chunkRecall =
    grounded.filter((r) => r.chunkHit).length / (grounded.length || 1);
  const avgCoverage =
    grounded.reduce((sum, r) => sum + r.keywordCoverage, 0) /
    (grounded.length || 1);
  const refusalAccuracy =
    outOfKb.filter((r) => r.refusedCorrectly).length / (outOfKb.length || 1);
  const refusalsWithCitations = outOfKb.filter(
    (r) => r.refusedCorrectly && r.citationsOnRefusal > 0,
  ).length;

  console.log('\n' + '='.repeat(72));
  console.log('TUTOR RAG EVAL SUMMARY');
  console.log('='.repeat(72));
  console.log(`Grounded questions:       ${grounded.length}`);
  console.log(`Out-of-KB questions:      ${outOfKb.length}`);
  console.log(`Retrieval recall (doc):   ${pct(docRecall)}  (right document in top-K)`);
  console.log(`Retrieval recall (chunk): ${pct(chunkRecall)}  (expected snippet in top-K)`);
  console.log(`Answer keyword coverage:  ${pct(avgCoverage)}  (grounded answers)`);
  console.log(`Grounding refusal rate:   ${pct(refusalAccuracy)}  (out-of-KB correctly declined)`);
  if (refusalsWithCitations > 0) {
    console.log(
      `Note: ${refusalsWithCitations}/${outOfKb.length} declined answers still carried ` +
        `citations (vector search returns top-K even for irrelevant queries).`,
    );
  }

  const misses = results.filter(
    (r) => (r.grounded && !r.docHit) || (!r.grounded && !r.refusedCorrectly),
  );
  if (misses.length > 0) {
    console.log('\nCases needing attention:');
    for (const miss of misses) {
      console.log(
        `  - ${miss.name}: ${
          miss.grounded
            ? `expected doc not retrieved (top=${miss.topDocument ?? 'none'})`
            : 'answered an out-of-KB question instead of declining'
        }`,
      );
    }
  }
}

async function main(): Promise<void> {
  const cases = loadCases();
  const knowledgeFiles = loadKnowledgeFiles();

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  const ingestion = app.get(IngestionService);
  const retrieval = app.get(RetrievalService);
  const tutor = app.get(TutorService);
  const chunkModel = app.get<Model<KnowledgeChunkDocument>>(
    getModelToken(KnowledgeChunk.name),
  );
  const documentModel = app.get<Model<KnowledgeDocumentDocument>>(
    getModelToken(KnowledgeDocumentSchema.name),
  );

  try {
    console.log(`Ingesting ${knowledgeFiles.length} document(s) for eval user...`);
    for (const file of knowledgeFiles) {
      const doc = await ingestion.ingest({
        userId: EVAL_USER_ID,
        fileName: file.fileName,
        mimeType: file.mimeType,
        buffer: file.buffer,
      });
      console.log(`  + ${doc.name} (${doc.chunkCount} chunks)`);
    }

    const probe = cases.find((c) => c.grounded);
    if (probe) {
      console.log('\nWaiting for the Atlas vector index to catch up...');
      const ready = await waitForIndex(retrieval, probe.question);
      if (!ready) {
        console.warn(
          'WARNING: vector index did not return results within ' +
            `${INDEX_READY_TIMEOUT_MS / 1000}s. Recall numbers may be understated.`,
        );
      }
    }

    const results: CaseResult[] = [];
    for (const evalCase of cases) {
      results.push(await evaluateCase(evalCase, retrieval, tutor));
    }

    printSummary(results);
  } finally {
    await chunkModel.deleteMany({ userId: EVAL_USER_ID });
    await documentModel.deleteMany({ userId: EVAL_USER_ID });
    await app.close();
  }
}

void main().catch((error: unknown) => {
  const detail = error instanceof Error ? error.stack : String(error);
  console.error('Tutor eval run failed:', detail);
  process.exit(1);
});
