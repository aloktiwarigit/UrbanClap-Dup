import '../../../bootstrap.js';
import { app } from '@azure/functions';
import type { HttpRequest, InvocationContext, HttpResponseInit } from '@azure/functions';
import { requireAdmin } from '../../../middleware/requireAdmin.js';
import type { AdminContext } from '../../../types/admin.js';
import { listAdminUsers } from '../../../services/adminUser.service.js';

export async function adminListUsersHandler(
  _req: HttpRequest,
  _ctx: InvocationContext,
  admin: AdminContext,
): Promise<HttpResponseInit> {
  if (admin.role !== 'super-admin') {
    return { status: 403, jsonBody: { code: 'FORBIDDEN', requiredRoles: ['super-admin'] } };
  }

  const users = await listAdminUsers();
  return { status: 200, jsonBody: { users } };
}

app.http('adminListUsers', {
  methods: ['GET'],
  route: 'v1/admin/users',
  authLevel: 'anonymous',
  handler: requireAdmin(['super-admin'])(adminListUsersHandler),
});
