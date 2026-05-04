import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import {
  canAccessAdminPath,
  defaultPathForRole,
  normalizeAdminRole,
} from './src/admin/capabilities';

export async function middleware(request: NextRequest) {
  const jwtSecretEnv = process.env.JWT_SECRET;
  if (!jwtSecretEnv) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }
  const JWT_SECRET = new TextEncoder().encode(jwtSecretEnv);

  const token = request.cookies.get('hs_access')?.value;

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload['type'] !== 'access') throw new Error('wrong type');
    const role = normalizeAdminRole(payload['role']);
    if (!role) throw new Error('invalid role');

    if (!canAccessAdminPath(role, request.nextUrl.pathname)) {
      const url = new URL('/not-authorized', request.url);
      url.searchParams.set('from', request.nextUrl.pathname);
      url.searchParams.set('next', defaultPathForRole(role));
      return NextResponse.redirect(url);
    }
  } catch {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', request.nextUrl.pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('hs_access');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/orders/:path*',
    '/finance/:path*',
    '/catalogue/:path*',
    '/complaints/:path*',
    '/audit-log/:path*',
    '/admin-users/:path*',
    '/compliance/:path*',
    '/not-authorized',
  ],
};
