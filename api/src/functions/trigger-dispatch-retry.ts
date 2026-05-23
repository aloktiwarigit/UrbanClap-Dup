import '../bootstrap.js';
import { app } from '@azure/functions';
import type { InvocationContext, Timer } from '@azure/functions';
import * as Sentry from '@sentry/node';
import { dispatcherService } from '../services/dispatcher.service.js';

export async function retryAwaitingDispatchHandler(
  _timer: Timer,
  ctx: InvocationContext,
): Promise<void> {
  try {
    const result = await dispatcherService.retryAwaitingDispatch();
    ctx.log(`retryAwaitingDispatch: checked=${result.checked} dispatched=${result.dispatched}`);
  } catch (err: unknown) {
    Sentry.captureException(err);
    ctx.error('retryAwaitingDispatch failed', err);
  }
}

app.timer('retryAwaitingDispatch', {
  schedule: '0 */5 * * * *',
  handler: retryAwaitingDispatchHandler,
});
