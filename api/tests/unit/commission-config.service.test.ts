import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks (must come before imports) ──────────────────────────────────────────

vi.mock('../../src/cosmos/commission-config-repository.js', () => ({
  commissionConfigRepo: {
    getCommissionConfig: vi.fn(),
  },
}));

vi.mock('@sentry/node', () => ({ captureMessage: vi.fn(), captureException: vi.fn() }));

// ── Imports ───────────────────────────────────────────────────────────────────

import {
  resolveCommissionBps,
  getGlobalCommissionBps,
  DEFAULT_COMMISSION_BPS,
  _resetCommissionConfigCacheForTest,
} from '../../src/services/commission-config.service.js';
import { commissionConfigRepo } from '../../src/cosmos/commission-config-repository.js';

// ── resolveCommissionBps ──────────────────────────────────────────────────────

describe('resolveCommissionBps', () => {
  it('resolves from SERVICE when serviceBps is valid', () => {
    const result = resolveCommissionBps({ serviceBps: 2000, categoryBps: 2500, globalBps: 3000 });
    expect(result).toEqual({ bps: 2000, from: 'SERVICE' });
  });

  it('falls through to CATEGORY when serviceBps is undefined', () => {
    const result = resolveCommissionBps({ categoryBps: 2500, globalBps: 3000 });
    expect(result).toEqual({ bps: 2500, from: 'CATEGORY' });
  });

  it('falls through to GLOBAL when both serviceBps and categoryBps are undefined', () => {
    const result = resolveCommissionBps({ globalBps: 2200 });
    expect(result).toEqual({ bps: 2200, from: 'GLOBAL' });
  });

  it('falls through to CATEGORY when serviceBps is below minimum (invalid)', () => {
    const result = resolveCommissionBps({ serviceBps: 1000, categoryBps: 2500, globalBps: 3000 });
    expect(result).toEqual({ bps: 2500, from: 'CATEGORY' });
  });

  it('falls through to CATEGORY when serviceBps is above maximum (invalid)', () => {
    const result = resolveCommissionBps({ serviceBps: 4000, categoryBps: 2500, globalBps: 3000 });
    expect(result).toEqual({ bps: 2500, from: 'CATEGORY' });
  });

  it('falls through to CATEGORY when serviceBps is not an integer (invalid)', () => {
    const result = resolveCommissionBps({ serviceBps: 20.5, categoryBps: 2500, globalBps: 3000 });
    expect(result).toEqual({ bps: 2500, from: 'CATEGORY' });
  });

  it('falls through to GLOBAL when categoryBps is invalid', () => {
    const result = resolveCommissionBps({ categoryBps: 500, globalBps: 2200 });
    expect(result).toEqual({ bps: 2200, from: 'GLOBAL' });
  });

  it('falls through to GLOBAL when categoryBps is not an integer', () => {
    const result = resolveCommissionBps({ categoryBps: 25.5, globalBps: 2200 });
    expect(result).toEqual({ bps: 2200, from: 'GLOBAL' });
  });

  it('throws when globalBps is out of range', () => {
    expect(() => resolveCommissionBps({ globalBps: 1000 })).toThrow(
      'commission config invalid: globalBps out of range',
    );
  });

  it('throws when globalBps is above maximum', () => {
    expect(() => resolveCommissionBps({ globalBps: 4000 })).toThrow(
      'commission config invalid: globalBps out of range',
    );
  });

  it('throws when globalBps is not an integer', () => {
    expect(() => resolveCommissionBps({ globalBps: 22.5 })).toThrow(
      'commission config invalid: globalBps out of range',
    );
  });

  it('accepts boundary value MIN (1500) as valid', () => {
    const result = resolveCommissionBps({ globalBps: 1500 });
    expect(result).toEqual({ bps: 1500, from: 'GLOBAL' });
  });

  it('accepts boundary value MAX (3500) as valid', () => {
    const result = resolveCommissionBps({ serviceBps: 3500, globalBps: 2200 });
    expect(result).toEqual({ bps: 3500, from: 'SERVICE' });
  });

  it('returns correct from field for each resolved source', () => {
    expect(resolveCommissionBps({ serviceBps: 2000, globalBps: 2200 }).from).toBe('SERVICE');
    expect(resolveCommissionBps({ categoryBps: 2000, globalBps: 2200 }).from).toBe('CATEGORY');
    expect(resolveCommissionBps({ globalBps: 2200 }).from).toBe('GLOBAL');
  });
});

// ── getGlobalCommissionBps ────────────────────────────────────────────────────

describe('getGlobalCommissionBps', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    _resetCommissionConfigCacheForTest();
  });

  it('returns defaultCommissionBps from the doc when the repo returns a doc', async () => {
    vi.mocked(commissionConfigRepo.getCommissionConfig).mockResolvedValue({
      id: 'commission-config',
      defaultCommissionBps: 2500,
      updatedBy: 'admin',
      updatedAt: '2026-05-24T00:00:00.000Z',
    });

    const bps = await getGlobalCommissionBps();
    expect(bps).toBe(2500);
  });

  it(`returns DEFAULT_COMMISSION_BPS (${DEFAULT_COMMISSION_BPS}) when repo returns null`, async () => {
    vi.mocked(commissionConfigRepo.getCommissionConfig).mockResolvedValue(null);

    const bps = await getGlobalCommissionBps();
    expect(bps).toBe(DEFAULT_COMMISSION_BPS);
    expect(DEFAULT_COMMISSION_BPS).toBe(2200);
  });

  it('caches the result so the repo is only called once', async () => {
    vi.mocked(commissionConfigRepo.getCommissionConfig).mockResolvedValue({
      id: 'commission-config',
      defaultCommissionBps: 2800,
      updatedBy: 'admin',
      updatedAt: '2026-05-24T00:00:00.000Z',
    });

    const first = await getGlobalCommissionBps();
    const second = await getGlobalCommissionBps();

    expect(first).toBe(2800);
    expect(second).toBe(2800);
    expect(vi.mocked(commissionConfigRepo.getCommissionConfig)).toHaveBeenCalledTimes(1);
  });

  it('re-fetches after cache reset', async () => {
    vi.mocked(commissionConfigRepo.getCommissionConfig).mockResolvedValue({
      id: 'commission-config',
      defaultCommissionBps: 2800,
      updatedBy: 'admin',
      updatedAt: '2026-05-24T00:00:00.000Z',
    });

    await getGlobalCommissionBps();
    _resetCommissionConfigCacheForTest();
    await getGlobalCommissionBps();

    expect(vi.mocked(commissionConfigRepo.getCommissionConfig)).toHaveBeenCalledTimes(2);
  });

  it('re-fetches after TTL expires', async () => {
    vi.useFakeTimers();
    const NOW = Date.now();
    vi.setSystemTime(NOW);

    vi.mocked(commissionConfigRepo.getCommissionConfig).mockResolvedValue({
      id: 'commission-config',
      defaultCommissionBps: 2800,
      updatedBy: 'admin',
      updatedAt: '2026-05-24T00:00:00.000Z',
    });

    await getGlobalCommissionBps();

    // Advance time past TTL (5 minutes)
    vi.advanceTimersByTime(6 * 60 * 1000);

    await getGlobalCommissionBps();
    expect(vi.mocked(commissionConfigRepo.getCommissionConfig)).toHaveBeenCalledTimes(2);
  });
});
