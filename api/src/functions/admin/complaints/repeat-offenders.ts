import { app } from '@azure/functions';
import type { InvocationContext } from '@azure/functions';
import type { HttpRequest, HttpResponseInit } from '@azure/functions';
import { requireAdmin } from '../../../middleware/requireAdmin.js';
import type { AdminContext } from '../../../types/admin.js';
import { getRepeatOffenders } from '../../../cosmos/complaints-repository.js';

export async function adminRepeatOffendersHandler(
  _req: HttpRequest,
  _ctx: InvocationContext,
  _admin: AdminContext,
): Promise<HttpResponseInit> {
  const sinceDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sinceIso = sinceDate.toISOString();

  let offenders: Awaited<ReturnType<typeof getRepeatOffenders>>;
  try {
    offenders = await getRepeatOffenders(sinceIso);
  } catch (err: unknown) {
    if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: number }).code === 404) {
      return { status: 200, jsonBody: { offenders: [] } };
    }
    throw err;
  }
  return { status: 200, jsonBody: { offenders } };
}

app.http('adminRepeatOffenders', {
  methods: ['GET'],
  route: 'v1/admin/complaints/repeat-offenders',
  authLevel: 'anonymous',
  handler: requireAdmin(['super-admin', 'ops-manager'])(adminRepeatOffendersHandler),
});
