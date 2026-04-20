import '../../../bootstrap.js';
import { app } from '@azure/functions';
import type { HttpRequest, InvocationContext, HttpResponseInit, Cookie } from '@azure/functions';
import { parseCookies } from '../../../shared/cookies.js';
import { verifyAccessToken } from '../../../services/jwt.service.js';
import { deleteSession } from '../../../services/adminSession.service.js';
import { auditLog } from '../../../services/auditLog.service.js';

export async function adminLogoutHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
): Promise<HttpResponseInit> {
  const cookies = parseCookies(req.headers.get('cookie') ?? undefined);
  const token = cookies['hs_access'];

  if (token) {
    const payload = await verifyAccessToken(token);
    if (payload) {
      await deleteSession(payload.sessionId).catch(() => undefined);
      const ip = req.headers.get('x-forwarded-for') ?? undefined;
      const userAgent = req.headers.get('user-agent') ?? undefined;
      void auditLog(
        { adminId: payload.sub, role: payload.role, sessionId: payload.sessionId },
        'admin.logout',
        'admin_session',
        payload.sessionId,
        { sessionId: payload.sessionId },
        {
          ...(ip !== undefined && { ip }),
          ...(userAgent !== undefined && { userAgent }),
        },
      );
    }
  }

  const clearCookies: Cookie[] = [
    { name: 'hs_access', value: '', httpOnly: true, secure: true, sameSite: 'Strict', path: '/', maxAge: 0 },
    { name: 'hs_refresh', value: '', httpOnly: true, secure: true, sameSite: 'Strict', path: '/api/v1/admin/auth/refresh', maxAge: 0 },
  ];

  return { status: 200, cookies: clearCookies, jsonBody: { ok: true } };
}

app.http('adminLogout', {
  methods: ['POST'],
  route: 'v1/admin/auth/logout',
  authLevel: 'anonymous',
  handler: adminLogoutHandler,
});
