// TODO(E01-Sxx observability): wire OpenTelemetry once exporter is chosen — see api/ bootstrap.ts.
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN?.trim();
if (dsn) {
  try {
    Sentry.init({ dsn, tracesSampleRate: 0.1 });
  } catch (err) {
    // Malformed DSN must not crash module load — bootstrap proceeds without Sentry.
    console.warn('[sentry.server] init failed', err);
  }
}
