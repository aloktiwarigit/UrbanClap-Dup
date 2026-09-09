/**
 * E21-S04 / ADR-0032 — the runtime half of the Karnataka rule.
 *
 * Hold state is an ELIGIBILITY FILTER, never a ranking input. The Semgrep rule
 * `no-commission-hold-in-ranking` catches the field appearing in a comparator (including
 * inside an if-condition, not just a bare arithmetic return); this test catches the
 * behaviour, including any indirect route (a helper, a derived score, a stable-sort side
 * effect) that Semgrep could not see — because it asserts on `rankTechnicians`'s OUTPUT
 * order, not on its source text.
 *
 * That "any indirect route" claim only holds because the fixtures below are constructed so a
 * hold-based tiebreaker would actually have somewhere to act. An earlier version of this file
 * used three fixtures at three distinct distances, so `a.distanceKm !== b.distanceKm` was true
 * for every pair and the comparator always returned at its first branch — rating was never
 * consulted, and neither would any tiebreaker appended after it. Mutating hold state there only
 * caught a hold sort promoted AHEAD of distance, the least likely regression. The
 * "tie-breaking" describe block below adds a same-distance pair (so rating decides) and a
 * same-distance-and-rating pair (so only Array.prototype.sort's guaranteed-since-ES2019
 * stability decides) — the two places a `BLOCKED`-last tiebreaker, or a helper that replaces
 * rating as the secondary key, would actually surface as a reordering.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { rankTechnicians } from '../../src/services/dispatcher.service.js';
import type { CommissionHold, TechnicianProfile } from '../../src/schemas/technician.js';

const LAT = 12.9716;
const LNG = 77.5946;

function tech(id: string, lngOffset: number, rating: number, hold?: CommissionHold): TechnicianProfile {
  return {
    id,
    technicianId: id,
    location: { type: 'Point', coordinates: [LNG + lngOffset, LAT] },
    skills: ['svc-plumbing'],
    availabilityWindows: [],
    isOnline: true,
    isAvailable: true,
    kycStatus: 'APPROVED',
    rating,
    ...(hold ? { commissionHold: hold } : {}),
  };
}

const hold = (state: CommissionHold['state'], outstandingPaise: number): CommissionHold => ({
  outstandingPaise,
  dueCount: 3,
  state,
  evaluatedAt: '2026-09-08T00:00:00.000Z',
});

describe('rankTechnicians is invariant under commission hold state', () => {
  const baseline = [
    tech('near-low-rating', 0.001, 3.0),
    tech('far-high-rating', 0.050, 5.0),
    tech('mid', 0.010, 4.0),
  ];

  const expectedOrder = ['near-low-rating', 'mid', 'far-high-rating'];

  it('ranks by distance then rating with no holds present', () => {
    expect(rankTechnicians(baseline, LAT, LNG).map((t) => t.id)).toEqual(expectedOrder);
  });

  it('produces the identical order when the nearest technician is BLOCKED with a huge balance', () => {
    const mutated = [
      tech('near-low-rating', 0.001, 3.0, hold('BLOCKED', 9_999_900)),
      tech('far-high-rating', 0.050, 5.0),
      tech('mid', 0.010, 4.0),
    ];
    expect(rankTechnicians(mutated, LAT, LNG).map((t) => t.id)).toEqual(expectedOrder);
  });

  it('produces the identical order across every combination of hold states', () => {
    const states: Array<CommissionHold['state']> = ['CLEAR', 'WARN', 'BLOCKED'];
    for (const a of states) {
      for (const b of states) {
        for (const c of states) {
          const mutated = [
            tech('near-low-rating', 0.001, 3.0, hold(a, 100)),
            tech('far-high-rating', 0.050, 5.0, hold(b, 500_000)),
            tech('mid', 0.010, 4.0, hold(c, 250_000)),
          ];
          expect(rankTechnicians(mutated, LAT, LNG).map((t) => t.id)).toEqual(expectedOrder);
        }
      }
    }
  });

  it('produces the identical order when some technicians have no commissionHold at all', () => {
    const mutated = [
      tech('near-low-rating', 0.001, 3.0),
      tech('far-high-rating', 0.050, 5.0, hold('BLOCKED', 800_000)),
      tech('mid', 0.010, 4.0),
    ];
    expect(rankTechnicians(mutated, LAT, LNG).map((t) => t.id)).toEqual(expectedOrder);
  });

  it('CLEAR-with-zero-balance never outranks a nearer technician', () => {
    const mutated = [
      tech('far-high-rating', 0.050, 5.0, hold('CLEAR', 0)),
      tech('near-low-rating', 0.001, 3.0, hold('BLOCKED', 999_999)),
      tech('mid', 0.010, 4.0, hold('WARN', 300_000)),
    ];
    expect(rankTechnicians(mutated, LAT, LNG)[0]!.id).toBe('near-low-rating');
  });
});

describe('rankTechnicians tie-breaking is invariant under commission hold state', () => {
  // Two technicians at IDENTICAL distance: distanceKm ties, so rating is the only thing that
  // can decide order. If a hold-based tiebreaker were ever appended after rating, mutating
  // hold state across this pair would flip the order — that is what these tests catch.
  const tieExpectedOrder = ['tie-high-rating', 'tie-low-rating'];

  it('breaks a distance tie by rating with no holds present', () => {
    const baseline = [tech('tie-low-rating', 0.020, 2.0), tech('tie-high-rating', 0.020, 4.5)];
    expect(rankTechnicians(baseline, LAT, LNG).map((t) => t.id)).toEqual(tieExpectedOrder);
  });

  it('keeps the rating-decided tie order across every combination of hold states', () => {
    const states: Array<CommissionHold['state']> = ['CLEAR', 'WARN', 'BLOCKED'];
    for (const a of states) {
      for (const b of states) {
        const mutated = [
          tech('tie-low-rating', 0.020, 2.0, hold(a, 100)),
          tech('tie-high-rating', 0.020, 4.5, hold(b, 900_000)),
        ];
        expect(rankTechnicians(mutated, LAT, LNG).map((t) => t.id)).toEqual(tieExpectedOrder);
      }
    }
  });

  // Two technicians identical in BOTH distance and rating: every branch of the comparator
  // returns 0, so the only thing that can determine their relative order is
  // Array.prototype.sort's stability (guaranteed by spec since ES2019 / stable in V8 since
  // 7.0). ANY tiebreaker appended after rating — hold state included — would show up here as
  // a reordering that a plain distance/rating equality check could never exercise.
  const identicalPairExpectedOrder = ['dup-first', 'dup-second'];

  it('preserves input order for technicians identical in distance and rating, with no holds', () => {
    const baseline = [tech('dup-first', 0.030, 3.5), tech('dup-second', 0.030, 3.5)];
    expect(rankTechnicians(baseline, LAT, LNG).map((t) => t.id)).toEqual(identicalPairExpectedOrder);
  });

  it('preserves input order for identical-distance-and-rating technicians across every combination of hold states', () => {
    const states: Array<CommissionHold['state']> = ['CLEAR', 'WARN', 'BLOCKED'];
    for (const a of states) {
      for (const b of states) {
        const mutated = [
          tech('dup-first', 0.030, 3.5, hold(a, 500_000)),
          tech('dup-second', 0.030, 3.5, hold(b, 500_000)),
        ];
        expect(rankTechnicians(mutated, LAT, LNG).map((t) => t.id)).toEqual(identicalPairExpectedOrder);
      }
    }
  });
});

describe('rankTechnicians source contains no hold reference', () => {
  /**
   * Extracts the source text of a top-level `function <name>(...) { ... }` declaration by
   * counting braces from the first `{` after the signature, rather than assuming the body
   * ends at the next line that starts in column 0. The naive `indexOf('\n}', start)` heuristic
   * this replaced was correct only by accident: it happened to find the function's own closing
   * brace because nothing inside the body was itself a column-0 `}`. That assumption breaks
   * silently — and dangerously — the moment the comparator is extracted into a helper (the
   * exact refactor that would let a hold-based tiebreaker hide from this static check): the
   * heuristic would then most likely still find *a* `\n}` and slice out a body that no longer
   * contains the real logic, making this test pass vacuously instead of failing loudly.
   */
  function extractFunctionSource(src: string, signature: string): string {
    const start = src.indexOf(signature);
    if (start < 0) return '';
    const braceStart = src.indexOf('{', start);
    if (braceStart < 0) return '';
    let depth = 0;
    let i = braceStart;
    for (; i < src.length; i++) {
      if (src[i] === '{') depth++;
      else if (src[i] === '}') {
        depth--;
        if (depth === 0) {
          i++;
          break;
        }
      }
    }
    return src.slice(start, i);
  }

  it('the function body mentions neither commissionHold nor outstandingPaise', () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const src = readFileSync(
      resolve(here, '..', '..', 'src', 'services', 'dispatcher.service.ts'),
      'utf8',
    );
    const body = extractFunctionSource(src, 'export function rankTechnicians');
    expect(body, 'rankTechnicians not found — was it renamed?').not.toBe('');
    // Sanity check on the extraction itself: if a refactor (e.g. the comparator moved into a
    // helper) makes this slice stop containing the ranking logic, fail loudly here rather than
    // silently passing the hold-reference check below against an unrepresentative body.
    expect(body, 'extracted body does not look like the ranking function — check the slice').toMatch(
      /distanceKm/,
    );
    expect(body).not.toMatch(/commissionHold|outstandingPaise|dueCount|holdState/);
  });
});
