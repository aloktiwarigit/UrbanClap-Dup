import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/cosmos/commission-receivable-repository.js');
vi.mock('../../src/services/commission-config.service.js');
vi.mock('../../src/cosmos/technician-repository.js');

import { commissionReceivableRepo } from '../../src/cosmos/commission-receivable-repository.js';
import * as configSvc from '../../src/services/commission-config.service.js';
import * as techRepo from '../../src/cosmos/technician-repository.js';
import { evaluateState, recomputeCommissionHold, sweepAllHolds } from '../../src/services/commission-hold.service.js';
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

describe('recomputeCommissionHold', () => {
  it('sums outstanding from DUE rows, preserves an active override, patches with readStartedAt condition', async () => {
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockResolvedValue([row('b1', 300000, '2026-09-01')]);
    vi.mocked(configSvc.getCommissionConfig).mockResolvedValue(effectiveDefaults);
    vi.mocked(techRepo.readCommissionHold).mockResolvedValue({
      exists: true,
      hold: {
        outstandingPaise: 0, dueCount: 0, state: 'CLEAR', evaluatedAt: 'old',
        override: { until: '2999-01-01T00:00:00.000Z', byAdminId: 'a', reason: 'r' },
      },
    });
    vi.mocked(techRepo.patchCommissionHold).mockResolvedValue('APPLIED');

    const hold = await recomputeCommissionHold('t1');

    expect(hold).toMatchObject({ outstandingPaise: 300000, dueCount: 1, state: 'CLEAR', oldestDueAt: '2026-09-01' });
    expect(hold?.override?.reason).toBe('r');
    const [id, patchedHold, readStartedAt] = vi.mocked(techRepo.patchCommissionHold).mock.calls[0]!;
    expect(id).toBe('t1');
    expect(patchedHold).toBe(hold);
    expect(typeof readStartedAt).toBe('string');
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
    vi.mocked(techRepo.patchCommissionHold).mockResolvedValue('APPLIED');

    const hold = await recomputeCommissionHold('t1');

    expect(hold?.override).toBeUndefined();
    expect(hold?.state).toBe('BLOCKED');
  });

  it('recomputes a technician with a hold but zero DUE rows down to CLEAR/0', async () => {
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockResolvedValue([]);
    vi.mocked(configSvc.getCommissionConfig).mockResolvedValue(effectiveDefaults);
    vi.mocked(techRepo.readCommissionHold).mockResolvedValue({
      exists: true,
      hold: { outstandingPaise: 900000, dueCount: 3, state: 'BLOCKED', evaluatedAt: 'old' },
    });
    vi.mocked(techRepo.patchCommissionHold).mockResolvedValue('APPLIED');

    const hold = await recomputeCommissionHold('t1');

    expect(hold).toMatchObject({ outstandingPaise: 0, dueCount: 0, state: 'CLEAR' });
    expect(hold?.oldestDueAt).toBeUndefined();
  });

  it('returns null when the technician doc is missing', async () => {
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockResolvedValue([row('b1', 100, '2026-09-01')]);
    vi.mocked(configSvc.getCommissionConfig).mockResolvedValue(effectiveDefaults);
    vi.mocked(techRepo.readCommissionHold).mockResolvedValue({ exists: false, hold: null });

    const hold = await recomputeCommissionHold('ghost');

    expect(hold).toBeNull();
    expect(techRepo.patchCommissionHold).not.toHaveBeenCalled();
  });

  it('never throws on STALE — returns the computed (superseded) hold', async () => {
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockResolvedValue([row('b1', 100, '2026-09-01')]);
    vi.mocked(configSvc.getCommissionConfig).mockResolvedValue(effectiveDefaults);
    vi.mocked(techRepo.readCommissionHold).mockResolvedValue({ exists: true, hold: null });
    vi.mocked(techRepo.patchCommissionHold).mockResolvedValue('STALE');

    const hold = await recomputeCommissionHold('t1');

    expect(hold).toMatchObject({ outstandingPaise: 100, dueCount: 1 });
  });

  it('also returns null when patchCommissionHold itself reports MISSING (raced delete)', async () => {
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockResolvedValue([row('b1', 100, '2026-09-01')]);
    vi.mocked(configSvc.getCommissionConfig).mockResolvedValue(effectiveDefaults);
    vi.mocked(techRepo.readCommissionHold).mockResolvedValue({ exists: true, hold: null });
    vi.mocked(techRepo.patchCommissionHold).mockResolvedValue('MISSING');

    expect(await recomputeCommissionHold('t1')).toBeNull();
  });
});

describe('sweepAllHolds', () => {
  it('unions technicians from sumDueGroupedByTechnician and listTechniciansWithHold, recomputes each, counts drift', async () => {
    vi.mocked(commissionReceivableRepo.sumDueGroupedByTechnician).mockResolvedValueOnce({
      groups: [{ technicianId: 't1', outstandingPaise: 300000, dueCount: 1, oldestDueAt: '2026-09-01' }],
    });
    vi.mocked(techRepo.listTechniciansWithHold).mockResolvedValueOnce({
      items: [{ id: 't2', commissionHold: { outstandingPaise: 0, dueCount: 0, state: 'CLEAR', evaluatedAt: 'old' } as CommissionHold }],
    });
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

  it('logs each drift via opts.log', async () => {
    vi.mocked(commissionReceivableRepo.sumDueGroupedByTechnician).mockResolvedValueOnce({
      groups: [{ technicianId: 't1', outstandingPaise: 300000, dueCount: 1, oldestDueAt: '2026-09-01' }],
    });
    vi.mocked(techRepo.listTechniciansWithHold).mockResolvedValueOnce({ items: [] });
    vi.mocked(configSvc.getCommissionConfig).mockResolvedValue(effectiveDefaults);
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockResolvedValue([row('b1', 300000, '2026-09-01')]);
    vi.mocked(techRepo.readCommissionHold).mockResolvedValue({ exists: true, hold: null });
    vi.mocked(techRepo.patchCommissionHold).mockResolvedValue('APPLIED');
    const log = vi.fn();

    await sweepAllHolds({ log });

    expect(log).toHaveBeenCalledWith(expect.stringContaining('t1'));
  });

  it('dryRun counts recomputed but never calls patchCommissionHold', async () => {
    vi.mocked(commissionReceivableRepo.sumDueGroupedByTechnician).mockResolvedValueOnce({
      groups: [{ technicianId: 't1', outstandingPaise: 100, dueCount: 1, oldestDueAt: 'x' }],
    });
    vi.mocked(techRepo.listTechniciansWithHold).mockResolvedValueOnce({ items: [] });
    vi.mocked(techRepo.readCommissionHold).mockResolvedValue({ exists: true, hold: null });

    const result = await sweepAllHolds({ dryRun: true });

    expect(result).toEqual({ recomputed: 1, drifted: 0 });
    expect(techRepo.patchCommissionHold).not.toHaveBeenCalled();
    expect(commissionReceivableRepo.getOutstandingByTechnician).not.toHaveBeenCalled();
  });

  it('handles an empty system', async () => {
    vi.mocked(commissionReceivableRepo.sumDueGroupedByTechnician).mockResolvedValueOnce({ groups: [] });
    vi.mocked(techRepo.listTechniciansWithHold).mockResolvedValueOnce({ items: [] });

    expect(await sweepAllHolds()).toEqual({ recomputed: 0, drifted: 0 });
  });

  it('pages through both sources via continuationToken', async () => {
    vi.mocked(commissionReceivableRepo.sumDueGroupedByTechnician)
      .mockResolvedValueOnce({ groups: [{ technicianId: 't1', outstandingPaise: 1, dueCount: 1, oldestDueAt: 'x' }], continuationToken: 'tok1' })
      .mockResolvedValueOnce({ groups: [{ technicianId: 't2', outstandingPaise: 1, dueCount: 1, oldestDueAt: 'x' }] });
    vi.mocked(techRepo.listTechniciansWithHold)
      .mockResolvedValueOnce({ items: [{ id: 't3', commissionHold: { outstandingPaise: 0, dueCount: 0, state: 'CLEAR', evaluatedAt: 'old' } as CommissionHold }], continuationToken: 'tok2' })
      .mockResolvedValueOnce({ items: [] });
    vi.mocked(configSvc.getCommissionConfig).mockResolvedValue(effectiveDefaults);
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockResolvedValue([]);
    vi.mocked(techRepo.readCommissionHold).mockResolvedValue({ exists: true, hold: null });
    vi.mocked(techRepo.patchCommissionHold).mockResolvedValue('APPLIED');

    const result = await sweepAllHolds();

    expect(result.recomputed).toBe(3);
    expect(vi.mocked(commissionReceivableRepo.sumDueGroupedByTechnician).mock.calls[1]).toEqual(['tok1']);
    expect(vi.mocked(techRepo.listTechniciansWithHold).mock.calls[1]).toEqual(['tok2']);
  });
});
