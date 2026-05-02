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
