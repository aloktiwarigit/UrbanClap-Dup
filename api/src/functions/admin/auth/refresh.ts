import '../../../bootstrap.js';
import { app } from '@azure/functions';
import type { HttpRequest, InvocationContext, HttpResponseInit, Cookie } from '@azure/functions';
import { parseCookies } from '../../../shared/cookies.js';
import { touchAndGetSession } from '../../../services/adminSession.service.js';
import { signAccessToken } from '../../../services/jwt.service.js';

export async function adminRefreshHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
): Promise<HttpResponseInit> {
  const cookies = parseCookies(req.headers.get('cookie') ?? undefined);
  const sessionId = cookies['hs_refresh'];
  if (!sessionId) return { status: 401, jsonBody: { code: 'REFRESH_TOKEN_MISSING' } };

  const session = await touchAndGetSession(sessionId);
  if (!session) return { status: 401, jsonBody: { code: 'SESSION_EXPIRED' } };

  const accessToken = await signAccessToken({
    sub: session.adminId,
    role: session.role,
    sessionId: session.sessionId,
  });

  const cookie: Cookie = {
    name: 'hs_access',
    value: accessToken,
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    path: '/',
    maxAge: 900,
  };

  return { status: 200, cookies: [cookie], jsonBody: { ok: true } };
}

app.http('adminRefresh', {
  methods: ['POST'],
  route: 'v1/admin/auth/refresh',
  authLevel: 'anonymous',
  handler: adminRefreshHandler,
});
