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
 * /login?next=//evil.com, /login?next=/setup, or
 * /login?next=/hi/dashboard/../admin-api/... (path traversal).
 *
 * Query strings in the `next` param are discarded — only the normalized
 * path is returned, preventing arbitrary param injection into dashboard routes.
 */
export function getSafeNextPath(next: string | null, role: AdminRole): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return defaultPathForRole(role);
  }

  // Normalize the path to resolve `..` sequences before any validation.
  // This prevents path-traversal attacks like /hi/dashboard/../admin-api/setup
  // from passing the allowlist check on `dashboard` while actually routing elsewhere.
  const normalized = new URL(next, 'https://placeholder.invalid').pathname;

  // Strip locale prefix to get the underlying path segment for validation
  let rawPath = normalized;
  for (const locale of routing.locales as readonly string[]) {
    if (normalized === `/${locale}`) {
      rawPath = '/';
      break;
    }
    if (normalized.startsWith(`/${locale}/`)) {
      rawPath = normalized.slice(locale.length + 1);
      break;
    }
  }

  const base = '/' + (rawPath.split('/')[1] ?? '');
  // Return the normalized path-only string (no query string) to prevent
  // arbitrary query param injection into dashboard routes on the redirect.
  return ALLOWED_PATHS.has(base) ? normalized : defaultPathForRole(role);
}
