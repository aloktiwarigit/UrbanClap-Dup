// TODO(E01-Sxx observability): wire OpenTelemetry once exporter is chosen — see api/ bootstrap.ts.
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
  });
}
