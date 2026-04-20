import '../../../bootstrap.js';
import { app } from '@azure/functions';
import type { HttpRequest, InvocationContext, HttpResponseInit, Cookie } from '@azure/functions';
import { SetupTotpVerifySchema } from '../../../schemas/admin-auth.js';
import { verifySetupToken, signAccessToken } from '../../../services/jwt.service.js';
import { getAdminUserById, updateAdminUser } from '../../../services/adminUser.service.js';
import {
  generateSecret,
  generateOtpAuthUri,
  encryptSecret,
  decryptSecret,
  verifyToken,
} from '../../../services/totp.service.js';
import { createAdminSession } from '../../../services/adminSession.service.js';
import { auditLog } from '../../../services/auditLog.service.js';
import QRCode from 'qrcode';

async function extractSetupPayload(req: HttpRequest) {
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  return token ? verifySetupToken(token) : null;
}

export async function setupTotpGetHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
): Promise<HttpResponseInit> {
  const setupPayload = await extractSetupPayload(req);
  if (!setupPayload) return { status: 401, jsonBody: { code: 'SETUP_TOKEN_INVALID' } };

  const adminUser = await getAdminUserById(setupPayload.sub);
  if (!adminUser || adminUser.deactivatedAt) {
    return { status: 401, jsonBody: { code: 'ADMIN_NOT_FOUND' } };
  }
  if (adminUser.totpEnrolled) {
    return { status: 409, jsonBody: { code: 'ALREADY_ENROLLED' } };
  }

  let secret: string;
  if (adminUser.totpSecretPending) {
    secret = decryptSecret(adminUser.totpSecretPending);
  } else {
    secret = generateSecret();
    await updateAdminUser(adminUser.adminId, { totpSecretPending: encryptSecret(secret) });
  }

  const uri = generateOtpAuthUri(secret, adminUser.email);
  const qrCodeDataUri = await QRCode.toDataURL(uri);

  return { status: 200, jsonBody: { qrCodeDataUri } };
}

export async function setupTotpPostHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
): Promise<HttpResponseInit> {
  const setupPayload = await extractSetupPayload(req);
  if (!setupPayload) return { status: 401, jsonBody: { code: 'SETUP_TOKEN_INVALID' } };

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { status: 400, jsonBody: { code: 'INVALID_JSON' } };
  }

  const parsed = SetupTotpVerifySchema.safeParse(raw);
  if (!parsed.success) {
    return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', issues: parsed.error.issues } };
  }

  const adminUser = await getAdminUserById(setupPayload.sub);
  if (!adminUser || adminUser.deactivatedAt) {
    return { status: 401, jsonBody: { code: 'ADMIN_NOT_FOUND' } };
  }
  if (adminUser.totpEnrolled) {
    return { status: 409, jsonBody: { code: 'ALREADY_ENROLLED' } };
  }
  if (!adminUser.totpSecretPending) {
    return { status: 409, jsonBody: { code: 'SETUP_NOT_INITIATED' } };
  }

  const secret = decryptSecret(adminUser.totpSecretPending);
  if (!verifyToken(parsed.data.totpCode, secret)) {
    return { status: 422, jsonBody: { code: 'TOTP_INVALID' } };
  }

  await updateAdminUser(adminUser.adminId, {
    totpSecret: adminUser.totpSecretPending,
    totpSecretPending: null,
    totpEnrolled: true,
  });

  const session = await createAdminSession({ adminId: adminUser.adminId, role: adminUser.role });
  const accessToken = await signAccessToken({
    sub: adminUser.adminId,
    role: adminUser.role,
    sessionId: session.sessionId,
  });

  const ip = req.headers.get('x-forwarded-for') ?? undefined;
  void auditLog(
    { adminId: adminUser.adminId, role: adminUser.role, sessionId: session.sessionId },
    'admin.totp_setup',
    'admin_user',
    adminUser.adminId,
    { adminId: adminUser.adminId },
    { ...(ip !== undefined && { ip }) },
  );

  const cookies: Cookie[] = [
    { name: 'hs_access', value: accessToken, httpOnly: true, secure: true, sameSite: 'Strict', path: '/', maxAge: 900 },
    { name: 'hs_refresh', value: session.sessionId, httpOnly: true, secure: true, sameSite: 'Strict', path: '/api/v1/admin/auth/refresh', maxAge: 28800 },
  ];

  return { status: 200, cookies, jsonBody: { adminId: adminUser.adminId } };
}

app.http('adminSetupTotpGet', {
  methods: ['GET'],
  route: 'v1/admin/auth/setup-totp',
  authLevel: 'anonymous',
  handler: setupTotpGetHandler,
});

app.http('adminSetupTotpPost', {
  methods: ['POST'],
  route: 'v1/admin/auth/setup-totp',
  authLevel: 'anonymous',
  handler: setupTotpPostHandler,
});
