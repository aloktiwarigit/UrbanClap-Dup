import { describe, it, expect } from 'vitest';
import { buildHoldRoster } from '../../src/services/commission-dashboard.service.js';
import type { CommissionHold } from '../../src/schemas/technician.js';

const hold = (over: Partial<CommissionHold> = {}): CommissionHold => ({
  outstandingPaise: 0, dueCount: 0, state: 'CLEAR', evaluatedAt: '2026-09-08T00:00:00.000Z', ...over,
});

describe('buildHoldRoster', () => {
  it('returns empty aggregates for an empty roster', () => {
    expect(buildHoldRoster([], [])).toEqual({
      rows: [], totalOutstandingPaise: 0, unreconciledTechnicianCount: 0,
    });
  });

  it('sorts rows by outstandingPaise descending', () => {
    const rows = buildHoldRoster(
      [
        { id: 't1', name: 'A', commissionHold: hold({ outstandingPaise: 100, state: 'WARN' }) },
        { id: 't2', name: 'B', commissionHold: hold({ outstandingPaise: 900, state: 'BLOCKED' }) },
        { id: 't3', name: 'C', commissionHold: hold({ outstandingPaise: 500, state: 'WARN' }) },
      ],
      [],
    ).rows;
    expect(rows.map((r) => r.technicianId)).toEqual(['t2', 't3', 't1']);
  });

  it('carries name, dueCount, oldestDueAt, state, evaluatedAt and override onto the row', () => {
    const override = { until: '2999-01-01T00:00:00.000Z', byAdminId: 'a1', reason: 'pilot' };
    const [row] = buildHoldRoster(
      [{
        id: 't1', name: 'Ravi',
        commissionHold: hold({
          outstandingPaise: 700, dueCount: 3, oldestDueAt: '2026-09-01T00:00:00.000Z',
          state: 'BLOCKED', override,
        }),
      }],
      [],
    ).rows;
    expect(row).toEqual({
      technicianId: 't1', technicianName: 'Ravi', outstandingPaise: 700, dueCount: 3,
      oldestDueAt: '2026-09-01T00:00:00.000Z', state: 'BLOCKED',
      evaluatedAt: '2026-09-08T00:00:00.000Z', override,
    });
  });

  it('omits technicianName, oldestDueAt and override when absent', () => {
    const [row] = buildHoldRoster(
      [{ id: 't1', commissionHold: hold({ outstandingPaise: 700, state: 'BLOCKED' }) }],
      [],
    ).rows;
    expect(Object.keys(row!).sort()).toEqual(
      ['dueCount', 'evaluatedAt', 'outstandingPaise', 'state', 'technicianId'],
    );
  });

  it('totals one contribution per technician, preferring the cached hold', () => {
    const { totalOutstandingPaise } = buildHoldRoster(
      [{ id: 't1', commissionHold: hold({ outstandingPaise: 100, state: 'WARN' }) }],
      [{ technicianId: 't1', outstandingPaise: 999 }],
    );
    expect(totalOutstandingPaise).toBe(100);
  });

  it('falls back to the DUE aggregate for a technician with no cached hold yet', () => {
    const { totalOutstandingPaise } = buildHoldRoster(
      [{ id: 't1', commissionHold: hold({ outstandingPaise: 100, state: 'WARN' }) }],
      [{ technicianId: 't1', outstandingPaise: 100 }, { technicianId: 't2', outstandingPaise: 250 }],
    );
    expect(totalOutstandingPaise).toBe(350);
  });

  it('counts a DUE group whose cached hold disagrees as unreconciled', () => {
    const { unreconciledTechnicianCount } = buildHoldRoster(
      [{ id: 't1', commissionHold: hold({ outstandingPaise: 100, state: 'WARN' }) }],
      [{ technicianId: 't1', outstandingPaise: 250 }],
    );
    expect(unreconciledTechnicianCount).toBe(1);
  });

  it('counts a DUE group with no cached hold at all as unreconciled', () => {
    const { unreconciledTechnicianCount } = buildHoldRoster(
      [], [{ technicianId: 't9', outstandingPaise: 250 }],
    );
    expect(unreconciledTechnicianCount).toBe(1);
  });

  it('counts a non-zero cached hold with no DUE group as unreconciled (the other direction)', () => {
    const { unreconciledTechnicianCount } = buildHoldRoster(
      [{ id: 't1', commissionHold: hold({ outstandingPaise: 100, state: 'WARN' }) }], [],
    );
    expect(unreconciledTechnicianCount).toBe(1);
  });

  it('does not count a zero cached hold with no DUE group', () => {
    const { unreconciledTechnicianCount } = buildHoldRoster(
      [{ id: 't1', commissionHold: hold({ outstandingPaise: 0, state: 'CLEAR' }) }], [],
    );
    expect(unreconciledTechnicianCount).toBe(0);
  });

  it('is pure — calling twice on the same inputs gives deep-equal output and no mutation', () => {
    const input = [{ id: 't1', commissionHold: hold({ outstandingPaise: 100, state: 'WARN' as const }) }];
    const snapshot = JSON.stringify(input);
    expect(buildHoldRoster(input, [])).toEqual(buildHoldRoster(input, []));
    expect(JSON.stringify(input)).toBe(snapshot);
  });
});
