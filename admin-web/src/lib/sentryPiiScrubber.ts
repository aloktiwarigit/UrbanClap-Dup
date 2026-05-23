/**
 * Sentry PII scrubbing utilities shared across server, edge, and client
 * Sentry configurations (E13-S04, ADR-0018).
 *
 * Redaction patterns (Indian context):
 *   - Indian mobile numbers:      (?:\+91[-\s]?)?[6-9]\d{9}
 *   - Email addresses:            [\w._%+-]+@[\w.-]+\.\w{2,}
 *   - Aadhaar numbers:            \b\d{4}\s?\d{4}\s?\d{4}\b
 *   - PAN card numbers:           \b[A-Z]{5}\d{4}[A-Z]\b
 *   - JWT tokens:                 eyJ[A-Za-z0-9_-]{20,}
 *   - UPI IDs:                    [\w.-]+@[\w-]{2,}
 *   - Razorpay payment/order IDs: (pay|order|rfnd|payout)_[A-Za-z0-9]{14}
 *   - IFSC codes:                 [A-Z]{4}0[A-Z0-9]{6}
 *   - Indian bank account (9-18 digits) — restricted to request.data / extra paths
 *
 * Sensitive request headers stripped:
 *   authorization, cookie, x-integrity-token, x-firebase-token
 */

// Include optional +91 prefix so the country code is not left visible after redaction.
const PHONE_RE = /(?:\+91[-\s]?)?[6-9]\d{9}/g;
const EMAIL_RE = /[\w._%+\-]+@[\w.\-]+\.\w{2,}/g;
const AADHAAR_RE = /\b\d{4}\s?\d{4}\s?\d{4}\b/g;
const PAN_RE = /\b[A-Z]{5}\d{4}[A-Z]\b/g;
const JWT_RE = /eyJ[A-Za-z0-9_\-]{20,}/g;
const UPI_RE = /[\w.\-]+@[\w\-]{2,}/g;
const RAZORPAY_RE = /\b(pay|order|rfnd|payout)_[A-Za-z0-9]{14}\b/g;
const IFSC_RE = /\b[A-Z]{4}0[A-Z0-9]{6}\b/g;
// Bank account — gated to structured paths (request.data, extra) only.
// Collides with other numeric data in free text.
const BANK_ACCOUNT_RE = /\b\d{9,18}\b/g;

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
    .replace(JWT_RE, '[REDACTED_JWT]')
    .replace(UPI_RE, '[REDACTED_UPI]')
    .replace(RAZORPAY_RE, '[REDACTED_PAYMENT_ID]')
    .replace(IFSC_RE, '[REDACTED_IFSC]');
}

function redactStructuredString(value: string): string {
  return redactString(value).replace(BANK_ACCOUNT_RE, '[REDACTED_ACCOUNT]');
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

function walkAndRedactStructured(node: unknown): unknown {
  if (typeof node === 'string') return redactStructuredString(node);
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      node[i] = walkAndRedactStructured(node[i]);
    }
    return node;
  }
  if (node !== null && typeof node === 'object') {
    const obj = node as Record<string, unknown>;
    for (const key of Object.keys(obj)) {
      obj[key] = walkAndRedactStructured(obj[key]);
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
      // Scrub the exception message string.
      if (typeof val['value'] === 'string') {
        val['value'] = redactString(val['value']);
      }

      // Scrub mechanism.data — Sentry sometimes drops raw payload here.
      const mechanism = val['mechanism'] as Record<string, unknown> | undefined;
      if (mechanism?.['data']) {
        mechanism['data'] = walkAndRedact(mechanism['data']);
      }

      // Scrub local-variable captures in stack frames.
      const stacktrace = val['stacktrace'] as Record<string, unknown> | undefined;
      if (stacktrace && Array.isArray(stacktrace['frames'])) {
        for (const frame of stacktrace['frames'] as Record<string, unknown>[]) {
          if (frame['vars']) {
            frame['vars'] = walkAndRedact(frame['vars']);
          }
        }
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

  // event.extra uses structured redaction (includes bank-account pattern).
  if (event['extra']) walkAndRedactStructured(event['extra']);
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

    // Scrub POST body / request data with structured redaction (includes bank account).
    if (request['data']) request['data'] = walkAndRedactStructured(request['data']);
    if (request['body']) request['body'] = walkAndRedactStructured(request['body']);
  }

  return event;
}
