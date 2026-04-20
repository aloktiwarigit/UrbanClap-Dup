import { app } from '@azure/functions';
import type { InvocationContext } from '@azure/functions';
import type { HttpRequest, HttpResponseInit } from '@azure/functions';
import { requireAdmin } from '../../../middleware/requireAdmin.js';
import type { AdminContext } from '../../../types/admin.js';
import { CreateComplaintBodySchema } from '../../../schemas/complaint.js';
import type { ComplaintDoc } from '../../../schemas/complaint.js';
import { createComplaint } from '../../../cosmos/complaints-repository.js';
import { appendAuditEntry } from '../../../cosmos/audit-log-repository.js';
import { randomUUID } from 'crypto';

export async function adminCreateComplaintHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
  admin: AdminContext,
): Promise<HttpResponseInit> {
  const body: unknown = await req.json();
  const parsed = CreateComplaintBodySchema.safeParse(body);
  if (!parsed.success) {
    return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', issues: parsed.error.issues } };
  }

  const now = new Date();
  const slaDeadlineAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  const doc: ComplaintDoc = {
    id: randomUUID(),
    orderId: parsed.data.orderId,
    customerId: parsed.data.customerId,
    technicianId: parsed.data.technicianId,
    description: parsed.data.description,
    status: 'NEW',
    internalNotes: [],
    slaDeadlineAt: slaDeadlineAt.toISOString(),
    escalated: false,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  await createComplaint(doc);

  await appendAuditEntry({
    id: randomUUID(),
    adminId: admin.adminId,
    role: admin.role,
    action: 'COMPLAINT_CREATED',
    resourceType: 'complaint',
    resourceId: doc.id,
    payload: { orderId: doc.orderId, customerId: doc.customerId },
    ip: req.headers.get('x-forwarded-for') ?? '',
    userAgent: '',
    timestamp: now.toISOString(),
    partitionKey: now.toISOString().slice(0, 7),
  });

  return { status: 201, jsonBody: doc };
}

app.http('adminCreateComplaint', {
  methods: ['POST'],
  route: 'v1/admin/complaints',
  authLevel: 'anonymous',
  handler: requireAdmin(['super-admin', 'ops-manager'])(adminCreateComplaintHandler),
});
