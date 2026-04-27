import '../../../bootstrap.js';
import { app } from '@azure/functions';
import type { HttpRequest, InvocationContext, HttpResponseInit, Cookie } from '@azure/functions';
import { LoginRequestSchema } from '../../../schemas/admin-auth.js';
import { verifyFirebaseIdToken } from '../../../services/firebaseAdmin.js';
import { getAdminUserById } from '../../../services/adminUser.service.js';
import { decryptSecret, verifyToken } from '../../../services/totp.service.js';
import { createAdminSession } from '../../../services/adminSession.service.js';
import { signAccessToken, signSetupToken } from '../../../services/jwt.service.js';
import { auditLog } from '../../../services/auditLog.service.js';

export async function adminLoginHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
): Promise<HttpResponseInit> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { status: 400, jsonBody: { code: 'INVALID_JSON' } };
  }

  const parsed = LoginRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: 400,
      jsonBody: {
        code: 'VALIDATION_ERROR',
        issues: parsed.error.issues.map((i) => ({
          path: i.path,
          message: i.message,
          code: i.code,
        })),
      },
    };
  }

  const { idToken, totpCode } = parsed.data;

  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined;
  const userAgent = req.headers.get('user-agent') ?? undefined;

  let uid: string;
  try {
    const decoded = await verifyFirebaseIdToken(idToken);
    uid = decoded.uid;
  } catch {
    void auditLog(
      { adminId: 'system', role: 'system' },
      'ADMIN_LOGIN_FAILED',
      'admin_session',
      'unknown',
      { reason: 'BAD_TOKEN', ip },
    );
    return { status: 401, jsonBody: { code: 'FIREBASE_TOKEN_INVALID' } };
  }

  const adminUser = await getAdminUserById(uid);
  if (!adminUser || adminUser.deactivatedAt) {
    void auditLog(
      { adminId: uid, role: 'system' },
      'ADMIN_LOGIN_FAILED',
      'admin_session',
      uid,
      { reason: 'DEACTIVATED', email: adminUser?.email ?? null, ip },
    );
    return { status: 401, jsonBody: { code: 'ADMIN_NOT_FOUND' } };
  }

  if (!adminUser.totpEnrolled) {
    const setupToken = await signSetupToken({ sub: adminUser.adminId, email: adminUser.email });
    return { status: 200, jsonBody: { requiresSetup: true, setupToken } };
  }

  if (!totpCode) return { status: 422, jsonBody: { code: 'TOTP_REQUIRED' } };

  const secret = decryptSecret(adminUser.totpSecret!);
  if (!verifyToken(totpCode, secret)) {
    void auditLog(
      { adminId: adminUser.adminId, role: adminUser.role },
      'ADMIN_LOGIN_FAILED',
      'admin_session',
      adminUser.adminId,
      { reason: 'WRONG_TOTP', email: adminUser.email, ip },
    );
    return { status: 422, jsonBody: { code: 'TOTP_INVALID' } };
  }

  const session = await createAdminSession({ adminId: adminUser.adminId, role: adminUser.role });
  const accessToken = await signAccessToken({
    sub: adminUser.adminId,
    role: adminUser.role,
    sessionId: session.sessionId,
  });

  void auditLog(
    { adminId: adminUser.adminId, role: adminUser.role, sessionId: session.sessionId },
    'admin.login',
    'admin_session',
    session.sessionId,
    { sessionId: session.sessionId },
    {
      ...(ip !== undefined && { ip }),
      ...(userAgent !== undefined && { userAgent }),
    },
  );

  const cookies: Cookie[] = [
    {
      name: 'hs_access',
      value: accessToken,
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      path: '/',
      maxAge: 900,
    },
    {
      name: 'hs_refresh',
      value: session.sessionId,
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      path: '/api/v1/admin/auth/refresh',
      maxAge: 28800,
    },
  ];

  return {
    status: 200,
    cookies,
    jsonBody: { adminId: adminUser.adminId, role: adminUser.role, email: adminUser.email },
  };
}

app.http('adminLogin', {
  methods: ['POST'],
  route: 'v1/admin/auth/login',
  authLevel: 'anonymous',
  handler: adminLoginHandler,
});
