import { cookies } from 'next/headers';

export const THEME_COOKIE_NAME = 'theme';
export const THEME_VALUES = ['dark', 'light'] as const;
export type Theme = (typeof THEME_VALUES)[number];

const DEFAULT_THEME: Theme = 'dark';

export function isTheme(value: string | undefined): value is Theme {
  return value !== undefined && (THEME_VALUES as readonly string[]).includes(value);
}

export async function readThemeCookie(): Promise<Theme> {
  const store = await cookies();
  const raw = store.get(THEME_COOKIE_NAME)?.value;
  return isTheme(raw) ? raw : DEFAULT_THEME;
}
