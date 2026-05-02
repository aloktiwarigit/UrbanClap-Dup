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

  it('every active catalogue serviceId has >=2 KYC-approved + online technicians (launch-gate prerequisite)', () => {
    const eligible = TECHNICIANS.filter(t => t.kycStatus === 'APPROVED' && t.isOnline);
    for (const svc of SERVICES.filter(s => s.isActive)) {
      const matchCount = eligible.filter(t => t.skills.includes(svc.id)).length;
      expect(
        matchCount,
        `${svc.id} (${svc.categoryId}) coverage — need >=2 KYC-approved + online techs per umbrella spec sec 2.3`,
      ).toBeGreaterThanOrEqual(2);
    }
  });

  it('every active catalogue category has >=2 techs with at least one of its services', () => {
    const eligible = TECHNICIANS.filter(t => t.kycStatus === 'APPROVED' && t.isOnline);
    for (const cat of CATEGORIES.filter(c => c.isActive)) {
      const catServiceIds = new Set(SERVICES.filter(s => s.categoryId === cat.id).map(s => s.id));
      const matchCount = eligible.filter(t => t.skills.some(skill => catServiceIds.has(skill))).length;
      expect(matchCount, `${cat.id} category coverage — need >=2 eligible techs`).toBeGreaterThanOrEqual(2);
    }
  });
});
