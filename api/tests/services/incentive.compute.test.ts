// api/tests/services/incentive.compute.test.ts
import { describe, it, expect } from 'vitest';
import { computeWeek, deriveAwardStatus } from '../../src/services/incentive.service.js';
import { istWeekBounds } from '../../src/lib/ist-time.js';

const { startUtc, endUtc } = istWeekBounds('2026-W37'); // Mon 2026-09-07 .. Sun 2026-09-13 IST
const cfg = {
  milestones: [{ jobs: 5, bonusPaise: 10_000 }, { jobs: 10, bonusPaise: 30_000 }],
  capFractionBps: 6000, minCountableBookingPaise: 24_900,
};
/** `n` receivables of `amount` paise each, commission at the platform default 22%. */
const jobs = (n: number, amount: number, iso = '2026-09-09T10:00:00.000Z') =>
  Array.from({ length: n }, (_, i) => ({
    bookingId: `b${i}`, bookingAmount: amount, commissionDue: Math.round(amount * 0.22), createdAt: iso,
  }));
const run = (receivables: ReturnType<typeof jobs>, c = cfg) => computeWeek({ receivables, startUtc, endUtc, cfg: c });

describe('computeWeek — milestones', () => {
  it('awards nothing below the lowest milestone', () => {
    expect(run(jobs(4, 100_000))).toMatchObject({ countedJobs: 4, grossBonusPaise: 0, awardedPaise: 0 });
  });
  it('awards the HIGHEST milestone reached, not the sum of all reached', () => {
    expect(run(jobs(12, 100_000))).toMatchObject({
      reachedMilestone: { jobs: 10, bonusPaise: 30_000 }, grossBonusPaise: 30_000,
    });
  });
  it('awards the exact-boundary milestone, and nothing when the table is empty', () => {
    expect(run(jobs(5, 100_000)).grossBonusPaise).toBe(10_000);
    expect(run(jobs(50, 100_000), { ...cfg, milestones: [] }).awardedPaise).toBe(0);
  });
});

describe('computeWeek — the anti-gaming cap (spec §2 item 4, §10)', () => {
  it('PROOF: the all-cheap-jobs attack is capped, not paid in full', () => {
    // 10 x ₹249 -> generated commission 54_780 paise. At 3000 bps the cap is 16_434, well below
    // the ₹300 milestone bonus, so the cap — not the milestone — decides what is paid.
    const r = run(jobs(10, 24_900), { ...cfg, capFractionBps: 3000 });
    expect(r.countedCommissionPaise).toBe(54_780);
    expect(r.grossBonusPaise).toBe(30_000);
    expect(r.capPaise).toBe(16_434);
    expect(r.awardedPaise).toBe(16_434); // capped, NOT 30_000
  });
  it('PROOF: the margin attack from the design doc, priced exactly at the shipped 6000 bps', () => {
    // 7 real ₹1000 jobs + 3 faked ₹249 jobs to cross the 10-job milestone.
    //   generated commission = 7*22_000 + 3*5_478 = 170_434; cap = floor(*0.6) = 102_260
    //   gross bonus 30_000 is UNDER that cap, so 6000 bps does NOT close this specific case.
    // Recorded honestly rather than asserting protection that does not exist; ADR-0035 states
    // the residual and the lever (the next test).
    const attack = [...jobs(7, 100_000), ...jobs(3, 24_900, '2026-09-10T10:00:00.000Z')];
    const r = run(attack);
    expect(r.countedJobs).toBe(10);
    expect(r.countedCommissionPaise).toBe(170_434);
    expect(r.capPaise).toBe(102_260);
    expect(r.awardedPaise).toBe(30_000);
    expect(r.awardedPaise - 3 * 5_478).toBe(13_566); // the residual margin, documented
  });
  it('PROOF: the same attack IS closed at 1500 bps, with no false positive on honest work', () => {
    const attack = [...jobs(7, 100_000), ...jobs(3, 24_900, '2026-09-10T10:00:00.000Z')];
    expect(run(attack, { ...cfg, capFractionBps: 1500 }).awardedPaise).toBe(25_565); // capped
    // An honest 10-job week generates 220_000; floor(*0.15) = 33_000 > 30_000 -> untouched.
    expect(run(jobs(10, 100_000), { ...cfg, capFractionBps: 1500 }).awardedPaise).toBe(30_000);
  });
  it('PROOF: 10 genuine jobs are never capped at the shipped setting', () => {
    expect(run(jobs(10, 100_000))).toMatchObject({ capPaise: 132_000, awardedPaise: 30_000 });
  });
  it('a 0 bps cap awards nothing; a 10000 bps cap never reduces the bonus', () => {
    expect(run(jobs(20, 100_000), { ...cfg, capFractionBps: 0 }).awardedPaise).toBe(0);
    expect(run(jobs(10, 100_000), { ...cfg, capFractionBps: 10_000 }).awardedPaise).toBe(30_000);
  });
  it('rounds the cap DOWN — the platform never over-credits by a rounding paisa', () => {
    const r = computeWeek({
      receivables: [{ bookingId: 'b', bookingAmount: 24_900, commissionDue: 1, createdAt: '2026-09-09T10:00:00.000Z' }],
      startUtc, endUtc, cfg: { ...cfg, milestones: [{ jobs: 1, bonusPaise: 10_000 }] },
    });
    expect(r).toMatchObject({ capPaise: 0, awardedPaise: 0 });
  });
});

describe('computeWeek — the minCountableBookingPaise guard', () => {
  it('PROOF: ₹1 phantom bookings cannot pad the job count', () => {
    // 4 real + 20 x ₹1. Without the guard that is 24 jobs -> ₹300 for ₹4.40 of fake commission.
    expect(run([...jobs(4, 100_000), ...jobs(20, 100, '2026-09-10T10:00:00.000Z')]))
      .toMatchObject({ countedJobs: 4, awardedPaise: 0 });
  });
  it('PROOF: sub-threshold bookings are excluded from the commission base, so they cannot inflate the cap', () => {
    const r = computeWeek({
      receivables: [...jobs(1, 100_000), ...jobs(1, 100, '2026-09-10T10:00:00.000Z')],
      startUtc, endUtc, cfg: { ...cfg, milestones: [{ jobs: 1, bonusPaise: 1 }] },
    });
    expect(r.countedCommissionPaise).toBe(22_000); // the ₹1 job's 22 paise is NOT in the base
  });
  it('counts a booking exactly AT the threshold; a threshold of 0 counts everything', () => {
    expect(run(jobs(1, 24_900)).countedJobs).toBe(1);
    expect(run(jobs(3, 1), { ...cfg, minCountableBookingPaise: 0 }).countedJobs).toBe(3);
  });
});

describe('computeWeek — IST week boundaries', () => {
  it('includes Monday 00:00:00.000 IST and the last ms of Sunday, excludes the next Monday', () => {
    expect(run(jobs(1, 100_000, startUtc.toISOString())).countedJobs).toBe(1);
    expect(run(jobs(1, 100_000, new Date(endUtc.getTime() - 1).toISOString())).countedJobs).toBe(1);
    expect(run(jobs(1, 100_000, endUtc.toISOString())).countedJobs).toBe(0); // half-open
  });
  it('excludes a job done Sunday 23:00 UTC that is already Monday 04:30 IST', () => {
    // The whole reason week maths is done in IST: in UTC this job reads as "last week".
    expect(run(jobs(1, 100_000, '2026-09-13T23:00:00.000Z')).countedJobs).toBe(0);
  });
  it('excludes a job from the previous week', () => {
    expect(run(jobs(1, 100_000, '2026-09-05T10:00:00.000Z')).countedJobs).toBe(0);
  });
  it('counts a WAIVED receivable — enforced structurally, the input type has no status field', () => {
    expect(run(jobs(5, 100_000)).countedJobs).toBe(5);
  });
});

describe('deriveAwardStatus', () => {
  it('maps applied-vs-awarded onto the three states, over-applied included', () => {
    expect(deriveAwardStatus(30_000, 0)).toBe('AWARDED');
    expect(deriveAwardStatus(30_000, 12_000)).toBe('PARTIAL');
    expect(deriveAwardStatus(30_000, 30_000)).toBe('APPLIED');
    expect(deriveAwardStatus(30_000, 31_000)).toBe('APPLIED');
  });
});
