'use client';

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { setThemeCookie } from '../../../app/actions/theme';
import type { Theme } from '@/lib/theme';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (next: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({
  initialTheme,
  children,
}: {
  initialTheme: Theme;
  children: ReactNode;
}) {
  const [theme, setLocal] = useState<Theme>(initialTheme);

  // Coalesced single-flight writer: rapid toggles update `desired` and the
  // running flush picks up the latest value. Prevents out-of-order Server
  // Action completions from persisting a stale cookie under fast toggling.
  const desired = useRef<Theme>(initialTheme);
  const flushing = useRef(false);

  const flushWrite = useCallback(async () => {
    if (flushing.current) return;
    flushing.current = true;
    try {
      let written: Theme | null = null;
      while (written !== desired.current) {
        const target: Theme = desired.current;
        try {
          await setThemeCookie(target);
        } catch {
          // Server Action failed — DOM is already updated optimistically.
          // Stop the loop; next setTheme call (or page reload) reconciles.
          return;
        }
        written = target;
      }
    } finally {
      flushing.current = false;
    }
  }, []);

  const setTheme = useCallback(
    (next: Theme) => {
      setLocal(next);
      if (typeof document !== 'undefined') {
        document.documentElement.dataset['theme'] = next;
      }
      desired.current = next;
      void flushWrite();
    },
    [flushWrite],
  );

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (ctx === undefined) {
    throw new Error('useTheme must be used inside <ThemeProvider>');
  }
  return ctx;
}
