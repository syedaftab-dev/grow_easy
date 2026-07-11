import OpenAI from 'openai';
import type { RawRecord } from './csv.service';
import type { ToolOutput, CrmRecord, SkippedRecord } from '../types/crm.types';
import { parseToolOutput, enforceSkipRule } from '../types/crm.types';
import {
  SYSTEM_PROMPT,
  EMIT_CRM_RECORDS_TOOL,
  TOOL_CHOICE,
} from '../prompts/extraction.prompt';
import { chunkArray } from '../utils/batchChunker';
import { asyncPool } from '../utils/asyncPool';

// ── Configuration ──────────────────────────────────────────────────────────

const BATCH_SIZE     = parseInt(process.env.BATCH_SIZE             ?? '8', 10);
const MAX_RETRIES    = parseInt(process.env.MAX_RETRIES            ?? '3', 10);
const MAX_CONCURRENT = parseInt(process.env.MAX_CONCURRENT_BATCHES ?? '1', 10);

// llama-3.3-70b-versatile: Groq's best general-purpose model with native
// tool-calling support (deprecated preview fine-tunes not needed).
const MODEL      = 'llama-3.3-70b-versatile';
const FALLBACK_MODEL = 'llama-3.1-8b-instant';
const MAX_TOKENS = 8096;

// OpenAI-compatible client pointed at Groq's base URL
const client = new OpenAI({
  apiKey:  process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Splits records into batches, processes each through Groq with
 * bounded concurrency and per-batch retries, then merges all results.
 */
export async function extractBatches(records: RawRecord[]): Promise<ToolOutput> {
  const batches = chunkArray(records, BATCH_SIZE);

  console.log(
    `[ai] ${records.length} records → ${batches.length} batch(es)` +
    ` | model=${MODEL} | size=${BATCH_SIZE} | concurrency=${MAX_CONCURRENT} | retries=${MAX_RETRIES}`,
  );

  const batchResults = await asyncPool(
    MAX_CONCURRENT,
    batches,
    (batch, i) => extractBatchWithRetry(batch, i, batches.length),
  );

  const allImported: CrmRecord[]     = [];
  const allSkipped:  SkippedRecord[] = [];

  for (const result of batchResults) {
    allImported.push(...result.imported);
    allSkipped.push(...result.skipped);
  }

  return { imported: allImported, skipped: allSkipped };
}

// ── Batch with retry ───────────────────────────────────────────────────────

async function extractBatchWithRetry(
  batch: RawRecord[],
  batchIndex: number,
  totalBatches: number,
): Promise<ToolOutput> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Attempt 1 uses Llama 3.3 70B; retry attempts switch to Llama 3.1 8B instant (higher TPM allowance)
      const modelToUse = attempt === 1 ? MODEL : FALLBACK_MODEL;
      const result = await extractSingleBatch(batch, modelToUse);
      console.log(
        `[ai] Batch ${batchIndex + 1}/${totalBatches} ✓ (${modelToUse})` +
        ` imported=${result.imported.length} skipped=${result.skipped.length}`,
      );
      return result;
    } catch (err) {
      lastError = err;
      const isLast = attempt === MAX_RETRIES;

      if (!isLast) {
        const delayMs = attempt * 1500;
        console.warn(
          `[ai] Batch ${batchIndex + 1}/${totalBatches} attempt ${attempt} failed` +
          ` (retrying in ${delayMs}ms with fallback model): ${errorMessage(err)}`,
        );
        await sleep(delayMs);
      }
    }
  }

  // All retries exhausted — demote entire batch to skipped (don't crash request)
  console.error(
    `[ai] Batch ${batchIndex + 1}/${totalBatches} failed after ${MAX_RETRIES} attempts.` +
    ` Moving ${batch.length} row(s) to skipped.`,
  );

  return {
    imported: [],
    skipped: batch.map((row) => ({
      reason: `AI extraction failed after ${MAX_RETRIES} retries: ${errorMessage(lastError)}`,
      original_data: row,
    })),
  };
}

// ── Single batch call ──────────────────────────────────────────────────────

async function extractSingleBatch(
  batch: RawRecord[],
  modelToUse: string = MODEL,
): Promise<ToolOutput> {
  const response = await client.chat.completions.create({
    model:       modelToUse,
    max_tokens:  MAX_TOKENS,
    temperature: 0,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: buildUserMessage(batch) },
    ],
    tools:       [EMIT_CRM_RECORDS_TOOL],
    tool_choice: TOOL_CHOICE,
  });

  const choice = response.choices[0];

  // Groq returns tool calls in message.tool_calls[]
  const toolCallRaw = choice?.message?.tool_calls?.[0];

  if (!toolCallRaw) {
    const reason = choice?.finish_reason ?? 'unknown';
    throw new Error(
      `No tool_call in Groq response (finish_reason: ${reason}). ` +
      `stop_reason may indicate a context-length or rate-limit issue.`,
    );
  }

  // Narrow to the 'function' variant of the ChatCompletionMessageToolCall union
  if (toolCallRaw.type !== 'function') {
    throw new Error(`Unexpected tool_call type: "${toolCallRaw.type}"`);
  }

  const toolCall = toolCallRaw; // type is now ChatCompletionMessageToolCall & { type: 'function' }

  if (toolCall.function.name !== 'emit_crm_records') {
    throw new Error(`Unexpected function called: "${toolCall.function.name}"`);
  }

  // Parse the JSON arguments string returned by Groq
  let rawInput: unknown;
  try {
    rawInput = JSON.parse(toolCall.function.arguments);
  } catch {
    throw new Error(
      `Groq returned malformed JSON in function arguments: ${toolCall.function.arguments.slice(0, 200)}`,
    );
  }


  // Per-record safeParse (crm.types.ts → parseToolOutput).
  // Throws ONLY if the top-level arrays are missing — triggers the retry.
  // Individual record failures are demoted to skipped, never thrown.
  const parsed = parseToolOutput(rawInput);

  // Deterministic skip-rule enforcement (no email AND no mobile → skipped)
  return enforceSkipRule(parsed);
}

// ── Helpers ────────────────────────────────────────────────────────────────

function buildUserMessage(batch: RawRecord[]): string {
  const headers = batch.length > 0 ? Object.keys(batch[0]) : [];
  return (
    `CSV Headers: [${headers.join(', ')}]\n\n` +
    `Rows (${batch.length} total):\n` +
    JSON.stringify(batch, null, 2)
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
