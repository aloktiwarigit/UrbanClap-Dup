/**
 * Pilot launch is Ayodhya, UP. Dispatcher ranking must be invariant to decline
 * history — factoring a technician's past decline count into job-offer ordering
 * is prohibited by operator policy (and likely by future state regulation).
 *
 * This test is the CI-enforced gate for that invariant. Any change to
 * rankTechnicians that introduces a decline-based term will break this suite.
 */
import { describe, it, expect } from 'vitest';
import { rankTechnicians } from '../../src/services/dispatcher.service.js';
import type { TechnicianProfile } from '../../src/schemas/technician.js';

// Booking location: Ayodhya, UP
const BOOKING_LAT = 26.7922;
const BOOKING_LNG = 82.1998;

function makeTech(
  id: string,
  lngOffset: number,
  overrides: Partial<TechnicianProfile> = {},
): TechnicianProfile {
  return {
    id,
    technicianId: id,
    location: { type: 'Point', coordinates: [BOOKING_LNG + lngOffset, BOOKING_LAT] },
    skills: ['svc-plumbing'],
    availabilityWindows: [],
    isOnline: true,
    isAvailable: true,
    kycStatus: 'APPROVED',
    ...overrides,
  };
}

describe('Dispatch ranking — invariant to decline history (Ayodhya pilot)', () => {
  it('ranks closer technician first even when they have the highest simulated decline count', () => {
    /**
     * Scenario: tech-A is closest but has many declines.
     * tech-B is mid-range, no declines.
     * tech-C is furthest, no declines.
     *
     * Expected: A → B → C  (distance wins, declines irrelevant)
     *
     * If any implementation accidentally read a "declineCount" field, it would
     * need to be added to TechnicianProfile — which is itself a schema violation.
     * The ranking function only reads `location` and `rating`.
     */
    const techA = makeTech('tech-A', 0.02, { rating: 2.5 }); // ~2.2 km, low rating
    const techB = makeTech('tech-B', 0.10, { rating: 4.9 }); // ~11 km, high rating
    const techC = makeTech('tech-C', 0.50, { rating: 5.0 }); // ~55 km, perfect rating

    const ranked = rankTechnicians([techC, techB, techA], BOOKING_LAT, BOOKING_LNG);

    expect(ranked.map((t) => t.id)).toEqual(['tech-A', 'tech-B', 'tech-C']);
  });

  it('ranking is stable across all permutations of input order', () => {
    const techs = [
      makeTech('near', 0.02),
      makeTech('mid', 0.15),
      makeTech('far', 0.40),
    ];

    const permutations = [
      [techs[0]!, techs[1]!, techs[2]!],
      [techs[0]!, techs[2]!, techs[1]!],
      [techs[1]!, techs[0]!, techs[2]!],
      [techs[1]!, techs[2]!, techs[0]!],
      [techs[2]!, techs[0]!, techs[1]!],
      [techs[2]!, techs[1]!, techs[0]!],
    ];

    for (const perm of permutations) {
      const ranked = rankTechnicians(perm, BOOKING_LAT, BOOKING_LNG);
      expect(ranked.map((t) => t.id)).toEqual(['near', 'mid', 'far']);
    }
  });

  it('TechnicianProfile schema does not expose a decline-related field', () => {
    const profile = makeTech('check', 0.01);
    expect(profile).not.toHaveProperty('declineCount');
    expect(profile).not.toHaveProperty('declineHistory');
    expect(profile).not.toHaveProperty('declines');
  });
});
