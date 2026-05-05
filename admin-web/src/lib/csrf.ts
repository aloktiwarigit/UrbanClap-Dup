// Double-submit CSRF cookie helpers.
// NOTE: verifyCsrf() is NOT currently used in the admin-api proxy (route.ts).
// The proxy uses an Origin allowlist check instead because the hs_csrf cookie
// seeding mechanism is not yet implemented. These helpers are preserved for
// when the full double-submit flow is wired (E12-S06b follow-up).

const CSRF_COOKIE = 'hs_csrf';
const CSRF_HEADER = 'x-csrf-token';

export function getCsrfToken(cookies: string | null): string | null {
  if (!cookies) return null;
  const match = cookies.match(new RegExp(`(?:^|;)\\s*${CSRF_COOKIE}=([^;]+)`));
  return match ? decodeURIComponent(match[1] ?? '') : null;
}

export function verifyCsrf(req: Request): boolean {
  // GET/HEAD/OPTIONS are safe methods — no CSRF check needed
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return true;
  const cookieToken = getCsrfToken(req.headers.get('cookie'));
  const headerToken = req.headers.get(CSRF_HEADER);
  if (!cookieToken || !headerToken) return false;
  return cookieToken === headerToken;
}
