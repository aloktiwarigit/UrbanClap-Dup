import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/cosmos/commission-receivable-repository.js');
vi.mock('../../src/services/commission-config.service.js');
vi.mock('../../src/cosmos/technician-repository.js');

import { commissionReceivableRepo } from '../../src/cosmos/commission-receivable-repository.js';
import * as configSvc from '../../src/services/commission-config.service.js';
import * as techRepo from '../../src/cosmos/technician-repository.js';
import {
  computeCommissionHold,
  evaluateState,
  recomputeCommissionHold,
  sweepAllHolds,
} from '../../src/services/commission-hold.service.js';
import type { EffectiveCommissionConfig } from '../../src/schemas/commission-config.js';
import type { CommissionHold } from '../../src/schemas/technician.js';

const row = (id: string, due: number, createdAt: string) => ({
  entry: {
    id, bookingId: id, technicianId: 't1', partitionKey: 't1', serviceId: 's', categoryId: 'c', bookingAmount: 1,
    commissionBps: 2000, commissionDue: due, commissionResolvedFrom: 'GLOBAL' as const, remittanceStatus: 'DUE' as const, createdAt,
  },
  etag: `"${id}"`, outstandingPaise: due,
});

const effectiveDefaults: EffectiveCommissionConfig = {
  defaultCommissionBps: 2200,
  warnThresholdPaise: 250000,
  blockThresholdPaise: 500000,
  holdEnforcementEnabled: false,
  enforceKycInDispatch: false,
  updatedBy: 'system',
  updatedAt: new Date(0).toISOString(),
  isDefault: true,
};

beforeEach(() => vi.resetAllMocks());

describe('evaluateState', () => {
  const cfg = { warnThresholdPaise: 250000, blockThresholdPaise: 500000 };
  it.each([
    [0, 'CLEAR'],
    [249999, 'CLEAR'],
    [250000, 'WARN'],
    [499999, 'WARN'],
    [500000, 'BLOCKED'],
  ])('%i → %s', (p, s) => {
    expect(evaluateState(p, cfg)).toBe(s);
  });

  it('active override forces CLEAR; expired override is ignored', () => {
    expect(evaluateState(900000, cfg, { until: '2999-01-01T00:00:00.000Z' })).toBe('CLEAR');
    expect(evaluateState(900000, cfg, { until: '2000-01-01T00:00:00.000Z' })).toBe('BLOCKED');
  });

  it('an override whose until exactly equals now is treated as expired (strict >)', () => {
    const now = new Date('2026-06-01T00:00:00.000Z');
    expect(evaluateState(900000, cfg, { until: now.toISOString() }, now)).toBe('BLOCKED');
  });
});

describe('computeCommissionHold', () => {
  it('sums outstanding from DUE rows and preserves an active override, without writing anything', async () => {
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockResolvedValue([row('b1', 300000, '2026-09-01')]);
    vi.mocked(configSvc.getCommissionConfig).mockResolvedValue(effectiveDefaults);
    vi.mocked(techRepo.readCommissionHold).mockResolvedValue({
      exists: true,
      hold: {
        outstandingPaise: 0, dueCount: 0, state: 'CLEAR', evaluatedAt: 'old',
        override: { until: '2999-01-01T00:00:00.000Z', byAdminId: 'a', reason: 'r' },
      },
    });

    const result = await computeCommissionHold('t1');

    expect(result?.hold).toMatchObject({ outstandingPaise: 300000, dueCount: 1, state: 'CLEAR', oldestDueAt: '2026-09-01' });
    expect(result?.hold.override?.reason).toBe('r');
    expect(typeof result?.readStartedAt).toBe('string');
    expect(techRepo.patchCommissionHold).not.toHaveBeenCalled();
  });

  it('returns null when the technician doc is missing', async () => {
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockResolvedValue([row('b1', 100, '2026-09-01')]);
    vi.mocked(configSvc.getCommissionConfig).mockResolvedValue(effectiveDefaults);
    vi.mocked(techRepo.readCommissionHold).mockResolvedValue({ exists: false, hold: null });

    expect(await computeCommissionHold('ghost')).toBeNull();
  });

  it('drops an expired override and evaluates against outstanding normally', async () => {
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockResolvedValue([row('b1', 600000, '2026-09-01')]);
    vi.mocked(configSvc.getCommissionConfig).mockResolvedValue(effectiveDefaults);
    vi.mocked(techRepo.readCommissionHold).mockResolvedValue({
      exists: true,
      hold: {
        outstandingPaise: 0, dueCount: 0, state: 'CLEAR', evaluatedAt: 'old',
        override: { until: '2000-01-01T00:00:00.000Z', byAdminId: 'a', reason: 'expired' },
      },
    });

    const result = await computeCommissionHold('t1');

    expect(result?.hold.override).toBeUndefined();
    expect(result?.hold.state).toBe('BLOCKED');
  });

  it('computes a technician with a hold but zero DUE rows down to CLEAR/0', async () => {
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockResolvedValue([]);
    vi.mocked(configSvc.getCommissionConfig).mockResolvedValue(effectiveDefaults);
    vi.mocked(techRepo.readCommissionHold).mockResolvedValue({
      exists: true,
      hold: { outstandingPaise: 900000, dueCount: 3, state: 'BLOCKED', evaluatedAt: 'old' },
    });

    const result = await computeCommissionHold('t1');

    expect(result?.hold).toMatchObject({ outstandingPaise: 0, dueCount: 0, state: 'CLEAR' });
    expect(result?.hold.oldestDueAt).toBeUndefined();
  });

  it('an override that expires exactly at evaluationNow is dropped from both the data and the state (P2 fix)', async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-06-01T00:00:00.000Z'));
      vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockImplementation(async () => {
        // Simulate the override's `until` landing exactly at the instant the reads finish.
        vi.setSystemTime(new Date('2026-06-01T00:00:05.000Z'));
        return [row('b1', 600000, '2026-09-01')];
      });
      vi.mocked(configSvc.getCommissionConfig).mockResolvedValue(effectiveDefaults);
      vi.mocked(techRepo.readCommissionHold).mockResolvedValue({
        exists: true,
        hold: {
          outstandingPaise: 0, dueCount: 0, state: 'CLEAR', evaluatedAt: 'old',
          override: { until: '2026-06-01T00:00:05.000Z', byAdminId: 'a', reason: 'boundary' },
        },
      });

      const result = await computeCommissionHold('t1');

      // override.until (00:00:05) is NOT strictly greater than evaluationNow (00:00:05) → expired.
      expect(result?.hold.override).toBeUndefined();
      expect(result?.hold.state).toBe('BLOCKED');
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('timestamp ordering — readStartedAt vs evaluatedAt (P2 fix)', () => {
  it('readStartedAt (passed to patchCommissionHold) is captured before every read; evaluatedAt is captured strictly after they resolve', async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-06-01T00:00:00.000Z'));
      vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockImplementation(async () => {
        vi.advanceTimersByTime(1000);
        return [row('b1', 100, '2026-09-01')];
      });
      vi.mocked(configSvc.getCommissionConfig).mockImplementation(async () => {
        vi.advanceTimersByTime(1000);
        return effectiveDefaults;
      });
      vi.mocked(techRepo.readCommissionHold).mockImplementation(async () => {
        vi.advanceTimersByTime(1000);
        return { exists: true, hold: null };
      });
      vi.mocked(techRepo.patchCommissionHold).mockResolvedValue('APPLIED');

      const { hold, status } = await recomputeCommissionHold('t1');

      expect(status).toBe('APPLIED');
      const call = vi.mocked(techRepo.patchCommissionHold).mock.calls[0]!;
      const readStartedAt = call[2];
      expect(readStartedAt).toBe('2026-06-01T00:00:00.000Z');
      // All three reads advanced the clock by 1s each (3s total) before evaluationNow is captured.
      expect(new Date(hold!.evaluatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(readStartedAt).getTime() + 3000,
      );
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('recomputeCommissionHold', () => {
  it('patches with the readStartedAt condition and returns status APPLIED', async () => {
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockResolvedValue([row('b1', 300000, '2026-09-01')]);
    vi.mocked(configSvc.getCommissionConfig).mockResolvedValue(effectiveDefaults);
    vi.mocked(techRepo.readCommissionHold).mockResolvedValue({ exists: true, hold: null });
    vi.mocked(techRepo.patchCommissionHold).mockResolvedValue('APPLIED');

    const { hold, status } = await recomputeCommissionHold('t1');

    expect(status).toBe('APPLIED');
    expect(hold).toMatchObject({ outstandingPaise: 300000, dueCount: 1 });
    const [id, patchedHold, readStartedAt] = vi.mocked(techRepo.patchCommissionHold).mock.calls[0]!;
    expect(id).toBe('t1');
    expect(patchedHold).toBe(hold);
    expect(typeof readStartedAt).toBe('string');
  });

  it('returns status MISSING (hold: null) when the technician doc is missing', async () => {
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockResolvedValue([row('b1', 100, '2026-09-01')]);
    vi.mocked(configSvc.getCommissionConfig).mockResolvedValue(effectiveDefaults);
    vi.mocked(techRepo.readCommissionHold).mockResolvedValue({ exists: false, hold: null });

    const result = await recomputeCommissionHold('ghost');

    expect(result).toEqual({ hold: null, status: 'MISSING' });
    expect(techRepo.patchCommissionHold).not.toHaveBeenCalled();
  });

  it('returns status MISSING (hold: null) when patchCommissionHold itself reports MISSING (raced delete)', async () => {
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockResolvedValue([row('b1', 100, '2026-09-01')]);
    vi.mocked(configSvc.getCommissionConfig).mockResolvedValue(effectiveDefaults);
    vi.mocked(techRepo.readCommissionHold).mockResolvedValue({ exists: true, hold: null });
    vi.mocked(techRepo.patchCommissionHold).mockResolvedValue('MISSING');

    expect(await recomputeCommissionHold('t1')).toEqual({ hold: null, status: 'MISSING' });
  });

  it('retries a STALE patch with a completely fresh read, up to 2 more times, then succeeds (P1 fix)', async () => {
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockResolvedValue([row('b1', 100, '2026-09-01')]);
    vi.mocked(configSvc.getCommissionConfig).mockResolvedValue(effectiveDefaults);
    vi.mocked(techRepo.readCommissionHold).mockResolvedValue({ exists: true, hold: null });
    vi.mocked(techRepo.patchCommissionHold)
      .mockResolvedValueOnce('STALE')
      .mockResolvedValueOnce('STALE')
      .mockResolvedValueOnce('APPLIED');

    const { hold, status } = await recomputeCommissionHold('t1');

    expect(status).toBe('APPLIED');
    expect(hold).toMatchObject({ outstandingPaise: 100 });
    expect(techRepo.patchCommissionHold).toHaveBeenCalledTimes(3);
    // Each retry re-ran the full read set (a "completely fresh read"), not a reuse of stale data.
    expect(techRepo.readCommissionHold).toHaveBeenCalledTimes(3);
    expect(commissionReceivableRepo.getOutstandingByTechnician).toHaveBeenCalledTimes(3);
    expect(configSvc.getCommissionConfig).toHaveBeenCalledTimes(3);
  });

  it('gives up with status STALE after exhausting all retries (1 initial + 2 retries = 3 attempts)', async () => {
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockResolvedValue([row('b1', 100, '2026-09-01')]);
    vi.mocked(configSvc.getCommissionConfig).mockResolvedValue(effectiveDefaults);
    vi.mocked(techRepo.readCommissionHold).mockResolvedValue({ exists: true, hold: null });
    vi.mocked(techRepo.patchCommissionHold).mockResolvedValue('STALE');

    const { hold, status } = await recomputeCommissionHold('t1');

    expect(status).toBe('STALE');
    expect(hold).toMatchObject({ outstandingPaise: 100, dueCount: 1 });
    expect(techRepo.patchCommissionHold).toHaveBeenCalledTimes(3);
  });

  it('a MISSING on a retry attempt stops retrying immediately', async () => {
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockResolvedValue([row('b1', 100, '2026-09-01')]);
    vi.mocked(configSvc.getCommissionConfig).mockResolvedValue(effectiveDefaults);
    vi.mocked(techRepo.readCommissionHold).mockResolvedValue({ exists: true, hold: null });
    vi.mocked(techRepo.patchCommissionHold)
      .mockResolvedValueOnce('STALE')
      .mockResolvedValueOnce('MISSING');

    const result = await recomputeCommissionHold('t1');

    expect(result).toEqual({ hold: null, status: 'MISSING' });
    expect(techRepo.patchCommissionHold).toHaveBeenCalledTimes(2);
  });
});

describe('sweepAllHolds — FULL scope (default)', () => {
  it('unions technicians from sumDueGroupedByTechnician and listAllTechniciansWithHold, recomputes each, counts drift only on APPLIED', async () => {
    vi.mocked(commissionReceivableRepo.sumDueGroupedByTechnician).mockResolvedValue([
      { technicianId: 't1', outstandingPaise: 300000, dueCount: 1, oldestDueAt: '2026-09-01' },
    ]);
    vi.mocked(techRepo.listAllTechniciansWithHold).mockResolvedValue([
      { id: 't2', commissionHold: { outstandingPaise: 0, dueCount: 0, state: 'CLEAR', evaluatedAt: 'old' } as CommissionHold },
    ]);
    vi.mocked(configSvc.getCommissionConfig).mockResolvedValue(effectiveDefaults);
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockImplementation(async (id: string) =>
      id === 't1' ? [row('b1', 300000, '2026-09-01')] : []);
    vi.mocked(techRepo.readCommissionHold).mockImplementation(async (id: string) =>
      id === 't1'
        ? { exists: true, hold: null }
        : { exists: true, hold: { outstandingPaise: 0, dueCount: 0, state: 'CLEAR', evaluatedAt: 'old' } });
    vi.mocked(techRepo.patchCommissionHold).mockResolvedValue('APPLIED');

    const result = await sweepAllHolds();

    expect(result.recomputed).toBe(2);
    expect(result.drifted).toBe(1);
  });

  it('does not count drift when the recompute status was STALE (P2 fix)', async () => {
    vi.mocked(commissionReceivableRepo.sumDueGroupedByTechnician).mockResolvedValue([
      { technicianId: 't1', outstandingPaise: 300000, dueCount: 1, oldestDueAt: '2026-09-01' },
    ]);
    vi.mocked(techRepo.listAllTechniciansWithHold).mockResolvedValue([]);
    vi.mocked(configSvc.getCommissionConfig).mockResolvedValue(effectiveDefaults);
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockResolvedValue([row('b1', 300000, '2026-09-01')]);
    vi.mocked(techRepo.readCommissionHold).mockResolvedValue({ exists: true, hold: null });
    vi.mocked(techRepo.patchCommissionHold).mockResolvedValue('STALE'); // every attempt STALE → gives up STALE

    const result = await sweepAllHolds();

    expect(result.recomputed).toBe(1);
    expect(result.drifted).toBe(0);
  });

  it('logs each drift via opts.log', async () => {
    vi.mocked(commissionReceivableRepo.sumDueGroupedByTechnician).mockResolvedValue([
      { technicianId: 't1', outstandingPaise: 300000, dueCount: 1, oldestDueAt: '2026-09-01' },
    ]);
    vi.mocked(techRepo.listAllTechniciansWithHold).mockResolvedValue([]);
    vi.mocked(configSvc.getCommissionConfig).mockResolvedValue(effectiveDefaults);
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockResolvedValue([row('b1', 300000, '2026-09-01')]);
    vi.mocked(techRepo.readCommissionHold).mockResolvedValue({ exists: true, hold: null });
    vi.mocked(techRepo.patchCommissionHold).mockResolvedValue('APPLIED');
    const log = vi.fn();

    await sweepAllHolds({ log });

    expect(log).toHaveBeenCalledWith(expect.stringContaining('t1'));
  });

  it('dryRun evaluates via computeCommissionHold and counts drift, but never calls patchCommissionHold (P2 fix)', async () => {
    vi.mocked(commissionReceivableRepo.sumDueGroupedByTechnician).mockResolvedValue([
      { technicianId: 't1', outstandingPaise: 300000, dueCount: 1, oldestDueAt: 'x' },
    ]);
    vi.mocked(techRepo.listAllTechniciansWithHold).mockResolvedValue([]);
    vi.mocked(configSvc.getCommissionConfig).mockResolvedValue(effectiveDefaults);
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockResolvedValue([row('b1', 300000, '2026-09-01')]);
    vi.mocked(techRepo.readCommissionHold).mockResolvedValue({ exists: true, hold: null });

    const result = await sweepAllHolds({ dryRun: true });

    expect(result).toEqual({ recomputed: 1, drifted: 1 }); // before: none/0, computed: WARN/300000 → drift
    expect(techRepo.patchCommissionHold).not.toHaveBeenCalled();
    expect(commissionReceivableRepo.getOutstandingByTechnician).toHaveBeenCalledWith('t1');
  });

  it('dryRun on a technician with no drift reports drifted: 0', async () => {
    vi.mocked(commissionReceivableRepo.sumDueGroupedByTechnician).mockResolvedValue([]);
    vi.mocked(techRepo.listAllTechniciansWithHold).mockResolvedValue([
      { id: 't1', commissionHold: { outstandingPaise: 0, dueCount: 0, state: 'CLEAR', evaluatedAt: 'old' } as CommissionHold },
    ]);
    vi.mocked(configSvc.getCommissionConfig).mockResolvedValue(effectiveDefaults);
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockResolvedValue([]);
    vi.mocked(techRepo.readCommissionHold).mockResolvedValue({
      exists: true,
      hold: { outstandingPaise: 0, dueCount: 0, state: 'CLEAR', evaluatedAt: 'old' },
    });

    const result = await sweepAllHolds({ dryRun: true });

    expect(result).toEqual({ recomputed: 1, drifted: 0 });
    expect(techRepo.patchCommissionHold).not.toHaveBeenCalled();
  });

  it('handles an empty system', async () => {
    vi.mocked(commissionReceivableRepo.sumDueGroupedByTechnician).mockResolvedValue([]);
    vi.mocked(techRepo.listAllTechniciansWithHold).mockResolvedValue([]);

    expect(await sweepAllHolds()).toEqual({ recomputed: 0, drifted: 0 });
  });
});

describe('sweepAllHolds — EXPIRED_OVERRIDES scope', () => {
  it('recomputes only technicians returned by listTechniciansWithExpiredOverride, ignoring the FULL-scope sources', async () => {
    vi.mocked(techRepo.listTechniciansWithExpiredOverride).mockResolvedValue(['t9']);
    vi.mocked(configSvc.getCommissionConfig).mockResolvedValue(effectiveDefaults);
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockResolvedValue([]);
    vi.mocked(techRepo.readCommissionHold).mockResolvedValue({
      exists: true,
      hold: {
        outstandingPaise: 900000, dueCount: 1, state: 'BLOCKED', evaluatedAt: 'old',
        override: { until: '2000-01-01T00:00:00.000Z', byAdminId: 'a', reason: 'expired' },
      },
    });
    vi.mocked(techRepo.patchCommissionHold).mockResolvedValue('APPLIED');

    const result = await sweepAllHolds({ scope: 'EXPIRED_OVERRIDES' });

    expect(result.recomputed).toBe(1);
    expect(techRepo.listTechniciansWithExpiredOverride).toHaveBeenCalledWith(expect.any(String));
    expect(commissionReceivableRepo.sumDueGroupedByTechnician).not.toHaveBeenCalled();
    expect(techRepo.listAllTechniciansWithHold).not.toHaveBeenCalled();
    expect(techRepo.readCommissionHold).toHaveBeenCalledWith('t9');
  });

  it('an empty expired-override set recomputes nothing', async () => {
    vi.mocked(techRepo.listTechniciansWithExpiredOverride).mockResolvedValue([]);

    expect(await sweepAllHolds({ scope: 'EXPIRED_OVERRIDES' })).toEqual({ recomputed: 0, drifted: 0 });
    expect(techRepo.readCommissionHold).not.toHaveBeenCalled();
  });
});
