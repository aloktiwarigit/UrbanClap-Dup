'use client';

import { useTheme } from './ThemeProvider';
import type { Theme } from '@/lib/theme';

const OPTIONS: ReadonlyArray<{ value: Theme; label: string }> = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="theme-toggle"
    >
      {OPTIONS.map((opt) => {
        const isActive = theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            data-active={isActive ? '' : undefined}
            onClick={() => setTheme(opt.value)}
            className="theme-toggle__option"
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
