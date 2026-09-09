import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../src/cosmos/commission-receivable-repository.js');
vi.mock('../../src/services/commission-config.service.js');
vi.mock('../../src/cosmos/technician-repository.js');

import { commissionReceivableRepo } from '../../src/cosmos/commission-receivable-repository.js';
import * as configSvc from '../../src/services/commission-config.service.js';
import * as techRepo from '../../src/cosmos/technician-repository.js';
import { assertCanAccept } from '../../src/services/commission-hold.service.js';
import type { EffectiveCommissionConfig } from '../../src/schemas/commission-config.js';
import type { CommissionHold } from '../../src/schemas/technician.js';

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

const row = (id: string, due: number) => ({
  entry: {
    id, bookingId: id, technicianId: 't1', partitionKey: 't1', serviceId: 's', categoryId: 'c',
    bookingAmount: 1, commissionBps: 2000, commissionDue: due,
    commissionResolvedFrom: 'GLOBAL' as const, remittanceStatus: 'DUE' as const,
    createdAt: '2026-09-01T00:00:00.000Z',
  },
  etag: `"${id}"`,
  outstandingPaise: due,
});

const existingHold = (over: Partial<CommissionHold> = {}): CommissionHold => ({
  outstandingPaise: 0, dueCount: 0, state: 'CLEAR', evaluatedAt: '2026-09-01T00:00:00.000Z', ...over,
});

/** Wire the three reads computeCommissionHold performs. */
function arrange(opts: {
  enforcement: boolean;
  outstanding: number;
  hold?: CommissionHold;
  exists?: boolean;
}) {
  vi.mocked(configSvc.getCommissionConfig).mockResolvedValue(
    cfg({ holdEnforcementEnabled: opts.enforcement }),
  );
  vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockResolvedValue(
    opts.outstanding > 0 ? [row('bk-1', opts.outstanding)] : [],
  );
  vi.mocked(techRepo.readCommissionHold).mockResolvedValue({
    exists: opts.exists ?? true,
    ...(opts.hold ? { hold: opts.hold } : { hold: existingHold() }),
  } as never);
}

beforeEach(() => vi.resetAllMocks());
afterEach(() => vi.restoreAllMocks());

describe('assertCanAccept — enforcement OFF (dark launch)', () => {
  it('ALLOWS a technician far over the block threshold', async () => {
    arrange({ enforcement: false, outstanding: 900000 });
    expect(await assertCanAccept('t1')).toEqual({ decision: 'ALLOW' });
  });

  it('logs a shadow line when it would have blocked', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    arrange({ enforcement: false, outstanding: 900000 });
    await assertCanAccept('t1');
    expect(log).toHaveBeenCalledWith(
      'ACCEPT_HOLD_SHADOW_BLOCK technicianId=t1 outstandingPaise=900000 blockThresholdPaise=500000',
    );
  });

  it('logs nothing when the technician is under the threshold', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    arrange({ enforcement: false, outstanding: 1000 });
    await assertCanAccept('t1');
    expect(log).not.toHaveBeenCalled();
  });

  it('ALLOWS and swallows the error when the ledger read throws', async () => {
    vi.mocked(configSvc.getCommissionConfig).mockResolvedValue(cfg({ holdEnforcementEnabled: false }));
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockRejectedValue(new Error('boom'));
    vi.mocked(techRepo.readCommissionHold).mockResolvedValue({ exists: true, hold: existingHold() } as never);
    expect(await assertCanAccept('t1')).toEqual({ decision: 'ALLOW' });
  });

  it('ALLOWS when the config read itself throws', async () => {
    vi.mocked(configSvc.getCommissionConfig).mockRejectedValue(new Error('cosmos down'));
    expect(await assertCanAccept('t1')).toEqual({ decision: 'ALLOW' });
  });
});

describe('assertCanAccept — enforcement ON', () => {
  it('BLOCKS at exactly the block threshold and reports both numbers', async () => {
    arrange({ enforcement: true, outstanding: 500000 });
    expect(await assertCanAccept('t1')).toEqual({
      decision: 'BLOCKED', outstandingPaise: 500000, blockThresholdPaise: 500000,
    });
  });

  it('ALLOWS one paise under the block threshold (WARN is not a block)', async () => {
    arrange({ enforcement: true, outstanding: 499999 });
    expect(await assertCanAccept('t1')).toEqual({ decision: 'ALLOW' });
  });

  it('ALLOWS a CLEAR technician', async () => {
    arrange({ enforcement: true, outstanding: 0 });
    expect(await assertCanAccept('t1')).toEqual({ decision: 'ALLOW' });
  });

  it('honours an ACTIVE admin override and allows despite a large balance', async () => {
    arrange({
      enforcement: true,
      outstanding: 900000,
      hold: existingHold({
        override: { until: '2999-01-01T00:00:00.000Z', byAdminId: 'a1', reason: 'pilot' },
      }),
    });
    expect(await assertCanAccept('t1')).toEqual({ decision: 'ALLOW' });
  });

  it('BLOCKS once the override has expired', async () => {
    arrange({
      enforcement: true,
      outstanding: 900000,
      hold: existingHold({
        override: { until: '2000-01-01T00:00:00.000Z', byAdminId: 'a1', reason: 'lapsed' },
      }),
    });
    expect(await assertCanAccept('t1')).toMatchObject({ decision: 'BLOCKED' });
  });

  it('FAILS CLOSED as INDETERMINATE when the ledger read throws', async () => {
    vi.mocked(configSvc.getCommissionConfig).mockResolvedValue(cfg({ holdEnforcementEnabled: true }));
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockRejectedValue(new Error('boom'));
    vi.mocked(techRepo.readCommissionHold).mockResolvedValue({ exists: true, hold: existingHold() } as never);
    const res = await assertCanAccept('t1');
    expect(res.decision).toBe('INDETERMINATE');
  });

  it('FAILS CLOSED as INDETERMINATE when the technician doc does not exist', async () => {
    arrange({ enforcement: true, outstanding: 0, exists: false });
    expect(await assertCanAccept('t1')).toEqual({
      decision: 'INDETERMINATE', reason: 'TECHNICIAN_NOT_FOUND',
    });
  });

  it('uses the LIVE single-partition sum, not the cached hold', async () => {
    // Cached hold says CLEAR/0; the live ledger says 900000. The live number must win.
    arrange({ enforcement: true, outstanding: 900000, hold: existingHold({ state: 'CLEAR' }) });
    expect(await assertCanAccept('t1')).toMatchObject({ decision: 'BLOCKED', outstandingPaise: 900000 });
    expect(commissionReceivableRepo.getOutstandingByTechnician).toHaveBeenCalledWith('t1');
  });

  it('never writes: no patchCommissionHold on any path', async () => {
    arrange({ enforcement: true, outstanding: 900000 });
    await assertCanAccept('t1');
    expect(techRepo.patchCommissionHold).not.toHaveBeenCalled();
  });
});

// ── Hardening: the gate must never throw, and must never write, under ANY read failure ──────────
//
// `assertCanAccept` reads the config twice: once to learn whether enforcement is on, and once
// after the hold is computed to report `blockThresholdPaise`. Both are served from the same
// 5-minute in-process cache, but the second can still miss the cache and hit a Cosmos error. If
// that rejection escaped, an enforcement-OFF request would throw — breaking the dark-launch
// contract that nothing user-visible changes while the flag is off.

/** Mocks the config service so the Nth call (0-indexed) onwards rejects. */
function configRejectsFromCall(n: number, enforcement: boolean) {
  const mock = vi.mocked(configSvc.getCommissionConfig);
  for (let i = 0; i < n; i++) mock.mockResolvedValueOnce(cfg({ holdEnforcementEnabled: enforcement }));
  mock.mockRejectedValue(new Error('config cache miss + cosmos down'));
}

describe('assertCanAccept — the second config read can never escape', () => {
  it('enforcement OFF: still ALLOWS when the post-compute config read rejects', async () => {
    // Call 0 = the enforcement probe, call 1 = computeCommissionHold's own read, call 2 = the
    // threshold read this test knocks over.
    configRejectsFromCall(2, false);
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockResolvedValue([row('bk-1', 900000)]);
    vi.mocked(techRepo.readCommissionHold).mockResolvedValue({ exists: true, hold: existingHold() } as never);
    expect(await assertCanAccept('t1')).toEqual({ decision: 'ALLOW' });
  });

  it('enforcement OFF: shadow-logs with the snapshot threshold when the second read rejects', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    configRejectsFromCall(2, false);
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockResolvedValue([row('bk-1', 900000)]);
    vi.mocked(techRepo.readCommissionHold).mockResolvedValue({ exists: true, hold: existingHold() } as never);
    await assertCanAccept('t1');
    expect(log).toHaveBeenCalledWith(
      'ACCEPT_HOLD_SHADOW_BLOCK technicianId=t1 outstandingPaise=900000 blockThresholdPaise=500000',
    );
  });

  it('enforcement ON: still reports BLOCKED with the snapshot threshold, never throws', async () => {
    configRejectsFromCall(2, true);
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockResolvedValue([row('bk-1', 900000)]);
    vi.mocked(techRepo.readCommissionHold).mockResolvedValue({ exists: true, hold: existingHold() } as never);
    expect(await assertCanAccept('t1')).toEqual({
      decision: 'BLOCKED', outstandingPaise: 900000, blockThresholdPaise: 500000,
    });
  });
});

describe('assertCanAccept — enforcement OFF never throws, whatever fails', () => {
  const failures: Array<[string, () => void]> = [
    ['config read rejects', () => {
      vi.mocked(configSvc.getCommissionConfig).mockRejectedValue(new Error('down'));
    }],
    ['ledger read rejects', () => {
      vi.mocked(configSvc.getCommissionConfig).mockResolvedValue(cfg());
      vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockRejectedValue(new Error('down'));
      vi.mocked(techRepo.readCommissionHold).mockResolvedValue({ exists: true, hold: existingHold() } as never);
    }],
    ['hold read rejects', () => {
      vi.mocked(configSvc.getCommissionConfig).mockResolvedValue(cfg());
      vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockResolvedValue([]);
      vi.mocked(techRepo.readCommissionHold).mockRejectedValue(new Error('down'));
    }],
    ['every read rejects', () => {
      vi.mocked(configSvc.getCommissionConfig).mockRejectedValue(new Error('down'));
      vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockRejectedValue(new Error('down'));
      vi.mocked(techRepo.readCommissionHold).mockRejectedValue(new Error('down'));
    }],
    ['technician doc is missing', () => {
      vi.mocked(configSvc.getCommissionConfig).mockResolvedValue(cfg());
      vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockResolvedValue([]);
      vi.mocked(techRepo.readCommissionHold).mockResolvedValue({ exists: false, hold: null } as never);
    }],
    ['second config read rejects', () => {
      configRejectsFromCall(2, false);
      vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockResolvedValue([row('bk-1', 900000)]);
      vi.mocked(techRepo.readCommissionHold).mockResolvedValue({ exists: true, hold: existingHold() } as never);
    }],
  ];

  it.each(failures)('ALLOWS (no throw) when %s', async (_name, wire) => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    wire();
    await expect(assertCanAccept('t1')).resolves.toEqual({ decision: 'ALLOW' });
    expect(techRepo.patchCommissionHold).not.toHaveBeenCalled();
  });
});
