import {
  app,
  type HttpRequest,
  type HttpResponseInit,
  type InvocationContext,
} from '@azure/functions';
import '../bootstrap.js';
import { HealthResponseSchema } from '../schemas/health.js';
import { getVersionInfo } from '../shared/version.js';

export async function healthHandler(
  _req: HttpRequest,
  _ctx: InvocationContext,
): Promise<HttpResponseInit> {
  const { version, commit } = getVersionInfo();
  const body = HealthResponseSchema.parse({
    status: 'ok',
    version,
    commit,
    timestamp: new Date().toISOString(),
    uptimeSeconds: process.uptime(),
  });
  return {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    jsonBody: body,
  };
}

app.http('health', {
  methods: ['GET'],
  route: 'v1/health',
  authLevel: 'anonymous',
  handler: healthHandler,
});
