import '../../../bootstrap.js';
import { app } from '@azure/functions';
import type { HttpRequest, InvocationContext, HttpResponseInit } from '@azure/functions';
import { requireAdmin } from '../../../middleware/requireAdmin.js';
import type { AdminContext } from '../../../types/admin.js';
import { AuditLogQuerySchema } from '../../../schemas/audit-log.js';
import { queryAuditLog } from '../../../cosmos/audit-log-repository.js';

export const adminAuditLogListHandler = requireAdmin(['super-admin'])(
  async (req: HttpRequest, _ctx: InvocationContext, _admin: AdminContext): Promise<HttpResponseInit> => {
    const rawParams: Record<string, string> = {};
    req.query.forEach((value, key) => {
      rawParams[key] = value;
    });

    const parsed = AuditLogQuerySchema.safeParse(rawParams);
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

    const result = await queryAuditLog(parsed.data);
    return {
      status: 200,
      jsonBody: {
        entries: result.entries,
        ...(result.continuationToken !== undefined && {
          continuationToken: result.continuationToken,
        }),
      },
    };
  },
);

app.http('adminAuditLogList', {
  methods: ['GET'],
  route: 'v1/admin/audit-log',
  authLevel: 'anonymous',
  handler: adminAuditLogListHandler,
});
