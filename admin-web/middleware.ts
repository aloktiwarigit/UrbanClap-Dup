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

// ── Locale-aware redirect helpers ─────────────────────────────────────────────

function redirectToLogin(request: NextRequest): NextResponse {
  const locale = getLocaleFromRequest(request, routing.defaultLocale, routing.locales);
  const loginUrl = new URL(`/${locale}/login`, request.url);
  loginUrl.searchParams.set('next', request.nextUrl.pathname);
  const response = NextResponse.redirect(loginUrl);
  clearAdminCookies(response);
  return response;
}

function redirectToNotAuthorized(request: NextRequest, role: AdminRole): NextResponse {
  const locale = getLocaleFromRequest(request, routing.defaultLocale, routing.locales);
  const url = new URL(`/${locale}/not-authorized`, request.url);
  url.searchParams.set('from', request.nextUrl.pathname);
  const rawDefault = defaultPathForRole(role);
  url.searchParams.set('next', `/${locale}${rawDefault}`);
  return NextResponse.redirect(url);
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

  // 3. Public paths — locale routing only, no JWT required
  const PUBLIC_PATHS = ['/', '/login', '/setup'];
  if (PUBLIC_PATHS.some((p) => rawPath === p || rawPath.startsWith(p + '/'))) {
    return handleI18nRouting(request);
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

  // 6. Capability check on the locale-stripped raw path
  if (!canAccessAdminPath(access.role, rawPath)) {
    const notAuthResponse = redirectToNotAuthorized(request, access.role);
    if (setCookies.length > 0) appendSetCookies(notAuthResponse, setCookies);
    return notAuthResponse;
  }

  // 7. Auth passed — apply i18n routing (handles locale prefix, NEXT_LOCALE cookie)
  if (setCookies.length > 0) {
    // Refreshed session: inject updated access token into request headers so
    // downstream server components receive it, then propagate Set-Cookie headers.
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(
      'cookie',
      withRequestCookie(request.headers.get('cookie'), ACCESS_COOKIE, access.token),
    );
    const refreshedRequest = new Request(request, { headers: requestHeaders });
    const i18nResponse = handleI18nRouting(new NextRequest(refreshedRequest));
    appendSetCookies(i18nResponse, setCookies);
    return i18nResponse;
  }

  return handleI18nRouting(request);
}

export const config = {
  matcher: [
    // Match all paths except Next.js static assets and image optimization
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
