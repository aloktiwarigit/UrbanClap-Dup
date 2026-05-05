import { type NextRequest } from 'next/server';

export function stripLocalePrefix(pathname: string, locales: readonly string[]): string {
  for (const locale of locales) {
    if (pathname === `/${locale}`) return '/';
    if (pathname.startsWith(`/${locale}/`)) return pathname.slice(locale.length + 1);
  }
  return pathname;
}

export function getLocaleFromRequest(
  request: NextRequest,
  defaultLocale: string,
  locales: readonly string[],
): string {
  const pathname = request.nextUrl.pathname;

  for (const locale of locales) {
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      return locale;
    }
  }

  const cookie = request.cookies.get('NEXT_LOCALE')?.value;
  if (cookie && locales.includes(cookie)) return cookie;

  return defaultLocale;
}
