import '../../../bootstrap.js';
import { app } from '@azure/functions';
import { z } from 'zod';
import type { HttpRequest, InvocationContext, HttpResponseInit } from '@azure/functions';
import { requireAdmin, type AdminHttpHandler } from '../../../middleware/requireAdmin.js';
import type { AdminContext } from '../../../types/admin.js';
import { readCommissionHold, patchCommissionHold } from '../../../cosmos/technician-repository.js';
import { recomputeCommissionHold } from '../../../services/commission-hold.service.js';
import { auditLog } from '../../../services/auditLog.service.js';
import type { CommissionHold } from '../../../schemas/technician.js';

const SetOverrideBodySchema = z
  .object({
    until: z.string().datetime(),
    reason: z.string().min(1).max(200),
  })
  .strict();

function getTechnicianId(req: HttpRequest): string | undefined {
  return (req.params as Record<string, string | undefined>)['technicianId'];
}

/** Fresh commissionHold seed for a technician doc that exists but has never had one computed. */
function defaultHold(evaluatedAt: string): CommissionHold {
  return { outstandingPaise: 0, dueCount: 0, state: 'CLEAR', evaluatedAt };
}

/**
 * Sets a manual override that forces a technician's commissionHold to CLEAR until `until`,
 * regardless of outstanding balance (E21-S02 Task 10). Writes the override field via the
 * conditional patch primitive, then immediately recomputes the hold so the response reflects the
 * override's effect (state, outstandingPaise, dueCount) rather than the raw patched field alone.
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

  const parsed = SetOverrideBodySchema.safeParse(raw);
  if (!parsed.success) {
    return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', issues: parsed.error.issues } };
  }

  try {
    const readStartedAt = new Date().toISOString();
    const { hold, exists } = await readCommissionHold(technicianId);
    if (!exists) return { status: 404, jsonBody: { code: 'TECHNICIAN_NOT_FOUND' } };

    const nextHold: CommissionHold = {
      ...(hold ?? defaultHold(readStartedAt)),
      override: { until: parsed.data.until, byAdminId: admin.adminId, reason: parsed.data.reason },
    };
    await patchCommissionHold(technicianId, nextHold, readStartedAt);
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
 * and recomputes so the hold immediately reflects the technician's real outstanding balance again
 * instead of waiting for the next unrelated recompute.
 */
export const clearCommissionHoldOverrideHandler: AdminHttpHandler = async (
  req: HttpRequest,
  _ctx: InvocationContext,
  admin: AdminContext,
): Promise<HttpResponseInit> => {
  const technicianId = getTechnicianId(req);
  if (!technicianId) return { status: 400, jsonBody: { code: 'MISSING_TECHNICIAN_ID' } };

  try {
    const readStartedAt = new Date().toISOString();
    const { hold, exists } = await readCommissionHold(technicianId);
    if (!exists) return { status: 404, jsonBody: { code: 'TECHNICIAN_NOT_FOUND' } };

    const { override: clearedOverride, ...rest } = hold ?? defaultHold(readStartedAt);
    await patchCommissionHold(technicianId, rest, readStartedAt);
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
