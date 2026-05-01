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
  const writeSeq = useRef(0);
  const latestSeq = useRef(0);

  const setTheme = useCallback((next: Theme) => {
    setLocal(next);
    if (typeof document !== 'undefined') {
      document.documentElement.dataset['theme'] = next;
    }
    const seq = ++writeSeq.current;
    latestSeq.current = seq;
    void (async () => {
      try {
        await setThemeCookie(next);
      } catch {
        // Server Action failed — DOM is already updated optimistically;
        // next page load will re-read whatever cookie value persisted.
        return;
      }
      // If a newer setTheme started after this one, it now owns the cookie —
      // we don't need to re-write. The latestSeq guard exists for diagnostic
      // clarity; awaited writes already serialise cookie state on the server.
      if (seq !== latestSeq.current) return;
    })();
  }, []);

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
