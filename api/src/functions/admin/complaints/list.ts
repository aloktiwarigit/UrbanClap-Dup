import { app } from '@azure/functions';
import type { InvocationContext } from '@azure/functions';
import type { HttpRequest, HttpResponseInit } from '@azure/functions';
import { requireAdmin } from '../../../middleware/requireAdmin.js';
import type { AdminContext } from '../../../types/admin.js';
import { ComplaintListQuerySchema } from '../../../schemas/complaint.js';
import { queryComplaints } from '../../../cosmos/complaints-repository.js';

export async function adminListComplaintsHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
  _admin: AdminContext,
): Promise<HttpResponseInit> {
  const raw: Record<string, string> = {};
  const paramKeys = [
    'status', 'assigneeAdminId', 'dateFrom', 'dateTo', 'resolvedSince', 'sortDir', 'page', 'pageSize',
  ];
  for (const key of paramKeys) {
    const val = req.query.get(key);
    if (val !== null) raw[key] = val;
  }

  const parsed = ComplaintListQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', issues: parsed.error.issues } };
  }

  try {
    const result = await queryComplaints(parsed.data);
    return { status: 200, jsonBody: result };
  } catch (err: unknown) {
    // Cosmos 404 means the complaints container hasn't been provisioned yet.
    // Return an empty board rather than crashing the page on fresh deployments.
    if (typeof err === 'object' && err !== null && 'statusCode' in err &&
        (err as { statusCode: number }).statusCode === 404) {
      return { status: 200, jsonBody: { items: [], total: 0 } };
    }
    throw err;
  }
}

app.http('adminListComplaints', {
  methods: ['GET'],
  route: 'v1/admin/complaints',
  authLevel: 'anonymous',
  handler: requireAdmin(['super-admin', 'ops-manager'])(adminListComplaintsHandler),
});
