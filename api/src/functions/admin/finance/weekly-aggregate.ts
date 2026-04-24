import '../../../bootstrap.js';
import { app } from '@azure/functions';
import type { Timer, InvocationContext } from '@azure/functions';
import { getPayoutQueue, upsertWeekSnapshot } from '../../../cosmos/finance-repository.js';
import * as Sentry from '@sentry/node';

function priorWeekBounds(now: Date): { weekStart: string; weekEnd: string } {
  // Cron fires Monday 00:30 UTC; yesterday (Sunday) is the last day of the prior week.
  const weekEnd = new Date(now);
  weekEnd.setUTCHours(0, 0, 0, 0);
  weekEnd.setUTCDate(weekEnd.getUTCDate() - 1);
  const weekStart = new Date(weekEnd);
  weekStart.setUTCDate(weekStart.getUTCDate() - 6);
  return { weekStart: weekStart.toISOString().slice(0, 10), weekEnd: weekEnd.toISOString().slice(0, 10) };
}

export async function weeklyPayoutAggregateHandler(
  _timer: Timer,
  ctx: InvocationContext,
): Promise<void> {
  const { weekStart, weekEnd } = priorWeekBounds(new Date());
  ctx.log(`weeklyPayoutAggregate: computing ${weekStart} → ${weekEnd}`);
  try {
    const queue = await getPayoutQueue(weekStart, weekEnd);
    await upsertWeekSnapshot(queue);
    ctx.log(`weeklyPayoutAggregate: done — ${queue.entries.length} techs, ${queue.totalNetPayable} paise total`);
  } catch (err: unknown) {
    Sentry.captureException(err);
    ctx.log(`weeklyPayoutAggregate ERROR: ${err instanceof Error ? err.message : String(err)}`);
    throw err;
  }
}

app.timer('weeklyPayoutAggregate', {
  schedule: '0 30 0 * * 1',
  handler: weeklyPayoutAggregateHandler,
});
