import { describe, it, expect } from 'vitest';
import { TECHNICIANS } from '../../scripts/seed-technicians.js';
import { SERVICES, CATEGORIES } from '../../src/cosmos/seeds/catalogue.js';

// Ayodhya operational bounding box (~10km radius around city centre [82.20, 26.79])
const LNG_MIN = 82.10;
const LNG_MAX = 82.30;
const LAT_MIN = 26.70;
const LAT_MAX = 26.88;

describe('seed-technicians Ayodhya coords', () => {
  it('seeds exactly 10 technicians', () => {
    expect(TECHNICIANS).toHaveLength(10);
  });

  it('all seeded technicians fall inside the Ayodhya operational bounding box', () => {
    for (const tech of TECHNICIANS) {
      const [lng, lat] = tech.location.coordinates;
      expect(lng, `${tech.id} longitude`).toBeGreaterThanOrEqual(LNG_MIN);
      expect(lng, `${tech.id} longitude`).toBeLessThanOrEqual(LNG_MAX);
      expect(lat, `${tech.id} latitude`).toBeGreaterThanOrEqual(LAT_MIN);
      expect(lat, `${tech.id} latitude`).toBeLessThanOrEqual(LAT_MAX);
    }
  });

  it('all seeded technicians use the tech-ayd-NNN id format', () => {
    for (const tech of TECHNICIANS) {
      expect(tech.id).toMatch(/^tech-ayd-\d{3}$/);
      expect(tech.technicianId).toBe(tech.id);
    }
  });

  it('every seeded technician skill is a real catalogue serviceId', () => {
    // Dispatch matches booking.serviceId against tech.skills via ARRAY_CONTAINS;
    // any drift between skill strings and catalogue IDs silently breaks dispatch.
    const validServiceIds = new Set(SERVICES.map(s => s.id));
    for (const tech of TECHNICIANS) {
      for (const skill of tech.skills) {
        expect(validServiceIds.has(skill), `${tech.id} skill "${skill}" must be a catalogue serviceId`).toBe(true);
      }
    }
  });

  // 2026-09-15 (ADR-0030): owner lowered the launch gate from 2 to 1. A service may
  // now ship with single-technician coverage; if that technician goes offline the
  // service has no coverage and bookings stick silently. Accepted by the owner.
  const MIN_TECHS_PER_ACTIVE_SERVICE = 1;

  // The filter now checks kycStatus as well as isOnline. The previous version's
  // message promised "KYC-approved + online" but only filtered isOnline, so it
  // asserted something weaker than it claimed.
  const eligibleTechnicians = () =>
    TECHNICIANS.filter(t => t.isOnline && t.kycStatus === 'APPROVED');

  it(`every active catalogue serviceId has >=${MIN_TECHS_PER_ACTIVE_SERVICE} online, KYC-approved technician`, () => {
    const eligible = eligibleTechnicians();
    for (const svc of SERVICES.filter(s => s.isActive)) {
      const matchCount = eligible.filter(t => t.skills.includes(svc.id)).length;
      expect(
        matchCount,
        `${svc.id} (${svc.categoryId}) coverage — need >=${MIN_TECHS_PER_ACTIVE_SERVICE} online + KYC-approved tech (ADR-0030)`,
      ).toBeGreaterThanOrEqual(MIN_TECHS_PER_ACTIVE_SERVICE);
    }
  });

  it(`every active catalogue category has >=${MIN_TECHS_PER_ACTIVE_SERVICE} tech with at least one of its services`, () => {
    const eligible = eligibleTechnicians();
    for (const cat of CATEGORIES.filter(c => c.isActive)) {
      const catServiceIds = new Set(SERVICES.filter(s => s.categoryId === cat.id).map(s => s.id));
      const matchCount = eligible.filter(t => t.skills.some(skill => catServiceIds.has(skill))).length;
      expect(
        matchCount,
        `${cat.id} category coverage — need >=${MIN_TECHS_PER_ACTIVE_SERVICE} eligible tech (ADR-0030)`,
      ).toBeGreaterThanOrEqual(MIN_TECHS_PER_ACTIVE_SERVICE);
    }
  });
});
