// TODO(E01-Sxx observability): wire OpenTelemetry once exporter is chosen.
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
if (dsn) {
  try {
    Sentry.init({ dsn, tracesSampleRate: 0.1 });
  } catch (err) {
    // Malformed DSN must not crash client bootstrap (instrumentation-client.ts top-level import).
    console.warn('[sentry.client] init failed', err);
  }
}
