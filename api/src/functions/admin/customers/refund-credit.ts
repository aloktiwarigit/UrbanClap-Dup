import { app } from '@azure/functions';
import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as Sentry from '@sentry/node';
import { requireAdmin } from '../../../middleware/requireAdmin.js';
import type { AdminContext } from '../../../types/admin.js';
import { RefundCreditBodySchema } from '../../../schemas/admin-customer.js';
import { getCosmosClient, DB_NAME } from '../../../cosmos/client.js';

export async function adminRefundCreditHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
  admin: AdminContext,
): Promise<HttpResponseInit> {
  const customerId = req.params['id'];
  if (!customerId) return { status: 400, jsonBody: { code: 'MISSING_ID' } };

  let body: unknown;
  try { body = await req.json(); } catch { return { status: 400, jsonBody: { code: 'INVALID_JSON' } }; }

  const parsed = RefundCreditBodySchema.safeParse(body);
  if (!parsed.success) return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', issues: parsed.error.issues } };

  const doc = {
    id: `${customerId}-${Date.now()}`,
    customerId,
    amountRupees: parsed.data.amountRupees,
    reason: parsed.data.reason,
    issuedBy: admin.adminId,
    issuedAt: new Date().toISOString(),
  };

  // NOTE: container name is `customer_credits` (underscore) per
  // api/src/cosmos/client.ts:88 and customer-credit-ledger-repository.ts. The
  // previous hyphenated value was a typo — Cosmos returned "Resource not found"
  // on every refund-credit request because no `customer-credits` container
  // exists in prod.
  const container = getCosmosClient().database(DB_NAME).container('customer_credits');
  await container.items.create(doc);

  Sentry.captureMessage('Admin refund credit issued', {
    level: 'info',
    extra: { customerId, amountRupees: parsed.data.amountRupees, issuedBy: admin.adminId },
  });

  return { status: 204 };
}

app.http('adminRefundCredit', {
  methods: ['POST'],
  route: 'v1/admin/customers/{id}/refund-credit',
  authLevel: 'anonymous',
  handler: requireAdmin(['super-admin', 'ops-manager'])(adminRefundCreditHandler),
});
