import { NextResponse, NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import createMiddleware from 'next-intl/middleware';
import {
  canAccessAdminPath,
  defaultPathForRole,
  normalizeAdminRole,
} from './src/admin/capabilities';
import type { AdminRole } from './src/lib/auth/types';
import { getApiBaseUrl } from './src/lib/apiBase';
import { getValidatedJwtSecret } from './src/lib/env';
import { routing } from './src/i18n/config';
import { stripLocalePrefix, getLocaleFromRequest } from './src/lib/i18n/helpers';

const ACCESS_COOKIE = 'hs_access';
const REFRESH_COOKIE = 'hs_refresh';
const LEGACY_PROXY_REFRESH_PATH = '/admin-api/v1/admin/auth/refresh';
const LEGACY_API_REFRESH_PATH = '/api/v1/admin/auth/refresh';

const handleI18nRouting = createMiddleware(routing);

type VerifiedAccess = {
  token: string;
  role: AdminRole;
};

type RefreshResult = {
  access: VerifiedAccess;
  setCookies: string[];
};

// ── Cookie utilities (unchanged from original) ────────────────────────────────

function splitSetCookieHeader(value: string): string[] {
  return value
    .split(/,(?=\s*[^;,=]+=[^;,]*)/g)
    .map((cookie) => cookie.trim())
    .filter(Boolean);
}

function getSetCookieHeaders(headers: Headers): string[] {
  const withGetter = headers as Headers & { getSetCookie?: () => string[] };
  const setCookies = withGetter.getSetCookie?.();
  if (setCookies && setCookies.length > 0) return setCookies;

  const combined = headers.get('set-cookie');
  return combined ? splitSetCookieHeader(combined) : [];
}

function firstForwardedValue(value: string | null): string | null {
  return value?.split(',')[0]?.trim() || null;
}

function externalUrl(request: NextRequest, pathname: string): URL {
  const protocol =
    firstForwardedValue(request.headers.get('x-forwarded-proto')) ??
    request.nextUrl.protocol.replace(/:$/, '');
  const host =
    firstForwardedValue(request.headers.get('x-forwarded-host')) ??
    firstForwardedValue(request.headers.get('host')) ??
    request.nextUrl.host;

  const url = new URL(`${protocol}://${host}`);
  if (url.protocol === 'https:' && url.port === '8080') {
    url.port = '';
  }
  url.pathname = pathname;
  url.search = '';
  return url;
}

function isLocalhost(requestUrl: string): boolean {
  const hostname = new URL(requestUrl).hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

function rewriteSetCookie(cookie: string, requestUrl: string): string {
  if (!isLocalhost(requestUrl)) return cookie;
  return cookie.replace(/;\s*Secure/gi, '');
}

function extractCookieValue(setCookie: string, name: string): string | null {
  const match = new RegExp(`^${name}=([^;]*)`, 'i').exec(setCookie.trim());
  if (!match) return null;
  const rawValue = match[1] ?? '';
  try {
    return decodeURIComponent(rawValue);
  } catch {
    return rawValue;
  }
}

function withRequestCookie(cookieHeader: string | null, name: string, value: string): string {
  const cookies = new Map<string, string>();
  for (const part of cookieHeader?.split(';') ?? []) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const index = trimmed.indexOf('=');
    if (index <= 0) continue;
    cookies.set(trimmed.slice(0, index), trimmed.slice(index + 1));
  }
  cookies.set(name, value);
  return Array.from(
    cookies,
    ([cookieName, cookieValue]) => `${cookieName}=${cookieValue}`,
  ).join('; ');
}

function appendSetCookies(response: NextResponse, cookies: readonly string[]): void {
  for (const cookie of cookies) {
    response.headers.append('set-cookie', cookie);
  }
}

function clearAdminCookies(response: NextResponse): void {
  for (const [name, path] of [
    [ACCESS_COOKIE, '/'],
    [REFRESH_COOKIE, '/'],
    [REFRESH_COOKIE, LEGACY_PROXY_REFRESH_PATH],
    [REFRESH_COOKIE, LEGACY_API_REFRESH_PATH],
  ] as const) {
    response.headers.append(
      'set-cookie',
      `${name}=; Path=${path}; Max-Age=0; HttpOnly; SameSite=Strict`,
    );
  }
}

function hostnameFromHeader(value: string | null): string | null {
  const first = value?.split(',')[0]?.trim();
  if (!first) return null;
  return first.replace(/:\d+$/, '');
}

function isAbsoluteUrl(value: string): boolean {
  return /^[a-z][a-z\d+\-.]*:/i.test(value);
}

function publicRedirectOrigin(request: NextRequest): string {
  const appUrl = process.env['NEXT_PUBLIC_APP_URL'];
  if (appUrl) {
    try {
      return new URL(appUrl).origin;
    } catch {
      // Ignore invalid configuration here; env validation handles hard failures.
    }
  }

  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const host = forwardedHost || request.headers.get('host') || request.nextUrl.host;
  const protocol = forwardedProto || request.nextUrl.protocol.replace(/:$/, '');
  return `${protocol}://${host}`;
}

export function normalizeSameHostRedirect(
  response: NextResponse,
  request: NextRequest,
): NextResponse {
  const location = response.headers.get('location');
  if (!location || !isAbsoluteUrl(location)) return response;

  let redirectUrl: URL;
  try {
    redirectUrl = new URL(location);
  } catch {
    return response;
  }

  const sameHostCandidates = new Set<string>([request.nextUrl.hostname]);

  const host = hostnameFromHeader(request.headers.get('host'));
  if (host) sameHostCandidates.add(host);

  const forwardedHost = hostnameFromHeader(request.headers.get('x-forwarded-host'));
  if (forwardedHost) sameHostCandidates.add(forwardedHost);

  const appUrl = process.env['NEXT_PUBLIC_APP_URL'];
  if (appUrl) {
    try {
      sameHostCandidates.add(new URL(appUrl).hostname);
    } catch {
      // Ignore invalid configuration here; env validation handles hard failures.
    }
  }

  if (!sameHostCandidates.has(redirectUrl.hostname)) return response;

  const publicUrl = new URL(
    `${redirectUrl.pathname}${redirectUrl.search}${redirectUrl.hash}`,
    publicRedirectOrigin(request),
  );
  response.headers.set('location', publicUrl.toString());
  return response;
}

function handleI18n(request: NextRequest): NextResponse {
  return normalizeSameHostRedirect(handleI18nRouting(request), request);
}

// ── Locale-aware redirect helpers ─────────────────────────────────────────────

function redirectToLogin(request: NextRequest): NextResponse {
  const locale = getLocaleFromRequest(request, routing.defaultLocale, routing.locales);
  const loginUrl = externalUrl(request, `/${locale}/login`);
  loginUrl.searchParams.set('next', request.nextUrl.pathname);
  const response = NextResponse.redirect(loginUrl);
  clearAdminCookies(response);
  return normalizeSameHostRedirect(response, request);
}

function redirectToNotAuthorized(request: NextRequest, role: AdminRole): NextResponse {
  const locale = getLocaleFromRequest(request, routing.defaultLocale, routing.locales);
  const url = externalUrl(request, `/${locale}/not-authorized`);
  url.searchParams.set('from', request.nextUrl.pathname);
  const rawDefault = defaultPathForRole(role);
  url.searchParams.set('next', `/${locale}${rawDefault}`);
  return normalizeSameHostRedirect(NextResponse.redirect(url), request);
}

// ── JWT verification (unchanged logic) ───────────────────────────────────────

async function verifyAccessToken(token: string, jwtSecret: Uint8Array): Promise<VerifiedAccess> {
  const { payload } = await jwtVerify(token, jwtSecret);
  if (payload['type'] !== 'access') throw new Error('wrong type');

  const role = normalizeAdminRole(payload['role']);
  if (!role) throw new Error('invalid role');

  if (typeof payload.sub !== 'string') throw new Error('invalid subject');
  if (typeof payload['sessionId'] !== 'string') throw new Error('invalid session');

  return { token, role };
}

async function refreshAccess(
  request: NextRequest,
  jwtSecret: Uint8Array,
): Promise<RefreshResult | null> {
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) return null;

  let refreshResponse: Response;
  try {
    refreshResponse = await fetch(`${getApiBaseUrl()}/v1/admin/auth/refresh`, {
      method: 'POST',
      headers: { cookie: `${REFRESH_COOKIE}=${refreshToken}` },
      cache: 'no-store',
    });
  } catch {
    return null;
  }

  if (!refreshResponse.ok) return null;

  const setCookies = getSetCookieHeaders(refreshResponse.headers).map((cookie) =>
    rewriteSetCookie(cookie, request.url),
  );
  const accessCookie = setCookies.find((cookie) =>
    new RegExp(`^${ACCESS_COOKIE}=`, 'i').test(cookie.trim()),
  );
  if (!accessCookie) return null;

  const accessToken = extractCookieValue(accessCookie, ACCESS_COOKIE);
  if (!accessToken) return null;

  return {
    access: await verifyAccessToken(accessToken, jwtSecret),
    setCookies,
  };
}

// ── Main middleware ───────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1. Auth API bypass — no locale routing, no JWT check
  if (
    pathname.startsWith('/admin-api/v1/admin/auth/refresh') ||
    pathname.startsWith('/admin-api/v1/admin/auth/login') ||
    pathname.startsWith('/admin-api/v1/admin/auth/setup')
  ) {
    return NextResponse.next();
  }

  // 2. Strip locale prefix to get the underlying path for capability checks
  const rawPath = stripLocalePrefix(pathname, routing.locales);
  const hasLocalePrefix = routing.locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  if (rawPath === '/') {
    const locale = getLocaleFromRequest(request, routing.defaultLocale, routing.locales);
    return NextResponse.redirect(externalUrl(request, `/${locale}/login`));
  }

  if (
    !hasLocalePrefix &&
    (rawPath === '/login' ||
      rawPath.startsWith('/login/') ||
      rawPath === '/setup' ||
      rawPath.startsWith('/setup/'))
  ) {
    const locale = getLocaleFromRequest(request, routing.defaultLocale, routing.locales);
    return NextResponse.redirect(externalUrl(request, `/${locale}${rawPath}`));
  }

  // 3. Public paths — locale routing only, no JWT required
  const PUBLIC_PATHS = ['/', '/login', '/setup'];
  if (PUBLIC_PATHS.some((p) => rawPath === p || rawPath.startsWith(p + '/'))) {
    return handleI18n(request);
  }

  // 4. Internal Next.js API routes (/api/) — pass through (no JWT proxy needed)
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // 5. Protected paths — JWT auth check
  let jwtSecretStr: string;
  try {
    jwtSecretStr = getValidatedJwtSecret();
  } catch {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }
  const JWT_SECRET = new TextEncoder().encode(jwtSecretStr);

  const token = request.cookies.get(ACCESS_COOKIE)?.value;

  let access: VerifiedAccess | null = null;
  let setCookies: string[] = [];

  try {
    if (token) {
      access = await verifyAccessToken(token, JWT_SECRET);
    }
  } catch {
    // Fall through to token refresh
  }

  if (!access) {
    const refreshed = await refreshAccess(request, JWT_SECRET);
    if (!refreshed) return redirectToLogin(request);
    access = refreshed.access;
    setCookies = refreshed.setCookies;
  }

  // 6. Admin API proxy requests — pass through after auth check, skip capability check and locale routing.
  // next-intl with localePrefix:'always' would redirect /admin-api/v1/... to
  // /{locale}/admin-api/v1/... which has no matching route and breaks proxy calls.
  // Must precede the capability check: /admin-api/* paths are not registered in
  // ADMIN_ROUTE_CAPABILITIES so they would be default-denied otherwise.
  if (pathname.startsWith('/admin-api/')) {
    if (setCookies.length === 0) return NextResponse.next();
    const response = NextResponse.next();
    appendSetCookies(response, setCookies);
    return response;
  }

  // 7. Capability check on the locale-stripped raw path
  if (!canAccessAdminPath(access.role, rawPath)) {
    const notAuthResponse = redirectToNotAuthorized(request, access.role);
    if (setCookies.length > 0) appendSetCookies(notAuthResponse, setCookies);
    return notAuthResponse;
  }

  // 8. Auth passed — apply i18n routing (handles locale prefix, NEXT_LOCALE cookie)
  if (setCookies.length > 0) {
    // Refreshed session: pass original `request` to handleI18nRouting to preserve
    // nextUrl (wrapping a plain Request in new NextRequest() loses nextUrl and breaks
    // locale detection). Forward the refreshed cookie via NextResponse.next's request
    // headers so downstream server components receive the updated access token.
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(
      'cookie',
      withRequestCookie(request.headers.get('cookie'), ACCESS_COOKIE, access.token),
    );
    const i18nResponse = handleI18n(request);
    if (i18nResponse.status >= 300 && i18nResponse.status < 400) {
      // i18n is redirecting for locale normalization — carry Set-Cookie on redirect
      appendSetCookies(i18nResponse, setCookies);
      return i18nResponse;
    }
    // i18n returned next() — rebuild with refreshed request headers so server
    // components see the updated access token, then copy i18n response headers
    // (e.g. NEXT_LOCALE set-cookie) but skip x-middleware-* which Next.js already
    // set correctly on the new response for the refreshed cookie.
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    i18nResponse.headers.forEach((value, key) => {
      if (!key.startsWith('x-middleware-')) response.headers.set(key, value);
    });
    appendSetCookies(response, setCookies);
    return response;
  }
  // TODO(ADR needed): /api/* bypass and /setup/* public-path behaviour should be
  // reviewed in a dedicated ADR before changing — altering them could break the
  // setup flow and the API edge-network routing.

  return handleI18n(request);
}

export const config = {
  matcher: [
    // Match all paths except SWA health checks, Next.js static assets, image optimization,
    // robots.txt (served from public/ — middleware would 500 when JWT_SECRET is absent),
    // and the Firebase service worker (must be served publicly from root for FCM push registration).
    '/((?!\\.swa|_next/static|_next/image|favicon\\.ico|robots\\.txt|firebase-messaging-sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
