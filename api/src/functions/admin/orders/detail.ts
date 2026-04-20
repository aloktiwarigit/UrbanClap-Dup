import { app } from '@azure/functions';
import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { requireAdmin } from '../../../middleware/requireAdmin.js';
import type { AdminContext } from '../../../types/admin.js';
import { getOrderById } from '../../../cosmos/orders-repository.js';

export async function adminGetOrderHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
  _admin: AdminContext,
): Promise<HttpResponseInit> {
  const id = (req.params as Record<string, string>)['id'];
  if (!id) {
    return { status: 400, jsonBody: { code: 'MISSING_ID' } };
  }

  const order = await getOrderById(id);
  if (!order) {
    return { status: 404, jsonBody: { code: 'ORDER_NOT_FOUND' } };
  }

  return { status: 200, jsonBody: order };
}

app.http('adminGetOrder', {
  methods: ['GET'],
  route: 'v1/admin/orders/{id}',
  authLevel: 'anonymous',
  handler: requireAdmin(['super-admin', 'ops-manager'])(adminGetOrderHandler),
});
