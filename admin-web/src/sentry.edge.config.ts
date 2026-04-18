// TODO(E01-Sxx observability): wire OpenTelemetry once exporter is chosen.
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN?.trim();
if (dsn) {
  try {
    Sentry.init({ dsn, tracesSampleRate: 0.1 });
  } catch (err) {
    console.warn('[sentry.edge] init failed', err);
  }
}
