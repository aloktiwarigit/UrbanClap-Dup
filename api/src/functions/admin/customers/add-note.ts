import { app } from '@azure/functions';
import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { requireAdmin } from '../../../middleware/requireAdmin.js';
import type { AdminContext } from '../../../types/admin.js';
import { addCustomerNote } from '../../../cosmos/customer-metadata-repository.js';
import { AddCustomerNoteBodySchema } from '../../../schemas/admin-customer.js';

export async function adminAddCustomerNoteHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
  admin: AdminContext,
): Promise<HttpResponseInit> {
  const id = req.params['id'];
  if (!id) return { status: 400, jsonBody: { code: 'MISSING_ID' } };

  let body: unknown;
  try { body = await req.json(); } catch { return { status: 400, jsonBody: { code: 'INVALID_JSON' } }; }

  const parsed = AddCustomerNoteBodySchema.safeParse(body);
  if (!parsed.success) return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', issues: parsed.error.issues } };

  await addCustomerNote(id, {
    text: parsed.data.text,
    createdAt: new Date().toISOString(),
    authorName: admin.adminId,
  });
  return { status: 204 };
}

app.http('adminAddCustomerNote', {
  methods: ['POST'],
  route: 'v1/admin/customers/{id}/notes',
  authLevel: 'anonymous',
  handler: requireAdmin(['super-admin', 'ops-manager'])(adminAddCustomerNoteHandler),
});
