const ID_SEGMENT_RE = /[0-9a-f]{8,}/i;

export function sanitizeUrl(url: string): { path: string; full: string } {
  if (!url) return { path: '', full: '' };

  let parsed: URL | null = null;
  let wasRelative = false;

  try {
    parsed = new URL(url);
  } catch {
    wasRelative = true;
    try {
      parsed = new URL(url, 'https://placeholder.invalid');
    } catch {
      return { path: url, full: url };
    }
  }

  // Sanitize path segments — replace hex ID / UUID / ObjectId-like segments.
  const sanitizedPathname = parsed.pathname
    .split('/')
    .map((segment) => (ID_SEGMENT_RE.test(segment) ? ':id' : segment))
    .join('/');

  if (wasRelative) {
    return { path: sanitizedPathname, full: sanitizedPathname };
  }

  const sanitizedFull = `${parsed.protocol}//${parsed.host}${sanitizedPathname}`;
  return { path: sanitizedPathname, full: sanitizedFull };
}
