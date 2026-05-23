/**
 * OpenTelemetry initialisation — api/ (E13-S04, ADR-0018).
 *
 * Exports to Azure Monitor Application Insights via the
 * @azure/monitor-opentelemetry-exporter when
 * APPLICATIONINSIGHTS_CONNECTION_STRING is set.
 *
 * No-ops cleanly in local dev where the env var is absent.
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { AzureMonitorTraceExporter } from '@azure/monitor-opentelemetry-exporter';
import { Resource } from '@opentelemetry/resources';

let sdk: NodeSDK | undefined;

export function initOtel(): void {
  const connectionString = process.env['APPLICATIONINSIGHTS_CONNECTION_STRING'];
  if (!connectionString) return; // no-op in local dev without the env var

  const exporter = new AzureMonitorTraceExporter({ connectionString });

  sdk = new NodeSDK({
    resource: new Resource({
      'service.name': 'homeservices-api',
      'service.version': process.env['GIT_SHA'] ?? 'local',
    }),
    // @azure/monitor-opentelemetry-exporter is still in beta and ships an older
    // @opentelemetry/sdk-trace-base peer than @opentelemetry/sdk-node expects,
    // causing a ReadableSpan struct mismatch at the TypeScript level only.
    // The types are structurally compatible at runtime. Cast through unknown to
    // satisfy the compiler without masking real type errors elsewhere.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
    traceExporter: exporter as unknown as any,
  });

  sdk.start();
}

/** Graceful shutdown — call on process exit to flush spans. */
export async function shutdownOtel(): Promise<void> {
  if (sdk) {
    await sdk.shutdown();
  }
}
