import { afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

/**
 * jsdom does not process @theme (Tailwind v4) or @import directives, so CSS
 * custom properties defined in globals.css are never computed. We inject them
 * directly so any test that calls getComputedStyle(documentElement) and reads
 * a CSS variable gets the real design-token value.
 */
beforeAll(() => {
  const style = document.createElement('style');
  style.textContent = `
    :root {
      --color-brand: #4f46e5;
      --color-brand-fg: #ffffff;
      --color-surface: #ffffff;
      --color-surface-alt: #f8fafc;
      --color-text: #0f172a;
      --color-text-muted: #475569;
      --color-border: #e2e8f0;
      --color-success: #16a34a;
      --color-warn: #d97706;
      --color-danger: #dc2626;
    }
    .dark {
      --color-surface: #0b1220;
      --color-surface-alt: #111a2e;
      --color-text: #e2e8f0;
      --color-text-muted: #94a3b8;
      --color-border: #1f2a44;
    }
  `;
  document.head.appendChild(style);
});
