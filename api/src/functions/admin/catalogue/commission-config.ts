import '../../../bootstrap.js';
import { app } from '@azure/functions';
import type { HttpRequest, InvocationContext, HttpResponseInit } from '@azure/functions';
import { requireAdmin, type AdminHttpHandler } from '../../../middleware/requireAdmin.js';
import type { AdminContext } from '../../../types/admin.js';
import { commissionConfigRepo } from '../../../cosmos/commission-config-repository.js';
import { UpdateCommissionConfigBodySchema } from '../../../schemas/commission-config.js';
import { _resetCommissionConfigCacheForTest } from '../../../services/commission-config.service.js';

export const getCommissionConfigHandler: AdminHttpHandler = async (
  _req: HttpRequest,
  _ctx: InvocationContext,
  _admin: AdminContext,
): Promise<HttpResponseInit> => {
  try {
    const doc = await commissionConfigRepo.getCommissionConfig();
    if (!doc) {
      return {
        status: 200,
        jsonBody: {
          defaultCommissionBps: 2200,
          updatedBy: 'system',
          updatedAt: new Date().toISOString(),
          isDefault: true,
        },
      };
    }
    return {
      status: 200,
      jsonBody: {
        defaultCommissionBps: doc.defaultCommissionBps,
        updatedBy: doc.updatedBy,
        updatedAt: doc.updatedAt,
      },
    };
  } catch {
    return { status: 502, jsonBody: { code: 'UPSTREAM_ERROR' } };
  }
};

export const putCommissionConfigHandler: AdminHttpHandler = async (
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
    const doc = await commissionConfigRepo.upsertCommissionConfig(
      parsed.data.defaultCommissionBps,
      admin.adminId,
    );
    // Bust the in-process cache so the next settlement immediately picks up the new rate
    _resetCommissionConfigCacheForTest();
    return {
      status: 200,
      jsonBody: {
        defaultCommissionBps: doc.defaultCommissionBps,
        updatedBy: doc.updatedBy,
        updatedAt: doc.updatedAt,
      },
    };
  } catch {
    return { status: 502, jsonBody: { code: 'UPSTREAM_ERROR' } };
  }
};

app.http('getAdminCommissionConfig', {
  methods: ['GET'],
  route: 'v1/admin/catalogue/commission-config',
  authLevel: 'anonymous',
  handler: requireAdmin(['super-admin', 'finance'])(getCommissionConfigHandler),
});

app.http('putAdminCommissionConfig', {
  methods: ['PUT'],
  route: 'v1/admin/catalogue/commission-config',
  authLevel: 'anonymous',
  handler: requireAdmin(['super-admin'])(putCommissionConfigHandler),
});
