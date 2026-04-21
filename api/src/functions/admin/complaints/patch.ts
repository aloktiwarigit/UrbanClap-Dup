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
  ctx: InvocationContext,
  admin: AdminContext,
): Promise<HttpResponseInit> {
  const id = req.params['id'];
  if (!id) {
    return { status: 400, jsonBody: { code: 'MISSING_ID' } };
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { status: 400, jsonBody: { code: 'INVALID_JSON' } };
  }
  const parsed = PatchComplaintBodySchema.safeParse(body);
  if (!parsed.success) {
    return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', issues: parsed.error.issues } };
  }

  const result = await getComplaint(id);
  if (!result) {
    return { status: 404, jsonBody: { code: 'COMPLAINT_NOT_FOUND' } };
  }
  const { doc: existing, etag } = result;

  const now = new Date().toISOString();
  const oldStatus = existing.status;

  const updated = { ...existing, updatedAt: now };

  if (parsed.data.status !== undefined) {
    if (parsed.data.status === 'RESOLVED' && !parsed.data.resolutionCategory && !existing.resolutionCategory) {
      return { status: 400, jsonBody: { code: 'RESOLUTION_CATEGORY_REQUIRED' } };
    }
    updated.status = parsed.data.status;
    if (parsed.data.status === 'RESOLVED' && oldStatus !== 'RESOLVED') {
      updated.resolvedAt = now;
    } else if (parsed.data.status !== 'RESOLVED' && oldStatus === 'RESOLVED') {
      // Reopen: clear stale resolution fields so the category guard works correctly next time.
      delete updated.resolvedAt;
      delete updated.resolutionCategory;
    }
  }
  if (parsed.data.assigneeAdminId !== undefined) {
    if (parsed.data.assigneeAdminId === null) {
      delete updated.assigneeAdminId;
    } else {
      updated.assigneeAdminId = parsed.data.assigneeAdminId;
    }
  }
  if (parsed.data.resolutionCategory !== undefined && updated.status === 'RESOLVED') {
    updated.resolutionCategory = parsed.data.resolutionCategory;
  }
  if (parsed.data.note !== undefined) {
    updated.internalNotes = [
      ...(existing.internalNotes ?? []),
      { adminId: admin.adminId, note: parsed.data.note, createdAt: now },
    ];
  }

  try {
    await replaceComplaint(updated, etag);
  } catch (err: unknown) {
    if (typeof err === 'object' && err !== null && 'code' in err && err.code === 412) {
      return { status: 409, jsonBody: { code: 'CONFLICT' } };
    }
    throw err;
  }

  // Fire-and-forget: audit writes must not fail the response after the complaint is committed.
  if (parsed.data.status !== undefined && parsed.data.status !== oldStatus) {
    appendAuditEntry({
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
    }).catch((err: unknown) => ctx.error('audit COMPLAINT_STATUS_CHANGED failed', err));
  }

  if (parsed.data.assigneeAdminId !== undefined && parsed.data.assigneeAdminId !== existing.assigneeAdminId) {
    appendAuditEntry({
      id: randomUUID(),
      adminId: admin.adminId,
      role: admin.role,
      action: 'COMPLAINT_ASSIGNED',
      resourceType: 'complaint',
      resourceId: updated.id,
      payload: { from: existing.assigneeAdminId ?? null, to: parsed.data.assigneeAdminId },
      ip: req.headers.get('x-forwarded-for') ?? '',
      userAgent: '',
      timestamp: now,
      partitionKey: now.slice(0, 7),
    }).catch((err: unknown) => ctx.error('audit COMPLAINT_ASSIGNED failed', err));
  }

  return { status: 200, jsonBody: updated };
}

app.http('adminPatchComplaint', {
  methods: ['PATCH'],
  route: 'v1/admin/complaints/{id}',
  authLevel: 'anonymous',
  handler: requireAdmin(['super-admin', 'ops-manager'])(adminPatchComplaintHandler),
});
