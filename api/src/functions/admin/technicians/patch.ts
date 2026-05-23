import { app } from '@azure/functions';
import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { z } from 'zod';
import { requireAdmin } from '../../../middleware/requireAdmin.js';
import type { AdminContext } from '../../../types/admin.js';
import { patchTechnicianAdminFields } from '../../../cosmos/technician-repository.js';

const PatchTechnicianBodySchema = z.object({
  status: z.enum(['ON_DUTY', 'OFF_DUTY', 'SUSPENDED']).optional(),
  commissionPct: z.number().int().min(0).max(100).optional(),
  serviceCategories: z.array(z.string()).optional(),
});

export async function adminPatchTechnicianHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
  admin: AdminContext,
): Promise<HttpResponseInit> {
  const id = req.params['id'];
  if (!id) return { status: 400, jsonBody: { code: 'MISSING_ID' } };

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { status: 400, jsonBody: { code: 'INVALID_JSON' } };
  }

  const parsed = PatchTechnicianBodySchema.safeParse(body);
  if (!parsed.success) {
    return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', issues: parsed.error.issues } };
  }

  // Commission edit is super-admin only
  if (parsed.data.commissionPct !== undefined && admin.role !== 'super-admin') {
    return { status: 403, jsonBody: { code: 'FORBIDDEN', reason: 'commission edit requires super-admin' } };
  }

  const patch: Parameters<typeof patchTechnicianAdminFields>[1] = {};
  if (parsed.data.status === 'ON_DUTY')   { patch.isOnline = true;  patch.suspended = false; }
  if (parsed.data.status === 'OFF_DUTY')  { patch.isOnline = false; patch.suspended = false; }
  if (parsed.data.status === 'SUSPENDED') { patch.suspended = true;  patch.isOnline = false; }
  if (parsed.data.commissionPct !== undefined) patch.commissionPct = parsed.data.commissionPct;
  if (parsed.data.serviceCategories !== undefined) patch.skills = parsed.data.serviceCategories;

  await patchTechnicianAdminFields(id, patch);
  return { status: 204 };
}

app.http('adminPatchTechnician', {
  methods: ['PATCH'],
  route: 'v1/admin/technicians/{id}',
  authLevel: 'anonymous',
  handler: requireAdmin(['super-admin', 'ops-manager'])(adminPatchTechnicianHandler),
});
