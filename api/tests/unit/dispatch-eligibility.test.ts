import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../src/services/commission-config.service.js', () => ({
  getCommissionConfig: vi.fn(),
}));

import { getCommissionConfig } from '../../src/services/commission-config.service.js';
import {
  gatesToPredicateOptions,
  loadDispatchGates,
  logShadowExclusions,
} from '../../src/services/dispatch-eligibility.js';
import type { EffectiveCommissionConfig } from '../../src/schemas/commission-config.js';
import type { TechnicianProfile } from '../../src/schemas/technician.js';

const cfg = (over: Partial<EffectiveCommissionConfig> = {}): EffectiveCommissionConfig => ({
  defaultCommissionBps: 2200,
  warnThresholdPaise: 250000,
  blockThresholdPaise: 500000,
  holdEnforcementEnabled: false,
  enforceKycInDispatch: false,
  updatedBy: 'system',
  updatedAt: new Date(0).toISOString(),
  ...over,
});

const tech = (id: string, hold?: TechnicianProfile['commissionHold']): TechnicianProfile => ({
  id,
  technicianId: id,
  location: { type: 'Point', coordinates: [77.59, 12.97] },
  skills: ['svc-plumbing'],
  availabilityWindows: [],
  isOnline: true,
  isAvailable: true,
  kycStatus: 'APPROVED',
  ...(hold ? { commissionHold: hold } : {}),
});

const blocked = {
  outstandingPaise: 600000, dueCount: 3, state: 'BLOCKED' as const,
  evaluatedAt: '2026-09-08T00:00:00.000Z',
};

beforeEach(() => vi.resetAllMocks());
afterEach(() => vi.restoreAllMocks());

describe('loadDispatchGates', () => {
  it('maps the config flags through', async () => {
    vi.mocked(getCommissionConfig).mockResolvedValue(
      cfg({ holdEnforcementEnabled: true, enforceKycInDispatch: true }),
    );
    expect(await loadDispatchGates()).toEqual({
      holdEnforcementEnabled: true,
      enforceKycInDispatch: true,
    });
  });

  it('FAILS OPEN: a config read failure yields both gates off and never throws', async () => {
    vi.mocked(getCommissionConfig).mockRejectedValue(new Error('cosmos down'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await loadDispatchGates()).toEqual({
      holdEnforcementEnabled: false,
      enforceKycInDispatch: false,
    });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('DISPATCH_GATES_UNAVAILABLE'));
  });
});

describe('gatesToPredicateOptions', () => {
  it('is a pure rename with no ranking-relevant output', () => {
    expect(gatesToPredicateOptions({ holdEnforcementEnabled: true, enforceKycInDispatch: false }))
      .toEqual({ excludeBlockedHolds: true, requireKyc: false });
  });
});

describe('logShadowExclusions', () => {
  it('logs one line per BLOCKED candidate and returns the count', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const n = logShadowExclusions('bk-1', [tech('t1'), tech('t2', blocked), tech('t3', blocked)]);
    expect(n).toBe(2);
    expect(log).toHaveBeenCalledTimes(2);
    expect(log).toHaveBeenCalledWith(
      'DISPATCH_HOLD_SHADOW_EXCLUSION bookingId=bk-1 technicianId=t2 state=BLOCKED outstandingPaise=600000 evaluatedAt=2026-09-08T00:00:00.000Z',
    );
  });

  it('logs nothing when no candidate is blocked, including candidates with no hold at all', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    expect(logShadowExclusions('bk-1', [tech('t1'), tech('t2', { ...blocked, state: 'WARN' })])).toBe(0);
    expect(log).not.toHaveBeenCalled();
  });
});
