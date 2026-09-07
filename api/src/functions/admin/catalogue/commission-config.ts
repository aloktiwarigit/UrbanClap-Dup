import '../../../bootstrap.js';
import * as Sentry from '@sentry/node';
import { app } from '@azure/functions';
import type { HttpRequest, InvocationContext, HttpResponseInit } from '@azure/functions';
import { requireAdmin, type AdminHttpHandler } from '../../../middleware/requireAdmin.js';
import type { AdminContext } from '../../../types/admin.js';
import { commissionConfigRepo } from '../../../cosmos/commission-config-repository.js';
import { systemDocsRepo } from '../../../cosmos/system-docs-repository.js';
import { UpdateCommissionConfigBodySchema, toEffectiveConfig } from '../../../schemas/commission-config.js';
import { _resetCommissionConfigCacheForTest } from '../../../services/commission-config.service.js';
import { auditLog } from '../../../services/auditLog.service.js';

const HOLD_REPAIR_TRIGGER_KEYS = [
  'warnThresholdPaise',
  'blockThresholdPaise',
  'holdEnforcementEnabled',
  'enforceKycInDispatch',
] as const;

export const getAdminCommissionConfigHandler: AdminHttpHandler = async (
  _req: HttpRequest,
  _ctx: InvocationContext,
  _admin: AdminContext,
): Promise<HttpResponseInit> => {
  try {
    // Raw point read (not the 5-minute cached service) — an admin who saves on one
    // Functions instance and reloads on another must see their own write immediately.
    const doc = await commissionConfigRepo.getCommissionConfig();
    return { status: 200, jsonBody: toEffectiveConfig(doc) };
  } catch {
    return { status: 502, jsonBody: { code: 'UPSTREAM_ERROR' } };
  }
};

export const putAdminCommissionConfigHandler: AdminHttpHandler = async (
  req: HttpRequest,
  _ctx: InvocationContext,
  admin: AdminContext,
): Promise<HttpResponseInit> => {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { status: 400, jsonBody: { code: 'PARSE_ERROR' } };
  }

  const parsed = UpdateCommissionConfigBodySchema.safeParse(raw);
  if (!parsed.success) {
    return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', issues: parsed.error.issues } };
  }

  try {
    const doc = await commissionConfigRepo.patchCommissionConfig(parsed.data, admin.adminId);

    // Bust the in-process cache so the next read immediately picks up the new config
    _resetCommissionConfigCacheForTest();

    if (HOLD_REPAIR_TRIGGER_KEYS.some((key) => key in parsed.data)) {
      try {
        await systemDocsRepo.enqueueHoldRepair('ALL');
      } catch (err) {
        Sentry.captureException(err);
      }
    }

    await auditLog(
      { adminId: admin.adminId, role: admin.role, sessionId: admin.sessionId },
      'COMMISSION_CONFIG_UPDATED',
      'commission-config',
      'commission-config',
      { patch: parsed.data },
    );

    return { status: 200, jsonBody: toEffectiveConfig(doc) };
  } catch (err) {
    if ((err as { code?: string })?.code === 'THRESHOLD_ORDER') {
      return { status: 400, jsonBody: { code: 'THRESHOLD_ORDER' } };
    }
    return { status: 502, jsonBody: { code: 'UPSTREAM_ERROR' } };
  }
};

app.http('getAdminCommissionConfig', {
  methods: ['GET'],
  route: 'v1/admin/catalogue/commission-config',
  authLevel: 'anonymous',
  handler: requireAdmin(['super-admin', 'finance'])(getAdminCommissionConfigHandler),
});

app.http('putAdminCommissionConfig', {
  methods: ['PUT'],
  route: 'v1/admin/catalogue/commission-config',
  authLevel: 'anonymous',
  handler: requireAdmin(['super-admin'])(putAdminCommissionConfigHandler),
});
