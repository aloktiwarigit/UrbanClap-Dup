import { describe, it, expect } from 'vitest';
import { CATEGORIES, SERVICES } from '../src/cosmos/seeds/catalogue.js';
import { PRICE_IN_PROSE } from '../src/schemas/service.js';

describe('catalogue seed canonical category set (Ayodhya pilot)', () => {
  it('contains the 6 categories in expected sortOrder', () => {
    expect(CATEGORIES.map(c => c.id)).toEqual([
      'ac-repair',
      'water-pump',
      'plumbing',
      'electrical',
      'water-purifier',
      'appliance-repair',
    ]);
  });

  it('does not contain dropped Bengaluru-metro categories', () => {
    const ids = new Set(CATEGORIES.map(c => c.id));
    expect(ids.has('deep-cleaning')).toBe(false);
    expect(ids.has('pest-control')).toBe(false);
  });

  it('contains no services for dropped categories', () => {
    const droppedCategoryIds = new Set(['deep-cleaning', 'pest-control']);
    const orphans = SERVICES.filter(s => droppedCategoryIds.has(s.categoryId));
    expect(orphans).toEqual([]);
  });

  it('every active category has at least one service', () => {
    for (const cat of CATEGORIES) {
      const svcs = SERVICES.filter(s => s.categoryId === cat.id);
      expect(svcs.length, `${cat.id} must have >=1 service`).toBeGreaterThanOrEqual(1);
    }
  });

  it('contains the new water-pump services', () => {
    const ids = new Set(SERVICES.map(s => s.id));
    expect(ids.has('water-pump-repair')).toBe(true);
    expect(ids.has('borewell-servicing')).toBe(true);
  });

  it('contains the new water-purifier services', () => {
    const ids = new Set(SERVICES.map(s => s.id));
    expect(ids.has('ro-installation')).toBe(true);
    expect(ids.has('ro-service-amc')).toBe(true);
  });

  it('contains the new appliance-repair services, inactive pending technician coverage', () => {
    const byId = new Map(SERVICES.map(s => [s.id, s]));
    for (const id of ['appliance-fridge-repair', 'appliance-cooler-service', 'appliance-washing-machine-repair', 'electrical-camera-installation']) {
      expect(byId.has(id), id).toBe(true);
      expect(byId.get(id)!.isActive, `${id} must stay inactive until a technician holds this skill`).toBe(false);
    }
    const applianceCategory = CATEGORIES.find(c => c.id === 'appliance-repair');
    expect(applianceCategory?.isActive, 'appliance-repair category must stay inactive until coverage exists').toBe(false);
  });

  it('contains the new inverter service, inactive pending technician coverage', () => {
    const byId = new Map(SERVICES.map(s => [s.id, s]));
    expect(byId.has('appliance-inverter-service')).toBe(true);
    const inverter = byId.get('appliance-inverter-service')!;
    expect(inverter.categoryId).toBe('appliance-repair');
    expect(inverter.basePrice).toBe(49900);
    expect(inverter.isActive, 'appliance-inverter-service must stay inactive until a technician holds this skill').toBe(false);
  });

  it('E22-S02: appliance-repair category and its services point at the real Storage bucket with alt=media', () => {
    const APPLIANCE_SERVICE_IDS = [
      'appliance-fridge-repair',
      'appliance-cooler-service',
      'appliance-washing-machine-repair',
      'electrical-camera-installation',
      'appliance-inverter-service',
    ];
    const applianceCategory = CATEGORIES.find(c => c.id === 'appliance-repair')!;
    expect(applianceCategory.heroImageUrl).toMatch(/^https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/homeservices-prod-001\.firebasestorage\.app\/o\/.+\?alt=media$/);
    expect(applianceCategory.heroImageUrl).not.toContain('homeservices-mvp');

    const byId = new Map(SERVICES.map(s => [s.id, s]));
    for (const id of APPLIANCE_SERVICE_IDS) {
      const svc = byId.get(id)!;
      expect(svc.heroImageUrl, `${id} heroImageUrl`).toMatch(/^https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/homeservices-prod-001\.firebasestorage\.app\/o\/.+\?alt=media$/);
      expect(svc.heroImageUrl, `${id} heroImageUrl must not use the dead homeservices-mvp bucket`).not.toContain('homeservices-mvp');
    }

    // Each service must point at its OWN storage path, not a borrowed sibling's —
    // this was the exact PR #346 gap for electrical-camera-installation, which
    // pointed at services%2Felectrical-switchboard-fix.jpg instead of its own id.
    for (const id of ['appliance-fridge-repair', 'appliance-cooler-service', 'appliance-washing-machine-repair', 'electrical-camera-installation', 'appliance-inverter-service']) {
      const svc = byId.get(id)!;
      expect(svc.heroImageUrl, `${id} must reference its own object path`).toContain(encodeURIComponent(`services/${id}.jpg`));
    }
  });
});

describe('E22-S01 — reprice', () => {
  const priceOf = (id: string) => SERVICES.find((s) => s.id === id)?.basePrice;

  it.each([
    ['ac-deep-clean', 99900],
    ['ac-gas-refill', 149900],
    ['ac-installation', 149900],
    ['ac-deep-clean-window', 69900],
    ['water-pump-repair', 49900],
    ['borewell-servicing', 99900],
    ['electrical-fan-install', 24900],
    ['electrical-switchboard-fix', 29900],
    ['ro-installation', 39900],
    ['ro-service-amc', 39900],
    ['plumbing-leak-fix', 39900],
    ['plumbing-tap-install', 59900],
    ['plumbing-pipe-repair', 79900],
    ['electrical-wiring', 99900],
  ])('%s is priced at %i paise', (id, expected) => {
    expect(priceOf(id)).toBe(expected);
  });

  it('adds the window AC deep clean to the AC category', () => {
    const svc = SERVICES.find((s) => s.id === 'ac-deep-clean-window');
    expect(svc?.categoryId).toBe('ac-repair');
    expect(svc?.isActive).toBe(true);
  });
});

describe('E22-S01 — no price may appear in prose', () => {
  // A price in a sentence goes stale the moment the owner edits the price, and
  // then the app states a figure it does not charge. In a Hindi-default app that
  // is a false price claim to every customer.

  it.each(SERVICES.map((s) => [s.id, s.shortDescription] as const))(
    '%s English description contains no price',
    (_id, text) => {
      expect(PRICE_IN_PROSE.test(text)).toBe(false);
    },
  );

  it.each(SERVICES.map((s) => [s.id, s.shortDescriptionHi ?? ''] as const))(
    '%s Hindi description contains no price',
    (_id, text) => {
      expect(PRICE_IN_PROSE.test(text)).toBe(false);
    },
  );

  it('no category name carries a price either', () => {
    for (const c of CATEGORIES) {
      expect(PRICE_IN_PROSE.test(c.name)).toBe(false);
      expect(PRICE_IN_PROSE.test(c.nameHi ?? '')).toBe(false);
    }
  });

  it('no service faq, addOn, includes, or photoStage text carries a price', () => {
    for (const s of SERVICES) {
      for (const [i, f] of s.faq.entries()) {
        expect(PRICE_IN_PROSE.test(f.question), `${s.id} faq[${i}].question`).toBe(false);
        expect(PRICE_IN_PROSE.test(f.answer), `${s.id} faq[${i}].answer`).toBe(false);
      }
      for (const [i, a] of s.addOns.entries()) {
        expect(PRICE_IN_PROSE.test(a.name), `${s.id} addOns[${i}].name`).toBe(false);
        expect(PRICE_IN_PROSE.test(a.triggerCondition), `${s.id} addOns[${i}].triggerCondition`).toBe(false);
      }
      for (const [i, inc] of s.includes.entries()) {
        expect(PRICE_IN_PROSE.test(inc), `${s.id} includes[${i}]`).toBe(false);
      }
      for (const [i, stage] of s.photoStages.entries()) {
        expect(PRICE_IN_PROSE.test(stage.label), `${s.id} photoStages[${i}].label`).toBe(false);
      }
    }
  });
});

describe('E22-S01 — Hindi coverage', () => {
  it('every seeded service has a Hindi name and description', () => {
    for (const s of SERVICES) {
      expect(s.nameHi, `${s.id} is missing nameHi`).toBeTruthy();
      expect(s.shortDescriptionHi, `${s.id} is missing shortDescriptionHi`).toBeTruthy();
    }
  });

  it('every seeded category has a Hindi name', () => {
    for (const c of CATEGORIES) {
      expect(c.nameHi, `${c.id} is missing nameHi`).toBeTruthy();
    }
  });

  it('every seeded service id is registered in catalogue-ids.ts (waitlist handler contract)', async () => {
    const { CATALOGUE_SERVICE_IDS } = await import('../src/data/catalogue-ids.js');
    const registered = new Set(CATALOGUE_SERVICE_IDS);
    for (const s of SERVICES) {
      expect(registered.has(s.id), `${s.id} missing from catalogue-ids.ts`).toBe(true);
    }
  });
});
