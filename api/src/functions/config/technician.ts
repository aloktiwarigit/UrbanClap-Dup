import '../../bootstrap.js';
import { app } from '@azure/functions';
import type { HttpRequest, InvocationContext, HttpResponseInit } from '@azure/functions';
import { verifyTechnicianToken } from '../../middleware/verifyTechnicianToken.js';
import { systemDocsRepo } from '../../cosmos/system-docs-repository.js';
import { getCommissionConfig } from '../../services/commission-config.service.js';
import {
  DEFAULT_TECHNICIAN_FEATURES,
  TechnicianConfigResponseSchema,
  type TechnicianConfigResponse,
  type TechnicianFeatureFlags,
} from '../../schemas/technician-client-config.js';

/** Dark-launch defaults for the milestone-incentive program (E23) — off until that story ships. */
const DEFAULT_INCENTIVE = { enabled: false, milestones: [], capFractionBps: 6000 } as const;

/** In-process cache TTL: 60 s. The response has no per-technician content, so one entry covers
 *  every caller — cheap to keep hot without a per-uid cache key. */
const CACHE_TTL_MS = 60_000;

let _cached: TechnicianConfigResponse | null = null;
let _cacheExpiresAt = 0;

/** Reset the in-process cache — used by tests only. */
export function _resetTechnicianConfigCacheForTest(): void {
  _cached = null;
  _cacheExpiresAt = 0;
}

async function buildTechnicianConfigResponse(): Promise<TechnicianConfigResponse> {
  const [doc, cfg, incentiveDoc] = await Promise.all([
    systemDocsRepo.getTechnicianClientConfig(),
    getCommissionConfig(),
    systemDocsRepo.getIncentiveConfig(),
  ]);

  const overrides = doc?.features ?? {};
  const features: TechnicianFeatureFlags = {
    wallet: overrides.wallet ?? DEFAULT_TECHNICIAN_FEATURES.wallet,
    duesBanner: overrides.duesBanner ?? DEFAULT_TECHNICIAN_FEATURES.duesBanner,
    upiQr: overrides.upiQr ?? DEFAULT_TECHNICIAN_FEATURES.upiQr,
    incentives: overrides.incentives ?? DEFAULT_TECHNICIAN_FEATURES.incentives,
    addOnRequests: overrides.addOnRequests ?? DEFAULT_TECHNICIAN_FEATURES.addOnRequests,
  };

  const response: TechnicianConfigResponse = {
    features,
    thresholds: { warnPaise: cfg.warnThresholdPaise, blockPaise: cfg.blockThresholdPaise },
    holdEnforcementEnabled: cfg.holdEnforcementEnabled,
    incentive: incentiveDoc ?? { ...DEFAULT_INCENTIVE, milestones: [...DEFAULT_INCENTIVE.milestones] },
    minSupportedVersionCode: doc?.minSupportedVersionCode ?? 0,
    serverTime: new Date().toISOString(),
  };

  return TechnicianConfigResponseSchema.parse(response);
}

export const getTechnicianConfigHandler = async (
  req: HttpRequest,
  _ctx: InvocationContext,
): Promise<HttpResponseInit> => {
  try {
    await verifyTechnicianToken(req);
  } catch {
    return { status: 401, jsonBody: { code: 'UNAUTHORIZED' } };
  }

  try {
    const now = Date.now();
    if (!_cached || now >= _cacheExpiresAt) {
      _cached = await buildTechnicianConfigResponse();
      _cacheExpiresAt = now + CACHE_TTL_MS;
    }
    return {
      status: 200,
      jsonBody: _cached,
      headers: { 'Cache-Control': 'private, max-age=60' },
    };
  } catch {
    return { status: 502, jsonBody: { code: 'UPSTREAM_ERROR' } };
  }
};

app.http('technicianConfig', {
  methods: ['GET'],
  route: 'v1/config/technician',
  authLevel: 'anonymous',
  handler: getTechnicianConfigHandler,
});
