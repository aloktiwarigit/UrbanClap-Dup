import '../../../bootstrap.js';
import { app } from '@azure/functions';
import type { HttpRequest, InvocationContext, HttpResponseInit } from '@azure/functions';
import { z } from 'zod';
import { requireAdmin } from '../../../middleware/requireAdmin.js';
import type { AdminContext } from '../../../types/admin.js';
import { updateAdminUser, type AdminUser } from '../../../services/adminUser.service.js';
import { deleteAllSessionsForAdmin } from '../../../services/adminSession.service.js';
import { auditLog } from '../../../services/auditLog.service.js';

const PatchAdminUserBodySchema = z.object({
  role: z.enum(['super-admin', 'ops-manager', 'finance', 'support-agent']).optional(),
  displayName: z.string().min(1).max(100).optional(),
  // exactOptionalPropertyTypes: true — null must be explicit, not undefined
  deactivatedAt: z.string().datetime().nullable().optional(),
}).strict();

export async function adminPatchUserHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
  admin: AdminContext,
): Promise<HttpResponseInit> {
  const adminId = req.params['adminId'] ?? '';
  if (!adminId) return { status: 400, jsonBody: { code: 'MISSING_ADMIN_ID' } };

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { status: 400, jsonBody: { code: 'INVALID_JSON' } };
  }

  const parsed = PatchAdminUserBodySchema.safeParse(body);
  if (!parsed.success) {
    return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', issues: parsed.error.issues } };
  }

  // IDOR guard: non-super-admin callers may only patch their own record
  const isSelf = adminId === admin.adminId;
  if (!isSelf && admin.role !== 'super-admin') {
    return { status: 403, jsonBody: { code: 'INSUFFICIENT_ROLE_FOR_CROSS_USER_PATCH' } };
  }

  // Role ceiling: only super-admin may write the role field
  if (parsed.data.role !== undefined && admin.role !== 'super-admin') {
    return { status: 403, jsonBody: { code: 'INSUFFICIENT_ROLE_FOR_ROLE_CHANGE' } };
  }

  // Deactivation ceiling: only super-admin may set/clear deactivatedAt
  if ('deactivatedAt' in parsed.data && admin.role !== 'super-admin') {
    return { status: 403, jsonBody: { code: 'INSUFFICIENT_ROLE_FOR_DEACTIVATION' } };
  }

  const patch: Partial<Pick<AdminUser, 'role' | 'displayName' | 'deactivatedAt'>> = {};
  if (parsed.data.role !== undefined) patch.role = parsed.data.role;
  if (parsed.data.displayName !== undefined) patch.displayName = parsed.data.displayName;
  // ?? null: deactivatedAt from Zod is string | null | undefined; service expects string | null
  if ('deactivatedAt' in parsed.data) patch.deactivatedAt = parsed.data.deactivatedAt ?? null;

  try {
    await updateAdminUser(adminId, patch);
  } catch (err) {
    if (err instanceof Error && err.message.includes('not found')) {
      return { status: 404, jsonBody: { code: 'ADMIN_USER_NOT_FOUND' } };
    }
    throw err;
  }

  // Role or deactivation change — revoke all existing sessions so the new
  // privilege level (or deactivated state) takes effect immediately.
  const requiresSessionRevocation = 'role' in patch || 'deactivatedAt' in patch;
  if (requiresSessionRevocation) {
    await deleteAllSessionsForAdmin(adminId);
  }

  void auditLog(
    admin,
    'ADMIN_USER_CHANGE',
    'admin_user',
    adminId,
    { targetAdminId: adminId, changed: Object.keys(patch) },
  );

  return { status: 200, jsonBody: { ok: true } };
}

app.http('adminPatchUser', {
  methods: ['PATCH'],
  route: 'v1/admin/users/{adminId}',
  authLevel: 'anonymous',
  handler: requireAdmin(['super-admin', 'ops-manager', 'finance', 'support-agent'])(adminPatchUserHandler),
});
