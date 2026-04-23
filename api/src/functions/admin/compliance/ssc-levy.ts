// api/src/functions/admin/compliance/ssc-levy.ts
import '../../../bootstrap.js';
import { app } from '@azure/functions';
import type { Timer, InvocationContext, HttpRequest, HttpResponseInit } from '@azure/functions';
import { requireAdmin, type AdminHttpHandler } from '../../../middleware/requireAdmin.js';
import type { AdminContext } from '../../../types/admin.js';
import { sscLevyRepo } from '../../../cosmos/ssc-levy-repository.js';
import { createTransfer } from '../../../services/razorpay.service.js';
import { auditLog } from '../../../services/auditLog.service.js';
import {
  calculateQuarterlyGmv,
  getPriorQuarter,
  quarterBounds,
  computeLevyAmount,
  sendOwnerFcmNotification,
  sendOwnerEmail,
} from '../../../services/ssc-levy.service.js';

export async function sscLevyTimerHandler(
  timer: Timer,
  context: InvocationContext,
): Promise<void> {
  try {
    // Derive the prior quarter from the timer's last scheduled occurrence (not wall clock)
    // so late Azure Function replays after downtime use the original trigger date rather
    // than whichever date the retry happens to run on.
    const scheduledAt = timer.scheduleStatus?.last
      ? new Date(timer.scheduleStatus.last)
      : new Date();
    const quarter = getPriorQuarter(scheduledAt);

    const existing = await sscLevyRepo.getLevyByQuarter(quarter);
    if (existing) {
      context.log(`SSC_LEVY_SKIP quarter=${quarter} status=${existing.status}`);
      return;
    }

    const { fromIso, toIso } = quarterBounds(quarter);
    const gmv = await calculateQuarterlyGmv(fromIso, toIso);
    const levyAmount = computeLevyAmount(gmv);

    let levy: Awaited<ReturnType<typeof sscLevyRepo.createLevy>>;
    try {
      levy = await sscLevyRepo.createLevy({
        quarter,
        gmv,
        levyRate: 0.01,
        levyAmount,
        status: 'PENDING_APPROVAL',
      });
    } catch (createErr: unknown) {
      // Cosmos 409 Conflict = concurrent/replayed invocation already created the doc.
      // Treat as idempotent success — no need to send notifications again.
      const cosmosErr = createErr as { code?: number };
      if (cosmosErr?.code === 409) {
        context.log(`SSC_LEVY_SKIP_CONFLICT quarter=${quarter} (concurrent creation)`);
        return;
      }
      throw createErr;
    }

    context.log(`SSC_LEVY_CREATED id=${levy.id} quarter=${quarter} gmv=${gmv} levyAmount=${levyAmount}`);

    const notifResults = await Promise.allSettled([
      sendOwnerFcmNotification(levy),
      sendOwnerEmail(levy),
    ]);
    for (const r of notifResults) {
      if (r.status === 'rejected') {
        context.error(`SSC_LEVY_NOTIFICATION_FAILED levyId=${levy.id}`, r.reason);
      }
    }
  } catch (err: unknown) {
    context.error(`SSC_LEVY_TIMER_FAILED`, err);
    throw err;
  }
}

export const approveSscLevyHandler: AdminHttpHandler = async (
  req: HttpRequest,
  ctx: InvocationContext,
  admin: AdminContext,
): Promise<HttpResponseInit> => {
  if (admin.role !== 'super-admin') {
    return { status: 403, jsonBody: { code: 'FORBIDDEN', requiredRoles: ['super-admin'] } };
  }

  const levyId = req.params['id'] ?? '';
  const levy = await sscLevyRepo.getLevyById(levyId);
  if (!levy) return { status: 404, jsonBody: { code: 'LEVY_NOT_FOUND' } };

  // APPROVED is also retryable: it means a previous run wrote APPROVED then crashed
  // before createTransfer() completed. The Razorpay idempotencyKey prevents double-charging.
  if (
    levy.status !== 'PENDING_APPROVAL' &&
    levy.status !== 'FAILED' &&
    levy.status !== 'APPROVED'
  ) {
    return { status: 409, jsonBody: { code: 'INVALID_STATUS', currentStatus: levy.status } };
  }

  const fundAccountId = process.env['SSC_FUND_ACCOUNT_ID'];
  if (!fundAccountId) {
    return { status: 500, jsonBody: { code: 'CONFIGURATION_ERROR', message: 'SSC_FUND_ACCOUNT_ID not set' } };
  }

  const approvedAt = new Date().toISOString();
  await sscLevyRepo.updateLevy(levy.id, levy.quarter, { status: 'APPROVED', approvedAt });

  // Phase 1: initiate Razorpay transfer. Only mark FAILED if the transfer
  // itself did not succeed — post-transfer DB/audit errors must NOT overwrite
  // the status to FAILED (money already moved; that would be a lie on the ledger).
  let transferId: string;
  try {
    const result = await createTransfer({
      accountId: fundAccountId,
      amount: levy.levyAmount,
      notes: { quarter: levy.quarter, levyId: levy.id, initiatedBy: admin.adminId },
      idempotencyKey: `ssc-levy-${levy.id}`,
    });
    transferId = result.transferId;
  } catch (err: unknown) {
    // Transfer did not happen — safe to mark FAILED so a retry is possible.
    try {
      await sscLevyRepo.updateLevy(levy.id, levy.quarter, { status: 'FAILED' });
    } catch (updateErr: unknown) {
      ctx.error(`SSC_LEVY_STATUS_UPDATE_FAILED levyId=${levy.id}`, updateErr);
    }
    return {
      status: 502,
      jsonBody: {
        code: 'TRANSFER_FAILED',
        message: err instanceof Error ? err.message : 'transfer failed',
      },
    };
  }

  // Phase 2: persist the transfer result. Errors here are internal failures —
  // money has already moved so we must NOT mark FAILED. Log and return 500.
  try {
    const transferredAt = new Date().toISOString();
    await sscLevyRepo.updateLevy(levy.id, levy.quarter, {
      status: 'TRANSFERRED',
      razorpayTransferId: transferId,
      transferredAt,
    });

    await auditLog(
      { adminId: admin.adminId, role: admin.role, sessionId: admin.sessionId },
      'SSC_LEVY_TRANSFER',
      'ssc_levy',
      levy.id,
      { quarter: levy.quarter, levyAmount: levy.levyAmount, razorpayTransferId: transferId },
      { ip: req.headers.get('x-forwarded-for') ?? 'unknown' },
    );
  } catch (err: unknown) {
    // Transfer succeeded but we failed to record it — operator must reconcile.
    ctx.error(`SSC_LEVY_POST_TRANSFER_RECORD_FAILED levyId=${levy.id} transferId=${transferId}`, err);
    return {
      status: 500,
      jsonBody: {
        code: 'POST_TRANSFER_RECORD_FAILED',
        message: 'Transfer succeeded but state recording failed — reconcile manually',
        transferId,
      },
    };
  }

  return {
    status: 200,
    jsonBody: { levyId: levy.id, quarter: levy.quarter, transferId, status: 'TRANSFERRED' },
  };
};

app.timer('sscLevyQuarterly', {
  schedule: '0 0 0 1 1,4,7,10 *',
  handler: sscLevyTimerHandler,
});

app.http('approveSscLevy', {
  methods: ['POST'],
  route: 'v1/admin/compliance/ssc-levy/{id}/approve',
  authLevel: 'anonymous',
  handler: requireAdmin(['super-admin'])(approveSscLevyHandler),
});
