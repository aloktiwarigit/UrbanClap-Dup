import type { AdminRole } from '@/lib/auth/types';
import { defaultPathForRole } from '@/admin/capabilities';
import { routing } from '@/i18n/config';

const ALLOWED_PATHS = new Set([
  '/dashboard',
  '/orders',
  '/finance',
  '/catalogue',
  '/complaints',
  '/audit-log',
  '/admin-users',
  '/compliance',
]);

/**
 * Returns a safe redirect path after login.
 *
 * Accepts both bare paths (/dashboard) and locale-prefixed paths (/hi/dashboard).
 * Strips locale prefix before checking against ALLOWED_PATHS to prevent
 * the locale segment from being treated as the base path.
 *
 * Prevents open-redirect attacks where an attacker crafts
 * /login?next=//evil.com or /login?next=/setup.
 */
export function getSafeNextPath(next: string | null, role: AdminRole): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return defaultPathForRole(role);
  }

  const pathOnly = next.split('?')[0] ?? '';

  // Strip locale prefix to get the underlying path segment for validation
  let rawPath = pathOnly;
  for (const locale of routing.locales as readonly string[]) {
    if (pathOnly === `/${locale}`) {
      rawPath = '/';
      break;
    }
    if (pathOnly.startsWith(`/${locale}/`)) {
      rawPath = pathOnly.slice(locale.length + 1);
      break;
    }
  }

  const base = '/' + (rawPath.split('/')[1] ?? '');
  return ALLOWED_PATHS.has(base) ? next : defaultPathForRole(role);
}
