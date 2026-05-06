import { app } from '@azure/functions';
import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { requireAdmin } from '../../../middleware/requireAdmin.js';
import type { AdminContext } from '../../../types/admin.js';
import { patchCustomerMetadata } from '../../../cosmos/customer-metadata-repository.js';
import { PatchCustomerBodySchema } from '../../../schemas/admin-customer.js';

export async function adminPatchCustomerHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
  _admin: AdminContext,
): Promise<HttpResponseInit> {
  const id = req.params['id'];
  if (!id) return { status: 400, jsonBody: { code: 'MISSING_ID' } };

  let body: unknown;
  try { body = await req.json(); } catch { return { status: 400, jsonBody: { code: 'INVALID_JSON' } }; }

  const parsed = PatchCustomerBodySchema.safeParse(body);
  if (!parsed.success) return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', issues: parsed.error.issues } };

  await patchCustomerMetadata(id, { flagged: parsed.data.accountStatus === 'FLAGGED' });
  return { status: 204 };
}

app.http('adminPatchCustomer', {
  methods: ['PATCH'],
  route: 'v1/admin/customers/{id}',
  authLevel: 'anonymous',
  handler: requireAdmin(['super-admin', 'ops-manager'])(adminPatchCustomerHandler),
});
