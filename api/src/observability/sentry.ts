import * as Sentry from '@sentry/node';
import type { Event as SentryEvent } from '@sentry/node';

// ---------------------------------------------------------------------------
// PII redaction patterns (ADR-0018)
// ---------------------------------------------------------------------------

const PHONE_RE = /\b[6-9]\d{9}\b/g;
const EMAIL_RE = /[\w._%+\-]+@[\w.\-]+\.\w{2,}/g;
const AADHAAR_RE = /\b\d{4}\s?\d{4}\s?\d{4}\b/g;
const PAN_RE = /\b[A-Z]{5}\d{4}[A-Z]\b/g;
const JWT_RE = /eyJ[A-Za-z0-9_\-]{20,}/g;

/** Headers to strip from request context before sending to Sentry. */
const SENSITIVE_HEADERS = new Set([
  'authorization',
  'cookie',
  'x-integrity-token',
  'x-firebase-token',
]);

/**
 * Redact all PII in a string value.
 * Applied to every string field visited during event scrubbing.
 */
function redactString(value: string): string {
  return value
    .replace(PHONE_RE, '[REDACTED_PHONE]')
    .replace(EMAIL_RE, '[REDACTED_EMAIL]')
    .replace(AADHAAR_RE, '[REDACTED_AADHAAR]')
    .replace(PAN_RE, '[REDACTED_PAN]')
    .replace(JWT_RE, '[REDACTED_JWT]');
}

/**
 * Recursively walk an object and redact string leaves.
 * Arrays and nested objects are traversed; non-string primitives are left as-is.
 *
 * NOTE: this mutates the input in place to avoid deep-cloning the entire event
 * (Sentry events can be large). The event object is owned by the SDK for the
 * duration of the beforeSend callback, so mutation is safe.
 */
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
    return obj;
  }
  return node;
}

/**
 * Scrub a Sentry event before it is transmitted.
 *
 * - Redacts all string fields that match PII patterns (phone, email, Aadhaar,
 *   PAN, JWT).
 * - Strips sensitive request headers (authorization, cookie, x-integrity-token,
 *   x-firebase-token).
 * - Preserves stack traces and non-string fields untouched.
 *
 * Exported for direct unit testing (sentry-before-send.test.ts).
 *
 * @param event A Sentry event object (may be partially shaped in tests).
 * @returns The mutated event — Sentry expects the same event returned.
 */
export function scrubSentryEvent(event: Record<string, unknown>): Record<string, unknown>;
export function scrubSentryEvent(event: SentryEvent): SentryEvent;
export function scrubSentryEvent(event: unknown): unknown {
  if (event === null || typeof event !== 'object') return event;

  const ev = event as Record<string, unknown>;

  // Scrub top-level message
  if (typeof ev['message'] === 'string') {
    ev['message'] = redactString(ev['message']);
  }

  // Scrub exception value messages (stack traces left intact)
  const exception = ev['exception'] as Record<string, unknown> | undefined;
  if (exception && Array.isArray(exception['values'])) {
    for (const exceptionValue of exception['values'] as Record<string, unknown>[]) {
      if (typeof exceptionValue['value'] === 'string') {
        exceptionValue['value'] = redactString(exceptionValue['value']);
      }
      // Stack frames: filenames and function names are code identifiers, not PII.
      // We deliberately do NOT scrub them so stack traces remain readable.
    }
  }

  // Scrub breadcrumbs
  const breadcrumbs = ev['breadcrumbs'] as Record<string, unknown> | undefined;
  if (breadcrumbs && Array.isArray(breadcrumbs['values'])) {
    for (const crumb of breadcrumbs['values'] as Record<string, unknown>[]) {
      if (typeof crumb['message'] === 'string') {
        crumb['message'] = redactString(crumb['message']);
      }
      if (crumb['data'] && typeof crumb['data'] === 'object') {
        walkAndRedact(crumb['data']);
      }
    }
  }

  // Scrub extra/contexts
  if (ev['extra']) walkAndRedact(ev['extra']);
  if (ev['contexts']) walkAndRedact(ev['contexts']);
  if (ev['tags']) walkAndRedact(ev['tags']);

  // Strip sensitive request headers
  const request = ev['request'] as Record<string, unknown> | undefined;
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

  return ev;
}

export function initSentry(): void {
  const dsn = process.env['SENTRY_DSN'];
  if (!dsn) return;
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    release: process.env['GIT_SHA'] ?? 'local',
    environment: process.env['NODE_ENV'] ?? 'production',
    // Sentry v8 beforeSend uses an overloaded ErrorEvent type that is
    // incompatible with the generic SentryEvent. We cast through unknown to
    // satisfy the compiler; the runtime behavior is identical since we only
    // mutate string leaves and delete header keys.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return
    beforeSend: (event: any) => scrubSentryEvent(event as Record<string, unknown>) as unknown as any,
  });
}
