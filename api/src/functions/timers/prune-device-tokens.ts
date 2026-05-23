import '../../bootstrap.js';
import { app } from '@azure/functions';
import type { InvocationContext } from '@azure/functions';
import * as Sentry from '@sentry/node';
import { deviceTokenRepo } from '../../cosmos/device-token-repository.js';

const STALE_THRESHOLD_DAYS = 60;

export async function pruneStaleDeviceTokens(ctx: InvocationContext): Promise<void> {
  ctx.log(`pruneStaleDeviceTokens: pruning tokens older than ${STALE_THRESHOLD_DAYS} days`);
  const pruned = await deviceTokenRepo.pruneStaleTokens(STALE_THRESHOLD_DAYS);
  ctx.log(`pruneStaleDeviceTokens: pruned ${pruned} stale tokens`);
  Sentry.addBreadcrumb({
    category: 'device-tokens',
    message: `Pruned ${pruned} stale device tokens (>${STALE_THRESHOLD_DAYS}d lastSeen)`,
    level: 'info',
  });
}

app.timer('triggerPruneDeviceTokens', {
  schedule: '0 0 2 * * *', // 02:00 UTC daily
  handler: async (_myTimer: unknown, context: InvocationContext): Promise<void> => {
    try {
      await pruneStaleDeviceTokens(context);
    } catch (err: unknown) {
      Sentry.captureException(err);
      context.error('pruneStaleDeviceTokens top-level error', err);
    }
  },
});
