import type { HttpRequest, InvocationContext, HttpResponseInit } from '@azure/functions';
import type { AdminContext } from '../../../types/admin.js';
import { AdminErasureDenyBodySchema } from '../../../schemas/erasure-request.js';
import {
  getErasureRequestById,
  replaceErasureRequest,
} from '../../../cosmos/erasure-request-repository.js';
import { auditLog } from '../../../services/auditLog.service.js';
import { sendErasureDenied } from '../../../services/fcm.service.js';
import type { ErasureRequestDoc } from '../../../schemas/erasure-request.js';

async function readPreparsedBody(req: HttpRequest, preparsed?: unknown): Promise<unknown> {
  if (preparsed !== undefined) return preparsed;
  try {
    return await req.json();
  } catch {
    return null;
  }
}

export async function denyErasureRequestHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
  admin: AdminContext,
  preparsedBody?: unknown,
): Promise<HttpResponseInit> {
  const id = req.params['id'];
  if (!id) return { status: 400, jsonBody: { code: 'MISSING_ID' } };

  const body = await readPreparsedBody(req, preparsedBody);
  const parsed = AdminErasureDenyBodySchema.safeParse(body);
  if (!parsed.success) {
    return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', issues: parsed.error.issues } };
  }

  const fetched = await getErasureRequestById(id);
  if (!fetched) return { status: 404, jsonBody: { code: 'ERASURE_REQUEST_NOT_FOUND' } };

  const { doc, etag } = fetched;
  if (doc.status !== 'PENDING') {
    return { status: 409, jsonBody: { code: 'NOT_PENDING', currentStatus: doc.status } };
  }

  const denied: ErasureRequestDoc = {
    ...doc,
    status: 'DENIED',
    denialReason: parsed.data.reason,
    deniedAt: new Date().toISOString(),
  };
  await replaceErasureRequest(denied, etag);

  await auditLog(
    { adminId: admin.adminId, role: admin.role, sessionId: admin.sessionId },
    'ERASURE_DENIED',
    'user',
    doc.userId,
    {
      erasureId: id,
      reason: parsed.data.reason,
      userRole: doc.userRole,
    },
  );

  // Best-effort FCM notification — DPDP §12(2) requires informing the data principal.
  try {
    await sendErasureDenied({
      userId: doc.userId,
      userRole: doc.userRole,
      erasureId: id,
      reason: parsed.data.reason,
    });
  } catch {
    // Silent — audit log entry is the authoritative record.
  }

  return {
    status: 200,
    jsonBody: {
      erasureId: id,
      status: 'DENIED' as const,
      denialReason: parsed.data.reason,
      deniedAt: denied.deniedAt,
    },
  };
}
