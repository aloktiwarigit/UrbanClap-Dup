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

  it('omits the kyc predicate by default and adds a two-fact one when requireKyc is set', async () => {
    const off = mockQuery([]);
    await getTechniciansWithinRadius(12.97, 77.59, 10, 'svc-plumbing');
    expect(off.query).not.toContain('c.kyc');

    const on = mockQuery([]);
    await getTechniciansWithinRadius(12.97, 77.59, 10, 'svc-plumbing', { requireKyc: true });

    // Fail-open disjunct keys on the WHOLE kyc sub-object, not on the two fields: upsertKycStatus
    // is the only writer of c.kyc and always defaults both keys in, so a doc carrying a kyc object
    // written any other way holds PARTIAL KYC info and must fail closed.
    expect(on.query).toContain('NOT IS_DEFINED(c.kyc)');
    // Fact 1 - DigiLocker Aadhaar succeeded. An equality on true, NOT a fail-open IS_DEFINED
    // disjunct: an absent aadhaarVerified is not proof the Aadhaar step ever ran.
    expect(on.query).toContain('c.kyc.aadhaarVerified = true');
    // Fact 2 - PAN OCR succeeded. IS_DEFINED alone is insufficient because upsertKycStatus
    // defaults `panHash: null` and submit-pan-ocr.ts writes an explicit null on rejection, and
    // Cosmos's IS_DEFINED is true for a null-valued property. NOT IS_NULL alone is insufficient
    // because IS_NULL is false for an undefined path too. Both halves are load-bearing.
    expect(on.query).toContain('IS_DEFINED(c.kyc.panHash) AND NOT IS_NULL(c.kyc.panHash)');

    // Round-1 regression guard: the dead, unmaintained top-level field.
    expect(on.query).not.toContain("c.kycStatus = 'APPROVED'");
    // Round-2 and round-3 regression guard: `kyc.kycStatus` is a single progress marker for a
    // two-step process completable in either order. It cannot express "both done" (nothing writes
    // COMPLETE), so reading it is either too loose (PAN_DONE admits PAN-only) or too strict (a
    // PAN-then-Aadhaar technician ends on AADHAAR_DONE). The predicate must not read it at all.
    expect(on.query).not.toContain('c.kyc.kycStatus');
    expect(on.query).not.toContain('PAN_DONE');
    expect(on.query).not.toContain('COMPLETE');
  });

  describe('KYC predicate semantics (mirrors Cosmos evaluation of the SQL text above)', () => {
    /**
     * Mirrors, in JS, the exact boolean Cosmos evaluates for the SQL above - including Cosmos's
     * three-valued logic, where a comparison against an undefined path yields `undefined` and
     * `false OR undefined` is `undefined`, which DROPS the row. `undefined` is modelled explicitly
     * and collapsed to "excluded" only at the end, rather than being conflated with `false`.
     *
     * This is not a re-implementation of business logic; it is the parenthesisation of the SQL
     * string, so that the admitted/excluded classification of every document shape has a real
     * assertion beyond string-containment on the SQL text.
     */
    type Tri = boolean | undefined;

    function or(a: Tri, b: () => Tri): Tri {
      if (a === true) return true; // short-circuits, even over an undefined right side
      const r = b();
      if (r === true) return true;
      if (a === undefined || r === undefined) return undefined;
      return false;
    }
    function and(a: Tri, b: () => Tri): Tri {
      if (a === false) return false; // short-circuits
      const r = b();
      if (r === false) return false;
      if (a === undefined || r === undefined) return undefined;
      return true;
    }

    interface Kyc {
      aadhaarVerified?: boolean;
      panHash?: string | null;
      kycStatus?: string;
    }
    interface Doc {
      kyc?: Kyc;
    }

    /** ADMITTED only when the whole expression evaluates to exactly `true`. */
    function kycPredicateAdmits(doc: Doc): boolean {
      const kyc = doc.kyc;
      // `c.kyc.aadhaarVerified = true` over an absent path -> undefined, per Cosmos.
      const aadhaarEqTrue: Tri =
        kyc === undefined || kyc.aadhaarVerified === undefined ? undefined : kyc.aadhaarVerified === true;
      const panDefined: Tri = kyc !== undefined && 'panHash' in kyc;
      const panNotNull: Tri = panDefined === true ? kyc?.panHash !== null : true;
      const result = or(
        kyc === undefined,
        () => and(aadhaarEqTrue, () => and(panDefined, () => panNotNull)),
      );
      return result === true;
    }

    /** The document shape upsertKycStatus() persists: defaults first, then whichever steps ran. */
    function afterUpserts(...patches: Kyc[]): Doc {
      const kyc: Kyc = { aadhaarVerified: false, panHash: null };
      for (const patch of patches) Object.assign(kyc, patch);
      return { kyc };
    }

    const AADHAAR_OK: Kyc = { aadhaarVerified: true, kycStatus: 'AADHAAR_DONE' };
    const AADHAAR_FAIL: Kyc = { aadhaarVerified: false, kycStatus: 'PENDING_MANUAL' };
    const PAN_OK: Kyc = { panHash: 'a'.repeat(64), kycStatus: 'PAN_DONE' };
    const PAN_REJECTED: Kyc = { panHash: null, kycStatus: 'MANUAL_REVIEW' };

    it('FAIL-OPEN: dispatches a technician with no kyc sub-object at all', () => {
      expect(kycPredicateAdmits({})).toBe(true);
    });

    it('excludes a kyc sub-object carrying no verification fields at all - partial/unknown KYC '
      + 'info fails closed; only total absence of the sub-object fails open', () => {
      expect(kycPredicateAdmits({ kyc: {} })).toBe(false);
    });

    it('excludes Aadhaar-only (aadhaarVerified true, panHash still at its null default)', () => {
      expect(kycPredicateAdmits(afterUpserts(AADHAAR_OK))).toBe(false);
    });

    it('excludes PAN-only (panHash set, aadhaarVerified still false) - the round-2 gap', () => {
      expect(kycPredicateAdmits(afterUpserts(PAN_OK))).toBe(false);
    });

    it('ADMITS both steps done, Aadhaar then PAN', () => {
      expect(kycPredicateAdmits(afterUpserts(AADHAAR_OK, PAN_OK))).toBe(true);
    });

    it('ADMITS both steps done, PAN then Aadhaar - the round-3 gap: the Aadhaar write moves '
      + 'kycStatus back to AADHAAR_DONE, so any status-based predicate excludes this technician',
      () => {
        const doc = afterUpserts(PAN_OK, AADHAAR_OK);
        expect(doc.kyc?.kycStatus).toBe('AADHAAR_DONE'); // the progress marker really is backwards
        expect(doc.kyc?.panHash).toBe('a'.repeat(64)); // ...while the PAN fact survives intact
        expect(kycPredicateAdmits(doc)).toBe(true);
      });

    it('ADMITS Aadhaar retried after a failure, then PAN', () => {
      expect(kycPredicateAdmits(afterUpserts(AADHAAR_FAIL, AADHAAR_OK, PAN_OK))).toBe(true);
    });

    it('excludes a PAN rejected after a prior success (submit-pan-ocr.ts nulls panHash back out)', () => {
      expect(kycPredicateAdmits(afterUpserts(AADHAAR_OK, PAN_OK, PAN_REJECTED))).toBe(false);
    });

    it('excludes a failed Aadhaar even with a good PAN already on file', () => {
      expect(kycPredicateAdmits(afterUpserts(PAN_OK, AADHAAR_FAIL))).toBe(false);
    });

    it('excludes a legacy doc holding only a status and the pre-E19 PAN fields (no panHash, no '
      + 'aadhaarVerified) - partial info; the runbook precondition query is what finds these', () => {
      expect(kycPredicateAdmits({ kyc: { kycStatus: 'PAN_DONE' } })).toBe(false);
    });
  });

  it('composes both optional predicates together', async () => {
    const c = mockQuery([]);
    await getTechniciansWithinRadius(12.97, 77.59, 10, 'svc-plumbing', {
      excludeBlockedHolds: true,
      requireKyc: true,
    });
    expect(c.query).toContain('commissionHold.state');
    expect(c.query).toContain('c.kyc.aadhaarVerified = true');
    expect(c.query).toContain('c.kyc.panHash');
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
