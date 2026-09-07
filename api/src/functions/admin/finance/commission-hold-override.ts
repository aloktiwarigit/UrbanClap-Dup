import '../../../bootstrap.js';
import { app } from '@azure/functions';
import type { HttpRequest, InvocationContext, HttpResponseInit } from '@azure/functions';
import { requireAdmin, type AdminHttpHandler } from '../../../middleware/requireAdmin.js';
import type { AdminContext } from '../../../types/admin.js';
import { readCommissionHold, patchCommissionHold } from '../../../cosmos/technician-repository.js';
import { recomputeCommissionHold } from '../../../services/commission-hold.service.js';
import { auditLog } from '../../../services/auditLog.service.js';
import type { CommissionHold } from '../../../schemas/technician.js';
import { SetCommissionHoldOverrideBodySchema } from '../../../schemas/commission-ledger.js';

const MAX_OVERRIDE_PATCH_ATTEMPTS = 3;

function getTechnicianId(req: HttpRequest): string | undefined {
  return (req.params as Record<string, string | undefined>)['technicianId'];
}

/** Fresh commissionHold seed for a technician doc that exists but has never had one computed. */
function defaultHold(evaluatedAt: string): CommissionHold {
  return { outstandingPaise: 0, dueCount: 0, state: 'CLEAR', evaluatedAt };
}

type ApplyHoldPatchResult =
  | { status: 'APPLIED'; hold: CommissionHold }
  | { status: 'MISSING' }
  | { status: 'STALE' };

/**
 * Retries the read-build-conditional-patch cycle up to `MAX_OVERRIDE_PATCH_ATTEMPTS` times so a
 * concurrent recompute landing between our read and our patch (`patchCommissionHold` returning
 * `'STALE'`) gets a fresh read + a fresh `readStartedAt` on the next attempt instead of silently
 * dropping the admin's override. `buildNext` receives the current hold (or `null` if the
 * technician has never had one computed) and this attempt's `readStartedAt`, and must return the
 * FULL next hold — it decides what to keep/strip/add (set vs. clear override).
 */
async function applyHoldPatch(
  technicianId: string,
  buildNext: (current: CommissionHold | null, readStartedAt: string) => CommissionHold,
): Promise<ApplyHoldPatchResult> {
  for (let attempt = 1; attempt <= MAX_OVERRIDE_PATCH_ATTEMPTS; attempt++) {
    const readStartedAt = new Date().toISOString();
    const { hold, exists } = await readCommissionHold(technicianId);
    if (!exists) return { status: 'MISSING' };

    const next = buildNext(hold, readStartedAt);
    const result = await patchCommissionHold(technicianId, next, readStartedAt);
    if (result === 'APPLIED') return { status: 'APPLIED', hold: next };
    if (result === 'MISSING') return { status: 'MISSING' };
    // STALE: another recompute/patch landed between our read and our write — retry with a
    // completely fresh read on the next iteration.
  }
  return { status: 'STALE' };
}

/**
 * Sets a manual override that forces a technician's commissionHold to CLEAR until `until`,
 * regardless of outstanding balance (E21-S02 Task 10). Writes the override field via the
 * conditional patch primitive (retried on `STALE`), then immediately recomputes the hold so the
 * response reflects the override's effect (state, outstandingPaise, dueCount) rather than the raw
 * patched field alone.
 */
export const setCommissionHoldOverrideHandler: AdminHttpHandler = async (
  req: HttpRequest,
  _ctx: InvocationContext,
  admin: AdminContext,
): Promise<HttpResponseInit> => {
  const technicianId = getTechnicianId(req);
  if (!technicianId) return { status: 400, jsonBody: { code: 'MISSING_TECHNICIAN_ID' } };

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { status: 400, jsonBody: { code: 'PARSE_ERROR' } };
  }

  const parsed = SetCommissionHoldOverrideBodySchema.safeParse(raw);
  if (!parsed.success) {
    return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', issues: parsed.error.issues } };
  }

  try {
    const patchResult = await applyHoldPatch(technicianId, (current, readStartedAt) => ({
      ...(current ?? defaultHold(readStartedAt)),
      override: { until: parsed.data.until, byAdminId: admin.adminId, reason: parsed.data.reason },
    }));

    if (patchResult.status === 'MISSING') {
      return { status: 404, jsonBody: { code: 'TECHNICIAN_NOT_FOUND' } };
    }
    if (patchResult.status === 'STALE') {
      return { status: 409, jsonBody: { code: 'LEDGER_BUSY' } };
    }

    const recomputed = await recomputeCommissionHold(technicianId);

    await auditLog(admin, 'COMMISSION_HOLD_OVERRIDDEN', 'commission_hold', technicianId, {
      until: parsed.data.until,
      reason: parsed.data.reason,
    });

    return { status: 200, jsonBody: { hold: recomputed.hold } };
  } catch {
    return { status: 502, jsonBody: { code: 'UPSTREAM_ERROR' } };
  }
};

/**
 * Clears a technician's commissionHold override (E21-S02 Task 10). Strips the `override` field
 * via the same retried conditional-patch primitive and recomputes so the hold immediately
 * reflects the technician's real outstanding balance again instead of waiting for the next
 * unrelated recompute.
 */
export const clearCommissionHoldOverrideHandler: AdminHttpHandler = async (
  req: HttpRequest,
  _ctx: InvocationContext,
  admin: AdminContext,
): Promise<HttpResponseInit> => {
  const technicianId = getTechnicianId(req);
  if (!technicianId) return { status: 400, jsonBody: { code: 'MISSING_TECHNICIAN_ID' } };

  try {
    let clearedOverride: CommissionHold['override'];
    const patchResult = await applyHoldPatch(technicianId, (current, readStartedAt) => {
      const base = current ?? defaultHold(readStartedAt);
      clearedOverride = base.override;
      const { override: _override, ...rest } = base;
      return rest;
    });

    if (patchResult.status === 'MISSING') {
      return { status: 404, jsonBody: { code: 'TECHNICIAN_NOT_FOUND' } };
    }
    if (patchResult.status === 'STALE') {
      return { status: 409, jsonBody: { code: 'LEDGER_BUSY' } };
    }

    const recomputed = await recomputeCommissionHold(technicianId);

    await auditLog(admin, 'COMMISSION_HOLD_OVERRIDE_CLEARED', 'commission_hold', technicianId, {
      clearedOverride: clearedOverride ?? null,
    });

    return { status: 200, jsonBody: { hold: recomputed.hold } };
  } catch {
    return { status: 502, jsonBody: { code: 'UPSTREAM_ERROR' } };
  }
};

app.http('setCommissionHoldOverride', {
  methods: ['POST'],
  route: 'v1/admin/finance/commission-hold/{technicianId}/override',
  authLevel: 'anonymous',
  handler: requireAdmin(['super-admin'])(setCommissionHoldOverrideHandler),
});

app.http('clearCommissionHoldOverride', {
  methods: ['DELETE'],
  route: 'v1/admin/finance/commission-hold/{technicianId}/override',
  authLevel: 'anonymous',
  handler: requireAdmin(['super-admin'])(clearCommissionHoldOverrideHandler),
});
