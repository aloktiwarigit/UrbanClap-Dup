import { describe, it, expect } from 'vitest';
import { scrubSentryEvent } from '../../src/lib/sentryPiiScrubber';

type AnyObj = Record<string, unknown>;
type AnyArr = AnyObj[];

function makeEvent(overrides: AnyObj = {}): AnyObj {
  return { ...overrides };
}

function exceptionVal(event: AnyObj, idx = 0): AnyObj {
  return ((event['exception'] as AnyObj)['values'] as AnyArr)[idx]!;
}

function breadcrumbVal(event: AnyObj, idx = 0): AnyObj {
  return ((event['breadcrumbs'] as AnyObj)['values'] as AnyArr)[idx]!;
}

describe('scrubSentryEvent — message field', () => {
  it('redacts plain 10-digit Indian phone number', () => {
    const event = makeEvent({ message: 'Customer called 9876543210 for help' });
    const result = scrubSentryEvent(event);
    expect(result['message']).toBe('Customer called [REDACTED_PHONE] for help');
  });

  it('redacts E.164 phone number including +91 prefix', () => {
    const event = makeEvent({ message: 'Phone: +919876543210' });
    const result = scrubSentryEvent(event);
    expect(String(result['message'])).not.toContain('+919876543210');
    expect(String(result['message'])).toContain('[REDACTED_PHONE]');
  });

  it('redacts +91 with space separator', () => {
    const event = makeEvent({ message: 'Contact: +91 9876543210' });
    const result = scrubSentryEvent(event);
    expect(String(result['message'])).not.toContain('9876543210');
  });

  it('redacts email address', () => {
    const event = makeEvent({ message: 'Login failed for user@example.com' });
    const result = scrubSentryEvent(event);
    expect(result['message']).toBe('Login failed for [REDACTED_EMAIL]');
  });

  it('redacts Aadhaar number', () => {
    const event = makeEvent({ message: 'Aadhaar 1234 5678 9012 invalid' });
    const result = scrubSentryEvent(event);
    expect(String(result['message'])).not.toContain('1234 5678 9012');
    expect(String(result['message'])).toContain('[REDACTED_AADHAAR]');
  });

  it('redacts PAN number', () => {
    const event = makeEvent({ message: 'PAN ABCDE1234F rejected' });
    const result = scrubSentryEvent(event);
    expect(String(result['message'])).not.toContain('ABCDE1234F');
    expect(String(result['message'])).toContain('[REDACTED_PAN]');
  });

  it('redacts JWT token', () => {
    const event = makeEvent({ message: 'Token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9 expired' });
    const result = scrubSentryEvent(event);
    expect(String(result['message'])).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
    expect(String(result['message'])).toContain('[REDACTED_JWT]');
  });

  it('passes through clean message unchanged', () => {
    const event = makeEvent({ message: 'Disk full — retry later' });
    const result = scrubSentryEvent(event);
    expect(result['message']).toBe('Disk full — retry later');
  });
});

describe('scrubSentryEvent — exception.values', () => {
  it('redacts phone in exception value string', () => {
    const event = makeEvent({
      exception: {
        values: [{ value: 'ApiError: 400 — customer 9876543210 not found', type: 'ApiError' }],
      },
    });
    const result = scrubSentryEvent(event);
    const val = exceptionVal(result);
    expect(String(val['value'])).not.toContain('9876543210');
    expect(String(val['value'])).toContain('[REDACTED_PHONE]');
  });

  it('redacts UPI ID in exception value', () => {
    const event = makeEvent({
      exception: {
        values: [{ value: 'Payment failed for someone@oksbi', type: 'Error' }],
      },
    });
    const result = scrubSentryEvent(event);
    const val = exceptionVal(result);
    expect(String(val['value'])).not.toContain('someone@oksbi');
    expect(String(val['value'])).toContain('[REDACTED_UPI]');
  });

  it('redacts phone in mechanism.data', () => {
    const event = makeEvent({
      exception: {
        values: [{
          value: 'Error',
          mechanism: { type: 'generic', data: { customerPhone: '9876543210' } },
        }],
      },
    });
    const result = scrubSentryEvent(event);
    const val = exceptionVal(result);
    const mech = val['mechanism'] as Record<string, AnyObj>;
    expect(String(mech['data']!['customerPhone'])).toContain('[REDACTED_PHONE]');
  });

  it('redacts vars in stacktrace frames', () => {
    const event = makeEvent({
      exception: {
        values: [{
          value: 'Error',
          stacktrace: {
            frames: [
              { function: 'fetchOrder', vars: { customerPhone: '9876543210', name: 'Alice' } },
            ],
          },
        }],
      },
    });
    const result = scrubSentryEvent(event);
    const val = exceptionVal(result);
    const frames = ((val['stacktrace'] as AnyObj)['frames'] as AnyArr);
    const frame = frames[0]!;
    const vars = frame['vars'] as AnyObj;
    expect(String(vars['customerPhone'])).toContain('[REDACTED_PHONE]');
    expect(vars['name']).toBe('Alice');
  });

  it('handles missing exception gracefully', () => {
    const event = makeEvent({ message: 'hello' });
    expect(() => scrubSentryEvent(event)).not.toThrow();
  });
});

describe('scrubSentryEvent — extra field (ApiError.body simulation)', () => {
  it('redacts phone in extra.body (ApiError simulation)', () => {
    // Simulates: Sentry.captureException(err, { extra: { body: err.body } })
    const event = makeEvent({
      extra: {
        body: { customerPhone: '9876543210', orderId: 'ORD-001' },
      },
    });
    const result = scrubSentryEvent(event);
    const extra = result['extra'] as Record<string, AnyObj>;
    expect(String(extra['body']!['customerPhone'])).toContain('[REDACTED_PHONE]');
    expect(extra['body']!['orderId']).toBe('ORD-001');
  });

  it('redacts Razorpay payment ID in extra.responseBody', () => {
    const event = makeEvent({
      extra: {
        responseBody: { paymentId: 'pay_AbCdEfGhIjKlMn' },
      },
    });
    const result = scrubSentryEvent(event);
    const extra = result['extra'] as Record<string, AnyObj>;
    expect(String(extra['responseBody']!['paymentId'])).not.toContain('pay_AbCdEfGhIjKlMn');
    expect(String(extra['responseBody']!['paymentId'])).toContain('[REDACTED_PAYMENT_ID]');
  });

  it('redacts bank account in extra.body (structured path)', () => {
    // 15-digit account number starting with 1s/0s — avoids PHONE_RE ([6-9]\d{9})
    // and AADHAAR_RE (12 digits with word boundaries at 4+4+4 groups).
    const event = makeEvent({
      extra: {
        body: { bankAccount: '100000000000001' },
      },
    });
    const result = scrubSentryEvent(event);
    const extra = result['extra'] as Record<string, AnyObj>;
    expect(String(extra['body']!['bankAccount'])).toContain('[REDACTED_ACCOUNT]');
  });

  it('redacts nested phone in extra', () => {
    const event = makeEvent({
      extra: { customer: { phone: '9876543210', name: 'Alice' } },
    });
    const result = scrubSentryEvent(event);
    const extra = result['extra'] as Record<string, AnyObj>;
    expect(String(extra['customer']!['phone'])).toContain('[REDACTED_PHONE]');
    expect(extra['customer']!['name']).toBe('Alice');
  });
});

describe('scrubSentryEvent — breadcrumbs', () => {
  it('redacts phone in breadcrumb message', () => {
    const event = makeEvent({
      breadcrumbs: {
        values: [{ message: 'Fetching order for 9876543210', category: 'api' }],
      },
    });
    const result = scrubSentryEvent(event);
    const crumb = breadcrumbVal(result);
    expect(String(crumb['message'])).not.toContain('9876543210');
    expect(String(crumb['message'])).toContain('[REDACTED_PHONE]');
  });

  it('redacts PII in breadcrumb data', () => {
    const event = makeEvent({
      breadcrumbs: {
        values: [{ message: 'API call', data: { phone: '9876543210' } }],
      },
    });
    const result = scrubSentryEvent(event);
    const crumb = breadcrumbVal(result);
    expect(String((crumb['data'] as AnyObj)['phone'])).toContain('[REDACTED_PHONE]');
  });
});

describe('scrubSentryEvent — request headers', () => {
  it('deletes Authorization header', () => {
    const event = makeEvent({
      request: { headers: { Authorization: 'Bearer token123', 'Content-Type': 'application/json' } },
    });
    const result = scrubSentryEvent(event);
    const headers = (result['request'] as AnyObj)['headers'] as AnyObj;
    expect(headers['Authorization']).toBeUndefined();
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('deletes cookie header (case-insensitive)', () => {
    const event = makeEvent({
      request: { headers: { Cookie: 'hs_access=token123' } },
    });
    const result = scrubSentryEvent(event);
    const headers = (result['request'] as AnyObj)['headers'] as AnyObj;
    expect(headers['Cookie']).toBeUndefined();
  });

  it('deletes x-firebase-token header', () => {
    const event = makeEvent({
      request: { headers: { 'x-firebase-token': 'firebase-token-abc' } },
    });
    const result = scrubSentryEvent(event);
    const headers = (result['request'] as AnyObj)['headers'] as AnyObj;
    expect(headers['x-firebase-token']).toBeUndefined();
  });

  it('scrubs phone in request.data', () => {
    const event = makeEvent({
      request: { data: { customerPhone: '9876543210', action: 'search' } },
    });
    const result = scrubSentryEvent(event);
    const data = (result['request'] as Record<string, AnyObj>)['data']!;
    expect(String(data['customerPhone'])).toContain('[REDACTED_PHONE]');
    expect(data['action']).toBe('search');
  });
});

describe('scrubSentryEvent — new patterns', () => {
  it('redacts IFSC code in message', () => {
    const event = makeEvent({ message: 'IFSC SBIN0012345 invalid' });
    const result = scrubSentryEvent(event);
    expect(String(result['message'])).toContain('[REDACTED_IFSC]');
    expect(String(result['message'])).not.toContain('SBIN0012345');
  });

  it('redacts Razorpay order ID in message', () => {
    const event = makeEvent({ message: 'Order order_AbCdEfGhIjKlMn failed' });
    const result = scrubSentryEvent(event);
    expect(String(result['message'])).toContain('[REDACTED_PAYMENT_ID]');
  });
});

describe('scrubSentryEvent — edge cases', () => {
  it('returns empty event without error', () => {
    const event = makeEvent();
    expect(() => scrubSentryEvent(event)).not.toThrow();
  });

  it('handles null/undefined field values gracefully', () => {
    const event = makeEvent({
      message: null as unknown as string,
      exception: null as unknown as AnyObj,
      extra: null as unknown as AnyObj,
    });
    expect(() => scrubSentryEvent(event)).not.toThrow();
  });

  it('handles exception with no stacktrace', () => {
    const event = makeEvent({
      exception: { values: [{ value: 'Error with phone 9876543210' }] },
    });
    expect(() => scrubSentryEvent(event)).not.toThrow();
    const val = exceptionVal(event);
    expect(String(val['value'])).toContain('[REDACTED_PHONE]');
  });

  it('handles breadcrumbs with no data field', () => {
    const event = makeEvent({
      breadcrumbs: { values: [{ message: 'click', category: 'ui' }] },
    });
    expect(() => scrubSentryEvent(event)).not.toThrow();
  });
});
