import { initSentry } from './observability/sentry.js';
import { initOtel } from './observability/otel.js';
// PostHog self-inits on import — import to start flush interval
import './observability/posthog.js';

initSentry();
initOtel();
