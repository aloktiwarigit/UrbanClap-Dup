export function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  return cookieHeader
    .split(';')
    .reduce<Record<string, string>>((acc, part) => {
      const idx = part.indexOf('=');
      if (idx === -1) return acc;
      const key = part.slice(0, idx).trim();
      const val = part.slice(idx + 1).trim();
      if (key) acc[key] = decodeURIComponent(val);
      return acc;
    }, {});
}
