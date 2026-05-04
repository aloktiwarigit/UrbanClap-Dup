import '../../../bootstrap.js';
import { randomUUID } from 'node:crypto';
import { app } from '@azure/functions';
import type { HttpRequest, InvocationContext, HttpResponseInit, Cookie } from '@azure/functions';
import { withRateLimit } from '../../../middleware/withRateLimit.js';
import * as Sentry from '@sentry/node';
import { LoginRequestSchema } from '../../../schemas/admin-auth.js';
import { verifyFirebaseIdToken } from '../../../services/firebaseAdmin.js';
import {
  claimAdminInvite,
  getAdminUserByEmail,
  getAdminUserById,
  isAdminInvite,
} from '../../../services/adminUser.service.js';
import { decryptSecret, verifyToken } from '../../../services/totp.service.js';
import { createAdminSession } from '../../../services/adminSession.service.js';
import {
  signAccessToken,
  signMfaChallengeToken,
  signSetupToken,
  verifyMfaChallengeToken,
} from '../../../services/jwt.service.js';
import { auditLog } from '../../../services/auditLog.service.js';
import { appendAuditEntry } from '../../../cosmos/audit-log-repository.js';
import { normalizeAdminRole, type AdminRole } from '../../../types/admin.js';

type LoginAdminUser = {
  adminId: string;
  email: string;
  role: unknown;
  totpEnrolled?: boolean;
  totpSecret?: string | null;
  deactivatedAt?: string | null;
};

async function completeTotpLogin(
  req: HttpRequest,
  adminUser: LoginAdminUser,
  role: AdminRole,
  totpCode: string,
): Promise<HttpResponseInit> {
  if (!adminUser.totpSecret) {
    return { status: 409, jsonBody: { code: 'TOTP_NOT_CONFIGURED' } };
  }

  const secret = decryptSecret(adminUser.totpSecret);
  if (!verifyToken(totpCode, secret)) {
    const _ts = new Date().toISOString();
    void appendAuditEntry({ id: randomUUID(), adminId: adminUser.adminId, role, action: 'ADMIN_LOGIN_FAILED', resourceType: 'admin_session', resourceId: adminUser.adminId, payload: { reason: 'TOTP_INVALID' }, timestamp: _ts, partitionKey: _ts.slice(0, 7) }).catch(Sentry.captureException);
    return { status: 422, jsonBody: { code: 'TOTP_INVALID' } };
  }

  const session = await createAdminSession({ adminId: adminUser.adminId, role });
  const accessToken = await signAccessToken({
    sub: adminUser.adminId,
    role,
    sessionId: session.sessionId,
  });

  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined;
  const userAgent = req.headers.get('user-agent') ?? undefined;
  void auditLog(
    { adminId: adminUser.adminId, role, sessionId: session.sessionId },
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
      // Format: "<sessionId>:<rawRefreshToken>" — sessionId is the partition key
      // for O(1) lookup in the refresh handler; rawRefreshToken is the one-time
      // credential rotated on each use.
      name: 'hs_refresh',
      value: `${session.sessionId}:${session.rawRefreshToken}`,
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      path: '/',
      maxAge: 28800,
    },
  ];

  return {
    status: 200,
    cookies,
    jsonBody: { adminId: adminUser.adminId, role, email: adminUser.email },
  };
}

async function completeChallengeLogin(
  req: HttpRequest,
  challengeToken: string,
  totpCode: string,
): Promise<HttpResponseInit> {
  const challenge = await verifyMfaChallengeToken(challengeToken);
  if (!challenge) {
    return { status: 401, jsonBody: { code: 'MFA_CHALLENGE_INVALID' } };
  }

  const adminUser = await getAdminUserById(challenge.sub);
  if (!adminUser || adminUser.deactivatedAt) {
    return { status: 401, jsonBody: { code: 'ADMIN_NOT_FOUND' } };
  }
  if (adminUser.email.toLowerCase() !== challenge.email.toLowerCase()) {
    return { status: 401, jsonBody: { code: 'MFA_CHALLENGE_INVALID' } };
  }

  const role = normalizeAdminRole(adminUser.role);
  if (!role) {
    return { status: 401, jsonBody: { code: 'ADMIN_NOT_FOUND' } };
  }

  if (!adminUser.totpEnrolled) {
    return { status: 409, jsonBody: { code: 'TOTP_NOT_ENROLLED' } };
  }

  return completeTotpLogin(req, adminUser, role, totpCode);
}

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

  if ('challengeToken' in parsed.data) {
    return completeChallengeLogin(req, parsed.data.challengeToken, parsed.data.totpCode);
  }

  const { idToken, totpCode } = parsed.data;

  let uid: string;
  let verifiedEmail: string | null = null;
  try {
    const decoded = await verifyFirebaseIdToken(idToken);
    uid = decoded.uid;
    if (decoded.email && decoded.email_verified === true) {
      verifiedEmail = decoded.email.toLowerCase();
    }
  } catch {
    return { status: 401, jsonBody: { code: 'FIREBASE_TOKEN_INVALID' } };
  }

  let adminUser = await getAdminUserById(uid);
  if (!adminUser && verifiedEmail) {
    const invite = await getAdminUserByEmail(verifiedEmail);
    if (invite && isAdminInvite(invite) && !invite.deactivatedAt) {
      adminUser = await claimAdminInvite(invite, uid, verifiedEmail);
    }
  }

  if (!adminUser || adminUser.deactivatedAt) {
    return { status: 401, jsonBody: { code: 'ADMIN_NOT_FOUND' } };
  }
  const role = normalizeAdminRole(adminUser.role);
  if (!role) {
    return { status: 401, jsonBody: { code: 'ADMIN_NOT_FOUND' } };
  }

  if (!adminUser.totpEnrolled) {
    const setupToken = await signSetupToken({ sub: adminUser.adminId, email: adminUser.email });
    // Deliver setupToken as an HttpOnly cookie (hs_setup) so the client never
    // touches it via JS. Also include it in the JSON body for the deprecation
    // window while old clients (if any) drain. Once all clients use the cookie
    // path the JSON field can be dropped.
    const setupCookie: Cookie = {
      name: 'hs_setup',
      value: setupToken,
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      path: '/setup',
      maxAge: 600,
    };
    return {
      status: 200,
      cookies: [setupCookie],
      jsonBody: { requiresSetup: true, setupToken },
    };
  }

  if (!totpCode) {
    const challengeToken = await signMfaChallengeToken({
      sub: adminUser.adminId,
      email: adminUser.email,
    });
    return {
      status: 200,
      jsonBody: {
        mfaRequired: true,
        challengeToken,
        email: adminUser.email,
        expiresInSeconds: 300,
      },
    };
  }

  return completeTotpLogin(req, adminUser, role, totpCode);
}

const adminLoginRateLimiter = withRateLimit({
  buckets: { ip: { capacity: 10, refillPerSec: 10 / 60 } },
});

app.http('adminLogin', {
  methods: ['POST'],
  route: 'v1/admin/auth/login',
  authLevel: 'anonymous',
  handler: adminLoginRateLimiter(adminLoginHandler),
});
