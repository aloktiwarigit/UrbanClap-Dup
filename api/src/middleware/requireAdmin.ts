import type { HttpHandler, HttpRequest, InvocationContext, HttpResponseInit } from '@azure/functions';
import { parseCookies } from '../shared/cookies.js';
import { verifyAccessToken } from '../services/jwt.service.js';
import { touchAndGetSession } from '../services/adminSession.service.js';
import type { AdminRole, AdminContext } from '../types/admin.js';

export type AdminHttpHandler = (
  req: HttpRequest,
  ctx: InvocationContext,
  admin: AdminContext,
) => Promise<HttpResponseInit>;

export function requireAdmin(roles: AdminRole[]) {
  return (handler: AdminHttpHandler): HttpHandler =>
    async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
      const cookies = parseCookies(req.headers.get('cookie') ?? undefined);
      const token = cookies['hs_access'];
      if (!token) return { status: 401, jsonBody: { code: 'UNAUTHENTICATED' } };

      const payload = await verifyAccessToken(token);
      if (!payload) return { status: 401, jsonBody: { code: 'TOKEN_INVALID' } };

      const session = await touchAndGetSession(payload.sessionId);
      if (!session) return { status: 401, jsonBody: { code: 'SESSION_EXPIRED' } };

      if (!roles.includes(payload.role)) {
        return { status: 403, jsonBody: { code: 'FORBIDDEN', requiredRoles: roles } };
      }

      return handler(req, ctx, {
        adminId: payload.sub,
        role: payload.role,
        sessionId: payload.sessionId,
      });
    };
}
