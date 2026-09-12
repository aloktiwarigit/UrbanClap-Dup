import '../bootstrap.js';
import { app } from '@azure/functions';
import type { InvocationContext, Timer } from '@azure/functions';
import * as Sentry from '@sentry/node';
import { runIncentiveWeek } from '../services/incentive.service.js';
import { previousIstWeekKey } from '../lib/ist-time.js';

/**
 * Weekly incentive run, Monday 00:30 IST.
 *
 * Always the PREVIOUS IST week — the week that closed half an hour ago — never the one just
 * starting. Idempotent: award ids are deterministic, so a duplicate delivery or a manual re-run
 * of the same week replays per technician and awards nothing twice.
 */
export async function runWeeklyIncentives(ctx: InvocationContext): Promise<void> {
  const weekKey = previousIstWeekKey(new Date());
  const s = await runIncentiveWeek(weekKey, 'system:incentive-timer');
  ctx.log(
    `runWeeklyIncentives week=${s.weekKey} enabled=${s.enabled} technicians=${s.technicianCount} ` +
    `awarded=${s.awarded} replayed=${s.replayed} noAward=${s.noAward} failed=${s.failed} ` +
    `totalAwardedPaise=${s.totalAwardedPaise}`,
  );
  if (s.failed > 0) ctx.error(`INCENTIVE_RUN_PARTIAL_FAILURE week=${s.weekKey} failed=${s.failed}`);
}

app.timer('triggerIncentiveWeekly', {
  // Sunday 19:00 UTC == Monday 00:30 IST. The host runs CRON in UTC (WEBSITE_TIME_ZONE unset),
  // as every other timer in this repo assumes.
  schedule: '0 0 19 * * 0',
  handler: async (_timer: Timer, ctx: InvocationContext): Promise<void> => {
    try {
      await runWeeklyIncentives(ctx);
    } catch (err: unknown) {
      Sentry.captureException(err);
      ctx.error(`runWeeklyIncentives ERROR: ${err instanceof Error ? err.message : String(err)}`);
      throw err; // let the host record a failed invocation
    }
  },
});
