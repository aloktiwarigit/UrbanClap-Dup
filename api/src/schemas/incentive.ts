import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { IST_WEEK_KEY_RE } from '../lib/ist-time.js';
extendZodWithOpenApi(z);

/** Singleton id in the `system` container (spec §5.3). */
export const INCENTIVE_CONFIG_DOC_ID = 'incentive-config';
/** Owner decision (spec §2 item 4): bonus ≤ 60% of the week's generated commission. Ships ON. */
export const DEFAULT_CAP_FRACTION_BPS = 6000;
/** Cheapest real service at pilot (₹249) — cheaper "bookings" cannot pad the job count. */
export const DEFAULT_MIN_COUNTABLE_BOOKING_PAISE = 24_900;

export const MilestoneSchema = z.object({
  jobs: z.number().int().positive(),
  bonusPaise: z.number().int().positive(),
}).strict();
export type Milestone = z.infer<typeof MilestoneSchema>;

/** Strictly ascending in BOTH dimensions: more jobs must never pay less, and two milestones
 *  must never share a job count (the "highest reached" pick would be ambiguous). */
function isStrictlyAscending(ms: readonly Milestone[]): boolean {
  return ms.every((m, i) => i === 0 || (m.jobs > ms[i - 1]!.jobs && m.bonusPaise > ms[i - 1]!.bonusPaise));
}

/** Stored shape. Every field but `id` optional — the doc is written field-by-field and a
 *  partially-populated doc must always parse (read paths only widen, spec §3.3). */
export const IncentiveConfigDocSchema = z.object({
  id: z.literal(INCENTIVE_CONFIG_DOC_ID),
  enabled: z.boolean().optional(),
  milestones: z.array(MilestoneSchema).optional(),
  capFractionBps: z.number().int().min(0).max(10_000).optional(),
  minCountableBookingPaise: z.number().int().nonnegative().optional(),
  updatedBy: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type IncentiveConfigDoc = z.infer<typeof IncentiveConfigDocSchema>;

export const EffectiveIncentiveConfigSchema = z.object({
  enabled: z.boolean(),
  milestones: z.array(MilestoneSchema),
  capFractionBps: z.number().int().min(0).max(10_000),
  minCountableBookingPaise: z.number().int().nonnegative(),
  updatedBy: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type EffectiveIncentiveConfig = z.infer<typeof EffectiveIncentiveConfigSchema>;

export function toEffectiveIncentiveConfig(doc: IncentiveConfigDoc | null): EffectiveIncentiveConfig {
  return {
    enabled: doc?.enabled ?? false,
    // Sorted once here so every consumer (compute, snapshot, progress card) sees one order.
    milestones: [...(doc?.milestones ?? [])].sort((a, b) => a.jobs - b.jobs),
    capFractionBps: doc?.capFractionBps ?? DEFAULT_CAP_FRACTION_BPS,
    minCountableBookingPaise: doc?.minCountableBookingPaise ?? DEFAULT_MIN_COUNTABLE_BOOKING_PAISE,
    ...(doc?.updatedBy !== undefined ? { updatedBy: doc.updatedBy } : {}),
    ...(doc?.updatedAt !== undefined ? { updatedAt: doc.updatedAt } : {}),
  };
}

export const UpdateIncentiveConfigBodySchema = z.object({
  enabled: z.boolean().optional(),
  milestones: z.array(MilestoneSchema).max(20).optional(),
  capFractionBps: z.number().int().min(0).max(10_000).optional(),
  minCountableBookingPaise: z.number().int().nonnegative().optional(),
})
  .strict()
  .refine((b) => Object.keys(b).length > 0, { message: 'empty patch' })
  .refine((b) => b.milestones === undefined || isStrictlyAscending(b.milestones), {
    message: 'milestones must be strictly ascending in both jobs and bonusPaise',
    path: ['milestones'],
  });
export type UpdateIncentiveConfigBody = z.infer<typeof UpdateIncentiveConfigBodySchema>;

/** AWARDED = nothing applied yet · PARTIAL = remainder still sits as a CREDIT · APPLIED = absorbed. */
export const IncentiveAwardStatusSchema = z.enum(['AWARDED', 'PARTIAL', 'APPLIED']);
export type IncentiveAwardStatus = z.infer<typeof IncentiveAwardStatusSchema>;

const awardShape = {
  id: z.string().min(1),
  docType: z.literal('INCENTIVE_AWARD'),
  technicianId: z.string().min(1),
  partitionKey: z.string().min(1),
  weekKey: z.string().regex(IST_WEEK_KEY_RE),
  weekStart: z.string(),
  weekEnd: z.string(),
  countedJobs: z.number().int().nonnegative(),
  countedCommissionPaise: z.number().int().nonnegative(),
  /** Snapshot (spec §3.5) — a later config edit must never re-price this week. */
  milestoneSnapshot: z.array(MilestoneSchema),
  capFractionBpsSnapshot: z.number().int().min(0).max(10_000),
  minCountableBookingPaiseSnapshot: z.number().int().nonnegative(),
  reachedMilestone: MilestoneSchema.optional(),
  grossBonusPaise: z.number().int().nonnegative(),
  capPaise: z.number().int().nonnegative(),
  /** Positive by construction: a zero award is never written at all. */
  awardedPaise: z.number().int().positive(),
  /** ALWAYS recomputed absolutely from allocations. Never incremented (spec §3.2). */
  appliedPaise: z.number().int().nonnegative(),
  status: IncentiveAwardStatusSchema,
  computedAt: z.string(),
  updatedAt: z.string().optional(),
};

/** Read path. Deliberately NOT `.strict()`: Cosmos returns `_rid`/`_etag`/`_ts`/`_self`/
 *  `_attachments` on every stored doc, and zod's default strip mode drops them silently. */
export const IncentiveAwardDocSchema = z.object(awardShape);
export type IncentiveAwardDoc = z.infer<typeof IncentiveAwardDocSchema>;

/**
 * Write path. `.strict()` at all levels (including nested milestones) is the STRUCTURAL half of
 * credit-only (spec §7.8, ADR-0035): any `payoutPaise`/`netPayable`/`razorpayTransferId` field
 * added in a future edit throws here at parse time and can never be persisted — whether at the
 * top level or nested inside `milestoneSnapshot`/`reachedMilestone`. The Semgrep rules and
 * the static test are the other two halves. Only `incentive.service.ts` may call this.
 */
export const IncentiveAwardWriteSchema = z.object(awardShape).strict();

export const incentiveAwardId = (technicianId: string, weekKey: string): string =>
  `inc:${technicianId}:${weekKey}`;
