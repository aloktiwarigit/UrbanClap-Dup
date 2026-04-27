import '../bootstrap.js';
import { app } from '@azure/functions';
import type { Timer, InvocationContext } from '@azure/functions';
import * as Sentry from '@sentry/node';
import { randomUUID } from 'node:crypto';
import { appendAuditEntry } from '../cosmos/audit-log-repository.js';

interface NoShowResolution {
  bookingId: string;
  technicianId: string;
  outcome: 'NO_SHOW_CREDIT_ISSUED' | 'NO_SHOW_TECH_SWAPPED' | 'BOOKING_UNFULFILLED';
  creditAmount?: number;
  newTechId?: string;
}

// TODO(#63): implement detection logic — query ASSIGNED/EN_ROUTE bookings where
// scheduledAt < (now - grace period), then resolve each via credit, swap, or cancel.
async function detectAndResolve(_cutoff: string): Promise<NoShowResolution[]> {
  return [];
}

function noShowAuditEntry(resolution: NoShowResolution): Promise<void> {
  const timestamp = new Date().toISOString();
  return appendAuditEntry({
    id: randomUUID(),
    adminId: 'system',
    role: 'system',
    action: resolution.outcome,
    resourceType: 'booking',
    resourceId: resolution.bookingId,
    payload: {
      bookingId: resolution.bookingId,
      technicianId: resolution.technicianId,
      ...(resolution.creditAmount !== undefined && { creditAmount: resolution.creditAmount }),
      ...(resolution.newTechId !== undefined && { newTechId: resolution.newTechId }),
    },
    timestamp,
    partitionKey: timestamp.slice(0, 7),
  });
}

export async function detectNoShows(_timer: Timer, ctx: InvocationContext): Promise<void> {
  const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const resolutions = await detectAndResolve(cutoff);

  for (const resolution of resolutions) {
    try {
      await noShowAuditEntry(resolution);
      ctx.log(`detectNoShows: ${resolution.outcome} bookingId=${resolution.bookingId}`);
    } catch (err: unknown) {
      Sentry.captureException(err);
      ctx.error(`detectNoShows audit error bookingId=${resolution.bookingId}`, err);
    }
  }
}

app.timer('detectNoShows', {
  schedule: '0 */15 * * * *',
  handler: detectNoShows,
});
