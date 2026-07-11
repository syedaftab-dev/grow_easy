import { z } from 'zod';

// ── Enums ──────────────────────────────────────────────────────────────────

export const CrmStatusEnum = z.enum([
  'GOOD_LEAD_FOLLOW_UP',
  'DID_NOT_CONNECT',
  'BAD_LEAD',
  'SALE_DONE',
]);

export const DataSourceEnum = z.enum([
  'leads_on_demand',
  'meridian_tower',
  'eden_park',
  'varah_swamy',
  'sarjapur_plots',
]);

// ── Single CRM record ──────────────────────────────────────────────────────

export const CrmRecordSchema = z
  .object({
    created_at:                  z.string().optional(),
    name:                        z.string().optional(),
    email:                       z.string().optional(),
    country_code:                z.string().optional(),
    mobile_without_country_code: z.string().optional(),
    company:                     z.string().optional(),
    city:                        z.string().optional(),
    state:                       z.string().optional(),
    country:                     z.string().optional(),
    lead_owner:                  z.string().optional(),
    crm_status:                  CrmStatusEnum.optional(),
    crm_note:                    z.string().optional(),
    data_source:                 DataSourceEnum.optional(),
    possession_time:             z.string().optional(),
    description:                 z.string().optional(),
  })
  .strict(); // rejects any key not listed above

export type CrmRecord = z.infer<typeof CrmRecordSchema>;

// ── Skipped record ─────────────────────────────────────────────────────────

export const SkippedRecordSchema = z.object({
  reason:        z.string(),
  original_data: z.record(z.string()).optional(),
});

export type SkippedRecord = z.infer<typeof SkippedRecordSchema>;

// ── Tool output type (interface only — never used with .parse()) ───────────

export interface ToolOutput {
  imported: CrmRecord[];
  skipped:  SkippedRecord[];
}

// ── Batch-level shape check ────────────────────────────────────────────────
// Throws ONLY when the top-level `imported` or `skipped` arrays are entirely
// absent from the tool_use block. This is the only throw that triggers a
// batch retry — it means Claude's response was structurally malformed.

const BatchShapeSchema = z.object({
  imported: z.array(z.unknown()),
  skipped:  z.array(z.unknown()),
});

// ── Per-record parser (the real safety net) ────────────────────────────────
// ToolOutputSchema.parse() is NEVER called on the full response.
// Each record in `imported` and `skipped` is validated individually via
// safeParse. A failing record is demoted to skipped — the rest of the batch
// is never lost.
// IMPORTANT: Groq's enum adherence via function-calling can be imperfect.
// Enum violations are explicitly warned so frequency is visible during testing.

export function parseToolOutput(rawInput: unknown): ToolOutput {
  // 1. Batch-level check — intentional throw if arrays missing (triggers retry)
  const batch = BatchShapeSchema.parse(rawInput);

  const finalImported: CrmRecord[]     = [];
  const finalSkipped:  SkippedRecord[] = [];

  // 2. Validate each imported record individually
  for (const rawRecord of batch.imported) {
    const result = CrmRecordSchema.safeParse(rawRecord);
    if (result.success) {
      finalImported.push(result.data);
    } else {
      // Warn specifically on enum violations so Groq slippage is visible in logs
      for (const issue of result.error.issues) {
        if (issue.code === 'invalid_enum_value') {
          const field    = issue.path.join('.');
          const received = (issue as { received?: unknown }).received;
          const options  = (issue as { options?: unknown[] }).options;
          console.warn(
            `[zod] ⚠ Enum violation caught — field: "${field}"` +
            ` | received: ${JSON.stringify(received)}` +
            ` | allowed: [${(options ?? []).map((v) => JSON.stringify(v)).join(', ')}]` +
            ` | record demoted to skipped`,
          );
        }
      }
      const reasons = result.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ');
      finalSkipped.push({
        reason: `failed post-validation: ${reasons}`,
        original_data: toStringRecord(rawRecord),
      });
    }
  }

  // 3. Validate each skipped entry individually
  for (const rawSkipped of batch.skipped) {
    const result = SkippedRecordSchema.safeParse(rawSkipped);
    if (result.success) {
      finalSkipped.push(result.data);
    } else {
      // Skipped entry itself is malformed — preserve what we can
      finalSkipped.push({
        reason: 'failed post-validation (malformed skipped entry)',
        original_data: toStringRecord(rawSkipped),
      });
    }
  }

  return { imported: finalImported, skipped: finalSkipped };
}

// ── Skip-rule enforcer ─────────────────────────────────────────────────────
// Deterministic pass after parseToolOutput. Catches any imported record
// that Claude mistakenly placed in `imported` despite having neither email
// nor mobile number. This is an assignment hard-requirement.

export function enforceSkipRule(output: ToolOutput): ToolOutput {
  const finalImported: CrmRecord[]     = [];
  const finalSkipped:  SkippedRecord[] = [...output.skipped];

  for (const record of output.imported) {
    const hasEmail  = !!record.email?.trim();
    const hasMobile = !!record.mobile_without_country_code?.trim();

    if (!hasEmail && !hasMobile) {
      finalSkipped.push({
        reason: 'No email or mobile number found (enforced post-validation)',
        original_data: toStringRecord(record),
      });
    } else {
      finalImported.push(record);
    }
  }

  return { imported: finalImported, skipped: finalSkipped };
}

// ── Helper ─────────────────────────────────────────────────────────────────

function toStringRecord(value: unknown): Record<string, string> {
  if (typeof value !== 'object' || value === null) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, String(v ?? '')]),
  );
}
