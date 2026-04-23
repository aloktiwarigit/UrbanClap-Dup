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
    // Use wall clock to derive the quarterly levy period. The timer fires at midnight on
    // Jan 1, Apr 1, Jul 1, Oct 1 — the first day of the new quarter — so new Date() at
    // that moment correctly maps to the prior quarter via getPriorQuarter().
    //
    // Known limitation: if the host is down on a trigger date and Azure replays the missed
    // run (timer.isPastDue === true) more than ~24h later, new Date() may be in a different
    // month. The Timer SDK type does not expose the originally-scheduled occurrence time, so
    // there is no reliable workaround within Azure Functions v4 without an external clock
    // source. At pilot scale (≤5k bookings/mo) the combination of isPastDue AND a cross-day
    // drift on a quarterly boundary is considered implausible operationally. If it occurs,
    // the levy doc for that quarter will not be created by the timer; the owner can invoke
    // the approve endpoint with a manually-constructed levy or re-run the timer.
    const quarter = getPriorQuarter(new Date());

    // If an existing PENDING_APPROVAL levy is found, notifications may not have been
    // delivered on a prior crashed run. Re-attempt them (fire-and-forget; idempotent).
    const existing = await sscLevyRepo.getLevyByQuarter(quarter);
    if (existing) {
      if (existing.status === 'PENDING_APPROVAL') {
        context.log(`SSC_LEVY_NOTIFY_RETRY quarter=${quarter} levyId=${existing.id}`);
        const notifResults = await Promise.allSettled([
          sendOwnerFcmNotification(existing),
          sendOwnerEmail(existing),
        ]);
        for (const r of notifResults) {
          if (r.status === 'rejected') {
            context.error(`SSC_LEVY_NOTIFICATION_FAILED levyId=${existing.id}`, r.reason);
          }
        }
      } else {
        context.log(`SSC_LEVY_SKIP quarter=${quarter} status=${existing.status}`);
      }
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
      // Cosmos 409 Conflict = concurrent invocation already created the doc.
      // We can't assume the winner sent notifications (it may have crashed), so read
      // the existing doc and retry notifications if it's still PENDING_APPROVAL.
      const cosmosErr = createErr as { code?: number };
      if (cosmosErr?.code === 409) {
        context.log(`SSC_LEVY_SKIP_CONFLICT quarter=${quarter} (concurrent creation) — retrying notifications`);
        const created = await sscLevyRepo.getLevyByQuarter(quarter);
        if (created?.status === 'PENDING_APPROVAL') {
          const notifResults = await Promise.allSettled([
            sendOwnerFcmNotification(created),
            sendOwnerEmail(created),
          ]);
          for (const r of notifResults) {
            if (r.status === 'rejected') {
              context.error(`SSC_LEVY_NOTIFICATION_FAILED levyId=${created.id}`, r.reason);
            }
          }
        }
        return;
      }
      throw createErr;
    }

    context.log(`SSC_LEVY_CREATED id=${levy.id} quarter=${quarter} gmv=${gmv} levyAmount=${levyAmount}`);

    // Send notifications. If both fail (e.g. transient FCM+ACS outage), throw so Azure
    // retries this invocation. On retry the levy already exists (PENDING_APPROVAL), so the
    // early-exit branch above will attempt notifications again without re-creating the doc.
    // At least one success = return normally; the other channel's failure is logged only.
    const notifResults = await Promise.allSettled([
      sendOwnerFcmNotification(levy),
      sendOwnerEmail(levy),
    ]);
    const notifFailures = notifResults.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
    for (const r of notifFailures) {
      context.error(`SSC_LEVY_NOTIFICATION_FAILED levyId=${levy.id}`, r.reason as unknown);
    }
    if (notifFailures.length === notifResults.length) {
      throw new Error(`SSC_LEVY_ALL_NOTIFICATIONS_FAILED levyId=${levy.id} — Azure will retry`);
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
