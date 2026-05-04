const DEFAULT_BROWSER_API_BASE_URL = '/admin-api';

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

export const BROWSER_API_BASE_URL = trimTrailingSlash(
  process.env['NEXT_PUBLIC_API_BASE_URL'] ?? DEFAULT_BROWSER_API_BASE_URL,
);

export function apiUrl(path: string): string {
  return `${BROWSER_API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
