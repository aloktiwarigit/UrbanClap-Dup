import { initSentry } from './observability/sentry.js';

initSentry();

// TODO(future-observability-story): wire OpenTelemetry tracing once the
// exporter choice is made (Azure Monitor vs OTLP vs Axiom). Deferred per
// docs/superpowers/specs/2026-04-17-e01-s01-api-skeleton-design.md §2.
