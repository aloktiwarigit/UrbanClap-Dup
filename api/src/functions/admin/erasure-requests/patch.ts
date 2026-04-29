import '../../../bootstrap.js';
import { app } from '@azure/functions';
import type { HttpRequest, InvocationContext, HttpResponseInit } from '@azure/functions';
import { requireAdmin } from '../../../middleware/requireAdmin.js';
import type { AdminContext } from '../../../types/admin.js';
import { executeErasureRequestHandler } from './execute.js';
import { denyErasureRequestHandler } from './deny.js';

/**
 * Single PATCH dispatcher: parses body once (Azure Functions HttpRequest body
 * is single-consume), then routes to the action-specific handler with the
 * pre-parsed body.
 */
async function adminErasureRequestPatchHandler(
  req: HttpRequest,
  ctx: InvocationContext,
  admin: AdminContext,
): Promise<HttpResponseInit> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { status: 400, jsonBody: { code: 'INVALID_JSON' } };
  }
  const action = (body as { action?: unknown } | null)?.action;
  if (action === 'EXECUTE') {
    return executeErasureRequestHandler(req, ctx, admin, body);
  }
  if (action === 'DENY') {
    return denyErasureRequestHandler(req, ctx, admin, body);
  }
  return { status: 400, jsonBody: { code: 'INVALID_ACTION', allowedActions: ['EXECUTE', 'DENY'] } };
}

app.http('adminErasureRequestPatch', {
  methods: ['PATCH'],
  route: 'v1/admin/erasure-requests/{id}',
  authLevel: 'anonymous',
  handler: requireAdmin(['super-admin'])(adminErasureRequestPatchHandler),
});
