import { app } from '@azure/functions';
import type { Timer, InvocationContext } from '@azure/functions';
import { getOverdueComplaints, replaceComplaint } from '../../../cosmos/complaints-repository.js';
import { appendAuditEntry } from '../../../cosmos/audit-log-repository.js';
import { randomUUID } from 'crypto';

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
    overdue.map(async (complaint) => {
      const updated = { ...complaint, escalated: true, updatedAt: now };
      await replaceComplaint(updated);
      await appendAuditEntry({
        id: randomUUID(),
        adminId: 'system',
        role: 'super-admin',
        action: 'SLA_BREACH',
        resourceType: 'complaint',
        resourceId: complaint.id,
        payload: { technicianId: complaint.technicianId, orderId: complaint.orderId },
        ip: '',
        userAgent: '',
        timestamp: now,
        partitionKey: now.slice(0, 7),
      });
    }),
  );

  ctx.log(`slaBreachTimer: escalated ${overdue.length} complaint(s)`);
}

app.timer('slaBreachTimer', {
  schedule: '0 */15 * * * *',
  handler: slaBreachTimerHandler,
});
