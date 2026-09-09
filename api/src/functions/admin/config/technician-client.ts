import '../../../bootstrap.js';
import { app } from '@azure/functions';
import type { HttpRequest, InvocationContext, HttpResponseInit } from '@azure/functions';
import { requireAdmin, type AdminHttpHandler } from '../../../middleware/requireAdmin.js';
import type { AdminContext } from '../../../types/admin.js';
import { systemDocsRepo } from '../../../cosmos/system-docs-repository.js';
import {
  TECHNICIAN_CLIENT_CONFIG_DOC_ID,
  DEFAULT_TECHNICIAN_FEATURES,
  UpdateTechnicianClientConfigBodySchema,
  type TechnicianClientConfigDoc,
} from '../../../schemas/technician-client-config.js';
import { auditLog } from '../../../services/auditLog.service.js';

/**
 * GET must never 404 — the client never reasons about absence of this doc. Any unset
 * feature flag falls back to DEFAULT_TECHNICIAN_FEATURES and minSupportedVersionCode
 * defaults to 0.
 */
function toEffectiveConfig(doc: TechnicianClientConfigDoc | null): TechnicianClientConfigDoc {
  return {
    id: TECHNICIAN_CLIENT_CONFIG_DOC_ID,
    features: { ...DEFAULT_TECHNICIAN_FEATURES, ...doc?.features },
    minSupportedVersionCode: doc?.minSupportedVersionCode ?? 0,
    ...(doc?.updatedBy !== undefined ? { updatedBy: doc.updatedBy } : {}),
    ...(doc?.updatedAt !== undefined ? { updatedAt: doc.updatedAt } : {}),
  };
}

export const getTechnicianClientConfigHandler: AdminHttpHandler = async (
  _req: HttpRequest,
  _ctx: InvocationContext,
  _admin: AdminContext,
): Promise<HttpResponseInit> => {
  try {
    const doc = await systemDocsRepo.getTechnicianClientConfig();
    return { status: 200, jsonBody: toEffectiveConfig(doc) };
  } catch {
    return { status: 502, jsonBody: { code: 'UPSTREAM_ERROR' } };
  }
};

export const putTechnicianClientConfigHandler: AdminHttpHandler = async (
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

  const parsed = UpdateTechnicianClientConfigBodySchema.safeParse(raw);
  if (!parsed.success) {
    return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', issues: parsed.error.issues } };
  }

  try {
    const doc = await systemDocsRepo.patchTechnicianClientConfig(parsed.data, admin.adminId);

    await auditLog(
      { adminId: admin.adminId, role: admin.role, sessionId: admin.sessionId },
      'TECHNICIAN_CLIENT_CONFIG_UPDATED',
      'technician-client-config',
      TECHNICIAN_CLIENT_CONFIG_DOC_ID,
      { patch: parsed.data },
    );

    return { status: 200, jsonBody: toEffectiveConfig(doc) };
  } catch {
    return { status: 502, jsonBody: { code: 'UPSTREAM_ERROR' } };
  }
};

app.http('getTechnicianClientConfig', {
  methods: ['GET'],
  route: 'v1/admin/config/technician-client',
  authLevel: 'anonymous',
  handler: requireAdmin(['super-admin', 'finance'])(getTechnicianClientConfigHandler),
});

app.http('putTechnicianClientConfig', {
  methods: ['PUT'],
  route: 'v1/admin/config/technician-client',
  authLevel: 'anonymous',
  handler: requireAdmin(['super-admin'])(putTechnicianClientConfigHandler),
});
