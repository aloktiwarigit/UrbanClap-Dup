import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/cosmos/client.js', () => ({
  getCosmosClient: vi.fn(),
  DB_NAME: 'homeservices',
}));

import { getCosmosClient } from '../../src/cosmos/client.js';
import {
  countBlockedInRadius,
  getTechniciansWithinRadius,
  readTechnicianGateState,
} from '../../src/cosmos/technician-repository.js';

/** Captures the SQL text and parameters of the single query the call issues. */
function mockQuery(resources: unknown[]) {
  const captured: { query?: string; parameters?: Array<{ name: string; value: unknown }> } = {};
  const fetchAll = vi.fn().mockResolvedValue({ resources });
  (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
    database: () => ({
      container: () => ({
        items: {
          query: (spec: { query: string; parameters: Array<{ name: string; value: unknown }> }) => {
            captured.query = spec.query;
            captured.parameters = spec.parameters;
            return { fetchAll };
          },
        },
      }),
    }),
  });
  return captured;
}

beforeEach(() => vi.resetAllMocks());

describe('getTechniciansWithinRadius predicates', () => {
  it('ALWAYS excludes suspended technicians, with a fail-open IS_DEFINED disjunct', async () => {
    const c = mockQuery([]);
    await getTechniciansWithinRadius(12.97, 77.59, 10, 'svc-plumbing');
    expect(c.query).toContain('NOT IS_DEFINED(c.suspended) OR c.suspended != true');
  });

  it('omits the hold predicate when excludeBlockedHolds is not set (dark launch)', async () => {
    const c = mockQuery([]);
    await getTechniciansWithinRadius(12.97, 77.59, 10, 'svc-plumbing');
    expect(c.query).not.toContain('commissionHold');
  });

  it('adds a fail-open hold predicate when excludeBlockedHolds is set', async () => {
    const c = mockQuery([]);
    await getTechniciansWithinRadius(12.97, 77.59, 10, 'svc-plumbing', { excludeBlockedHolds: true });
    expect(c.query).toContain(
      "NOT IS_DEFINED(c.commissionHold.state) OR c.commissionHold.state != 'BLOCKED'",
    );
  });

  it('omits the kyc predicate by default and adds a fail-open one when requireKyc is set', async () => {
    const off = mockQuery([]);
    await getTechniciansWithinRadius(12.97, 77.59, 10, 'svc-plumbing');
    expect(off.query).not.toContain('kycStatus');

    const on = mockQuery([]);
    await getTechniciansWithinRadius(12.97, 77.59, 10, 'svc-plumbing', { requireKyc: true });
    expect(on.query).toContain("NOT IS_DEFINED(c.kycStatus) OR c.kycStatus = 'APPROVED'");
  });

  it('composes both optional predicates together', async () => {
    const c = mockQuery([]);
    await getTechniciansWithinRadius(12.97, 77.59, 10, 'svc-plumbing', {
      excludeBlockedHolds: true,
      requireKyc: true,
    });
    expect(c.query).toContain('commissionHold.state');
    expect(c.query).toContain('kycStatus');
    expect(c.query).toContain('c.suspended');
  });

  it('keeps the original geo/skill/online/available predicates and parameters', async () => {
    const c = mockQuery([]);
    await getTechniciansWithinRadius(12.97, 77.59, 10, 'svc-plumbing', { excludeBlockedHolds: true });
    expect(c.query).toContain('ST_WITHIN(c.location, @polygon)');
    expect(c.query).toContain('ARRAY_CONTAINS(c.skills, @serviceId)');
    expect(c.query).toContain('c.isOnline = true');
    expect(c.query).toContain('c.isAvailable = true');
    expect(c.parameters?.map((p) => p.name).sort()).toEqual(['@polygon', '@serviceId']);
  });

  it('returns the rows the query produced', async () => {
    mockQuery([{ id: 'tech-1' }, { id: 'tech-2' }]);
    const rows = await getTechniciansWithinRadius(12.97, 77.59, 10, 'svc-plumbing');
    expect(rows.map((r) => r.id)).toEqual(['tech-1', 'tech-2']);
  });
});

describe('countBlockedInRadius', () => {
  it('counts only BLOCKED technicians inside the same geo/skill/online/available set', async () => {
    const c = mockQuery([7]);
    const n = await countBlockedInRadius(12.97, 77.59, 10, 'svc-plumbing');
    expect(n).toBe(7);
    expect(c.query).toContain('SELECT VALUE COUNT(1)');
    expect(c.query).toContain("c.commissionHold.state = 'BLOCKED'");
    expect(c.query).toContain('ST_WITHIN(c.location, @polygon)');
    expect(c.query).toContain('NOT IS_DEFINED(c.suspended) OR c.suspended != true');
  });

  it('returns 0 when the aggregate page comes back empty', async () => {
    mockQuery([]);
    expect(await countBlockedInRadius(12.97, 77.59, 10, 'svc-plumbing')).toBe(0);
  });
});

describe('readTechnicianGateState', () => {
  function mockPointRead(resource: unknown) {
    const read = vi.fn().mockResolvedValue({ resource });
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({ item: () => ({ read }) }) }),
    });
  }

  it('returns exists:false with null hold when the technician doc is absent', async () => {
    mockPointRead(undefined);
    expect(await readTechnicianGateState('tech-x')).toEqual({ exists: false, hold: null, suspended: false });
  });

  it('returns the hold and suspended flag when present', async () => {
    const hold = {
      outstandingPaise: 600000, dueCount: 3, state: 'BLOCKED' as const,
      evaluatedAt: '2026-09-08T00:00:00.000Z',
    };
    mockPointRead({ id: 'tech-1', commissionHold: hold, suspended: true });
    expect(await readTechnicianGateState('tech-1')).toEqual({ exists: true, hold, suspended: true });
  });

  it('reads a legacy doc with neither field as exists:true, hold null, suspended false', async () => {
    mockPointRead({ id: 'tech-1' });
    expect(await readTechnicianGateState('tech-1')).toEqual({ exists: true, hold: null, suspended: false });
  });
});
