import { app } from '@azure/functions';
import type { Timer, InvocationContext } from '@azure/functions';
import { getOverdueComplaints, replaceComplaint } from '../../../cosmos/complaints-repository.js';
import { appendAuditEntry } from '../../../cosmos/audit-log-repository.js';
import { randomUUID } from 'crypto';

const SYSTEM_ACTOR_ID = 'system';
const SYSTEM_ACTOR_ROLE = 'super-admin' as const;

export async function slaBreachTimerHandler(
  _timer: Timer,
  ctx: InvocationContext,
): Promise<void> {
  const overdue = await getOverdueComplaints();
  if (overdue.length === 0) {
    ctx.log('slaBreachTimer: no overdue complaints');
    return;
  }

  const now = new Date().toISOString();

  await Promise.all(
    overdue.map(async ({ doc: complaint, etag }) => {
      const updated = { ...complaint, escalated: true, updatedAt: now };
      try {
        await replaceComplaint(updated, etag);
      } catch (err: unknown) {
        if (typeof err === 'object' && err !== null && 'code' in err && err.code === 412) {
          ctx.log(`slaBreachTimer: skipping ${complaint.id} — concurrent update in progress`);
          return;
        }
        throw err;
      }
      appendAuditEntry({
        id: randomUUID(),
        adminId: SYSTEM_ACTOR_ID,
        role: SYSTEM_ACTOR_ROLE,
        action: 'SLA_BREACH',
        resourceType: 'complaint',
        resourceId: complaint.id,
        payload: { technicianId: complaint.technicianId, orderId: complaint.orderId },
        ip: '',
        userAgent: '',
        timestamp: now,
        partitionKey: now.slice(0, 7),
      }).catch((err: unknown) => ctx.error(`audit SLA_BREACH failed for ${complaint.id}`, err));
    }),
  );

  ctx.log(`slaBreachTimer: escalated ${overdue.length} complaint(s)`);
}

app.timer('slaBreachTimer', {
  schedule: '0 */15 * * * *',
  handler: slaBreachTimerHandler,
});
