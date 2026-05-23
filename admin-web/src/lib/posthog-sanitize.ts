const PII_KEYS = new Set([
  'phone',
  'email',
  'aadhaar',
  'pan',
  'customerphone',
  'customeremail',
  'technicianphone',
  'technicianemail',
  'dob',
  'address',
  'otp',
  'token',
]);

const URL_PII_PARAMS = PII_KEYS;

const URL_PROP_KEYS = ['$current_url', '$pathname', '$referrer'];

export function sanitizePosthogUrl(url: string): string {
  if (!url) return url;

  const qIdx = url.indexOf('?');
  if (qIdx === -1) return url;

  const base = url.slice(0, qIdx);
  const query = url.slice(qIdx + 1);

  const sanitizedQuery = query
    .split('&')
    .map((part) => {
      const eqIdx = part.indexOf('=');
      if (eqIdx === -1) return part;
      const key = part.slice(0, eqIdx);
      const decodedKey = (() => {
        try { return decodeURIComponent(key); } catch { return key; }
      })();
      if (URL_PII_PARAMS.has(decodedKey.toLowerCase())) {
        return `${key}=[REDACTED]`;
      }
      return part;
    })
    .join('&');

  return `${base}?${sanitizedQuery}`;
}

export function sanitizeProperties(
  properties: Record<string, unknown>,
  _eventName: string
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(properties)) {
    if (PII_KEYS.has(key.toLowerCase())) {
      // Drop PII key entirely
      continue;
    }
    if (URL_PROP_KEYS.includes(key) && typeof value === 'string') {
      result[key] = sanitizePosthogUrl(value);
    } else {
      result[key] = value;
    }
  }

  return result;
}
