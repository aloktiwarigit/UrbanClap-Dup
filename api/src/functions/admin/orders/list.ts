import { app } from '@azure/functions';
import type { InvocationContext } from '@azure/functions';
import type { HttpRequest, HttpResponseInit } from '@azure/functions';
import { requireAdmin } from '../../../middleware/requireAdmin.js';
import type { AdminContext } from '../../../types/admin.js';
import { OrderListQuerySchema } from '../../../schemas/order.js';
import { queryOrders } from '../../../cosmos/orders-repository.js';

export async function adminListOrdersHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
  _admin: AdminContext,
): Promise<HttpResponseInit> {
  // Collect query params into plain object for Zod parsing
  const raw: Record<string, string> = {};
  const paramKeys = [
    'status', 'city', 'categoryId', 'technicianId', 'customerPhone',
    'dateFrom', 'dateTo', 'minAmount', 'maxAmount', 'page', 'pageSize',
  ];
  for (const key of paramKeys) {
    const val = req.query.get(key);
    if (val !== null) raw[key] = val;
  }

  const parsed = OrderListQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', issues: parsed.error.issues } };
  }

  const result = await queryOrders(parsed.data);
  return { status: 200, jsonBody: result };
}

app.http('adminListOrders', {
  methods: ['GET'],
  route: 'v1/admin/orders',
  authLevel: 'anonymous',
  handler: requireAdmin(['super-admin', 'ops-manager'])(adminListOrdersHandler),
});
