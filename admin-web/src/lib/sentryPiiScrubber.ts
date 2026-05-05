/**
 * Sentry PII scrubbing utilities shared across server, edge, and client
 * Sentry configurations (E13-S04, ADR-0018).
 *
 * Redaction patterns (Indian context):
 *   - Indian mobile numbers:   \b[6-9]\d{9}\b
 *   - Email addresses:         [\w._%+-]+@[\w.-]+\.\w{2,}
 *   - Aadhaar numbers:         \b\d{4}\s?\d{4}\s?\d{4}\b
 *   - PAN card numbers:        \b[A-Z]{5}\d{4}[A-Z]\b
 *   - JWT tokens:              eyJ[A-Za-z0-9_-]{20,}
 *
 * Sensitive request headers stripped:
 *   authorization, cookie, x-integrity-token, x-firebase-token
 */

const PHONE_RE = /\b[6-9]\d{9}\b/g;
const EMAIL_RE = /[\w._%+\-]+@[\w.\-]+\.\w{2,}/g;
const AADHAAR_RE = /\b\d{4}\s?\d{4}\s?\d{4}\b/g;
const PAN_RE = /\b[A-Z]{5}\d{4}[A-Z]\b/g;
const JWT_RE = /eyJ[A-Za-z0-9_\-]{20,}/g;

const SENSITIVE_HEADERS = new Set([
  'authorization',
  'cookie',
  'x-integrity-token',
  'x-firebase-token',
]);

function redactString(value: string): string {
  return value
    .replace(PHONE_RE, '[REDACTED_PHONE]')
    .replace(EMAIL_RE, '[REDACTED_EMAIL]')
    .replace(AADHAAR_RE, '[REDACTED_AADHAAR]')
    .replace(PAN_RE, '[REDACTED_PAN]')
    .replace(JWT_RE, '[REDACTED_JWT]');
}

function walkAndRedact(node: unknown): unknown {
  if (typeof node === 'string') return redactString(node);
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      node[i] = walkAndRedact(node[i]);
    }
    return node;
  }
  if (node !== null && typeof node === 'object') {
    const obj = node as Record<string, unknown>;
    for (const key of Object.keys(obj)) {
      obj[key] = walkAndRedact(obj[key]);
    }
  }
  return node;
}

export function scrubSentryEvent(event: Record<string, unknown>): Record<string, unknown> {
  if (typeof event['message'] === 'string') {
    event['message'] = redactString(event['message']);
  }

  const exception = event['exception'] as Record<string, unknown> | undefined;
  if (exception && Array.isArray(exception['values'])) {
    for (const val of exception['values'] as Record<string, unknown>[]) {
      if (typeof val['value'] === 'string') {
        val['value'] = redactString(val['value']);
      }
    }
  }

  const breadcrumbs = event['breadcrumbs'] as Record<string, unknown> | undefined;
  if (breadcrumbs && Array.isArray(breadcrumbs['values'])) {
    for (const crumb of breadcrumbs['values'] as Record<string, unknown>[]) {
      if (typeof crumb['message'] === 'string') {
        crumb['message'] = redactString(crumb['message']);
      }
      if (crumb['data']) walkAndRedact(crumb['data']);
    }
  }

  if (event['extra']) walkAndRedact(event['extra']);
  if (event['contexts']) walkAndRedact(event['contexts']);
  if (event['tags']) walkAndRedact(event['tags']);

  const request = event['request'] as Record<string, unknown> | undefined;
  if (request) {
    const headers = request['headers'] as Record<string, string> | undefined;
    if (headers && typeof headers === 'object') {
      for (const header of Object.keys(headers)) {
        if (SENSITIVE_HEADERS.has(header.toLowerCase())) {
          delete headers[header];
        }
      }
    }
  }

  return event;
}
