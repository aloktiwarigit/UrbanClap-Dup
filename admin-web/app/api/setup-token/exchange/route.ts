import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/setup-token/exchange
 *
 * Server-side bridge that reads the HttpOnly `hs_setup` cookie and returns
 * the token to the client component. Because the cookie is HttpOnly, JS cannot
 * read it directly — this one-shot server Route Handler is the only way for the
 * setup page to obtain the token.
 *
 * On success: returns { token: string }.
 * On failure: returns 401.
 */
export function GET(request: NextRequest): NextResponse {
  const token = request.cookies.get('hs_setup')?.value ?? '';

  if (!token) {
    return NextResponse.json({ code: 'SETUP_TOKEN_MISSING' }, { status: 401 });
  }

  return NextResponse.json({ token });
}
