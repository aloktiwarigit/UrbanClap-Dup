/**
 * TDD (E13-S04) — Sentry beforeSend PII scrubbing + header stripping.
 *
 * These tests verify the scrubSentryEvent helper that is wired into the
 * beforeSend callback on every Sentry.init call.
 */

import { describe, it, expect } from 'vitest';
import { scrubSentryEvent } from '../../src/observability/sentry.js';

// ---------------------------------------------------------------------------
// Fixture: minimal SentryEvent shape used for testing.
// We don't import the real Sentry Event type to keep tests free of SDK deps.
// ---------------------------------------------------------------------------

function makeEvent(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    event_id: 'abc123',
    level: 'error',
    message: undefined,
    exception: undefined,
    request: undefined,
    ...overrides,
  };
}

describe('scrubSentryEvent — PII redaction', () => {
  it('redacts Indian mobile number in message', () => {
    const event = makeEvent({ message: 'User 9876543210 signed in' });
    const result = scrubSentryEvent(event);
    expect(result.message).toBe('User [REDACTED_PHONE] signed in');
  });

  it('redacts email address in message', () => {
    const event = makeEvent({ message: 'Login failed for user@example.com' });
    const result = scrubSentryEvent(event);
    expect(result.message).toBe('Login failed for [REDACTED_EMAIL]');
  });

  it('redacts Aadhaar number (spaced format) in message', () => {
    const event = makeEvent({ message: 'Aadhaar 1234 5678 9012 verified' });
    const result = scrubSentryEvent(event);
    expect(result.message).toBe('Aadhaar [REDACTED_AADHAAR] verified');
  });

  it('redacts PAN in message', () => {
    const event = makeEvent({ message: 'PAN ABCDE1234F submitted' });
    const result = scrubSentryEvent(event);
    expect(result.message).toBe('PAN [REDACTED_PAN] submitted');
  });

  it('redacts JWT in message', () => {
    const jwt = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMTIzIn0.sig';
    const event = makeEvent({ message: `Token: ${jwt}` });
    const result = scrubSentryEvent(event);
    expect(result.message).toContain('[REDACTED_JWT]');
  });

  it('preserves stack trace structure (exception.values array passes through)', () => {
    const event = makeEvent({
      exception: {
        values: [
          {
            type: 'TypeError',
            value: 'Cannot read property x of undefined',
            stacktrace: {
              frames: [
                { filename: 'src/functions/bookings.ts', lineno: 42, colno: 7 },
              ],
            },
          },
        ],
      },
    });
    const result = scrubSentryEvent(event);
    const values = (result.exception as { values: unknown[] }).values;
    expect(values).toHaveLength(1);
    const first = (values[0] ?? {}) as Record<string, unknown>;
    expect(first.type).toBe('TypeError');
    const st = first.stacktrace as { frames: { filename: string }[] };
    expect(st.frames[0]?.filename).toBe('src/functions/bookings.ts');
  });

  it('strips sensitive headers from request.headers', () => {
    const event = makeEvent({
      request: {
        url: 'https://api.example.com/v1/bookings',
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer eyJsometoken',
          cookie: 'hs_access=abc; hs_refresh=def',
          'x-integrity-token': 'some-integrity-value',
          'x-firebase-token': 'firebase-token-value',
          'x-correlation-id': 'corr-123',
        },
      },
    });
    const result = scrubSentryEvent(event);
    const headers = (result.request as { headers: Record<string, string> }).headers;
    // Sensitive headers must be absent
    expect(headers['authorization']).toBeUndefined();
    expect(headers['cookie']).toBeUndefined();
    expect(headers['x-integrity-token']).toBeUndefined();
    expect(headers['x-firebase-token']).toBeUndefined();
    // Non-sensitive header must be preserved
    expect(headers['content-type']).toBe('application/json');
    expect(headers['x-correlation-id']).toBe('corr-123');
  });
});
