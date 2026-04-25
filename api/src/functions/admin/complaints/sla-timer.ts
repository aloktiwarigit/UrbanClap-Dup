import { app } from '@azure/functions';
import type { Timer, InvocationContext } from '@azure/functions';
import {
  getOverdueComplaints,
  replaceComplaint,
  getUnacknowledgedPastDueComplaints,
} from '../../../cosmos/complaints-repository.js';
import { appendAuditEntry } from '../../../cosmos/audit-log-repository.js';
import { randomUUID } from 'crypto';

const SYSTEM_ACTOR_ID = 'system';
const SYSTEM_ACTOR_ROLE = 'super-admin' as const;

async function escalateBatch(
  batch: Awaited<ReturnType<typeof getOverdueComplaints>>,
  auditAction: string,
  ctx: InvocationContext,
  now: string,
): Promise<void> {
  await Promise.all(
    batch.map(async ({ doc: complaint, etag }) => {
      const updated = { ...complaint, escalated: true, updatedAt: now };
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
  await Promise.all([
    escalateBatch(overdue, 'SLA_BREACH', ctx, now),
    escalateBatch(ackOverdue, 'SLA_BREACH_ACK', ctx, now),
  ]);

  ctx.log(
    `slaBreachTimer: resolve-breaches=${overdue.length} ack-breaches=${ackOverdue.length}`,
  );
}

app.timer('slaBreachTimer', {
  schedule: '0 */15 * * * *',
  handler: slaBreachTimerHandler,
});
