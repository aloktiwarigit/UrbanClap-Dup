# E21-S02 — Commission Ledger v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the cash-commission ledger settle-able in the real world — partial and bulk remittances, overpayment credits, a denormalised per-technician hold, an enriched technician view, admin-editable dues thresholds and a server-driven technician client config — all as atomic single-partition Cosmos writes.

**Architecture:** Every money document for a technician lives in the existing `commission_receivables` container (pk `/technicianId`) under a `docType` discriminator (absent = `RECEIVABLE`). Every mutation is one `items.batch()` on that partition with deterministic ids so a replay is a detectable 409 and a concurrent edit is a 412 that re-plans. Derived numbers are always recomputed from the rows, never incremented. The technician's `commissionHold` is a cache on the `technicians` doc written by a conditional patch; the receivables stay the sole truth.

**Tech Stack:** Node 22 · TypeScript strict · Azure Functions v4 · `@azure/cosmos` 4.9.2 (`items.batch`, `item.patch`) · Zod · Vitest · zod-to-openapi · Semgrep.

**Spec:** `C:/Users/alokt/.claude/plans/validated-frolicking-mochi.md` §3, §5.1–5.3, §6 "E21-S02", §7.1, §11. Owner decisions in `C:/Users/alokt/.claude/plans/act-as-a-principal-ticklish-fern.md` §"Decisions taken with the owner".

## Global Constraints

- Tier: **Foundation** (money + Cosmos schema). Worktree `C:/Alok/Business Projects/wt-e21-s02`, branch `feat/e21-s02-commission-ledger-v2`, base `origin/main` @ `aab4fddc`.
- **Read-path schemas only widen.** Every new stored field is `.optional()`; `docType` absent means `RECEIVABLE`; no `.strict()` on stored-doc schemas that are ever parsed on read. Validation that can reject a stored prod doc goes on write-body schemas only. (`feedback_read_path_validation`, outage 2026-09-05.)
- **Absolute recomputation, never increments.** `remittedAmount = Σ allocations[].paise`; `remainingPaise = originalPaise − Σ consumedBy[].paise`; `commissionHold` is overwritten from a fresh SUM. Semgrep enforces (Task 12).
- **All money integers in paise.** Never `+=` on a stored figure.
- **Every ledger write goes through `runLedgerBatch`** in the repository (Task 3). No `items.create/upsert/replace` on the receivables container elsewhere. Semgrep enforces (Task 12).
- **Deploy order for rollout:** functions first, then seeds/backfill (Task 13).
- Roles: remittance/waive = `super-admin, finance`; dashboards = `super-admin, finance, ops-manager`; config PUT + override + recompute = `super-admin`; technician routes = `verifyTechnicianToken`.
- Commission bps bounds stay `1500..3500`. Threshold defaults: warn `250000`, block `500000`. `holdEnforcementEnabled` default `false` (E21-S04 consumes it; this story only stores and serves it).
- Gate: `bash tools/pre-codex-smoke-api.sh` (tsc → eslint 0 warnings → vitest) → `codex review --base main` → `/security-review` → CI. Commit after every task with the trailer below.

```
Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Kbr2b3MgFeVRdiWJoRUaM7
```

## Context an executor will not infer from the code

1. `items.batch(ops, partitionKey)` does **not throw** on a failed operation; it returns `result[i].statusCode` per op (the failing op carries 409/412, the rest 424). It **does** throw (`"Batch request error: …"`) for batch-level errors (400, 429). Task 3's `runLedgerBatch` normalises both.
2. `ReplaceOperationInput` needs `id` **and** `resourceBody`, plus `ifMatch` for the ETag guard. `CreateOperationInput` needs only `resourceBody`. Limit 100 ops per batch → the allocator caps at 98 receivable rows + 1 anchor + 1 credit.
3. `getAllByTechnician` runs `SELECT * FROM c` on the partition and feeds `earnings.ts`; once REMITTANCE/CREDIT docs share the partition **that query must filter by docType** or earnings will try to parse a remittance as a receivable.
4. `upsertCommissionConfig` currently rebuilds a four-field doc; `CommissionConfigDocSchema` is `.strict()` but is never parsed on read (`getCommissionConfig` is a raw typed read). Keep it that way; add the new fields as optional and switch the write to read-merge.
5. `trigger-booking-completed.ts` returns early on `existing` and on `!created`. The hold recompute must run **after** those returns are folded into a create-or-noop — a duplicate change-feed delivery is the normal case, not the exception.
6. `technicians` doc id **equals** `technicianId` (Firebase uid) and is its own partition key. Five writers do read→spread→`items.upsert` with no ETag; Task 7 fixes them.
7. `TechnicianProfileSchema` is a plain `z.object` (strip). New nested fields must still be added to it or `upsertTechnicianProfile`-style typed writers would drop them; that function is deleted in Task 7 anyway.
8. Tests live in `api/tests/**` mirroring `src/`; Cosmos is mocked via `vi.mock('../../src/cosmos/client.js', …)`; handlers are called directly with a fabricated `AdminContext` `{ adminId, role, sessionId }`.
9. The Semgrep rule `no-user-controlled-cosmos-query` flags template literals inside Cosmos query strings. The hold patch condition (Task 6) interpolates a server-generated ISO timestamp; use string concatenation and a one-line `// nosemgrep` with justification if the rule still fires.

## File Structure

| File | Responsibility |
|---|---|
| `api/src/schemas/commission-receivable.ts` (modify) | RECEIVABLE additions, `Allocation`, `CollectionMethod`, `outstandingOf()` |
| `api/src/schemas/commission-ledger.ts` (create) | `LedgerDocType`, `RemittanceDoc`, `CreditDoc`, `RecordRemittanceBody`, `LedgerDoc` union |
| `api/src/schemas/commission-config.ts` (modify) | thresholds + flags, `EffectiveCommissionConfig`, PUT body |
| `api/src/schemas/technician.ts` (modify) | `CommissionHold`, `PaymentProfile` |
| `api/src/schemas/technician-client-config.ts` (create) | `TechnicianClientConfigDoc`, `TechnicianConfigResponse` |
| `api/src/lib/ist-time.ts` (create) | `istDateStr`, `istWeekStart` |
| `api/src/services/commission-allocator.service.ts` (create) | pure `allocateOldestFirst`, `deriveStatus`, `mergeAllocation`; orchestrations `applyCredit`, `consumePendingCredits` |
| `api/src/cosmos/commission-receivable-repository.ts` (modify) | docType-aware reads, `runLedgerBatch`, waive-by-batch, grouped DUE sum |
| `api/src/services/commission-hold.service.ts` (create) | `evaluateState`, `recomputeCommissionHold`, `sweepAllHolds` |
| `api/src/cosmos/technician-repository.ts` (modify) | `patchCommissionHold`, `listTechniciansWithHold`, `patchPaymentProfile`, ETag hardening |
| `api/src/cosmos/commission-config-repository.ts` (modify) | read-merge `patchCommissionConfig` |
| `api/src/services/commission-config.service.ts` (modify) | `getCommissionConfig()` effective + cache |
| `api/src/cosmos/system-docs-repository.ts` (create) | `technician-client-config`, `hold-repair` docs |
| `api/src/services/commission-settlement.service.ts` (create) | `recordCommissionDue`, `finalizeLedgerForTechnician` (shared by trigger + active-job) |
| `api/src/functions/trigger-booking-completed.ts` (modify) | create-or-noop then always finalize |
| `api/src/functions/active-job.ts` (modify) | synchronous DUE on COMPLETED, `collectionMethod`, audit |
| `api/src/functions/admin/finance/commission-remittances.ts` (create) | POST remittance |
| `api/src/functions/admin/finance/commission-receivables.ts` (modify) | hold-based dashboard, ledger detail, recompute |
| `api/src/functions/admin/finance/commission-hold-override.ts` (create) | POST/DELETE override |
| `api/src/functions/admin/finance/mark-commission-received.ts` (modify) | WAIVE only |
| `api/src/functions/admin/catalogue/commission-config.ts` (modify) | thresholds/flags |
| `api/src/functions/technicians/commission-due.ts` (modify) | v2 response |
| `api/src/services/commission-view.service.ts` (create) | pure `buildCommissionDueResponse` |
| `api/src/functions/config/technician.ts` (create) | `GET /v1/config/technician` |
| `api/src/services/auditLog.service.ts`, `api/src/types/admin.ts` (modify) | closed `AuditAction` on the write helper |
| `api/.semgrep.yml` (modify) | `no-increment-on-ledger`, `ledger-batch-only` |
| `api/src/openapi/registry.ts` (modify) | contracts |
| `api/scripts/setup-cosmos.ts`, `api/scripts/backfill-commission-holds.ts` | seeds, backfill |
| `docs/adr/0031-single-partition-commission-ledger.md`, `docs/runbook.md`, `docs/stories/E21-S02-commission-ledger-v2.md` | docs |

---

### Task 1: Ledger, config and technician schemas

**Files:**
- Modify: `api/src/schemas/commission-receivable.ts`
- Create: `api/src/schemas/commission-ledger.ts`
- Modify: `api/src/schemas/commission-config.ts`
- Modify: `api/src/schemas/technician.ts`
- Create: `api/src/schemas/technician-client-config.ts`
- Create: `docs/stories/E21-S02-commission-ledger-v2.md`
- Test: `api/tests/schemas/commission-ledger.test.ts`, `api/tests/schemas/commission-config-v2.test.ts`

**Interfaces:**
- Produces: `Allocation`, `CollectionMethodSchema`, `outstandingOf(entry)`, `LedgerDocTypeSchema`, `RemittanceDoc`, `CreditDoc`, `LedgerDoc`, `RecordRemittanceBodySchema`, `EffectiveCommissionConfig`, `DEFAULT_WARN_THRESHOLD_PAISE=250000`, `DEFAULT_BLOCK_THRESHOLD_PAISE=500000`, `CommissionHold`, `HoldStateSchema`, `PaymentProfile`, `TechnicianClientConfigDoc`, `TechnicianConfigResponseSchema`.

- [ ] **Step 1: Write the failing schema tests**

`api/tests/schemas/commission-ledger.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { CommissionReceivableEntrySchema, outstandingOf } from '../../src/schemas/commission-receivable.js';
import { LedgerDocSchema, RemittanceDocSchema, CreditDocSchema, RecordRemittanceBodySchema } from '../../src/schemas/commission-ledger.js';

const legacy = {
  id: 'bk-1', bookingId: 'bk-1', technicianId: 't1', partitionKey: 't1', serviceId: 's', categoryId: 'c',
  bookingAmount: 99900, commissionBps: 2200, commissionDue: 21978, commissionResolvedFrom: 'GLOBAL',
  remittanceStatus: 'DUE', createdAt: '2026-09-01T00:00:00.000Z',
};

describe('ledger schemas', () => {
  it('parses an E21-S01-shaped receivable with no docType and treats it as RECEIVABLE', () => {
    const r = LedgerDocSchema.parse(legacy);
    expect(r.docType).toBe('RECEIVABLE');
  });
  it('outstandingOf derives from remittedAmount and never goes negative', () => {
    expect(outstandingOf(CommissionReceivableEntrySchema.parse(legacy))).toBe(21978);
    expect(outstandingOf(CommissionReceivableEntrySchema.parse({ ...legacy, remittedAmount: 30000 }))).toBe(0);
  });
  it('parses remittance and credit docs', () => {
    expect(RemittanceDocSchema.parse({
      id: 'rem:k1', docType: 'REMITTANCE', technicianId: 't1', partitionKey: 't1', amountPaise: 5000,
      method: 'UPI', ref: 'utr-1', allocations: [{ bookingId: 'bk-1', paise: 5000 }], creditCreatedPaise: 0,
      recordedByAdminId: 'a1', idempotencyKey: 'k1', createdAt: '2026-09-05T00:00:00.000Z',
    }).docType).toBe('REMITTANCE');
    expect(CreditDocSchema.parse({
      id: 'cr:rem:k1', docType: 'CREDIT', technicianId: 't1', partitionKey: 't1', source: 'OVERPAYMENT',
      refId: 'rem:k1', originalPaise: 700, remainingPaise: 700, consumedBy: [], createdAt: '2026-09-05T00:00:00.000Z',
    }).remainingPaise).toBe(700);
  });
  it('rejects a remittance body with a bad idempotency key or ADJUSTMENT method', () => {
    expect(RecordRemittanceBodySchema.safeParse({ technicianId: 't1', amountPaise: 1, method: 'UPI', ref: 'x', idempotencyKey: 'short' }).success).toBe(false);
    expect(RecordRemittanceBodySchema.safeParse({ technicianId: 't1', amountPaise: 1, method: 'ADJUSTMENT', ref: 'x', idempotencyKey: 'abcdefgh-1' }).success).toBe(false);
    expect(RecordRemittanceBodySchema.safeParse({ technicianId: 't1', amountPaise: 1, method: 'CASH_DEPOSIT', ref: 'x', idempotencyKey: 'abcdefgh-1' }).success).toBe(true);
  });
});
```

`api/tests/schemas/commission-config-v2.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { CommissionConfigDocSchema, UpdateCommissionConfigBodySchema, toEffectiveConfig } from '../../src/schemas/commission-config.js';
import { TechnicianProfileSchema } from '../../src/schemas/technician.js';

describe('commission config v2', () => {
  it('still parses the E21-S01 four-field doc and fills defaults', () => {
    const doc = CommissionConfigDocSchema.parse({ id: 'commission-config', defaultCommissionBps: 2200, updatedBy: 'system', updatedAt: '2026-09-05T00:00:00.000Z' });
    const eff = toEffectiveConfig(doc);
    expect(eff).toMatchObject({ warnThresholdPaise: 250000, blockThresholdPaise: 500000, holdEnforcementEnabled: false, enforceKycInDispatch: false });
  });
  it('rejects warn >= block on the PUT body', () => {
    expect(UpdateCommissionConfigBodySchema.safeParse({ warnThresholdPaise: 500000, blockThresholdPaise: 500000 }).success).toBe(false);
    expect(UpdateCommissionConfigBodySchema.safeParse({ warnThresholdPaise: 100000 }).success).toBe(true);
  });
  it('technician profile accepts commissionHold and paymentProfile', () => {
    const p = TechnicianProfileSchema.parse({
      id: 't1', technicianId: 't1', location: { type: 'Point', coordinates: [82.1, 26.7] }, skills: ['ac-deep-clean'],
      availabilityWindows: [], isOnline: true, isAvailable: true, kycStatus: 'APPROVED',
      commissionHold: { outstandingPaise: 0, dueCount: 0, state: 'CLEAR', evaluatedAt: '2026-09-05T00:00:00.000Z' },
      paymentProfile: { upiVpa: 'ram@ybl', upiUpdatedAt: '2026-09-05T00:00:00.000Z' },
    });
    expect(p.commissionHold?.state).toBe('CLEAR');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd api && node_modules/.bin/vitest run tests/schemas/commission-ledger.test.ts tests/schemas/commission-config-v2.test.ts`
Expected: FAIL — modules/exports not found.

- [ ] **Step 3: Implement the schemas**

`api/src/schemas/commission-receivable.ts` — add after `RemittanceMethodSchema`:
```ts
/** E24: how the money changed hands at the door (completion-time). Distinct from booking.paymentMethod. */
export const CollectionMethodSchema = z.enum(['CASH', 'UPI_QR']);
export type CollectionMethod = z.infer<typeof CollectionMethodSchema>;

export const AllocationSourceSchema = z.enum(['REMITTANCE', 'INCENTIVE', 'WAIVER']);
/** One credit applied to a receivable. id = `${refId}:${bookingId}` so a replay is detectable. */
export const AllocationSchema = z.object({
  id: z.string().min(1),
  source: AllocationSourceSchema,
  refId: z.string().min(1),
  paise: z.number().int().positive(),
  appliedAt: z.string(),
  byId: z.string().min(1),
});
export type Allocation = z.infer<typeof AllocationSchema>;
```
Extend `CommissionReceivableEntrySchema` (all optional, additive):
```ts
  docType: z.literal('RECEIVABLE').optional(),
  allocations: z.array(AllocationSchema).optional(),
  serviceName: z.string().optional(),
  slotDate: z.string().optional(),
  collectionMethod: CollectionMethodSchema.optional(),
```
Add helper at the bottom:
```ts
/** Derived, never stored. */
export function outstandingOf(e: Pick<CommissionReceivableEntry, 'commissionDue' | 'remittedAmount'>): number {
  return Math.max(0, e.commissionDue - (e.remittedAmount ?? 0));
}
```
Extend `CommissionReceivableCreateInput` with `serviceName?: string; slotDate?: string; collectionMethod?: CollectionMethod;`.

`api/src/schemas/commission-ledger.ts`:
```ts
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { CommissionReceivableEntrySchema } from './commission-receivable.js';
extendZodWithOpenApi(z);

export const LedgerDocTypeSchema = z.enum(['RECEIVABLE', 'REMITTANCE', 'CREDIT', 'INCENTIVE_AWARD']);
export type LedgerDocType = z.infer<typeof LedgerDocTypeSchema>;

export const RemittancePhysicalMethodSchema = z.enum(['UPI', 'CASH_DEPOSIT']);

export const RemittanceDocSchema = z.object({
  id: z.string().min(1),                 // `rem:${idempotencyKey}`
  docType: z.literal('REMITTANCE'),
  technicianId: z.string().min(1),
  partitionKey: z.string().min(1),
  amountPaise: z.number().int().positive(),
  method: RemittancePhysicalMethodSchema,
  ref: z.string().min(1),
  note: z.string().max(500).optional(),
  allocations: z.array(z.object({ bookingId: z.string(), paise: z.number().int().positive() })),
  creditCreatedPaise: z.number().int().nonnegative(),
  recordedByAdminId: z.string().min(1),
  idempotencyKey: z.string().min(1),
  createdAt: z.string(),
});
export type RemittanceDoc = z.infer<typeof RemittanceDocSchema>;

export const CreditDocSchema = z.object({
  id: z.string().min(1),                 // `cr:${refId}`
  docType: z.literal('CREDIT'),
  technicianId: z.string().min(1),
  partitionKey: z.string().min(1),
  source: z.enum(['OVERPAYMENT', 'INCENTIVE']),
  refId: z.string().min(1),
  originalPaise: z.number().int().positive(),
  remainingPaise: z.number().int().nonnegative(),
  consumedBy: z.array(z.object({ bookingId: z.string(), paise: z.number().int().positive(), appliedAt: z.string() })),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});
export type CreditDoc = z.infer<typeof CreditDocSchema>;

/** Read-path union. Absent docType = RECEIVABLE (every E21-S01 doc). */
export const LedgerDocSchema = z.preprocess(
  (v) => (v && typeof v === 'object' && !('docType' in v) ? { ...(v as object), docType: 'RECEIVABLE' } : v),
  z.discriminatedUnion('docType', [
    CommissionReceivableEntrySchema.extend({ docType: z.literal('RECEIVABLE') }),
    RemittanceDocSchema,
    CreditDocSchema,
    z.object({ docType: z.literal('INCENTIVE_AWARD') }).passthrough(), // E23 defines the body
  ]),
);
export type LedgerDoc = z.infer<typeof LedgerDocSchema>;

export const IDEMPOTENCY_KEY_RE = /^[A-Za-z0-9._-]{8,128}$/;
export const RecordRemittanceBodySchema = z.object({
  technicianId: z.string().min(1),
  amountPaise: z.number().int().positive(),
  method: RemittancePhysicalMethodSchema,
  ref: z.string().min(1).max(120),
  note: z.string().max(500).optional(),
  idempotencyKey: z.string().regex(IDEMPOTENCY_KEY_RE),
}).strict();
export type RecordRemittanceBody = z.infer<typeof RecordRemittanceBodySchema>;

export const remittanceDocId = (idempotencyKey: string): string => `rem:${idempotencyKey}`;
export const creditDocId = (refId: string): string => `cr:${refId}`;
export const allocationId = (refId: string, bookingId: string): string => `${refId}:${bookingId}`;
```

`api/src/schemas/commission-config.ts` — add:
```ts
export const DEFAULT_WARN_THRESHOLD_PAISE = 250_000;
export const DEFAULT_BLOCK_THRESHOLD_PAISE = 500_000;
```
Extend `CommissionConfigDocSchema` object (keep `.strict()`; never parsed on read) with:
```ts
    warnThresholdPaise: z.number().int().nonnegative().optional(),
    blockThresholdPaise: z.number().int().positive().optional(),
    holdEnforcementEnabled: z.boolean().optional(),
    enforceKycInDispatch: z.boolean().optional(),
```
Replace `UpdateCommissionConfigBodySchema` with:
```ts
export const UpdateCommissionConfigBodySchema = z.object({
  defaultCommissionBps: CommissionBpsSchema.optional(),
  warnThresholdPaise: z.number().int().nonnegative().optional(),
  blockThresholdPaise: z.number().int().positive().optional(),
  holdEnforcementEnabled: z.boolean().optional(),
  enforceKycInDispatch: z.boolean().optional(),
}).strict()
  .refine((b) => Object.keys(b).length > 0, { message: 'empty patch' })
  .refine((b) => b.warnThresholdPaise === undefined || b.blockThresholdPaise === undefined || b.warnThresholdPaise < b.blockThresholdPaise,
    { message: 'warnThresholdPaise must be below blockThresholdPaise' });
```
Add:
```ts
export const EffectiveCommissionConfigSchema = z.object({
  defaultCommissionBps: CommissionBpsSchema,
  warnThresholdPaise: z.number().int().nonnegative(),
  blockThresholdPaise: z.number().int().positive(),
  holdEnforcementEnabled: z.boolean(),
  enforceKycInDispatch: z.boolean(),
  updatedBy: z.string(),
  updatedAt: z.string(),
  isDefault: z.boolean().optional(),
});
export type EffectiveCommissionConfig = z.infer<typeof EffectiveCommissionConfigSchema>;

export function toEffectiveConfig(doc: CommissionConfigDoc | null): EffectiveCommissionConfig {
  return {
    defaultCommissionBps: doc?.defaultCommissionBps ?? 2200,
    warnThresholdPaise: doc?.warnThresholdPaise ?? DEFAULT_WARN_THRESHOLD_PAISE,
    blockThresholdPaise: doc?.blockThresholdPaise ?? DEFAULT_BLOCK_THRESHOLD_PAISE,
    holdEnforcementEnabled: doc?.holdEnforcementEnabled ?? false,
    enforceKycInDispatch: doc?.enforceKycInDispatch ?? false,
    updatedBy: doc?.updatedBy ?? 'system',
    updatedAt: doc?.updatedAt ?? new Date(0).toISOString(),
    ...(doc ? {} : { isDefault: true }),
  };
}
```
Also update `CommissionConfigResponseSchema` to `EffectiveCommissionConfigSchema` (alias export kept for the registry).
Note: the existing PUT handler passes `defaultCommissionBps` positionally — Task 5 rewrites it; the compile break in between is expected and fixed there.

`api/src/schemas/technician.ts` — add before `TechnicianProfileSchema`:
```ts
export const HoldStateSchema = z.enum(['CLEAR', 'WARN', 'BLOCKED']);
export type HoldState = z.infer<typeof HoldStateSchema>;
export const CommissionHoldSchema = z.object({
  outstandingPaise: z.number().int().nonnegative(),
  dueCount: z.number().int().nonnegative(),
  oldestDueAt: z.string().optional(),
  state: HoldStateSchema,
  evaluatedAt: z.string(),
  override: z.object({ until: z.string(), byAdminId: z.string(), reason: z.string() }).optional(),
});
export type CommissionHold = z.infer<typeof CommissionHoldSchema>;
export const PaymentProfileSchema = z.object({ upiVpa: z.string(), upiUpdatedAt: z.string() });
export type PaymentProfile = z.infer<typeof PaymentProfileSchema>;
```
and inside `TechnicianProfileSchema`: `commissionHold: CommissionHoldSchema.optional(), paymentProfile: PaymentProfileSchema.optional(),`.

`api/src/schemas/technician-client-config.ts`:
```ts
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
extendZodWithOpenApi(z);

export const TECHNICIAN_CLIENT_CONFIG_DOC_ID = 'technician-client-config';
export const TechnicianFeatureFlagsSchema = z.object({
  wallet: z.boolean(), duesBanner: z.boolean(), upiQr: z.boolean(), incentives: z.boolean(), addOnRequests: z.boolean(),
});
export const DEFAULT_TECHNICIAN_FEATURES = { wallet: false, duesBanner: false, upiQr: false, incentives: false, addOnRequests: false } as const;

export const TechnicianClientConfigDocSchema = z.object({
  id: z.literal(TECHNICIAN_CLIENT_CONFIG_DOC_ID),
  features: TechnicianFeatureFlagsSchema.partial().optional(),
  minSupportedVersionCode: z.number().int().nonnegative().optional(),
  updatedBy: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type TechnicianClientConfigDoc = z.infer<typeof TechnicianClientConfigDocSchema>;

export const UpdateTechnicianClientConfigBodySchema = z.object({
  features: TechnicianFeatureFlagsSchema.partial().optional(),
  minSupportedVersionCode: z.number().int().nonnegative().optional(),
}).strict().refine((b) => Object.keys(b).length > 0, { message: 'empty patch' });

export const TechnicianConfigResponseSchema = z.object({
  features: TechnicianFeatureFlagsSchema,
  thresholds: z.object({ warnPaise: z.number().int(), blockPaise: z.number().int() }),
  holdEnforcementEnabled: z.boolean(),
  incentive: z.object({ enabled: z.boolean(), milestones: z.array(z.object({ jobs: z.number().int(), bonusPaise: z.number().int() })), capFractionBps: z.number().int() }),
  minSupportedVersionCode: z.number().int(),
  serverTime: z.string(),
});
export type TechnicianConfigResponse = z.infer<typeof TechnicianConfigResponseSchema>;
```

`docs/stories/E21-S02-commission-ledger-v2.md` — 20-line story card: goal, acceptance list copied from this plan's Global Constraints + Task 14 verification, links to both plan files.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd api && node_modules/.bin/vitest run tests/schemas/commission-ledger.test.ts tests/schemas/commission-config-v2.test.ts`
Expected: PASS (tsc may still fail on the old PUT handler — expected until Task 5).

- [ ] **Step 5: Commit**
```bash
git add api/src/schemas api/tests/schemas docs/stories/E21-S02-commission-ledger-v2.md
git commit -m "feat(api): E21-S02 — ledger docType schemas, thresholds, commissionHold, technician client config"
```

---

### Task 2: Pure allocator functions

**Files:**
- Create: `api/src/services/commission-allocator.service.ts` (pure half)
- Test: `api/tests/services/commission-allocator.pure.test.ts`

**Interfaces:**
- Produces:
  - `type OutstandingRow = { entry: CommissionReceivableEntry; etag: string; outstandingPaise: number }`
  - `allocateOldestFirst(rows: OutstandingRow[], paise: number, maxRows = 98): { allocations: Array<{ bookingId: string; paise: number }>; leftoverPaise: number }`
  - `mergeAllocation(entry, alloc: Allocation): CommissionReceivableEntry` — dedupes by `alloc.id`, recomputes `remittedAmount` and `remittanceStatus`.
  - `deriveStatus(entry): 'DUE' | 'REMITTED' | 'WAIVED'`

- [ ] **Step 1: Write the failing tests**
```ts
import { describe, it, expect } from 'vitest';
import { allocateOldestFirst, mergeAllocation, deriveStatus, type OutstandingRow } from '../../src/services/commission-allocator.service.js';
import type { CommissionReceivableEntry } from '../../src/schemas/commission-receivable.js';

const mk = (id: string, due: number, createdAt: string, remitted = 0): OutstandingRow => ({
  entry: { id, bookingId: id, technicianId: 't1', partitionKey: 't1', serviceId: 's', categoryId: 'c', bookingAmount: due * 5,
    commissionBps: 2000, commissionDue: due, commissionResolvedFrom: 'GLOBAL', remittanceStatus: 'DUE', createdAt,
    ...(remitted ? { remittedAmount: remitted } : {}) } as CommissionReceivableEntry,
  etag: `"${id}"`, outstandingPaise: due - remitted,
});

describe('allocateOldestFirst', () => {
  it('fills oldest rows first, partial on the last, leftover 0', () => {
    const r = allocateOldestFirst([mk('b2', 300, '2026-09-02'), mk('b1', 200, '2026-09-01')], 400);
    expect(r.allocations).toEqual([{ bookingId: 'b1', paise: 200 }, { bookingId: 'b2', paise: 200 }]);
    expect(r.leftoverPaise).toBe(0);
  });
  it('returns leftover when paying more than outstanding', () => {
    expect(allocateOldestFirst([mk('b1', 200, '2026-09-01')], 250)).toEqual({ allocations: [{ bookingId: 'b1', paise: 200 }], leftoverPaise: 50 });
  });
  it('caps per row at current outstanding and skips zero rows', () => {
    expect(allocateOldestFirst([mk('b1', 200, '2026-09-01', 200), mk('b2', 100, '2026-09-02')], 100).allocations).toEqual([{ bookingId: 'b2', paise: 100 }]);
  });
  it('stops at maxRows and carries the rest as leftover', () => {
    const rows = Array.from({ length: 100 }, (_, i) => mk(`b${i}`, 10, `2026-01-${String(i % 28 + 1).padStart(2, '0')}T00:00:00.${String(i).padStart(3, '0')}Z`));
    const r = allocateOldestFirst(rows, 1000, 98);
    expect(r.allocations).toHaveLength(98);
    expect(r.leftoverPaise).toBe(20);
  });
});

describe('mergeAllocation / deriveStatus', () => {
  const alloc = { id: 'rem:k:b1', source: 'REMITTANCE' as const, refId: 'rem:k', paise: 150, appliedAt: 'now', byId: 'a1' };
  it('appends once, recomputes remittedAmount absolutely, flips to REMITTED at zero', () => {
    const once = mergeAllocation(mk('b1', 200, '2026-09-01').entry, alloc);
    const twice = mergeAllocation(once, alloc);
    expect(twice.allocations).toHaveLength(1);
    expect(twice.remittedAmount).toBe(150);
    expect(twice.remittanceStatus).toBe('DUE');
    const done = mergeAllocation(twice, { ...alloc, id: 'rem:k2:b1', refId: 'rem:k2', paise: 50 });
    expect(done.remittedAmount).toBe(200);
    expect(deriveStatus(done)).toBe('REMITTED');
  });
  it('WAIVER allocation makes the row WAIVED regardless of amount', () => {
    const w = mergeAllocation(mk('b1', 200, '2026-09-01').entry, { ...alloc, id: 'w:b1', source: 'WAIVER', paise: 200 });
    expect(w.remittanceStatus).toBe('WAIVED');
  });
});
```

- [ ] **Step 2: Run to verify failure** — `node_modules/.bin/vitest run tests/services/commission-allocator.pure.test.ts` → FAIL (module missing).

- [ ] **Step 3: Implement**
```ts
import type { Allocation, CommissionReceivableEntry, RemittanceStatus } from '../schemas/commission-receivable.js';

export type OutstandingRow = { entry: CommissionReceivableEntry; etag: string; outstandingPaise: number };

export const MAX_ALLOCATION_ROWS = 98; // 100-op batch limit minus anchor doc and optional credit doc

export function allocateOldestFirst(rows: OutstandingRow[], paise: number, maxRows = MAX_ALLOCATION_ROWS):
  { allocations: Array<{ bookingId: string; paise: number }>; leftoverPaise: number } {
  const sorted = [...rows].filter((r) => r.outstandingPaise > 0)
    .sort((a, b) => (a.entry.createdAt < b.entry.createdAt ? -1 : a.entry.createdAt > b.entry.createdAt ? 1 : a.entry.bookingId.localeCompare(b.entry.bookingId)));
  const allocations: Array<{ bookingId: string; paise: number }> = [];
  let remaining = paise;
  for (const row of sorted) {
    if (remaining <= 0 || allocations.length >= maxRows) break;
    const take = Math.min(remaining, row.outstandingPaise);
    allocations.push({ bookingId: row.entry.bookingId, paise: take });
    remaining -= take;
  }
  return { allocations, leftoverPaise: remaining };
}

export function deriveStatus(e: Pick<CommissionReceivableEntry, 'commissionDue' | 'allocations' | 'remittanceStatus'>): RemittanceStatus {
  const allocs = e.allocations ?? [];
  if (allocs.some((a) => a.source === 'WAIVER')) return 'WAIVED';
  const paid = allocs.reduce((s, a) => s + a.paise, 0);
  return paid >= e.commissionDue ? 'REMITTED' : 'DUE';
}

/** Idempotent merge: same allocation id twice is a no-op. All derived fields recomputed absolutely. */
export function mergeAllocation(entry: CommissionReceivableEntry, alloc: Allocation): CommissionReceivableEntry {
  const existing = entry.allocations ?? [];
  const allocations = existing.some((a) => a.id === alloc.id) ? existing : [...existing, alloc];
  const remittedAmount = allocations.filter((a) => a.source !== 'WAIVER').reduce((s, a) => s + a.paise, 0);
  const next: CommissionReceivableEntry = { ...entry, allocations, remittedAmount, updatedAt: alloc.appliedAt };
  const status = deriveStatus(next);
  return {
    ...next,
    remittanceStatus: status,
    ...(status === 'REMITTED' && !entry.remittedAt ? { remittedAt: alloc.appliedAt } : {}),
    ...(alloc.source === 'WAIVER' ? { waivedReason: entry.waivedReason ?? alloc.refId, markedByAdminId: alloc.byId } : {}),
  };
}
```

- [ ] **Step 4: Run tests** → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(api): E21-S02 — pure allocator (oldest-first, idempotent merge, derived status)"`

---

### Task 3: Ledger repository — docType-aware reads and the batch primitive

**Files:**
- Modify: `api/src/cosmos/commission-receivable-repository.ts`
- Modify: `api/tests/cosmos/commission-receivable-repository.test.ts` (replace `markRemitted` cases; add new)

**Interfaces:**
- Produces on `commissionReceivableRepo`:
  - `getOutstandingByTechnician(technicianId): Promise<OutstandingRow[]>` (**signature change**: returns rows with `etag` + `outstandingPaise`, DUE docType only)
  - `getAllByTechnician(technicianId): Promise<CommissionReceivableEntry[]>` (RECEIVABLE only — unchanged shape)
  - `listLedger(technicianId): Promise<{ receivables: CommissionReceivableEntry[]; remittances: RemittanceDoc[]; credits: CreditDoc[] }>`
  - `getRemittance(technicianId, id): Promise<RemittanceDoc | null>`
  - `getOpenCredits(technicianId): Promise<Array<{ doc: CreditDoc; etag: string }>>`
  - `runLedgerBatch(technicianId, ops: OperationInput[]): Promise<LedgerBatchResult>` where `type LedgerBatchResult = { ok: true } | { ok: false; reason: 'CONFLICT' | 'PRECONDITION' }`
  - `sumDueGroupedByTechnician(continuationToken?): Promise<{ groups: Array<{ technicianId: string; outstandingPaise: number; dueCount: number; oldestDueAt: string }>; continuationToken?: string }>`
  - `markRemitted` **removed**; `markWaived(bookingId, technicianId, { waivedReason, markedByAdminId })` reimplemented via `mergeAllocation` + `runLedgerBatch` (Replace with ifMatch), returns `{ entry, wasApplied }`.
  - `getAllTechnicianOutstandingSummaries` **removed**.

- [ ] **Step 1: Write failing tests** (append to the existing test file; delete the `markRemitted` describe block)
```ts
const mockBatch = vi.fn();
// extend the client mock: items: { create: mockCreate, query: mockQuery, batch: mockBatch }

describe('runLedgerBatch', () => {
  it('returns ok when every op succeeded', async () => {
    mockBatch.mockResolvedValue({ result: [{ statusCode: 201 }, { statusCode: 200 }] });
    expect(await commissionReceivableRepo.runLedgerBatch('tech-1', [])).toEqual({ ok: true });
  });
  it('maps 409 to CONFLICT and 412 to PRECONDITION (others 424)', async () => {
    mockBatch.mockResolvedValue({ result: [{ statusCode: 409 }, { statusCode: 424 }] });
    expect(await commissionReceivableRepo.runLedgerBatch('tech-1', [])).toEqual({ ok: false, reason: 'CONFLICT' });
    mockBatch.mockResolvedValue({ result: [{ statusCode: 424 }, { statusCode: 412 }] });
    expect(await commissionReceivableRepo.runLedgerBatch('tech-1', [])).toEqual({ ok: false, reason: 'PRECONDITION' });
  });
  it('rethrows batch-level errors', async () => {
    mockBatch.mockRejectedValue(new Error('Batch request error: 429'));
    await expect(commissionReceivableRepo.runLedgerBatch('tech-1', [])).rejects.toThrow(/429/);
  });
});

describe('docType-aware reads', () => {
  it('getOutstandingByTechnician filters RECEIVABLE+DUE and returns etag + outstanding', async () => {
    mockFetchAll.mockResolvedValue({ resources: [{ ...baseDueEntry, _etag: '"e1"', remittedAmount: 1000 }] });
    const rows = await commissionReceivableRepo.getOutstandingByTechnician('tech-1');
    const q = (mockQuery.mock.calls as unknown[][])[0]![0] as { query: string };
    expect(q.query).toMatch(/docType/);
    expect(rows[0]).toMatchObject({ etag: '"e1"', outstandingPaise: 10980 });
  });
  it('getAllByTechnician excludes non-receivable docs in the query', async () => {
    mockFetchAll.mockResolvedValue({ resources: [] });
    await commissionReceivableRepo.getAllByTechnician('tech-1');
    expect(((mockQuery.mock.calls as unknown[][])[0]![0] as { query: string }).query).toMatch(/NOT IS_DEFINED\(c\.docType\) OR c\.docType = 'RECEIVABLE'/);
  });
});

describe('markWaived (batch)', () => {
  it('replaces the row with a WAIVER allocation under ifMatch', async () => {
    mockRead.mockResolvedValue({ resource: baseDueEntry, etag: '"e1"' });
    mockBatch.mockResolvedValue({ result: [{ statusCode: 200 }] });
    const r = await commissionReceivableRepo.markWaived('bk-001', 'tech-1', { waivedReason: 'dispute', markedByAdminId: 'a1' });
    expect(r?.wasApplied).toBe(true);
    const ops = (mockBatch.mock.calls as unknown[][])[0]![0] as Array<{ operationType: string; ifMatch?: string; resourceBody: { remittanceStatus: string } }>;
    expect(ops[0]).toMatchObject({ operationType: 'Replace', ifMatch: '"e1"' });
    expect(ops[0]!.resourceBody.remittanceStatus).toBe('WAIVED');
  });
  it('is a no-op when already settled', async () => {
    mockRead.mockResolvedValue({ resource: { ...baseDueEntry, remittanceStatus: 'REMITTED' }, etag: '"e1"' });
    const r = await commissionReceivableRepo.markWaived('bk-001', 'tech-1', { waivedReason: 'x', markedByAdminId: 'a1' });
    expect(r?.wasApplied).toBe(false);
    expect(mockBatch).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run** → FAIL.

- [ ] **Step 3: Implement**

Replace the repository body. Key parts:
```ts
import type { OperationInput } from '@azure/cosmos';
import { getCommissionReceivablesContainer } from './client.js';
import { outstandingOf, type CommissionReceivableEntry, type CommissionReceivableCreateInput } from '../schemas/commission-receivable.js';
import type { RemittanceDoc, CreditDoc } from '../schemas/commission-ledger.js';
import { mergeAllocation, type OutstandingRow } from '../services/commission-allocator.service.js';

const RECEIVABLE_FILTER = `(NOT IS_DEFINED(c.docType) OR c.docType = 'RECEIVABLE')`;
export type LedgerBatchResult = { ok: true } | { ok: false; reason: 'CONFLICT' | 'PRECONDITION' };

export const commissionReceivableRepo = {
  // getByBookingId unchanged; createDueEntry adds serviceName/slotDate/collectionMethod when provided.

  async runLedgerBatch(technicianId: string, ops: OperationInput[]): Promise<LedgerBatchResult> {
    const res = await getCommissionReceivablesContainer().items.batch(ops, technicianId);
    const codes = (res.result ?? []).map((r) => r.statusCode);
    if (codes.every((c) => c >= 200 && c < 300)) return { ok: true };
    if (codes.includes(409)) return { ok: false, reason: 'CONFLICT' };
    if (codes.includes(412)) return { ok: false, reason: 'PRECONDITION' };
    throw new Error(`ledger batch failed: [${codes.join(',')}]`);
  },

  async getOutstandingByTechnician(technicianId: string): Promise<OutstandingRow[]> {
    const { resources } = await getCommissionReceivablesContainer()
      .items.query<CommissionReceivableEntry & { _etag: string }>(
        { query: `SELECT * FROM c WHERE ${RECEIVABLE_FILTER} AND c.remittanceStatus = 'DUE'` },
        { partitionKey: technicianId },
      ).fetchAll();
    return resources.map(({ _etag, ...entry }) => ({ entry, etag: _etag, outstandingPaise: outstandingOf(entry) }));
  },

  async getAllByTechnician(technicianId: string): Promise<CommissionReceivableEntry[]> {
    const { resources } = await getCommissionReceivablesContainer()
      .items.query<CommissionReceivableEntry>({ query: `SELECT * FROM c WHERE ${RECEIVABLE_FILTER}` }, { partitionKey: technicianId }).fetchAll();
    return resources;
  },

  async listLedger(technicianId: string) {
    const { resources } = await getCommissionReceivablesContainer()
      .items.query<Record<string, unknown>>({ query: 'SELECT * FROM c' }, { partitionKey: technicianId }).fetchAll();
    const receivables: CommissionReceivableEntry[] = []; const remittances: RemittanceDoc[] = []; const credits: CreditDoc[] = [];
    for (const d of resources) {
      const t = (d['docType'] as string | undefined) ?? 'RECEIVABLE';
      if (t === 'RECEIVABLE') receivables.push(d as unknown as CommissionReceivableEntry);
      else if (t === 'REMITTANCE') remittances.push(d as unknown as RemittanceDoc);
      else if (t === 'CREDIT') credits.push(d as unknown as CreditDoc);
    }
    return { receivables, remittances, credits };
  },

  async getRemittance(technicianId: string, id: string): Promise<RemittanceDoc | null> {
    const { resource } = await getCommissionReceivablesContainer().item(id, technicianId).read<RemittanceDoc>();
    return resource ?? null;
  },

  async getOpenCredits(technicianId: string): Promise<Array<{ doc: CreditDoc; etag: string }>> {
    const { resources } = await getCommissionReceivablesContainer()
      .items.query<CreditDoc & { _etag: string }>(
        { query: `SELECT * FROM c WHERE c.docType = 'CREDIT' AND c.remainingPaise > 0` }, { partitionKey: technicianId }).fetchAll();
    return resources.map(({ _etag, ...doc }) => ({ doc, etag: _etag }));
  },

  async markWaived(bookingId: string, technicianId: string, opts: { waivedReason: string; markedByAdminId: string }) {
    const { resource, etag } = await getCommissionReceivablesContainer().item(bookingId, technicianId).read<CommissionReceivableEntry>();
    if (!resource) return null;
    if (resource.remittanceStatus !== 'DUE') return { entry: resource, wasApplied: false };
    const now = new Date().toISOString();
    const entry = mergeAllocation({ ...resource, waivedReason: opts.waivedReason }, {
      id: `waive:${bookingId}`, source: 'WAIVER', refId: opts.waivedReason, paise: outstandingOf(resource) || 1, appliedAt: now, byId: opts.markedByAdminId,
    });
    const r = await this.runLedgerBatch(technicianId, [{ operationType: 'Replace', id: bookingId, ifMatch: etag ?? '', resourceBody: entry as never }]);
    if (!r.ok) throw Object.assign(new Error(r.reason), { code: r.reason });
    return { entry, wasApplied: true };
  },

  async sumDueGroupedByTechnician(continuationToken?: string) {
    const iterator = getCommissionReceivablesContainer().items.query<{ technicianId: string; outstandingPaise: number; dueCount: number; oldestDueAt: string }>(
      { query: `SELECT c.technicianId, SUM(c.commissionDue - (IS_DEFINED(c.remittedAmount) ? c.remittedAmount : 0)) AS outstandingPaise, COUNT(1) AS dueCount, MIN(c.createdAt) AS oldestDueAt FROM c WHERE ${RECEIVABLE_FILTER} AND c.remittanceStatus = 'DUE' GROUP BY c.technicianId` },
      { maxItemCount: 100, ...(continuationToken ? { continuationToken } : {}) },
    );
    const page = await iterator.fetchNext();
    return { groups: page.resources, ...(page.continuationToken ? { continuationToken: page.continuationToken } : {}) };
  },
};
```
Note for the WAIVER `paise`: waiving is a status change, not money received; `mergeAllocation` excludes WAIVER from `remittedAmount`. The `|| 1` only guards the `positive()` schema on a zero-outstanding row.

- [ ] **Step 4: Run** the whole file → PASS. Also run `tests/functions/admin/finance/commission-receivables.test.ts` and `tests/unit/earnings*.test.ts`; fix any mock that referenced `getAllTechnicianOutstandingSummaries` by marking it `it.todo` (Task 10 rewrites that handler and its tests). `tsc` will report errors in `commission-due.ts`, `commission-receivables.ts` and `mark-commission-received.ts` (callers of the removed/reshaped methods) — expected until Tasks 10–11; vitest does not type-check, so per-task test runs stay meaningful.
- [ ] **Step 5: Commit** — `git commit -m "feat(api): E21-S02 — ledger repo: docType filters, batch primitive, waive-by-batch, grouped DUE sum"`

---

### Task 4: Allocator orchestration — `applyCredit` and `consumePendingCredits`

**Files:**
- Modify: `api/src/services/commission-allocator.service.ts` (orchestration half)
- Test: `api/tests/services/commission-allocator.apply.test.ts`

**Interfaces:**
- Produces:
```ts
export type AllocationPlan = { allocations: Array<{ bookingId: string; paise: number }>; leftoverPaise: number };
export type ApplyCreditInput = {
  technicianId: string; refId: string; source: 'REMITTANCE' | 'INCENTIVE'; paise: number; byId: string;
  /** Deterministic anchor document created in the same batch; its 409 is the replay signal.
   *  `build` receives the final plan so the anchor can embed it (a remittance receipt lists its allocations). */
  anchor: { id: string; build: (plan: AllocationPlan) => Record<string, unknown> };
};
export type ApplyCreditResult =
  | { replayed: true; anchorId: string }
  | { replayed: false; anchorId: string; allocations: Array<{ bookingId: string; paise: number }>; creditCreatedPaise: number };
export async function applyCredit(input: ApplyCreditInput): Promise<ApplyCreditResult>
export async function consumePendingCredits(technicianId: string): Promise<{ consumedPaise: number }>
```
- Consumes: Task 3 repo methods, Task 2 pure fns, `creditDocId`, `allocationId` (Task 1).

- [ ] **Step 1: Write failing tests** (mock the repo module)
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('../../src/cosmos/commission-receivable-repository.js');
import { commissionReceivableRepo } from '../../src/cosmos/commission-receivable-repository.js';
import { applyCredit, consumePendingCredits } from '../../src/services/commission-allocator.service.js';

const row = (id: string, due: number, createdAt: string) => ({
  entry: { id, bookingId: id, technicianId: 't1', partitionKey: 't1', serviceId: 's', categoryId: 'c', bookingAmount: 1, commissionBps: 2000,
    commissionDue: due, commissionResolvedFrom: 'GLOBAL' as const, remittanceStatus: 'DUE' as const, createdAt },
  etag: `"${id}"`, outstandingPaise: due,
});
const base = { technicianId: 't1', refId: 'rem:k1', source: 'REMITTANCE' as const, byId: 'a1',
  anchor: { id: 'rem:k1', build: (plan: { allocations: unknown[]; leftoverPaise: number }) => ({ id: 'rem:k1', docType: 'REMITTANCE', allocations: plan.allocations, creditCreatedPaise: plan.leftoverPaise }) } };

beforeEach(() => vi.resetAllMocks());

describe('applyCredit', () => {
  it('builds [anchor create, replace per row, credit create] and returns allocations + leftover', async () => {
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockResolvedValue([row('b1', 200, '2026-09-01'), row('b2', 300, '2026-09-02')]);
    vi.mocked(commissionReceivableRepo.runLedgerBatch).mockResolvedValue({ ok: true });
    const r = await applyCredit({ ...base, paise: 600 });
    expect(r).toMatchObject({ replayed: false, allocations: [{ bookingId: 'b1', paise: 200 }, { bookingId: 'b2', paise: 300 }], creditCreatedPaise: 100 });
    const ops = vi.mocked(commissionReceivableRepo.runLedgerBatch).mock.calls[0]![1];
    expect(ops.map((o) => o.operationType)).toEqual(['Create', 'Replace', 'Replace', 'Create']);
    expect((ops[0] as { resourceBody: { allocations: unknown[]; creditCreatedPaise: number } }).resourceBody).toMatchObject({ allocations: [{ bookingId: 'b1', paise: 200 }, { bookingId: 'b2', paise: 300 }], creditCreatedPaise: 100 });
    expect((ops[3] as { resourceBody: { id: string; remainingPaise: number } }).resourceBody).toMatchObject({ id: 'cr:rem:k1', remainingPaise: 100 });
    expect((ops[1] as { ifMatch?: string }).ifMatch).toBe('"b1"');
  });
  it('treats a 409 on the anchor as an idempotent replay', async () => {
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockResolvedValue([row('b1', 200, '2026-09-01')]);
    vi.mocked(commissionReceivableRepo.runLedgerBatch).mockResolvedValue({ ok: false, reason: 'CONFLICT' });
    expect(await applyCredit({ ...base, paise: 100 })).toEqual({ replayed: true, anchorId: 'rem:k1' });
  });
  it('re-reads and re-plans on 412, then succeeds', async () => {
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician)
      .mockResolvedValueOnce([row('b1', 200, '2026-09-01')])
      .mockResolvedValueOnce([{ ...row('b1', 200, '2026-09-01'), outstandingPaise: 50, etag: '"b1v2"' }]);
    vi.mocked(commissionReceivableRepo.runLedgerBatch).mockResolvedValueOnce({ ok: false, reason: 'PRECONDITION' }).mockResolvedValueOnce({ ok: true });
    const r = await applyCredit({ ...base, paise: 100 });
    expect(r).toMatchObject({ replayed: false, allocations: [{ bookingId: 'b1', paise: 50 }], creditCreatedPaise: 50 });
    expect(commissionReceivableRepo.runLedgerBatch).toHaveBeenCalledTimes(2);
  });
  it('gives up after 3 precondition failures', async () => {
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockResolvedValue([row('b1', 200, '2026-09-01')]);
    vi.mocked(commissionReceivableRepo.runLedgerBatch).mockResolvedValue({ ok: false, reason: 'PRECONDITION' });
    await expect(applyCredit({ ...base, paise: 100 })).rejects.toThrow(/PRECONDITION/);
  });
});

describe('consumePendingCredits', () => {
  it('applies open credits oldest-first against DUE rows and updates remainingPaise absolutely', async () => {
    vi.mocked(commissionReceivableRepo.getOpenCredits).mockResolvedValue([{ doc: { id: 'cr:rem:k1', docType: 'CREDIT', technicianId: 't1', partitionKey: 't1', source: 'OVERPAYMENT', refId: 'rem:k1', originalPaise: 100, remainingPaise: 100, consumedBy: [], createdAt: '2026-09-01' }, etag: '"c1"' }]);
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockResolvedValue([row('b9', 60, '2026-09-05')]);
    vi.mocked(commissionReceivableRepo.runLedgerBatch).mockResolvedValue({ ok: true });
    const r = await consumePendingCredits('t1');
    expect(r.consumedPaise).toBe(60);
    const ops = vi.mocked(commissionReceivableRepo.runLedgerBatch).mock.calls[0]![1];
    expect(ops.map((o) => o.operationType)).toEqual(['Replace', 'Replace']); // credit doc + receivable
    expect((ops[0] as { resourceBody: { remainingPaise: number; consumedBy: unknown[] } }).resourceBody).toMatchObject({ remainingPaise: 40 });
  });
  it('is a no-op with no open credits or no DUE rows', async () => {
    vi.mocked(commissionReceivableRepo.getOpenCredits).mockResolvedValue([]);
    expect(await consumePendingCredits('t1')).toEqual({ consumedPaise: 0 });
    expect(commissionReceivableRepo.runLedgerBatch).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run** → FAIL.

- [ ] **Step 3: Implement** (append to the service file)
```ts
import type { OperationInput } from '@azure/cosmos';
import { commissionReceivableRepo } from '../cosmos/commission-receivable-repository.js';
import { allocationId, creditDocId, type CreditDoc } from '../schemas/commission-ledger.js';

const MAX_ATTEMPTS = 3;

export async function applyCredit(input: ApplyCreditInput): Promise<ApplyCreditResult> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const rows = await commissionReceivableRepo.getOutstandingByTechnician(input.technicianId);
    const plan = allocateOldestFirst(rows, input.paise);
    const now = new Date().toISOString();
    const byBooking = new Map(rows.map((r) => [r.entry.bookingId, r]));
    const ops: OperationInput[] = [{ operationType: 'Create', resourceBody: input.anchor.build(plan) as never }];
    for (const a of plan.allocations) {
      const row = byBooking.get(a.bookingId)!;
      const merged = mergeAllocation(row.entry, { id: allocationId(input.refId, a.bookingId), source: input.source, refId: input.refId, paise: a.paise, appliedAt: now, byId: input.byId });
      ops.push({ operationType: 'Replace', id: a.bookingId, ifMatch: row.etag, resourceBody: merged as never });
    }
    if (plan.leftoverPaise > 0) {
      const credit: CreditDoc = { id: creditDocId(input.refId), docType: 'CREDIT', technicianId: input.technicianId, partitionKey: input.technicianId,
        source: input.source === 'REMITTANCE' ? 'OVERPAYMENT' : 'INCENTIVE', refId: input.refId, originalPaise: plan.leftoverPaise, remainingPaise: plan.leftoverPaise, consumedBy: [], createdAt: now };
      ops.push({ operationType: 'Create', resourceBody: credit as never });
    }
    const res = await commissionReceivableRepo.runLedgerBatch(input.technicianId, ops);
    if (res.ok) return { replayed: false, anchorId: input.anchor.id, allocations: plan.allocations, creditCreatedPaise: plan.leftoverPaise };
    if (res.reason === 'CONFLICT') return { replayed: true, anchorId: input.anchor.id };
    if (attempt === MAX_ATTEMPTS) throw Object.assign(new Error('ledger PRECONDITION after retries'), { code: 'PRECONDITION' });
  }
  throw new Error('unreachable');
}

export async function consumePendingCredits(technicianId: string): Promise<{ consumedPaise: number }> {
  let consumed = 0;
  const credits = (await commissionReceivableRepo.getOpenCredits(technicianId)).sort((a, b) => a.doc.createdAt.localeCompare(b.doc.createdAt));
  for (const { doc, etag } of credits) {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const rows = await commissionReceivableRepo.getOutstandingByTechnician(technicianId);
      if (rows.every((r) => r.outstandingPaise === 0)) return { consumedPaise: consumed };
      const plan = allocateOldestFirst(rows, doc.remainingPaise, MAX_ALLOCATION_ROWS + 1);
      if (plan.allocations.length === 0) return { consumedPaise: consumed };
      const now = new Date().toISOString();
      const consumedBy = [...doc.consumedBy, ...plan.allocations.map((a) => ({ bookingId: a.bookingId, paise: a.paise, appliedAt: now }))];
      const remainingPaise = doc.originalPaise - consumedBy.reduce((s, c) => s + c.paise, 0); // absolute
      const ops: OperationInput[] = [{ operationType: 'Replace', id: doc.id, ifMatch: etag, resourceBody: { ...doc, consumedBy, remainingPaise, updatedAt: now } as never }];
      const byBooking = new Map(rows.map((r) => [r.entry.bookingId, r]));
      for (const a of plan.allocations) {
        const row = byBooking.get(a.bookingId)!;
        const source = doc.source === 'INCENTIVE' ? 'INCENTIVE' : 'REMITTANCE';
        ops.push({ operationType: 'Replace', id: a.bookingId, ifMatch: row.etag,
          resourceBody: mergeAllocation(row.entry, { id: allocationId(doc.id, a.bookingId), source, refId: doc.id, paise: a.paise, appliedAt: now, byId: 'system:credit' }) as never });
      }
      const res = await commissionReceivableRepo.runLedgerBatch(technicianId, ops);
      if (res.ok) { consumed += plan.allocations.reduce((s, a) => s + a.paise, 0); break; }
      if (res.reason === 'CONFLICT' || attempt === MAX_ATTEMPTS) break; // someone else consumed it; move on
    }
  }
  return { consumedPaise: consumed };
}
```

- [ ] **Step 4: Run** both allocator test files → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(api): E21-S02 — applyCredit/consumePendingCredits as single-partition transactional batches"`

---

### Task 5: Commission config — read-merge patch, effective config, PUT handler

**Files:**
- Modify: `api/src/cosmos/commission-config-repository.ts`, `api/src/services/commission-config.service.ts`, `api/src/functions/admin/catalogue/commission-config.ts`
- Create: `api/src/cosmos/system-docs-repository.ts`
- Test: `api/tests/cosmos/commission-config-repository.test.ts` (extend), `api/tests/services/commission-config.service.test.ts` (extend), `api/tests/functions/admin/catalogue/commission-config.test.ts` (extend)

**Interfaces:**
- `commissionConfigRepo.patchCommissionConfig(patch: UpdateCommissionConfigBody, updatedBy: string): Promise<CommissionConfigDoc>` (read-merge, `IfMatch`, 3 retries; creates the doc if absent). `upsertCommissionConfig` removed.
- `getCommissionConfig(): Promise<EffectiveCommissionConfig>` (cached 5 min; `getGlobalCommissionBps()` becomes `(await getCommissionConfig()).defaultCommissionBps`).
- `systemDocsRepo.getTechnicianClientConfig()`, `patchTechnicianClientConfig(body, updatedBy)`, `enqueueHoldRepair(technicianIds: string[] | 'ALL')`, `drainHoldRepair(): Promise<{ technicianIds: string[]; all: boolean }>` (docs `technician-client-config`, `hold-repair` in `system`).

- [ ] **Step 1: Failing tests**
```ts
// repository: thresholds survive a bps-only patch
it('patchCommissionConfig merges over the existing doc under IfMatch', async () => {
  mockRead.mockResolvedValue({ resource: { id: 'commission-config', defaultCommissionBps: 2200, warnThresholdPaise: 100000, blockThresholdPaise: 300000, updatedBy: 'a', updatedAt: 't' }, etag: '"1"' });
  mockReplace.mockResolvedValue({});
  const doc = await commissionConfigRepo.patchCommissionConfig({ defaultCommissionBps: 2500 }, 'admin-1');
  expect(doc).toMatchObject({ defaultCommissionBps: 2500, warnThresholdPaise: 100000, blockThresholdPaise: 300000, updatedBy: 'admin-1' });
  expect(mockReplace.mock.calls[0]![1]).toMatchObject({ accessCondition: { type: 'IfMatch', condition: '"1"' } });
});
it('rejects a patch whose merged warn >= stored block', async () => {
  mockRead.mockResolvedValue({ resource: { id: 'commission-config', defaultCommissionBps: 2200, blockThresholdPaise: 300000, updatedBy: 'a', updatedAt: 't' }, etag: '"1"' });
  await expect(commissionConfigRepo.patchCommissionConfig({ warnThresholdPaise: 300000 }, 'admin-1')).rejects.toMatchObject({ code: 'THRESHOLD_ORDER' });
  expect(mockReplace).not.toHaveBeenCalled();
});
it('creates the doc when absent', async () => {
  mockRead.mockResolvedValue({ resource: undefined, etag: undefined });
  mockCreate.mockResolvedValue({});
  const doc = await commissionConfigRepo.patchCommissionConfig({ holdEnforcementEnabled: true }, 'admin-1');
  expect(doc).toMatchObject({ id: 'commission-config', defaultCommissionBps: 2200, holdEnforcementEnabled: true });
});

// api/tests/services/commission-config.service.test.ts (append)
it('getCommissionConfig fills defaults for a legacy doc and caches for 5 minutes', async () => {
  vi.mocked(commissionConfigRepo.getCommissionConfig).mockResolvedValue({ id: 'commission-config', defaultCommissionBps: 2400, updatedBy: 'a', updatedAt: 't' });
  const a = await getCommissionConfig();
  const b = await getCommissionConfig();
  expect(a).toMatchObject({ defaultCommissionBps: 2400, warnThresholdPaise: 250000, blockThresholdPaise: 500000, holdEnforcementEnabled: false });
  expect(b).toBe(a);
  expect(commissionConfigRepo.getCommissionConfig).toHaveBeenCalledTimes(1);
  expect(await getGlobalCommissionBps()).toBe(2400);
});

// api/tests/functions/admin/catalogue/commission-config.test.ts (append)
it('PUT thresholds returns the effective config, busts the cache, enqueues a fleet-wide hold repair and audits', async () => {
  vi.mocked(commissionConfigRepo.patchCommissionConfig).mockResolvedValue({ id: 'commission-config', defaultCommissionBps: 2200, warnThresholdPaise: 200000, blockThresholdPaise: 400000, updatedBy: 'admin-1', updatedAt: 't' });
  const res = await putAdminCommissionConfigHandler(makePutReq({ warnThresholdPaise: 200000, blockThresholdPaise: 400000 }), {} as never, superAdminCtx);
  expect(res.status).toBe(200);
  expect(res.jsonBody).toMatchObject({ warnThresholdPaise: 200000, blockThresholdPaise: 400000, holdEnforcementEnabled: false });
  expect(systemDocsRepo.enqueueHoldRepair).toHaveBeenCalledWith('ALL');
  expect(auditLog).toHaveBeenCalledWith(expect.objectContaining({ adminId: 'admin-1' }), 'COMMISSION_CONFIG_UPDATED', 'commission-config', 'commission-config', expect.any(Object));
});
it('PUT with warn >= block is a 400 and never reaches the repo', async () => {
  const res = await putAdminCommissionConfigHandler(makePutReq({ warnThresholdPaise: 500000, blockThresholdPaise: 500000 }), {} as never, superAdminCtx);
  expect(res.status).toBe(400);
  expect(commissionConfigRepo.patchCommissionConfig).not.toHaveBeenCalled();
});
it('PUT with THRESHOLD_ORDER from the repo (merged against stored values) is a 400', async () => {
  vi.mocked(commissionConfigRepo.patchCommissionConfig).mockRejectedValue(Object.assign(new Error('x'), { code: 'THRESHOLD_ORDER' }));
  const res = await putAdminCommissionConfigHandler(makePutReq({ warnThresholdPaise: 490000 }), {} as never, superAdminCtx);
  expect(res.status).toBe(400);
  expect((res.jsonBody as { code: string }).code).toBe('THRESHOLD_ORDER');
});
```

- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement**
  - Repository `patchCommissionConfig`: read (`resource`, `etag`); `merged = { ...(resource ?? seedDefault), ...definedOnly(patch), updatedBy, updatedAt: now }`; validate `merged.warnThresholdPaise < merged.blockThresholdPaise` (using defaults for absent) else throw `{ code: 'THRESHOLD_ORDER' }`; `replace` with `IfMatch` (or `create` when no resource); retry on 412 ×3.
  - Service: `getCommissionConfig()` with the existing cache variables generalised to hold the effective object; keep `_resetCommissionConfigCacheForTest`; keep `resolveCommissionBps` unchanged.
  - Handler PUT: parse `UpdateCommissionConfigBodySchema`; call `patchCommissionConfig`; `_resetCommissionConfigCacheForTest()`; `await systemDocsRepo.enqueueHoldRepair('ALL')` when any threshold/flag key is present; audit `COMMISSION_CONFIG_UPDATED` via `auditLog(admin, …)`; return `toEffectiveConfig(doc)`. GET returns `toEffectiveConfig(await repo.getCommissionConfig())`.
  - `system-docs-repository.ts`: small read-merge helpers on `getSystemContainer()`; `hold-repair` doc `{ id: 'hold-repair', technicianIds: string[], all: boolean, updatedAt }`; `enqueueHoldRepair` dedupes ids (cap 5000) and sets `all` when `'ALL'`; `drainHoldRepair` reads then replaces with empty under `IfMatch` (retry ×3) and returns what it drained.
- [ ] **Step 4: Run** the three test files → PASS. `tsc --noEmit -p tsconfig.tests.json` now green.
- [ ] **Step 5: Commit** — `git commit -m "feat(api): E21-S02 — thresholds/flags on commission-config via read-merge patch; system docs repo"`

---

### Task 6: Commission hold service and technician hold persistence

**Files:**
- Create: `api/src/services/commission-hold.service.ts`
- Modify: `api/src/cosmos/technician-repository.ts` (add `patchCommissionHold`, `readCommissionHold`, `listTechniciansWithHold`, `patchPaymentProfile`)
- Test: `api/tests/services/commission-hold.service.test.ts`, extend `api/tests/cosmos/technician-repository.test.ts`

**Interfaces:**
```ts
export function evaluateState(outstandingPaise: number, cfg: { warnThresholdPaise: number; blockThresholdPaise: number }, override?: { until: string }, now = new Date()): HoldState
export async function recomputeCommissionHold(technicianId: string): Promise<CommissionHold | null>   // null = technician doc absent
export async function sweepAllHolds(opts?: { dryRun?: boolean; log?: (s: string) => void }): Promise<{ recomputed: number; drifted: number }>
// technician-repository:
export async function readCommissionHold(technicianId): Promise<{ hold: CommissionHold | null; exists: boolean }>
export async function patchCommissionHold(technicianId, hold: CommissionHold, readStartedAt: string): Promise<'APPLIED' | 'STALE' | 'MISSING'>
export async function listTechniciansWithHold(continuationToken?): Promise<{ items: Array<{ id: string; name?: string; commissionHold: CommissionHold }>; continuationToken?: string }>
export async function patchPaymentProfile(technicianId, profile: PaymentProfile): Promise<void>
```

- [ ] **Step 1: Failing tests**
```ts
describe('evaluateState', () => {
  const cfg = { warnThresholdPaise: 250000, blockThresholdPaise: 500000 };
  it.each([[0, 'CLEAR'], [249999, 'CLEAR'], [250000, 'WARN'], [499999, 'WARN'], [500000, 'BLOCKED']])('%i → %s', (p, s) => expect(evaluateState(p, cfg)).toBe(s));
  it('active override forces CLEAR; expired override is ignored', () => {
    expect(evaluateState(900000, cfg, { until: '2999-01-01T00:00:00.000Z' })).toBe('CLEAR');
    expect(evaluateState(900000, cfg, { until: '2000-01-01T00:00:00.000Z' })).toBe('BLOCKED');
  });
});
describe('recomputeCommissionHold', () => {
  it('sums outstanding from DUE rows, preserves an active override, patches with readStartedAt condition', async () => {
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockResolvedValue([row('b1', 300000, '2026-09-01')]);
    vi.mocked(configSvc.getCommissionConfig).mockResolvedValue(effectiveDefaults);
    vi.mocked(techRepo.readCommissionHold).mockResolvedValue({ exists: true, hold: { outstandingPaise: 0, dueCount: 0, state: 'CLEAR', evaluatedAt: 'old', override: { until: '2999-01-01T00:00:00.000Z', byAdminId: 'a', reason: 'r' } } });
    vi.mocked(techRepo.patchCommissionHold).mockResolvedValue('APPLIED');
    const hold = await recomputeCommissionHold('t1');
    expect(hold).toMatchObject({ outstandingPaise: 300000, dueCount: 1, state: 'CLEAR', oldestDueAt: '2026-09-01' });
    expect(hold?.override?.reason).toBe('r');
  });
  it('returns null when the technician doc is missing and never throws on STALE', async () => { /* MISSING → null; STALE → returns the computed hold */ });
});
// technician-repository.patchCommissionHold: builds patch {op:'set', path:'/commissionHold'} with condition string containing readStartedAt; maps 412→'STALE', 404→'MISSING'
```

- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement**

`commission-hold.service.ts`:
```ts
export function evaluateState(outstandingPaise, cfg, override?, now = new Date()): HoldState {
  if (override && override.until > now.toISOString()) return 'CLEAR';
  if (outstandingPaise >= cfg.blockThresholdPaise) return 'BLOCKED';
  if (outstandingPaise >= cfg.warnThresholdPaise) return 'WARN';
  return 'CLEAR';
}

export async function recomputeCommissionHold(technicianId: string): Promise<CommissionHold | null> {
  const readStartedAt = new Date().toISOString();
  const [rows, cfg, current] = await Promise.all([
    commissionReceivableRepo.getOutstandingByTechnician(technicianId), getCommissionConfig(), readCommissionHold(technicianId),
  ]);
  if (!current.exists) return null;
  const outstandingPaise = rows.reduce((s, r) => s + r.outstandingPaise, 0);
  const due = rows.filter((r) => r.outstandingPaise > 0);
  const override = current.hold?.override && current.hold.override.until > readStartedAt ? current.hold.override : undefined;
  const hold: CommissionHold = {
    outstandingPaise, dueCount: due.length,
    ...(due.length ? { oldestDueAt: due.map((r) => r.entry.createdAt).sort()[0]! } : {}),
    state: evaluateState(outstandingPaise, cfg, override), evaluatedAt: new Date().toISOString(),
    ...(override ? { override } : {}),
  };
  const result = await patchCommissionHold(technicianId, hold, readStartedAt);
  if (result === 'MISSING') return null;
  return hold; // STALE = a newer recompute already landed; ours is superseded, not wrong
}

export async function sweepAllHolds(opts = {}): Promise<{ recomputed: number; drifted: number }> {
  const seen = new Set<string>(); let recomputed = 0, drifted = 0, token: string | undefined;
  do { const page = await commissionReceivableRepo.sumDueGroupedByTechnician(token); for (const g of page.groups) seen.add(g.technicianId); token = page.continuationToken; } while (token);
  token = undefined;
  do { const page = await listTechniciansWithHold(token); for (const t of page.items) seen.add(t.id); token = page.continuationToken; } while (token);
  for (const id of seen) {
    const before = (await readCommissionHold(id)).hold;
    if (opts.dryRun) { recomputed++; continue; }
    const after = await recomputeCommissionHold(id);
    recomputed++;
    if (after && (before?.outstandingPaise !== after.outstandingPaise || before?.state !== after.state)) { drifted++; opts.log?.(`hold drift ${id}: ${before?.state ?? 'none'}/${before?.outstandingPaise ?? 0} → ${after.state}/${after.outstandingPaise}`); }
  }
  return { recomputed, drifted };
}
```
`technician-repository.ts`:
```ts
export async function patchCommissionHold(technicianId: string, hold: CommissionHold, readStartedAt: string): Promise<'APPLIED' | 'STALE' | 'MISSING'> {
  const container = getCosmosClient().database(DB_NAME).container(CONTAINER);
  // readStartedAt is server-generated ISO-8601; string comparison is chronological.
  const condition = 'FROM c WHERE NOT IS_DEFINED(c.commissionHold) OR NOT IS_DEFINED(c.commissionHold.evaluatedAt) OR c.commissionHold.evaluatedAt < "' + readStartedAt + '"';
  try {
    await container.item(technicianId, technicianId).patch({ operations: [{ op: 'set', path: '/commissionHold', value: hold }], condition });
    return 'APPLIED';
  } catch (err: unknown) {
    const code = (err as { code?: number }).code;
    if (code === 412) return 'STALE';
    if (code === 404) return 'MISSING';
    throw err;
  }
}
export async function readCommissionHold(technicianId: string): Promise<{ hold: CommissionHold | null; exists: boolean }> {
  const container = getCosmosClient().database(DB_NAME).container(CONTAINER);
  const { resource } = await container.item(technicianId, technicianId).read<{ id: string; commissionHold?: CommissionHold }>();
  return { exists: Boolean(resource), hold: resource?.commissionHold ?? null };
}

export async function listTechniciansWithHold(continuationToken?: string): Promise<{
  items: Array<{ id: string; name?: string; commissionHold: CommissionHold }>; continuationToken?: string;
}> {
  const container = getCosmosClient().database(DB_NAME).container(CONTAINER);
  const iterator = container.items.query<{ id: string; displayName?: string; name?: string; commissionHold: CommissionHold }>(
    { query: 'SELECT c.id, c.displayName, c.name, c.commissionHold FROM c WHERE IS_DEFINED(c.commissionHold)' },
    { maxItemCount: 50, ...(continuationToken ? { continuationToken } : {}) },
  );
  const page = await iterator.fetchNext();
  const items = page.resources
    .map((r) => ({ id: r.id, ...(r.displayName ?? r.name ? { name: r.displayName ?? r.name } : {}), commissionHold: r.commissionHold }))
    .sort((a, b) => b.commissionHold.outstandingPaise - a.commissionHold.outstandingPaise); // in-page sort; no composite index needed
  return { items, ...(page.continuationToken ? { continuationToken: page.continuationToken } : {}) };
}

export async function patchPaymentProfile(technicianId: string, profile: PaymentProfile): Promise<void> {
  const container = getCosmosClient().database(DB_NAME).container(CONTAINER);
  try {
    await container.item(technicianId, technicianId).patch({ operations: [{ op: 'set', path: '/paymentProfile', value: profile }] });
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 404) throw Object.assign(new Error('TECHNICIAN_NOT_FOUND'), { code: 'TECHNICIAN_NOT_FOUND' });
    throw err;
  }
}
```
If `ORDER BY c.commissionHold.outstandingPaise` needs a composite index on `technicians`, add it to `api/scripts/provision-cosmos-indexes.ts` in Task 13 and fall back to sorting the page in memory.

- [ ] **Step 4: Run** → PASS. **Step 5: Commit** — `git commit -m "feat(api): E21-S02 — commissionHold recompute with conditional patch, sweep, technician hold persistence"`

---

### Task 7: ETag hardening of the five technician writers; delete dead code

**Files:**
- Modify: `api/src/cosmos/technician-repository.ts` (`upsertKycStatus`, `patchTechnicianAvailability`, `patchTechnicianServiceProfile`, `patchTechnicianAdminFields`; delete `upsertTechnicianProfile`), `api/src/functions/technicians.ts` (`patchFcmTokenHandler` → use a new repo `patchFcmToken(technicianId, token)` with ETag), `api/src/cosmos/booking-repository.ts` (delete `markCashCollected`)
- Test: extend `api/tests/cosmos/technician-repository.test.ts`; remove tests that referenced the deleted functions.

- [ ] **Step 1: Failing tests** — for each writer: `read` returns `{ resource: { id, commissionHold: {...} }, etag: '"7"' }`; assert `replace` called with `{ accessCondition: { type: 'IfMatch', condition: '"7"' } }` and that `commissionHold` is preserved in the written body; on first 412 the function re-reads and retries; three 412s throw.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** — extract a private helper:
```ts
async function readModifyWrite<T extends { id: string }>(technicianId: string, mutate: (existing: T | null) => T): Promise<void> {
  const container = getCosmosClient().database(DB_NAME).container(CONTAINER);
  for (let attempt = 0; attempt < 3; attempt++) {
    const { resource, etag } = await container.item(technicianId, technicianId).read<T>();
    const next = mutate(resource ?? null);
    try {
      if (resource) await container.item(technicianId, technicianId).replace(next, { accessCondition: { type: 'IfMatch', condition: etag ?? '' } });
      else await container.items.create(next);
      return;
    } catch (err: unknown) {
      const code = (err as { code?: number }).code;
      if ((code === 412 || code === 409) && attempt < 2) continue;
      throw err;
    }
  }
}
```
and route all five writers through it (each `mutate` spreads `existing` first). Delete `upsertTechnicianProfile` and its test; delete `bookingRepo.markCashCollected` and its test.
- [ ] **Step 4: Run** `tests/cosmos/technician-repository.test.ts`, `tests/cosmos/booking-repository*.test.ts`, `tests/functions/technicians*.test.ts` → PASS.
- [ ] **Step 5: Commit** — `git commit -m "fix(api): E21-S02 — ETag-guard every technicians writer; delete dead upsertTechnicianProfile/markCashCollected"`

---

### Task 8: Shared settlement service; trigger becomes create-or-noop-then-finalize

**Files:**
- Create: `api/src/services/commission-settlement.service.ts`
- Modify: `api/src/functions/trigger-booking-completed.ts`
- Test: `api/tests/services/commission-settlement.service.test.ts`; modify `api/tests/unit/trigger-booking-completed.test.ts`

**Interfaces:**
```ts
export async function recordCommissionDue(booking: BookingDoc): Promise<{ created: boolean; commissionDue: number; commissionBps: number; commissionResolvedFrom: CommissionResolvedFrom } | { created: false; skipped: 'NO_TECHNICIAN' | 'NOT_COMPLETED' }>
/** Always safe to call; never throws (Sentry-captured). Consumes credits then recomputes the hold. */
export async function finalizeLedgerForTechnician(technicianId: string): Promise<void>
```

- [ ] **Step 1: Failing tests**
  - `recordCommissionDue`: creates with `serviceName`, `slotDate`, `collectionMethod`, `cashCollectedAmount` denormalised; returns `created:false` when the row exists or on 409; resolves the cascade exactly as before (reuse the existing cascade assertions).
  - `finalizeLedgerForTechnician`: calls `consumePendingCredits` then `recomputeCommissionHold`; swallows and reports errors from either.
  - Trigger: **duplicate delivery still calls `finalizeLedgerForTechnician`**; first delivery audits `COMMISSION_DUE_RECORDED`, increments job count and sends FCM; second delivery does none of those but still finalizes; RAZORPAY guarded branch unchanged.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** — move the cascade + `createDueEntry` block from the trigger into `recordCommissionDue` verbatim, adding `serviceName: booking.serviceName ?? service?.name`, `slotDate: booking.slotDate`, `collectionMethod: booking.collectionMethod` (field added to `BookingDocSchema` in Task 9 as optional — add it here first: `collectionMethod: CollectionMethodSchema.optional()` in `api/src/schemas/booking.ts`). Trigger CASH branch becomes:
```ts
const r = await recordCommissionDue(booking);
if ('skipped' in r) return;
if (r.created) { audit COMMISSION_DUE_RECORDED; try { await Promise.all([incrementCompletedJobCount(technicianId), sendTechEarningsUpdate(technicianId, { bookingId, commissionDue: r.commissionDue })]); } catch (e) { Sentry.captureException(e); } }
else ctx.log(`settleBooking: receivable already recorded for ${bookingId} — finalizing only`);
await finalizeLedgerForTechnician(technicianId);
return;
```
- [ ] **Step 4: Run** both test files → PASS. **Step 5: Commit** — `git commit -m "feat(api): E21-S02 — shared settlement service; trigger finalizes hold on every delivery"`

---

### Task 9: Synchronous DUE creation at job completion; `collectionMethod`; audit

**Files:**
- Modify: `api/src/functions/active-job.ts`, `api/src/schemas/booking.ts` (`collectionMethod`, `shortCollectionReason` optional)
- Test: `api/tests/functions/active-job*.test.ts` (extend)

- [ ] **Step 1: Failing tests** — COMPLETED with `{ cashCollected: true, collectedAmount: 90000, collectionMethod: 'UPI_QR', shortCollectionReason: 'customer_short' }`: booking patched with `cashCollectionStatus: 'COLLECTED'`, `cashCollectedAmount`, `collectionMethod`, `shortCollectionReason`; `recordCommissionDue` called with the updated booking; `finalizeLedgerForTechnician` called; an audit entry `CASH_COLLECTION_RECORDED` (role `system`, resourceType `booking`) written when `cashCollected === true`; a throwing `recordCommissionDue` does **not** fail the 200 response (Sentry-captured). Non-COMPLETED transitions never call the settlement service.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** — extend `TransitionBodySchema` with `collectionMethod: CollectionMethodSchema.optional()`, `shortCollectionReason: z.enum(['customer_short', 'discount_given', 'other']).optional()`; include both in the COMPLETED patch when `cashCollected === true`. After `bookingEventRepo.append`, when `body.targetStatus === 'COMPLETED'`:
```ts
try { await recordCommissionDue(updated); await finalizeLedgerForTechnician(uid); } catch (e) { Sentry.captureException(e); }
if (body.cashCollected === true) await systemAudit('CASH_COLLECTION_RECORDED', bookingId, { technicianId: uid, collectedAmount: body.collectedAmount, collectionMethod: body.collectionMethod ?? 'CASH', shortCollectionReason: body.shortCollectionReason }).catch(Sentry.captureException);
```
(`systemAudit` = the `auditLog({ adminId: 'system', role: 'system' }, …)` helper from Task 12's enum-typed write helper; until Task 12 lands, call `auditLog` with the string.)
- [ ] **Step 4: Run** → PASS. **Step 5: Commit** — `git commit -m "feat(api): E21-S02 — record commission due synchronously at COMPLETED; collectionMethod + cash audit"`

---

### Task 10: Admin endpoints — remittances, hold-based dashboard, ledger detail, override, waive-only settle, recompute

**Files:**
- Create: `api/src/functions/admin/finance/commission-remittances.ts`, `api/src/functions/admin/finance/commission-hold-override.ts`
- Modify: `api/src/functions/admin/finance/commission-receivables.ts`, `api/src/functions/admin/finance/mark-commission-received.ts`
- Test: `api/tests/functions/admin/finance/commission-remittances.test.ts`, `commission-hold-override.test.ts`, rewrite `commission-receivables.test.ts`, modify `mark-commission-received.test.ts`

**Interfaces (routes/roles per spec §6):**
- `POST /v1/admin/finance/commission-remittances` → 200 `{ remittance: RemittanceDoc, allocations, creditCreatedPaise, hold: CommissionHold | null, holdRecomputePending: boolean, replayed: boolean }`; 400 validation; 404 technician unknown; 502 upstream.
- `GET /v1/admin/finance/commission-receivables?continuationToken=` → `{ technicians: [{ technicianId, technicianName, outstandingPaise, dueCount, oldestDueAt?, state, evaluatedAt, override? }], totalOutstanding, unreconciledTechnicianCount, continuationToken? }`
- `GET /v1/admin/finance/commission-receivables/{technicianId}` → `{ technicianId, hold, receivables: [...with outstandingPaise], remittances, credits, cashCollectedPaise, creditAppliedPaise }`
- `POST /v1/admin/finance/commission-receivables/recompute` (super-admin) → runs `enqueueHoldRepair('ALL')` and returns 202.
- `POST /v1/admin/finance/commission-hold/{technicianId}/override` `{ until, reason }` / `DELETE …/override` (super-admin).
- `POST …/settle`: `WAIVE` unchanged; `REMIT` → `410 { code: 'USE_COMMISSION_REMITTANCES' }`.

- [ ] **Step 1: Failing tests** (handler-level, repo/service mocked): happy path builds the anchor `{ id: 'rem:<key>', docType: 'REMITTANCE', … }` and passes it to `applyCredit`; replay returns the stored remittance with `replayed: true`; PRECONDITION error → 409 `{ code: 'LEDGER_BUSY' }`; hold recompute throwing → response `holdRecomputePending: true` and `enqueueHoldRepair([technicianId])` called; audit `COMMISSION_REMITTANCE_RECORDED` written only when not replayed. Dashboard: uses `listTechniciansWithHold` + `sumDueGroupedByTechnician` first page for `unreconciledTechnicianCount` = groups whose technician has no hold or `hold.outstandingPaise !== group.outstandingPaise`. Override: writes `override` via `readCommissionHold` + `patchCommissionHold(readStartedAt)` then `recomputeCommissionHold`; audits. Settle REMIT → 410.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** — remittance handler core:
```ts
const anchorId = remittanceDocId(body.idempotencyKey);
const existing = await commissionReceivableRepo.getRemittance(body.technicianId, anchorId);
if (existing) return { status: 200, jsonBody: { remittance: existing, allocations: existing.allocations, creditCreatedPaise: existing.creditCreatedPaise, hold: (await readCommissionHold(body.technicianId)).hold, holdRecomputePending: false, replayed: true } };
const now = new Date().toISOString();
const result = await applyCredit({ technicianId: body.technicianId, refId: anchorId, source: 'REMITTANCE', paise: body.amountPaise, byId: admin.adminId,
  anchor: { id: anchorId, body: { id: anchorId, docType: 'REMITTANCE', technicianId: body.technicianId, partitionKey: body.technicianId, amountPaise: body.amountPaise, method: body.method, ref: body.ref, ...(body.note ? { note: body.note } : {}), allocations: [], creditCreatedPaise: 0, recordedByAdminId: admin.adminId, idempotencyKey: body.idempotencyKey, createdAt: now } } });
```
The anchor's `build(plan)` (Task 4) fills `allocations` and `creditCreatedPaise` from the final plan, so the receipt is complete inside the same batch. Write the handler call as `anchor: { id: anchorId, build: (plan) => ({ ...remittanceBase, allocations: plan.allocations, creditCreatedPaise: plan.leftoverPaise }) }`. Then:
```ts
let hold: CommissionHold | null = null; let holdRecomputePending = false;
try { hold = await recomputeCommissionHold(body.technicianId); } catch (e) { Sentry.captureException(e); holdRecomputePending = true; await systemDocsRepo.enqueueHoldRepair([body.technicianId]).catch(Sentry.captureException); }
if (!result.replayed) await auditLog(admin, 'COMMISSION_REMITTANCE_RECORDED', 'commission_remittance', anchorId, { technicianId: body.technicianId, amountPaise: body.amountPaise, method: body.method, ref: body.ref, allocations: result.allocations, creditCreatedPaise: result.creditCreatedPaise });
```
Ledger detail: `cashCollectedPaise = Σ remittances.amountPaise`; `creditAppliedPaise = Σ receivables.allocations where source !== 'REMITTANCE'` (WAIVER excluded → count INCENTIVE only). Never sum the two.
- [ ] **Step 4: Run** the four test files → PASS. **Step 5: Commit** — `git commit -m "feat(api): E21-S02 — remittance recording, hold-based dashboard, ledger detail, hold override, waive-only settle"`

---

### Task 11: Technician endpoints — `commission-due` v2 and `GET /v1/config/technician`

**Files:**
- Create: `api/src/services/commission-view.service.ts`, `api/src/lib/ist-time.ts`, `api/src/functions/config/technician.ts`
- Modify: `api/src/functions/technicians/commission-due.ts`
- Test: `api/tests/services/commission-view.service.test.ts`, `api/tests/lib/ist-time.test.ts`, `api/tests/functions/config/technician.test.ts`, modify `api/tests/functions/technicians/commission-due.test.ts`

**Interfaces:**
```ts
// ist-time.ts
export const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
export function istDateStr(d: Date): string;               // YYYY-MM-DD in IST
export function istWeekStart(d: Date): Date;               // Monday 00:00 IST as a UTC Date
// commission-view.service.ts
export function buildCommissionDueResponse(input: { ledger: {receivables, remittances, credits}; hold: CommissionHold | null; cfg: EffectiveCommissionConfig; now: Date }): TechnicianCommissionDueV2
```
`TechnicianCommissionDueV2` (add to `commission-receivable.ts`): `{ totalOutstandingPaise, dueCount, hold: { state, warnPaise, blockPaise, enforcementEnabled, override? }, entries: [{ bookingId, serviceName?, slotDate?, bookingAmount, cashCollectedAmount?, commissionDue, remittedAmount, outstandingPaise, collectionMethod?, remittanceStatus, createdAt }], remittances: [{ id, amountPaise, method, ref, createdAt }], credits: [{ id, source, remainingPaise, createdAt }], weekSummary: { weekStart, jobs, cashCollectedPaise, commissionPaise, netPaise } }`.

- [ ] **Step 1: Failing tests** — `totalOutstandingPaise` is net (`Σ outstandingOf`) and `dueCount` excludes fully-credited rows even if status is still DUE; entries sorted newest first; `weekSummary` counts receivables with `createdAt >= istWeekStart(now)`, `cashCollectedPaise = Σ (cashCollectedAmount ?? bookingAmount)`, `netPaise = cashCollected − commission`; hold falls back to `{ state: 'CLEAR', … }` when null; `istWeekStart` on a Sunday 23:30 IST returns the previous Monday and on Monday 00:30 IST returns that Monday. Config endpoint: merges `technician-client-config` (absent → defaults off), commission config thresholds/flag, `incentive` `{ enabled: false, milestones: [], capFractionBps: 6000 }` (reads `system/incentive-config` if present), `minSupportedVersionCode` default 0, `serverTime`; `Cache-Control: private, max-age=60`; 401 without token.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** per interfaces; the handler for `commission-due` becomes `listLedger` + `readCommissionHold` + `getCommissionConfig` → `buildCommissionDueResponse`. Register `app.http('technicianConfig', { route: 'v1/config/technician', methods: ['GET'], authLevel: 'anonymous', handler })`.
- [ ] **Step 4: Run** → PASS. **Step 5: Commit** — `git commit -m "feat(api): E21-S02 — commission-due v2 (net totals, ledger, week summary) and technician client config endpoint"`

---

### Task 12: Closed audit-action enum on the write helper; Semgrep rules

**Files:**
- Modify: `api/src/types/admin.ts` (extend `AuditAction`), `api/src/services/auditLog.service.ts` (`action: AuditAction`; add `systemAudit(action, resourceType, resourceId, payload)`), call sites that pass string literals not in the union (grep `auditLog(` and `appendAuditEntry(` — add the missing literals to the union rather than loosening the type)
- Modify: `api/.semgrep.yml`
- Test: `api/tests/services/auditLog.service.test.ts` (type-level: a non-member action is a compile error — use `// @ts-expect-error`), `api/tests/static/ledger-batch-only.test.ts`

- [ ] **Step 1: Failing tests** — static test: read every file under `api/src` except `cosmos/commission-receivable-repository.ts`; assert no line matches `/getCommissionReceivablesContainer\(\)\s*\.items\.(create|upsert)|getCommissionReceivablesContainer\(\)\s*\.item\([^)]*\)\.(replace|delete|patch)/`. Also assert no `remittedAmount\s*(\+=|-=)|\+\s*1\b.*remittedAmount` in `api/src`.
- [ ] **Step 2: Run** → the static test passes trivially if Task 3 was done right; the type test fails until the helper is typed.
- [ ] **Step 3: Implement** — union additions: `COMMISSION_DUE_RECORDED`, `COMMISSION_REMITTED`, `COMMISSION_WAIVED`, `COMMISSION_REMITTANCE_RECORDED`, `COMMISSION_HOLD_OVERRIDDEN`, `COMMISSION_HOLD_OVERRIDE_CLEARED`, `COMMISSION_CONFIG_UPDATED`, `CASH_COLLECTION_RECORDED`, `TECHNICIAN_CLIENT_CONFIG_UPDATED`, plus every literal already in use (`CATALOGUE_*`, `COMPLAINT_*`, `SOS_*`, `SETTLEMENT_HELD_*`, …). Stored `AuditLogEntrySchema.action` stays `z.string()`. Semgrep:
```yaml
  - id: ledger-batch-only
    message: Money docs in commission_receivables must be written through commissionReceivableRepo.runLedgerBatch (single-partition transactional batch). See docs/adr/0031.
    severity: ERROR
    languages: [typescript]
    paths: { include: ["api/src/**"], exclude: ["api/src/cosmos/commission-receivable-repository.ts"] }
    pattern-either:
      - pattern: getCommissionReceivablesContainer().items.create(...)
      - pattern: getCommissionReceivablesContainer().items.upsert(...)
      - pattern: getCommissionReceivablesContainer().item(...).replace(...)
      - pattern: getCommissionReceivablesContainer().item(...).patch(...)
      - pattern: getCommissionReceivablesContainer().item(...).delete(...)
  - id: no-increment-on-ledger
    message: Derived ledger figures are recomputed absolutely, never incremented (spec §3.2).
    severity: ERROR
    languages: [typescript]
    paths: { include: ["api/src/**"] }
    pattern-either:
      - pattern: $X.remittedAmount += $Y
      - pattern: $X.remittedAmount = $X.remittedAmount + $Y
      - pattern: $X.remainingPaise -= $Y
      - pattern: $X.outstandingPaise += $Y
      - pattern: $X.commissionHold.outstandingPaise = $X.commissionHold.outstandingPaise + $Y
```
- [ ] **Step 4: Run** `node_modules/.bin/vitest run tests/static tests/services/auditLog.service.test.ts` and `tsc --noEmit -p tsconfig.tests.json` → PASS. **Step 5: Commit** — `git commit -m "chore(api): E21-S02 — closed AuditAction on the write helper; Semgrep ledger-batch-only + no-increment-on-ledger"`

---

### Task 13: OpenAPI contract, Cosmos seeds, backfill script, ADR, runbook

**Files:**
- Modify: `api/src/openapi/registry.ts` (replace the E21-S01 block: register `RemittanceDoc`, `CreditDoc`, `RecordRemittanceBody`, `EffectiveCommissionConfig`, `UpdateCommissionConfigBody` v2, `CommissionHold`, `TechnicianCommissionDueV2`, `TechnicianConfigResponse`, dashboard v2 + detail v2 schemas; paths for all routes in Task 10/11 incl. `410` on settle REMIT), `api/openapi.json` (regenerate)
- Modify: `api/scripts/setup-cosmos.ts` (seed `technician-client-config` `{ features: all false, minSupportedVersionCode: 0 }` and `hold-repair` `{ technicianIds: [], all: false }` only-if-absent; add threshold fields to `commission-config` only-if-absent via read-merge), `api/scripts/provision-cosmos-indexes.ts` (composite index `/commissionHold/outstandingPaise DESC` on `technicians` if Task 6 needed it)
- Create: `api/scripts/backfill-commission-holds.ts` (`--dry-run` default; `--apply` runs `sweepAllHolds`, prints `recomputed/drifted`, and a per-technician diff table old-aggregate vs new hold)
- Create: `docs/adr/0031-single-partition-commission-ledger.md` (context: cross-container allocator rejected by two independent reviews; decision: docType ledger + transactional batch + deterministic ids + absolute recomputation; consequences: 98-row cap, docType filters on every query, hold is a cache with a repair queue)
- Modify: `docs/runbook.md` (sections: "Record a commission remittance", "Technician says he is blocked / hold looks wrong → recompute", "Rollout order for E21-S02: deploy functions → run setup-cosmos → backfill --dry-run → --apply → verify dashboard")

- [ ] **Step 1:** `cd api && npm run openapi:build && npm run openapi:lint` → both green; `cd ../admin-web && npm run openapi:client` → regenerated `schema.d.ts` type-checks (`npx tsc --noEmit`); commit the generated files.
- [ ] **Step 2:** Add a registry smoke test (`api/tests/openapi/registry-e21-s02.test.ts`) asserting the nine new paths exist in the generated document and `/v1/admin/finance/commission-receivables/settle` documents `410`.
- [ ] **Step 3:** Run `node_modules/.bin/tsx scripts/backfill-commission-holds.ts --dry-run` against the local emulator or a mocked client in a unit test (`api/tests/scripts/backfill-commission-holds.test.ts`: dry-run performs zero patches; apply calls `sweepAllHolds`).
- [ ] **Step 4:** Commit — `git commit -m "docs(api): E21-S02 — OpenAPI v2 contracts, seeds, hold backfill script, ADR-0031, runbook"`

---

### Task 14: Smoke gate, Codex review, security review, PR

- [ ] **Step 1:** `bash tools/pre-codex-smoke-api.sh` from the worktree root → exit 0 (tsc, eslint 0 warnings, vitest all green). Fix anything red before proceeding; do not skip.
- [ ] **Step 2:** `git diff origin/main --stat` sanity: no changes outside `api/`, `docs/`, `plans/`, `admin-web/src/api/generated/`.
- [ ] **Step 3:** Invoke `codex-review-gate` (`codex review --base main` with `disk-full-read-access` since this is a worktree). Fix P0/P1 in Claude, re-run Codex **once**. Write `.codex-review-passed`.
- [ ] **Step 4:** `/security-review` (money + admin auth) in parallel with Step 3; address findings.
- [ ] **Step 5:** `git push -u origin feat/e21-s02-commission-ledger-v2`; `gh pr create --title "feat(api): E21-S02 — commission ledger v2 (batch allocator, partial/overpay remittance, commissionHold, thresholds, technician config)" --body-file <summary incl. rollout order + review log>`; `gh pr merge --auto --squash`.
- [ ] **Step 6 (post-merge, owner-gated):** deploy per `feedback_azure_functions_deploy` → `setup-cosmos` → `backfill-commission-holds --dry-run` → read the diff aloud → `--apply` → `GET /v1/admin/finance/commission-receivables` shows every technician the old aggregate showed with equal outstanding → update memory `project_gap_closure_state`.

## Verification (story-level acceptance)

1. Legacy receivable docs (no `docType`, no `allocations`) parse, appear in earnings, dashboards, and technician view unchanged.
2. Record ₹200 against ₹220 → `remittedAmount=200`, status DUE, outstanding 20; same key again → `replayed:true`, no new docs; ₹50 more → REMITTED + CREDIT 30; next `recordCommissionDue` + `finalizeLedgerForTechnician` consumes 30 automatically.
3. Two concurrent remittances against the same rows → one 412 → re-plan → totals exact (unit test with sequenced mocks; integration against the emulator if available).
4. A duplicate change-feed delivery leaves one receivable and still recomputes the hold.
5. PUT `commission-config { defaultCommissionBps: 2500 }` leaves thresholds intact; PUT `{ warnThresholdPaise: 600000 }` with block 500000 → 400.
6. `GET /v1/technicians/me/commission-due` returns net totals; `GET /v1/config/technician` returns all features `false` on a fresh system.
7. Every technicians writer preserves `commissionHold` under concurrent hold patches (ETag tests).
8. Semgrep rules fire on a deliberately bad fixture (run `semgrep --config api/.semgrep.yml api/src` locally if installed; CI enforces).
