import '../bootstrap.js';
import { app } from '@azure/functions';
import type { HttpRequest, InvocationContext, HttpResponseInit } from '@azure/functions';
import { verifyFirebaseIdToken } from '../services/firebaseAdmin.js';
import { assembleUserDataExport } from '../services/dataExport.service.js';

/**
 * GET /v1/users/me/data-export — DPDP §11 right-to-access.
 *
 * Returns every PII field the platform holds about the calling user.
 * Role is supplied by the client via x-user-role header (CUSTOMER|TECHNICIAN);
 * defaults to CUSTOMER. The token is the authoritative subject — role only
 * controls which container surface is read.
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

  const declaredRole = (req.headers.get('x-user-role') ?? 'customer').toLowerCase();
  const role: 'CUSTOMER' | 'TECHNICIAN' = declaredRole === 'technician' ? 'TECHNICIAN' : 'CUSTOMER';

  const exported = await assembleUserDataExport(uid, role);
  return { status: 200, jsonBody: exported };
}

app.http('usersDataExport', {
  methods: ['GET'],
  route: 'v1/users/me/data-export',
  authLevel: 'anonymous',
  handler: dataExportHandler,
});
