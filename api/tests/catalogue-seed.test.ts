import { describe, it, expect } from 'vitest';
import { CATEGORIES, SERVICES } from '../src/cosmos/seeds/catalogue.js';

describe('catalogue seed canonical 5-category set (Ayodhya pilot)', () => {
  it('contains the 5 categories in expected sortOrder', () => {
    expect(CATEGORIES.map(c => c.id)).toEqual([
      'ac-repair',
      'water-pump',
      'plumbing',
      'electrical',
      'water-purifier',
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
  const RUPEE = /[₹]|\bRs\.?\b|\bINR\b/;

  it.each(SERVICES.map((s) => [s.id, s.shortDescription] as const))(
    '%s English description contains no price',
    (_id, text) => {
      expect(RUPEE.test(text)).toBe(false);
    },
  );

  it.each(SERVICES.map((s) => [s.id, s.shortDescriptionHi ?? ''] as const))(
    '%s Hindi description contains no price',
    (_id, text) => {
      expect(RUPEE.test(text)).toBe(false);
    },
  );

  it('no category name carries a price either', () => {
    for (const c of CATEGORIES) {
      expect(RUPEE.test(c.name)).toBe(false);
      expect(RUPEE.test(c.nameHi ?? '')).toBe(false);
    }
  });

  it('no service faq, addOn, includes, or photoStage text carries a price', () => {
    for (const s of SERVICES) {
      for (const [i, f] of s.faq.entries()) {
        expect(RUPEE.test(f.question), `${s.id} faq[${i}].question`).toBe(false);
        expect(RUPEE.test(f.answer), `${s.id} faq[${i}].answer`).toBe(false);
      }
      for (const [i, a] of s.addOns.entries()) {
        expect(RUPEE.test(a.name), `${s.id} addOns[${i}].name`).toBe(false);
        expect(RUPEE.test(a.triggerCondition), `${s.id} addOns[${i}].triggerCondition`).toBe(false);
      }
      for (const [i, inc] of s.includes.entries()) {
        expect(RUPEE.test(inc), `${s.id} includes[${i}]`).toBe(false);
      }
      for (const [i, stage] of s.photoStages.entries()) {
        expect(RUPEE.test(stage.label), `${s.id} photoStages[${i}].label`).toBe(false);
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
});
