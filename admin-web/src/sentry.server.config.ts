import * as Sentry from '@sentry/nextjs';
import { scrubSentryEvent } from './lib/sentryPiiScrubber.js';

const dsn = process.env.SENTRY_DSN?.trim();
if (dsn) {
  try {
    Sentry.init({
      dsn,
      tracesSampleRate: 0.1,
      release: process.env['GIT_SHA'] ?? 'local',
      environment: process.env['NODE_ENV'] ?? 'production',
      // The Sentry Event type uses strict overloads that don't match our
      // generic Record<string, unknown> scrubber. Cast is safe — we only
      // mutate string fields and delete header keys; structure is preserved.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return
      beforeSend: (event: any) => scrubSentryEvent(event as Record<string, unknown>) as typeof event,
    });
  } catch (err) {
    // Malformed DSN must not crash module load — bootstrap proceeds without Sentry.
    console.warn('[sentry.server] init failed', err);
  }
}
