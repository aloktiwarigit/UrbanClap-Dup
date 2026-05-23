import * as Sentry from '@sentry/nextjs';
import { scrubSentryEvent } from './lib/sentryPiiScrubber';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
if (dsn) {
  try {
    Sentry.init({
      dsn,
      tracesSampleRate: 0.1,
      release: process.env['NEXT_PUBLIC_GIT_SHA'] ?? 'local',
      environment: process.env['NODE_ENV'] ?? 'production',
      sendDefaultPii: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return
      beforeSend: (event: any) => scrubSentryEvent(event as Record<string, unknown>) as typeof event,
    });
  } catch {
    // Malformed DSN must not crash client bootstrap. Drop err — it may contain the raw DSN.
    console.warn('[sentry.client] init failed — check DSN format');
  }
}
