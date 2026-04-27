import '../bootstrap.js';
import { app } from '@azure/functions';
import type { HttpRequest, InvocationContext, HttpResponseInit } from '@azure/functions';
import { randomBytes, randomUUID } from 'node:crypto';
import { verifyFirebaseIdToken } from '../services/firebaseAdmin.js';
import { auditLog } from '../services/auditLog.service.js';
import {
  createErasureRequest,
  getPendingErasureRequestForUser,
  replaceErasureRequest,
} from '../cosmos/erasure-request-repository.js';
import {
  ErasureRequestSubmitBodySchema,
  ERASURE_GRACE_PERIOD_MS,
} from '../schemas/erasure-request.js';
import type { ErasureRequestDoc } from '../schemas/erasure-request.js';

async function authenticate(req: HttpRequest): Promise<{ uid: string } | { errorStatus: number; code: string }> {
  const auth = req.headers.get('authorization') ?? '';
  if (!auth.startsWith('Bearer ')) {
    return { errorStatus: 401, code: 'UNAUTHENTICATED' };
  }
  try {
    const decoded = await verifyFirebaseIdToken(auth.slice(7));
    return { uid: decoded.uid };
  } catch {
    return { errorStatus: 401, code: 'TOKEN_INVALID' };
  }
}

function inferRole(req: HttpRequest): 'CUSTOMER' | 'TECHNICIAN' {
  const v = (req.headers.get('x-user-role') ?? 'customer').toLowerCase();
  return v === 'technician' ? 'TECHNICIAN' : 'CUSTOMER';
}

export async function submitErasureRequestHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
): Promise<HttpResponseInit> {
  const auth = await authenticate(req);
  if ('errorStatus' in auth) {
    return { status: auth.errorStatus, jsonBody: { code: auth.code } };
  }
  const { uid } = auth;
  const role = inferRole(req);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const parsed = ErasureRequestSubmitBodySchema.safeParse(body);
  if (!parsed.success) {
    return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', issues: parsed.error.issues } };
  }

  const existing = await getPendingErasureRequestForUser(uid);
  if (existing) {
    return {
      status: 409,
      jsonBody: { code: 'ERASURE_REQUEST_PENDING', erasureId: existing.id },
    };
  }

  const requestedAt = new Date();
  const scheduledDeletionAt = new Date(requestedAt.getTime() + ERASURE_GRACE_PERIOD_MS);
  const id = randomUUID();
  const salt = randomBytes(16).toString('hex'); // 32 chars; well above the 16-char min

  const doc: ErasureRequestDoc = {
    id,
    partitionKey: id,
    userId: uid,
    userRole: role,
    status: 'PENDING',
    requestedAt: requestedAt.toISOString(),
    scheduledDeletionAt: scheduledDeletionAt.toISOString(),
    anonymizationSalt: salt,
    ...(parsed.data.reason !== undefined && { reason: parsed.data.reason }),
  };
  await createErasureRequest(doc);

  await auditLog(
    { adminId: uid, role: 'system' },
    'ERASURE_REQUESTED',
    'user',
    uid,
    {
      erasureId: id,
      userRole: role,
      reason: parsed.data.reason ?? null,
      scheduledDeletionAt: doc.scheduledDeletionAt,
    },
  );

  return {
    status: 201,
    jsonBody: {
      erasureId: id,
      scheduledDeletionAt: doc.scheduledDeletionAt,
      status: 'PENDING',
    },
  };
}

export async function revokeErasureRequestHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
): Promise<HttpResponseInit> {
  const auth = await authenticate(req);
  if ('errorStatus' in auth) {
    return { status: auth.errorStatus, jsonBody: { code: auth.code } };
  }
  const { uid } = auth;

  const existing = await getPendingErasureRequestForUser(uid);
  if (!existing) {
    return { status: 404, jsonBody: { code: 'NO_PENDING_ERASURE_REQUEST' } };
  }

  const updated: ErasureRequestDoc = {
    ...existing,
    status: 'REVOKED',
    revokedAt: new Date().toISOString(),
  };
  await replaceErasureRequest(updated);

  await auditLog(
    { adminId: uid, role: 'system' },
    'ERASURE_REVOKED',
    'user',
    uid,
    { erasureId: existing.id },
  );

  return { status: 204 };
}

app.http('usersErasureRequestSubmit', {
  methods: ['POST'],
  route: 'v1/users/me/erasure-request',
  authLevel: 'anonymous',
  handler: submitErasureRequestHandler,
});

app.http('usersErasureRequestRevoke', {
  methods: ['DELETE'],
  route: 'v1/users/me/erasure-request',
  authLevel: 'anonymous',
  handler: revokeErasureRequestHandler,
});
