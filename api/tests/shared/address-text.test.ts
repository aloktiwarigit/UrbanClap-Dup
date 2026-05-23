import { describe, expect, it } from 'vitest';
import { normalizeAddressText } from '../../src/shared/address-text.js';

describe('normalizeAddressText', () => {
  it('decodes percent-encoded address text', () => {
    expect(normalizeAddressText('123%20Main%20Street%20Ayodhya')).toBe('123 Main Street Ayodhya');
  });

  it('leaves normal address text unchanged', () => {
    expect(normalizeAddressText('123 Main Street Ayodhya')).toBe('123 Main Street Ayodhya');
  });

  it('leaves invalid percent sequences unchanged', () => {
    expect(normalizeAddressText('Shop 50% near chowk')).toBe('Shop 50% near chowk');
  });
});
