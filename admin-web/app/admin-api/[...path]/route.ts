import { NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/apiBase';

export const dynamic = 'force-dynamic';

const PROXY_PREFIX = '/admin-api';
const REFRESH_PROXY_PATH = `${PROXY_PREFIX}/v1/admin/auth/refresh`;

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
    `; Path=${REFRESH_PROXY_PATH}`,
  );

  if (isLocalhost(requestUrl)) {
    rewritten = rewritten.replace(/;\s*Secure/gi, '');
  }

  return rewritten;
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
    response.headers.append('set-cookie', rewriteSetCookie(cookie, request.url));
  }

  return response;
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
