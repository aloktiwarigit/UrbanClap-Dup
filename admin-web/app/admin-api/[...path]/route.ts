import { NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/apiBase';

export const dynamic = 'force-dynamic';

const LEGACY_REFRESH_PROXY_PATH = '/admin-api/v1/admin/auth/refresh';
const SETUP_TOTP_PATH = 'v1/admin/auth/setup-totp';

type ProxyContext = {
  params: Promise<{ path?: string[] }>;
};

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
  const host = new URL(requestUrl).hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '::1';
}

function rewriteSetCookie(cookie: string, requestUrl: string): string {
  let rewritten = cookie.replace(
    /;\s*Path=\/api\/v1\/admin\/auth\/refresh/gi,
    '; Path=/',
  );

  if (/^hs_setup=/i.test(cookie.trim())) {
    rewritten = rewritten.replace(/;\s*Path=\/setup\b/gi, '; Path=/');
  }

  if (isLocalhost(requestUrl)) {
    rewritten = rewritten.replace(/;\s*Secure/gi, '');
  }

  return rewritten;
}

function rewriteSetCookies(cookie: string, requestUrl: string): string[] {
  const rewritten = rewriteSetCookie(cookie, requestUrl);
  const shouldClearLegacyRefresh =
    /^hs_refresh=/i.test(cookie.trim()) &&
    /;\s*Path=\/api\/v1\/admin\/auth\/refresh/gi.test(cookie) &&
    /;\s*Max-Age=0\b/i.test(cookie);

  if (!shouldClearLegacyRefresh) return [rewritten];

  return [
    rewritten,
    rewriteSetCookie(
      cookie.replace(
        /;\s*Path=\/api\/v1\/admin\/auth\/refresh/gi,
        `; Path=${LEGACY_REFRESH_PROXY_PATH}`,
      ),
      requestUrl,
    ),
  ];
}

function buildSetupCookieClear(requestUrl: string): string {
  const secure = isLocalhost(requestUrl) ? '' : '; Secure';
  return `hs_setup=; Path=/; Max-Age=0; HttpOnly${secure}; SameSite=Strict`;
}

function buildForwardHeaders(request: Request): Headers {
  const headers = new Headers(request.headers);
  headers.delete('accept-encoding');
  headers.delete('connection');
  headers.delete('content-length');
  headers.delete('host');
  return headers;
}

function buildResponseHeaders(upstream: Response): Headers {
  const headers = new Headers();
  for (const [key, value] of upstream.headers.entries()) {
    const lower = key.toLowerCase();
    if (
      lower === 'content-encoding' ||
      lower === 'set-cookie' ||
      lower === 'transfer-encoding'
    ) {
      continue;
    }
    headers.set(key, value);
  }
  return headers;
}

async function proxy(request: Request, context: ProxyContext): Promise<NextResponse> {
  // CSRF protection via Origin allowlist.
  // SameSite=Strict on hs_access provides the primary CSRF defense.
  // This Origin check adds defense-in-depth for state-changing methods
  // without requiring cookie seeding (the double-submit cookie pattern
  // was half-implemented — see csrf.ts for the future full implementation).
  const unsafeMethod = !['GET', 'HEAD', 'OPTIONS'].includes(request.method);
  if (unsafeMethod) {
    const origin = request.headers.get('origin');
    const allowed = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000';
    // Allow same-origin requests that omit the Origin header (SSR fetch, curl)
    if (origin !== null && origin !== allowed) {
      return NextResponse.json({ error: 'Cross-origin request denied' }, { status: 403 });
    }
  }

  const { path = [] } = await context.params;
  const requestUrl = new URL(request.url);
  const apiPath = path.map((segment) => encodeURIComponent(segment)).join('/');
  const target = `${getApiBaseUrl()}/${apiPath}${requestUrl.search}`;
  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  const init: RequestInit = {
    method: request.method,
    headers: buildForwardHeaders(request),
    redirect: 'manual',
    cache: 'no-store',
  };
  if (hasBody) {
    init.body = await request.arrayBuffer();
  }

  const upstream = await fetch(target, init);

  const response = new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: buildResponseHeaders(upstream),
  });

  for (const cookie of getSetCookieHeaders(upstream.headers)) {
    for (const rewritten of rewriteSetCookies(cookie, request.url)) {
      response.headers.append('set-cookie', rewritten);
    }
  }

  if (request.method === 'POST' && apiPath === SETUP_TOTP_PATH && upstream.ok) {
    response.headers.append('set-cookie', buildSetupCookieClear(request.url));
  }

  return response;
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
