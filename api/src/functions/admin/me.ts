import '../../bootstrap.js';
import { app } from '@azure/functions';
import type { HttpRequest, InvocationContext, HttpResponseInit } from '@azure/functions';
import { requireAdmin } from '../../middleware/requireAdmin.js';
import { getAdminUserById } from '../../services/adminUser.service.js';
import type { AdminContext } from '../../types/admin.js';

export async function adminMeHandler(
  _req: HttpRequest,
  _ctx: InvocationContext,
  admin: AdminContext,
): Promise<HttpResponseInit> {
  const user = await getAdminUserById(admin.adminId);
  if (!user) return { status: 404, jsonBody: { code: 'ADMIN_NOT_FOUND' } };
  return {
    status: 200,
    jsonBody: { adminId: user.adminId, email: user.email, role: user.role },
  };
}

app.http('adminMe', {
  methods: ['GET'],
  route: 'v1/admin/me',
  authLevel: 'anonymous',
  handler: requireAdmin(['super-admin', 'ops-manager', 'finance', 'support-agent'])(adminMeHandler),
});
