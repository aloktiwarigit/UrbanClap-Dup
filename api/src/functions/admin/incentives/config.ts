import '../../../bootstrap.js';
import { app } from '@azure/functions';
import type { HttpRequest, InvocationContext, HttpResponseInit } from '@azure/functions';
import { requireAdmin, type AdminHttpHandler } from '../../../middleware/requireAdmin.js';
import type { AdminContext } from '../../../types/admin.js';
import { systemDocsRepo } from '../../../cosmos/system-docs-repository.js';
import { INCENTIVE_CONFIG_DOC_ID, UpdateIncentiveConfigBodySchema } from '../../../schemas/incentive.js';
import { auditLog } from '../../../services/auditLog.service.js';

/** GET must never 404 — an unwritten doc means "incentives are dark", not "missing". */
export const getIncentiveConfigHandler: AdminHttpHandler = async (
  _req: HttpRequest, _ctx: InvocationContext, _admin: AdminContext,
): Promise<HttpResponseInit> => {
  try {
    return { status: 200, jsonBody: await systemDocsRepo.getEffectiveIncentiveConfig() };
  } catch {
    return { status: 502, jsonBody: { code: 'UPSTREAM_ERROR' } };
  }
};

export const putIncentiveConfigHandler: AdminHttpHandler = async (
  req: HttpRequest, _ctx: InvocationContext, admin: AdminContext,
): Promise<HttpResponseInit> => {
  let raw: unknown;
  try { raw = await req.json(); } catch { return { status: 400, jsonBody: { code: 'PARSE_ERROR' } }; }

  const parsed = UpdateIncentiveConfigBodySchema.safeParse(raw);
  if (!parsed.success) {
    return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', issues: parsed.error.issues } };
  }
  try {
    const cfg = await systemDocsRepo.patchIncentiveConfig(parsed.data, admin.adminId);
    await auditLog(
      { adminId: admin.adminId, role: admin.role, sessionId: admin.sessionId },
      'INCENTIVE_CONFIG_UPDATED', 'incentive-config', INCENTIVE_CONFIG_DOC_ID,
      { patch: parsed.data },
    );
    return { status: 200, jsonBody: cfg };
  } catch {
    return { status: 502, jsonBody: { code: 'UPSTREAM_ERROR' } };
  }
};

app.http('getIncentiveConfig', {
  methods: ['GET'], route: 'v1/admin/incentives/config', authLevel: 'anonymous',
  handler: requireAdmin(['super-admin', 'finance'])(getIncentiveConfigHandler),
});
app.http('putIncentiveConfig', {
  methods: ['PUT'], route: 'v1/admin/incentives/config', authLevel: 'anonymous',
  handler: requireAdmin(['super-admin'])(putIncentiveConfigHandler),
});
