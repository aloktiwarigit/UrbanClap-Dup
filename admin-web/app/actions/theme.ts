'use server';

import { cookies } from 'next/headers';
import { THEME_COOKIE_NAME, isTheme, type Theme } from '@/lib/theme';

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function setThemeCookie(theme: Theme): Promise<void> {
  if (!isTheme(theme)) {
    throw new Error(`setThemeCookie: invalid theme "${String(theme)}"`);
  }
  const store = await cookies();
  store.set({
    name: THEME_COOKIE_NAME,
    value: theme,
    path: '/',
    sameSite: 'lax',
    httpOnly: true, // client never reads this cookie — optimistic update sets dataset.theme directly
    secure: process.env.NODE_ENV === 'production',
    maxAge: ONE_YEAR_SECONDS,
  });
}
