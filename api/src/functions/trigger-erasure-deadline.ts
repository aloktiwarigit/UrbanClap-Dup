import '../bootstrap.js';
import { app } from '@azure/functions';
import type { Timer, InvocationContext } from '@azure/functions';
import * as Sentry from '@sentry/node';
import {
  listOverduePendingErasureRequests,
  getErasureRequestById,
  replaceErasureRequest,
} from '../cosmos/erasure-request-repository.js';
import {
  executeErasureCascade,
  computeAnonymizedHash,
} from '../services/erasureCascade.service.js';
import { auditLog } from '../services/auditLog.service.js';
import { sendErasureFinalNotice } from '../services/fcm.service.js';
import type { ErasureRequestDoc } from '../schemas/erasure-request.js';

export interface CronOutcome {
  processed: number;
  executed: number;
  failed: number;
  skipped: number;
}

export async function processOverdueErasures(ctx: InvocationContext): Promise<CronOutcome> {
  const nowIso = new Date().toISOString();
  const overdue = await listOverduePendingErasureRequests(nowIso);
  ctx.log(`processOverdueErasures: ${overdue.length} overdue PENDING request(s) at ${nowIso}`);

  let executed = 0;
  let failed = 0;
  let skipped = 0;

  for (const stale of overdue) {
    // Re-read the doc to defend against races (user revoked between list + process).
    const fetched = await getErasureRequestById(stale.id);
    if (!fetched || fetched.doc.status !== 'PENDING') {
      skipped += 1;
      continue;
    }
    const { doc, etag } = fetched;
    const anonymizedHash = computeAnonymizedHash(doc.userId, doc.anonymizationSalt);

    // Mark EXECUTING (idempotency anchor).
    const executing: ErasureRequestDoc = {
      ...doc,
      status: 'EXECUTING',
      anonymizedHash,
    };
    try {
      await replaceErasureRequest(executing, etag);
    } catch (err) {
      // 412 = etag mismatch (concurrent change). Skip and try next cycle.
      Sentry.captureException(err);
      skipped += 1;
      continue;
    }

    try {
      // Best-effort final notice BEFORE the cascade — runs while the
      // technician's FCM token still exists in their doc. Never roll
      // back EXECUTED on a notification failure.
      try {
        await sendErasureFinalNotice({
          userId: doc.userId,
          userRole: doc.userRole,
          erasureId: doc.id,
        });
      } catch (notifyErr) {
        Sentry.captureException(notifyErr);
      }

      const counts = await executeErasureCascade({
        userId: doc.userId,
        userRole: doc.userRole,
        anonymizationSalt: doc.anonymizationSalt,
      });
      const finalDoc: ErasureRequestDoc = {
        ...executing,
        userId: anonymizedHash,
        anonymizationSalt: '',
        userIdWiped: true,
        status: 'EXECUTED',
        executedAt: new Date().toISOString(),
        deletedCounts: counts,
      };
      await replaceErasureRequest(finalDoc);

      await auditLog(
        { adminId: 'system', role: 'system' },
        'ERASURE_EXECUTED',
        'user',
        anonymizedHash,
        {
          erasureId: doc.id,
          deletedCounts: counts,
          userRole: doc.userRole,
          source: 'cron',
        },
      );

      executed += 1;
    } catch (err) {
      Sentry.captureException(err);
      const failureReason = err instanceof Error ? err.message : String(err);
      const failedDoc: ErasureRequestDoc = {
        ...executing,
        status: 'FAILED',
        failedAt: new Date().toISOString(),
        failureReason,
      };
      try {
        await replaceErasureRequest(failedDoc);
      } catch (replaceErr) {
        Sentry.captureException(replaceErr);
      }
      try {
        await auditLog(
          { adminId: 'system', role: 'system' },
          'ERASURE_FAILED',
          'user',
          anonymizedHash,
          { erasureId: doc.id, failureReason, userRole: doc.userRole, source: 'cron' },
        );
      } catch (auditErr) {
        Sentry.captureException(auditErr);
      }
      failed += 1;
    }
  }

  ctx.log(
    `processOverdueErasures done: processed=${overdue.length} executed=${executed} failed=${failed} skipped=${skipped}`,
  );
  return { processed: overdue.length, executed, failed, skipped };
}

app.timer('triggerErasureDeadline', {
  // 02:00 UTC daily.
  schedule: '0 0 2 * * *',
  handler: async (_timer: Timer, ctx: InvocationContext): Promise<void> => {
    try {
      await processOverdueErasures(ctx);
    } catch (err) {
      Sentry.captureException(err);
      ctx.log(
        `triggerErasureDeadline ERROR: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw err;
    }
  },
});
