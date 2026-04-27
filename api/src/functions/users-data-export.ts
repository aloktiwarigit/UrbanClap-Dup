import '../bootstrap.js';
import { app } from '@azure/functions';
import type { HttpRequest, InvocationContext, HttpResponseInit } from '@azure/functions';
import { verifyFirebaseIdToken } from '../services/firebaseAdmin.js';
import { assembleUserDataExport } from '../services/dataExport.service.js';
import { inferUserRole } from '../services/userRole.service.js';

/**
 * GET /v1/users/me/data-export — DPDP §11 right-to-access.
 *
 * Role is derived from the technicians container, NOT a client-supplied
 * header — preventing a customer from spoofing TECHNICIAN to widen the read
 * surface. The token is the authoritative subject.
 */
export async function dataExportHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
): Promise<HttpResponseInit> {
  const auth = req.headers.get('authorization') ?? '';
  if (!auth.startsWith('Bearer ')) {
    return { status: 401, jsonBody: { code: 'UNAUTHENTICATED' } };
  }
  let uid: string;
  try {
    const decoded = await verifyFirebaseIdToken(auth.slice(7));
    uid = decoded.uid;
  } catch {
    return { status: 401, jsonBody: { code: 'TOKEN_INVALID' } };
  }

  const role = await inferUserRole(uid);
  const exported = await assembleUserDataExport(uid, role);
  return { status: 200, jsonBody: exported };
}

app.http('usersDataExport', {
  methods: ['GET'],
  route: 'v1/users/me/data-export',
  authLevel: 'anonymous',
  handler: dataExportHandler,
});
