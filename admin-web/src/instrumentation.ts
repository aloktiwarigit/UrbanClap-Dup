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
      const { HttpInstrumentation } = await import('@opentelemetry/instrumentation-http');
      const { sanitizeUrl } = await import('./lib/otelSanitizeUrl');

      const sdk = new NodeSDK({
        resource: new Resource({
          'service.name': 'homeservices-admin-web',
          'service.version': process.env['GIT_SHA'] ?? 'local',
        }),
        instrumentations: [
          new HttpInstrumentation({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            requestHook: (span: any, request: any) => {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              const rawUrl: string = (request.url as string | undefined) ?? (request.path as string | undefined) ?? '';
              const sanitized = sanitizeUrl(rawUrl);
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              const method: string = (request.method as string | undefined) ?? 'HTTP';
              // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
              span.updateName(`HTTP ${method} ${sanitized.path}`);
              // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
              span.setAttribute('http.url', sanitized.full);
              // Use sanitized.path for http.target so ID segments are already replaced.
              // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
              if (sanitized.path) span.setAttribute('http.target', sanitized.path);
            },
          }),
        ],
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
