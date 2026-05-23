import '../../../bootstrap.js';
import { app } from '@azure/functions';
import type { HttpRequest, InvocationContext, HttpResponseInit, Cookie } from '@azure/functions';
import { parseCookies } from '../../../shared/cookies.js';
import { touchAndGetSession, validateAndRotateRefresh } from '../../../services/adminSession.service.js';
import { signAccessToken } from '../../../services/jwt.service.js';

export async function adminRefreshHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
): Promise<HttpResponseInit> {
  const cookies = parseCookies(req.headers.get('cookie') ?? undefined);
  const rawRefreshToken = cookies['hs_refresh'];
  if (!rawRefreshToken) return { status: 401, jsonBody: { code: 'REFRESH_TOKEN_MISSING' } };

  // The hs_refresh cookie stores: <sessionId>:<rawToken> or just a raw UUID.
  // For sessions created before E12-S03, the cookie value IS the sessionId.
  // For sessions created after E12-S03, the cookie value is the raw refresh token
  // (a UUID) and the sessionId is stored inside the Cosmos doc.
  //
  // Rotation approach: attempt validateAndRotateRefresh with the raw token.
  // This requires knowing the sessionId — since the sessionId is also a UUID
  // and raw tokens are different UUIDs, we store them separately. The refresh
  // cookie carries ONLY the rawRefreshToken; we must look up the session by
  // scanning for the matching hash. However, to avoid a cross-partition scan on
  // every refresh we use a lookup approach: the sessionId is embedded as the
  // partition key in the cookie via a "sessionId:rawToken" composite value.
  //
  // Legacy path (no ':' separator): treat the whole value as sessionId and use
  // touchAndGetSession for backward compatibility.
  const separatorIndex = rawRefreshToken.indexOf(':');
  if (separatorIndex === -1) {
    // Legacy path: cookie value is sessionId (pre-E12-S03 sessions)
    const session = await touchAndGetSession(rawRefreshToken);
    if (!session) return { status: 401, jsonBody: { code: 'SESSION_EXPIRED' } };

    const accessToken = await signAccessToken({
      sub: session.adminId,
      role: session.role,
      sessionId: session.sessionId,
    });

    const responseCookies: Cookie[] = [
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
        path: '/',
        maxAge: 28800,
      },
    ];

    return { status: 200, cookies: responseCookies, jsonBody: { ok: true } };
  }

  // New path: cookie value is "<sessionId>:<rawToken>"
  const sessionId = rawRefreshToken.slice(0, separatorIndex);
  const rawToken = rawRefreshToken.slice(separatorIndex + 1);

  const newRawToken = await validateAndRotateRefresh(sessionId, rawToken);
  if (!newRawToken) return { status: 401, jsonBody: { code: 'SESSION_EXPIRED' } };

  // Read the session to get adminId + role for the new access token
  const session = await touchAndGetSession(sessionId);
  if (!session) return { status: 401, jsonBody: { code: 'SESSION_EXPIRED' } };

  const accessToken = await signAccessToken({
    sub: session.adminId,
    role: session.role,
    sessionId: session.sessionId,
  });

  const responseCookies: Cookie[] = [
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
      value: `${sessionId}:${newRawToken}`,
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      path: '/',
      maxAge: 28800,
    },
  ];

  return { status: 200, cookies: responseCookies, jsonBody: { ok: true } };
}

app.http('adminRefresh', {
  methods: ['POST'],
  route: 'v1/admin/auth/refresh',
  authLevel: 'anonymous',
  handler: adminRefreshHandler,
});
