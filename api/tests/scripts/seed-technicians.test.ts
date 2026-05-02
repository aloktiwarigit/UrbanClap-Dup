import { describe, it, expect } from 'vitest';
import { TECHNICIANS } from '../../scripts/seed-technicians.js';

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

  it('seeded technicians cover all 5 active services with at least 2 each', () => {
    const required = ['ac-deep-clean', 'water-pump-repair', 'pipe-leak-fix', 'main-switch-fix', 'ro-installation'];
    for (const serviceId of required) {
      const matchCount = TECHNICIANS.filter(t => t.skills.includes(serviceId)).length;
      expect(matchCount, `${serviceId} coverage (need >=2 per launch-gate prerequisite)`).toBeGreaterThanOrEqual(2);
    }
  });
});
