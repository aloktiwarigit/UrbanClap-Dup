import { describe, it, expect, beforeAll } from 'vitest';
import '../app/globals.css';

describe('design tokens', () => {
  beforeAll(() => {
    document.documentElement.classList.remove('dark');
  });

  it('exposes --color-brand on document.documentElement (light)', () => {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue('--color-brand')
      .trim();
    expect(value).not.toBe('');
  });

  it('exposes a different --color-surface in dark mode', () => {
    const light = getComputedStyle(document.documentElement)
      .getPropertyValue('--color-surface')
      .trim();
    document.documentElement.classList.add('dark');
    const dark = getComputedStyle(document.documentElement)
      .getPropertyValue('--color-surface')
      .trim();
    document.documentElement.classList.remove('dark');
    expect(dark).not.toBe('');
    expect(dark).not.toBe(light);
  });
});
