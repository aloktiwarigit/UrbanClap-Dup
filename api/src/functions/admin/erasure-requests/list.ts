import '../../../bootstrap.js';
import { app } from '@azure/functions';
import type { HttpRequest, InvocationContext, HttpResponseInit } from '@azure/functions';
import { requireAdmin } from '../../../middleware/requireAdmin.js';
import type { AdminContext } from '../../../types/admin.js';
import { listErasureRequests } from '../../../cosmos/erasure-request-repository.js';
import { ErasureRequestStatusEnum } from '../../../schemas/erasure-request.js';

export async function adminListErasureRequestsHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
  _admin: AdminContext,
): Promise<HttpResponseInit> {
  const statusParam = req.query.get('status');
  const pageSizeParam = req.query.get('pageSize');
  const filter: { status?: ReturnType<typeof ErasureRequestStatusEnum.parse>; pageSize?: number } = {};
  if (statusParam !== null) {
    const parsed = ErasureRequestStatusEnum.safeParse(statusParam);
    if (!parsed.success) {
      return { status: 400, jsonBody: { code: 'INVALID_STATUS' } };
    }
    filter.status = parsed.data;
  }
  if (pageSizeParam !== null) {
    const n = Number(pageSizeParam);
    if (!Number.isInteger(n) || n < 1 || n > 200) {
      return { status: 400, jsonBody: { code: 'INVALID_PAGE_SIZE' } };
    }
    filter.pageSize = n;
  }
  const items = await listErasureRequests(filter);
  return {
    status: 200,
    jsonBody: { items },
  };
}

app.http('adminErasureRequestList', {
  methods: ['GET'],
  route: 'v1/admin/erasure-requests',
  authLevel: 'anonymous',
  handler: requireAdmin(['super-admin', 'ops-manager'])(adminListErasureRequestsHandler),
});
