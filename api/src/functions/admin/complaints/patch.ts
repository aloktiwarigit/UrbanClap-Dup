import { app } from '@azure/functions';
import type { InvocationContext } from '@azure/functions';
import type { HttpRequest, HttpResponseInit } from '@azure/functions';
import { requireAdmin } from '../../../middleware/requireAdmin.js';
import type { AdminContext } from '../../../types/admin.js';
import { PatchComplaintBodySchema } from '../../../schemas/complaint.js';
import { getComplaint, replaceComplaint } from '../../../cosmos/complaints-repository.js';
import { appendAuditEntry } from '../../../cosmos/audit-log-repository.js';
import { randomUUID } from 'crypto';

export async function adminPatchComplaintHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
  admin: AdminContext,
): Promise<HttpResponseInit> {
  const id = (req.params as Record<string, string>)['id'];
  if (!id) {
    return { status: 400, jsonBody: { code: 'MISSING_ID' } };
  }

  const body: unknown = await req.json();
  const parsed = PatchComplaintBodySchema.safeParse(body);
  if (!parsed.success) {
    return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', issues: parsed.error.issues } };
  }

  const existing = await getComplaint(id);
  if (!existing) {
    return { status: 404, jsonBody: { code: 'COMPLAINT_NOT_FOUND' } };
  }

  const now = new Date().toISOString();
  const oldStatus = existing.status;

  const updated = { ...existing, updatedAt: now };

  if (parsed.data.status !== undefined) {
    updated.status = parsed.data.status;
  }
  if (parsed.data.assigneeAdminId !== undefined) {
    updated.assigneeAdminId = parsed.data.assigneeAdminId;
  }
  if (parsed.data.resolutionCategory !== undefined) {
    updated.resolutionCategory = parsed.data.resolutionCategory;
  }
  if (parsed.data.note !== undefined) {
    updated.internalNotes = [
      ...(existing.internalNotes ?? []),
      { adminId: admin.adminId, note: parsed.data.note, createdAt: now },
    ];
  }

  await replaceComplaint(updated);

  if (parsed.data.status !== undefined && parsed.data.status !== oldStatus) {
    await appendAuditEntry({
      id: randomUUID(),
      adminId: admin.adminId,
      role: admin.role,
      action: 'COMPLAINT_STATUS_CHANGED',
      resourceType: 'complaint',
      resourceId: id,
      payload: { from: oldStatus, to: parsed.data.status },
      ip: req.headers.get('x-forwarded-for') ?? '',
      userAgent: '',
      timestamp: now,
      partitionKey: now.slice(0, 7),
    });
  }

  return { status: 200, jsonBody: updated };
}

app.http('adminPatchComplaint', {
  methods: ['PATCH'],
  route: 'v1/admin/complaints/{id}',
  authLevel: 'anonymous',
  handler: requireAdmin(['super-admin', 'ops-manager'])(adminPatchComplaintHandler),
});
