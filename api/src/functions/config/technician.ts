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
  const [doc, cfg, effectiveIncentive] = await Promise.all([
    systemDocsRepo.getTechnicianClientConfig(),
    getCommissionConfig(),
    // Codex P2: getIncentiveConfig() is a raw point read with no per-field defaulting. A
    // partial first write (e.g. `PUT {"enabled":true}` before milestones/capFractionBps are
    // ever set) produced a stored doc missing required fields, and this response schema's
    // `incentive` object requires all three -- every technician's config fetch 502'd.
    // getEffectiveIncentiveConfig() (E23-S01, api/src/cosmos/system-docs-repository.ts) already
    // applies the same per-field defaults `incentive.service.ts` relies on; it never 404s and
    // never returns a partially-populated shape. TechnicianConfigResponseSchema's `incentive`
    // field is a plain z.object (not .strict()), so the extra fields it carries
    // (minCountableBookingPaise, updatedBy, updatedAt) are stripped harmlessly.
    systemDocsRepo.getEffectiveIncentiveConfig(),
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
    incentive: effectiveIncentive,
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
