/**
 * Next.js instrumentation hook — loaded once per runtime context (nodejs, edge).
 *
 * Wires:
 * - Sentry (server + edge configs)
 * - OpenTelemetry → Azure Monitor Application Insights (nodejs runtime only,
 *   E13-S04 ADR-0018). No-ops when APPLICATIONINSIGHTS_CONNECTION_STRING is absent.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');

    // Wire OTel → AppInsights (server-side only; edge runtime is too constrained).
    const connectionString = process.env['APPLICATIONINSIGHTS_CONNECTION_STRING'];
    if (connectionString) {
      const { NodeSDK } = await import('@opentelemetry/sdk-node');
      const { AzureMonitorTraceExporter } = await import(
        '@azure/monitor-opentelemetry-exporter'
      );
      const { Resource } = await import('@opentelemetry/resources');

      const sdk = new NodeSDK({
        resource: new Resource({
          'service.name': 'homeservices-admin-web',
          'service.version': process.env['GIT_SHA'] ?? 'local',
        }),
        // @azure/monitor-opentelemetry-exporter is still in beta and ships an older
        // @opentelemetry/sdk-trace-base peer than @opentelemetry/sdk-node expects,
        // causing a ReadableSpan struct mismatch at the TypeScript level only.
        // The types are structurally compatible at runtime.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
        traceExporter: new AzureMonitorTraceExporter({ connectionString }) as unknown as any,
      });
      sdk.start();
    }
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}
