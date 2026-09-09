/**
 * E21-S04 / ADR-0032 — the runtime half of the Karnataka rule.
 *
 * Hold state is an ELIGIBILITY FILTER, never a ranking input. The Semgrep rule
 * `no-commission-hold-in-ranking` catches the field appearing in a comparator; this test catches
 * the behaviour, including any indirect route (a helper, a derived score, a stable-sort side
 * effect) that Semgrep could not see.
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

describe('rankTechnicians source contains no hold reference', () => {
  it('the function body mentions neither commissionHold nor outstandingPaise', () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const src = readFileSync(
      resolve(here, '..', '..', 'src', 'services', 'dispatcher.service.ts'),
      'utf8',
    );
    const start = src.indexOf('export function rankTechnicians');
    expect(start, 'rankTechnicians not found — was it renamed?').toBeGreaterThanOrEqual(0);
    const end = src.indexOf('\n}', start);
    const body = src.slice(start, end);
    expect(body).not.toMatch(/commissionHold|outstandingPaise|dueCount|holdState/);
  });
});
