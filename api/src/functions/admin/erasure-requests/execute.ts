import type { HttpRequest, InvocationContext, HttpResponseInit } from '@azure/functions';
import * as Sentry from '@sentry/node';
import type { AdminContext } from '../../../types/admin.js';
import { AdminErasureExecuteBodySchema } from '../../../schemas/erasure-request.js';
import {
  getErasureRequestById,
  replaceErasureRequest,
} from '../../../cosmos/erasure-request-repository.js';
import {
  executeErasureCascade,
  computeAnonymizedHash,
} from '../../../services/erasureCascade.service.js';
import { auditLog } from '../../../services/auditLog.service.js';
import type { ErasureRequestDoc } from '../../../schemas/erasure-request.js';

async function readPreparsedBody(req: HttpRequest, preparsed?: unknown): Promise<unknown> {
  if (preparsed !== undefined) return preparsed;
  try {
    return await req.json();
  } catch {
    return null;
  }
}

export async function executeErasureRequestHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
  admin: AdminContext,
  preparsedBody?: unknown,
): Promise<HttpResponseInit> {
  const id = req.params['id'];
  if (!id) return { status: 400, jsonBody: { code: 'MISSING_ID' } };

  const body = await readPreparsedBody(req, preparsedBody);
  const parsed = AdminErasureExecuteBodySchema.safeParse(body);
  if (!parsed.success) {
    return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', issues: parsed.error.issues } };
  }

  const fetched = await getErasureRequestById(id);
  if (!fetched) return { status: 404, jsonBody: { code: 'ERASURE_REQUEST_NOT_FOUND' } };

  const { doc, etag } = fetched;

  if (doc.status !== 'PENDING') {
    return { status: 409, jsonBody: { code: 'NOT_PENDING', currentStatus: doc.status } };
  }

  // DPDP cool-off: cannot fast-track before scheduledDeletionAt.
  if (Date.parse(doc.scheduledDeletionAt) > Date.now()) {
    return {
      status: 409,
      jsonBody: {
        code: 'COOL_OFF_NOT_ELAPSED',
        scheduledDeletionAt: doc.scheduledDeletionAt,
      },
    };
  }

  const anonymizedHash = computeAnonymizedHash(doc.userId, doc.anonymizationSalt);

  // Step 1: transition to EXECUTING with anonymizedHash persisted (idempotency anchor).
  const executing: ErasureRequestDoc = {
    ...doc,
    status: 'EXECUTING',
    anonymizedHash,
  };
  await replaceErasureRequest(executing, etag);

  // Step 2: run the cascade.
  let counts;
  try {
    counts = await executeErasureCascade({
      userId: doc.userId,
      userRole: doc.userRole,
      anonymizationSalt: doc.anonymizationSalt,
    });
  } catch (err) {
    Sentry.captureException(err);
    const failureReason = err instanceof Error ? err.message : String(err);
    const failed: ErasureRequestDoc = {
      ...executing,
      status: 'FAILED',
      failedAt: new Date().toISOString(),
      failureReason,
    };
    await replaceErasureRequest(failed);
    await auditLog(
      { adminId: admin.adminId, role: admin.role, sessionId: admin.sessionId },
      'ERASURE_FAILED',
      'user',
      anonymizedHash,
      { erasureId: id, failureReason, userRole: doc.userRole, source: 'admin-execute' },
    );
    return {
      status: 500,
      jsonBody: { code: 'CASCADE_FAILED', message: failureReason },
    };
  }

  // Step 3: mark EXECUTED, wipe userId + anonymizationSalt so the natural-
  // person uid cannot be re-derived from the surviving doc. anonymizedHash
  // remains for ops cross-reference.
  const finalDoc: ErasureRequestDoc = {
    ...executing,
    userId: anonymizedHash,
    anonymizationSalt: '',
    userIdWiped: true,
    status: 'EXECUTED',
    executedAt: new Date().toISOString(),
    deletedCounts: counts,
  };
  await replaceErasureRequest(finalDoc);

  await auditLog(
    { adminId: admin.adminId, role: admin.role, sessionId: admin.sessionId },
    'ERASURE_EXECUTED',
    'user',
    anonymizedHash,
    {
      erasureId: id,
      deletedCounts: counts,
      userRole: doc.userRole,
    },
  );

  return {
    status: 200,
    jsonBody: {
      erasureId: id,
      status: 'EXECUTED' as const,
      deletedCounts: counts,
      executedAt: finalDoc.executedAt,
    },
  };
}
