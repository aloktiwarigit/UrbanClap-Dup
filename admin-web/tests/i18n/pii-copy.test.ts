import { describe, it, expect } from 'vitest';
import en from '../../messages/en.json';
import hi from '../../messages/hi.json';

// Every component test in this repo mocks next-intl, which means no
// component test can prove a message key actually exists — a missing key
// surfaces as a runtime error in production, in the default locale, in
// front of the user. This suite asserts against the REAL imported message
// files instead.

function flatten(obj: unknown, prefix = ''): string[] {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) return [prefix];
  return Object.entries(obj as Record<string, unknown>).flatMap(([key, value]) =>
    flatten(value, prefix ? `${prefix}.${key}` : key),
  );
}

const REQUIRED = [
  'orders.pii.showNumber',
  'orders.pii.showNumberAria',
  'orders.pii.hideNow',
  'orders.pii.hideNowAria',
  'orders.pii.recorded',
  'orders.pii.unavailable',
  'orders.pii.party.customer',
  'orders.pii.party.technician',
  'orders.pii.errors.forbidden',
  'orders.pii.errors.rateLimited',
  'orders.pii.errors.rateLimitedDaily',
  'orders.pii.errors.failed',
  'orders.csv.headers.technicianPhone',
  'orders.detail.sections.customerPhone',
  'orders.detail.sections.technicianPhone',
];

describe('PII reveal copy', () => {
  const enKeys = flatten(en);
  const hiKeys = flatten(hi);

  it('keeps en and hi key sets identical', () => {
    expect(enKeys.slice().sort()).toEqual(hiKeys.slice().sort());
  });

  for (const key of REQUIRED) {
    it(`defines ${key} in en`, () => expect(enKeys).toContain(key));
    it(`defines ${key} in hi`, () => expect(hiKeys).toContain(key));
  }

  it('translates the reveal copy into Devanagari rather than copying English', () => {
    const hiPii = (hi as unknown as Record<string, Record<string, Record<string, string>>>)['orders']!['pii']!;
    for (const key of ['showNumber', 'recorded', 'unavailable']) {
      expect(hiPii[key]).toMatch(/[ऀ-ॿ]/);
    }
  });

  it('does not promise a reveal without saying it is recorded', () => {
    const enPii = (en as unknown as Record<string, Record<string, Record<string, string>>>)['orders']!['pii']!;
    expect(enPii['recorded']).toMatch(/audit log/i);
  });
});
