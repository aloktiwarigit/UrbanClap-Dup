import { app } from '@azure/functions';
import type { Timer, InvocationContext } from '@azure/functions';
import {
  getOverdueComplaints,
  replaceComplaint,
  getUnacknowledgedPastDueComplaints,
} from '../../../cosmos/complaints-repository.js';
import { appendAuditEntry } from '../../../cosmos/audit-log-repository.js';
import { sendOwnerComplaintSlaBreach } from '../../../services/fcm.service.js';
import { randomUUID } from 'crypto';

const SYSTEM_ACTOR_ID = 'system';
const SYSTEM_ACTOR_ROLE = 'super-admin' as const;

async function escalateBatch(
  batch: Awaited<ReturnType<typeof getOverdueComplaints>>,
  auditAction: 'SLA_BREACH' | 'SLA_BREACH_ACK',
  ctx: InvocationContext,
  now: string,
): Promise<void> {
  await Promise.all(
    batch.map(async ({ doc: complaint, etag }) => {
      // SLA_BREACH sets `escalated: true` (picked up by resolution-overdue query).
      // SLA_BREACH_ACK sets `ackBreached: true` only — leaving `escalated: false`
      // so the complaint still surfaces in getOverdueComplaints() if it later
      // crosses the 24-hour SLA deadline.
      const updated =
        auditAction === 'SLA_BREACH'
          ? { ...complaint, escalated: true, updatedAt: now }
          : { ...complaint, ackBreached: true, updatedAt: now };
      try {
        await replaceComplaint(updated, etag);
      } catch (err: unknown) {
        if (
          typeof err === 'object' &&
          err !== null &&
          'code' in err &&
          (err as { code: number }).code === 412
        ) {
          ctx.log(`slaBreachTimer: skipping ${complaint.id} — concurrent update in progress`);
          return;
        }
        throw err;
      }
      appendAuditEntry({
        id: randomUUID(),
        adminId: SYSTEM_ACTOR_ID,
        role: SYSTEM_ACTOR_ROLE,
        action: auditAction,
        resourceType: 'complaint',
        resourceId: complaint.id,
        payload: { technicianId: complaint.technicianId, orderId: complaint.orderId },
        ip: '',
        userAgent: '',
        timestamp: now,
        partitionKey: now.slice(0, 7),
      }).catch((err: unknown) => ctx.error(`audit ${auditAction} failed for ${complaint.id}`, err));
      sendOwnerComplaintSlaBreach({
        complaintId: complaint.id,
        bookingId: complaint.orderId,
        breachType: auditAction,
      }).catch((err: unknown) =>
        ctx.error(`FCM SLA breach push failed for ${complaint.id}`, err),
      );
    }),
  );
}

export async function slaBreachTimerHandler(
  _timer: Timer,
  ctx: InvocationContext,
): Promise<void> {
  let overdue: Awaited<ReturnType<typeof getOverdueComplaints>>;
  let ackOverdue: Awaited<ReturnType<typeof getUnacknowledgedPastDueComplaints>>;
  try {
    [overdue, ackOverdue] = await Promise.all([
      getOverdueComplaints(),
      getUnacknowledgedPastDueComplaints(),
    ]);
  } catch (err: unknown) {
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: number }).code === 404
    ) {
      ctx.log('slaBreachTimer: complaints container not yet provisioned — skipping');
      return;
    }
    throw err;
  }

  const now = new Date().toISOString();
  // De-duplicate: a complaint whose slaDeadlineAt is also past (i.e. in `overdue`) satisfies
  // both queries. Running SLA_BREACH on it is sufficient; exclude it from the ACK batch to
  // avoid a same-ETag race between the two escalateBatch calls.
  const overdueIds = new Set(overdue.map(({ doc }) => doc.id));
  const dedupedAckOverdue = ackOverdue.filter(({ doc }) => !overdueIds.has(doc.id));

  await Promise.all([
    escalateBatch(overdue, 'SLA_BREACH', ctx, now),
    escalateBatch(dedupedAckOverdue, 'SLA_BREACH_ACK', ctx, now),
  ]);

  ctx.log(
    `slaBreachTimer: resolve-breaches=${overdue.length} ack-breaches=${dedupedAckOverdue.length}`,
  );
}

app.timer('slaBreachTimer', {
  schedule: '0 */15 * * * *',
  handler: slaBreachTimerHandler,
});
