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

/**
 * Wire the three reads `computeCommissionHold` performs, plus the enforcement probe read
 * `assertCanAccept` performs before it. Every config read returns the SAME config here, which is
 * fine for decision tests — the tests that care about WHICH config read a number came from wire
 * the calls with different thresholds themselves (see "reported threshold" below).
 */
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
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(configSvc.getCommissionConfig).mockResolvedValue(cfg({ holdEnforcementEnabled: false }));
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockRejectedValue(new Error('boom'));
    vi.mocked(techRepo.readCommissionHold).mockResolvedValue({ exists: true, hold: existingHold() } as never);
    expect(await assertCanAccept('t1')).toEqual({ decision: 'ALLOW' });
  });

  it('still logs the read failure server-side, so the dark launch produces a failure rate', async () => {
    // The gate must be silent to the CLIENT while the flag is off, not silent in the logs. How
    // often these reads fail is precisely the number we need before flipping enforcement on.
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(configSvc.getCommissionConfig).mockResolvedValue(cfg({ holdEnforcementEnabled: false }));
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockRejectedValue(new Error('boom'));
    vi.mocked(techRepo.readCommissionHold).mockResolvedValue({ exists: true, hold: existingHold() } as never);
    await assertCanAccept('t1');
    expect(err).toHaveBeenCalledWith('ACCEPT_HOLD_CHECK_FAILED technicianId=t1 reason=boom');
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
    vi.spyOn(console, 'error').mockImplementation(() => {});
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
    // Behavioural half of the no-write property. It can only see cross-module writes:
    // `recomputeCommissionHold` lives in the same module as `assertCanAccept` and cannot be
    // spied on from here, so the real evidence that the gate never writes is the static one —
    // the function body calls only `getCommissionConfig` and `computeCommissionHold`.
    arrange({ enforcement: true, outstanding: 900000 });
    await assertCanAccept('t1');
    expect(techRepo.patchCommissionHold).not.toHaveBeenCalled();
  });
});

// ── The threshold reported to the technician must be the one that produced the verdict ──────────
//
// `getCommissionConfig` is TTL-cached (5 min) with no write-invalidation, so two reads either side
// of a TTL boundary can legitimately disagree after an admin edits the threshold. If the number in
// the 403 came from a different read than the one `computeCommissionHold` evaluated the state
// against, the technician is told a limit that is not the limit that blocked them. These tests
// give each config read a DIFFERENT `blockThresholdPaise` so the source is observable — with a
// single shared value they would pass no matter where the number came from.

/** Config reads resolve in the given order; any further read resolves to `tail`. */
function configReads(...values: EffectiveCommissionConfig[]) {
  const mock = vi.mocked(configSvc.getCommissionConfig);
  for (const v of values) mock.mockResolvedValueOnce(v);
  // A read beyond the expected ones is a bug this suite must be able to SEE, so give it a value
  // that could never be mistaken for one of the legitimate reads.
  mock.mockResolvedValue(cfg({ blockThresholdPaise: 999999 }));
}

describe('assertCanAccept — reported threshold is the one the verdict used', () => {
  it('reports computeCommissionHold’s threshold, not the enforcement probe’s', async () => {
    // Probe (read 0) sees an old 400000; compute (read 1) sees the current 500000. The verdict is
    // computed inside computeCommissionHold against 500000, so 500000 is what must be reported.
    configReads(
      cfg({ holdEnforcementEnabled: true, blockThresholdPaise: 400000 }),
      cfg({ holdEnforcementEnabled: true, blockThresholdPaise: 500000 }),
    );
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockResolvedValue([row('bk-1', 620000)]);
    vi.mocked(techRepo.readCommissionHold).mockResolvedValue({ exists: true, hold: existingHold() } as never);

    expect(await assertCanAccept('t1')).toEqual({
      decision: 'BLOCKED', outstandingPaise: 620000, blockThresholdPaise: 500000,
    });
  });

  it('reads the config exactly twice — the probe, and computeCommissionHold’s own read', async () => {
    // Guards against a third read creeping back in. A third read is the whole bug class above:
    // it can return a threshold that no verdict was ever computed against.
    arrange({ enforcement: true, outstanding: 900000 });
    await assertCanAccept('t1');
    expect(configSvc.getCommissionConfig).toHaveBeenCalledTimes(2);
  });

  it('shadow-logs computeCommissionHold’s threshold too', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    configReads(
      cfg({ holdEnforcementEnabled: false, blockThresholdPaise: 400000 }),
      cfg({ holdEnforcementEnabled: false, blockThresholdPaise: 500000 }),
    );
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockResolvedValue([row('bk-1', 620000)]);
    vi.mocked(techRepo.readCommissionHold).mockResolvedValue({ exists: true, hold: existingHold() } as never);

    await assertCanAccept('t1');

    expect(log).toHaveBeenCalledWith(
      'ACCEPT_HOLD_SHADOW_BLOCK technicianId=t1 outstandingPaise=620000 blockThresholdPaise=500000',
    );
    expect(configSvc.getCommissionConfig).toHaveBeenCalledTimes(2);
  });
});

// ── Enforcement OFF must never throw, whatever fails ────────────────────────────────────────────
//
// Each row asserts the expected number of config reads as well as the decision. Without that, a
// row whose failure is wired to a call index that no longer happens would go green while
// exercising nothing (the trigger becomes unreachable, the assertion still holds vacuously).

describe('assertCanAccept — enforcement OFF never throws, whatever fails', () => {
  const failures: Array<[name: string, wire: () => void, configReadCount: number]> = [
    ['the probe config read rejects', () => {
      vi.mocked(configSvc.getCommissionConfig).mockRejectedValue(new Error('down'));
    }, 1],
    ['the ledger read rejects', () => {
      vi.mocked(configSvc.getCommissionConfig).mockResolvedValue(cfg());
      vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockRejectedValue(new Error('down'));
      vi.mocked(techRepo.readCommissionHold).mockResolvedValue({ exists: true, hold: existingHold() } as never);
    }, 2],
    ['the hold read rejects', () => {
      vi.mocked(configSvc.getCommissionConfig).mockResolvedValue(cfg());
      vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockResolvedValue([]);
      vi.mocked(techRepo.readCommissionHold).mockRejectedValue(new Error('down'));
    }, 2],
    ['compute’s own config read rejects', () => {
      vi.mocked(configSvc.getCommissionConfig)
        .mockResolvedValueOnce(cfg())
        .mockRejectedValue(new Error('down'));
      vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockResolvedValue([row('bk-1', 900000)]);
      vi.mocked(techRepo.readCommissionHold).mockResolvedValue({ exists: true, hold: existingHold() } as never);
    }, 2],
    ['every read rejects', () => {
      vi.mocked(configSvc.getCommissionConfig).mockRejectedValue(new Error('down'));
      vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockRejectedValue(new Error('down'));
      vi.mocked(techRepo.readCommissionHold).mockRejectedValue(new Error('down'));
    }, 1],
    ['the technician doc is missing', () => {
      vi.mocked(configSvc.getCommissionConfig).mockResolvedValue(cfg());
      vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockResolvedValue([]);
      vi.mocked(techRepo.readCommissionHold).mockResolvedValue({ exists: false, hold: null } as never);
    }, 2],
  ];

  it.each(failures)('ALLOWS (no throw) when %s', async (_name, wire, configReadCount) => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    wire();
    await expect(assertCanAccept('t1')).resolves.toEqual({ decision: 'ALLOW' });
    expect(configSvc.getCommissionConfig).toHaveBeenCalledTimes(configReadCount);
    expect(techRepo.patchCommissionHold).not.toHaveBeenCalled();
  });
});
