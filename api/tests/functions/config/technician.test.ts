import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { HttpResponseInit } from '@azure/functions';
import { HttpRequest } from '@azure/functions';

vi.mock('../../../src/middleware/verifyTechnicianToken.js', () => ({
  verifyTechnicianToken: vi.fn(),
}));
vi.mock('../../../src/cosmos/system-docs-repository.js', () => ({
  systemDocsRepo: {
    getTechnicianClientConfig: vi.fn(),
    getEffectiveIncentiveConfig: vi.fn(),
  },
}));
vi.mock('../../../src/services/commission-config.service.js', () => ({
  getCommissionConfig: vi.fn(),
}));

import { verifyTechnicianToken } from '../../../src/middleware/verifyTechnicianToken.js';
import { systemDocsRepo } from '../../../src/cosmos/system-docs-repository.js';
import { getCommissionConfig } from '../../../src/services/commission-config.service.js';
import {
  getTechnicianConfigHandler,
  _resetTechnicianConfigCacheForTest,
} from '../../../src/functions/config/technician.js';
import type { TechnicianConfigResponse } from '../../../src/schemas/technician-client-config.js';
import type { EffectiveCommissionConfig } from '../../../src/schemas/commission-config.js';

const req = new HttpRequest({
  url: 'http://localhost/api/v1/config/technician',
  method: 'GET',
  headers: { authorization: 'Bearer test-token' },
});

const cfg: EffectiveCommissionConfig = {
  defaultCommissionBps: 2200,
  warnThresholdPaise: 250_000,
  blockThresholdPaise: 500_000,
  holdEnforcementEnabled: true,
  enforceKycInDispatch: false,
  updatedBy: 'admin-1',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  _resetTechnicianConfigCacheForTest();
  vi.mocked(verifyTechnicianToken).mockResolvedValue({ uid: 'tech-1' } as never);
  vi.mocked(getCommissionConfig).mockResolvedValue(cfg);
  vi.mocked(systemDocsRepo.getTechnicianClientConfig).mockResolvedValue(null);
  // getEffectiveIncentiveConfig never 404s and never returns a partial shape (E23-S01) --
  // this is the dark-launch default it always applies when nothing has been configured yet.
  vi.mocked(systemDocsRepo.getEffectiveIncentiveConfig).mockResolvedValue({
    enabled: false, milestones: [], capFractionBps: 6000, minCountableBookingPaise: 24_900,
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('getTechnicianConfigHandler', () => {
  it('returns 401 when the token is missing/invalid', async () => {
    vi.mocked(verifyTechnicianToken).mockRejectedValue(new Error('invalid token'));

    const res = (await getTechnicianConfigHandler(req, {} as never)) as HttpResponseInit;

    expect(res.status).toBe(401);
  });

  it('returns defaults when the technician-client-config and incentive docs are absent', async () => {
    const res = (await getTechnicianConfigHandler(req, {} as never)) as HttpResponseInit;

    expect(res.status).toBe(200);
    const body = res.jsonBody as TechnicianConfigResponse;
    expect(body.features).toEqual({
      wallet: false, duesBanner: false, upiQr: false, incentives: false, addOnRequests: false,
    });
    expect(body.thresholds).toEqual({ warnPaise: 250_000, blockPaise: 500_000 });
    expect(body.holdEnforcementEnabled).toBe(true);
    expect(body.incentive).toEqual({ enabled: false, milestones: [], capFractionBps: 6000 });
    expect(body.minSupportedVersionCode).toBe(0);
    expect(typeof body.serverTime).toBe('string');
    expect(res.headers).toMatchObject({ 'Cache-Control': 'private, max-age=60' });
  });

  it('merges partial features from the technician-client-config doc over the defaults', async () => {
    vi.mocked(systemDocsRepo.getTechnicianClientConfig).mockResolvedValue({
      id: 'technician-client-config',
      features: { wallet: true, upiQr: true },
      minSupportedVersionCode: 12,
    });

    const res = (await getTechnicianConfigHandler(req, {} as never)) as HttpResponseInit;

    const body = res.jsonBody as TechnicianConfigResponse;
    expect(body.features).toEqual({
      wallet: true, duesBanner: false, upiQr: true, incentives: false, addOnRequests: false,
    });
    expect(body.minSupportedVersionCode).toBe(12);
  });

  it('returns the incentive doc fields when present', async () => {
    vi.mocked(systemDocsRepo.getEffectiveIncentiveConfig).mockResolvedValue({
      enabled: true,
      milestones: [{ jobs: 20, bonusPaise: 10_000 }],
      capFractionBps: 5000,
      minCountableBookingPaise: 24_900,
    });

    const res = (await getTechnicianConfigHandler(req, {} as never)) as HttpResponseInit;

    const body = res.jsonBody as TechnicianConfigResponse;
    // TechnicianConfigResponseSchema's `incentive` object is not `.strict()` -- it validates
    // and keeps only enabled/milestones/capFractionBps, stripping minCountableBookingPaise
    // (and updatedBy/updatedAt, when present) harmlessly.
    expect(body.incentive).toEqual({
      enabled: true,
      milestones: [{ jobs: 20, bonusPaise: 10_000 }],
      capFractionBps: 5000,
    });
  });

  it('Codex regression: a partial admin write does not 502 every technician', async () => {
    // Before the fix, a PUT naming only `enabled` produced a stored Cosmos doc missing
    // `milestones`/`capFractionBps`, and the raw reader passed that partial shape straight
    // into a schema requiring all three -- every technician's config fetch 502'd.
    // getEffectiveIncentiveConfig() defaults every field itself, so even a "just enabled,
    // nothing else configured yet" state is always a complete, valid shape by the time it
    // reaches this handler -- this test pins that the response is 200, not 502, in exactly
    // that state.
    vi.mocked(systemDocsRepo.getEffectiveIncentiveConfig).mockResolvedValue({
      enabled: true, milestones: [], capFractionBps: 6000, minCountableBookingPaise: 24_900,
      updatedBy: 'admin-1', updatedAt: '2026-09-10T00:00:00.000Z',
    });

    const res = (await getTechnicianConfigHandler(req, {} as never)) as HttpResponseInit;

    expect(res.status).toBe(200);
    const body = res.jsonBody as TechnicianConfigResponse;
    expect(body.incentive).toEqual({ enabled: true, milestones: [], capFractionBps: 6000 });
  });

  it('serves a cached response within the 60s TTL without re-querying', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-06T10:00:00.000Z'));

    const first = (await getTechnicianConfigHandler(req, {} as never)) as HttpResponseInit;
    expect(vi.mocked(systemDocsRepo.getTechnicianClientConfig)).toHaveBeenCalledTimes(1);

    vi.setSystemTime(new Date('2026-05-06T10:00:30.000Z')); // +30s, within TTL
    const second = (await getTechnicianConfigHandler(req, {} as never)) as HttpResponseInit;

    expect(vi.mocked(systemDocsRepo.getTechnicianClientConfig)).toHaveBeenCalledTimes(1); // no re-query
    expect(second.jsonBody).toEqual(first.jsonBody); // same cached serverTime too
  });

  it('re-queries after the 60s TTL expires', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-06T10:00:00.000Z'));

    await getTechnicianConfigHandler(req, {} as never);
    expect(vi.mocked(systemDocsRepo.getTechnicianClientConfig)).toHaveBeenCalledTimes(1);

    vi.setSystemTime(new Date('2026-05-06T10:01:01.000Z')); // +61s, past TTL
    await getTechnicianConfigHandler(req, {} as never);

    expect(vi.mocked(systemDocsRepo.getTechnicianClientConfig)).toHaveBeenCalledTimes(2);
  });

  it('returns 502 on upstream error', async () => {
    vi.mocked(getCommissionConfig).mockRejectedValue(new Error('cosmos timeout'));

    const res = (await getTechnicianConfigHandler(req, {} as never)) as HttpResponseInit;

    expect(res.status).toBe(502);
  });
});
