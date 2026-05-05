import type { AdminRole } from '@/lib/auth/types';
import { defaultPathForRole } from '@/admin/capabilities';

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
 * Only paths whose first path segment is in ALLOWED_PATHS are accepted.
 * Anything else (protocol-relative URLs, absolute URLs, /setup, path traversal)
 * falls back to the default path for the given role.
 *
 * This prevents open-redirect attacks where an attacker crafts
 * /login?next=//evil.com or /login?next=/setup.
 */
export function getSafeNextPath(next: string | null, role: AdminRole): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return defaultPathForRole(role);
  }
  const pathOnly = next.split('?')[0] ?? '';
  const base = '/' + (pathOnly.split('/')[1] ?? '');
  return ALLOWED_PATHS.has(base) ? next : defaultPathForRole(role);
}
