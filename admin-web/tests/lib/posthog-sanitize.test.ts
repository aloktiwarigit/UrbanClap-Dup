import { describe, it, expect } from 'vitest';
import { sanitizeProperties, sanitizePosthogUrl } from '../../src/lib/posthog-sanitize';

describe('sanitizePosthogUrl', () => {
  it('strips customerPhone query param value', () => {
    const result = sanitizePosthogUrl('https://example.com/orders?customerPhone=9876543210&status=active');
    expect(result).not.toContain('9876543210');
    expect(result).toContain('customerPhone=[REDACTED]');
    expect(result).toContain('status=active');
  });

  it('strips phone query param value', () => {
    const result = sanitizePosthogUrl('https://example.com/?phone=9876543210');
    expect(result).toContain('phone=[REDACTED]');
    expect(result).not.toContain('9876543210');
  });

  it('strips email query param value', () => {
    const result = sanitizePosthogUrl('https://example.com/?email=user@example.com');
    expect(result).toContain('email=[REDACTED]');
    expect(result).not.toContain('user@example.com');
  });

  it('strips aadhaar param value', () => {
    const result = sanitizePosthogUrl('https://example.com/?aadhaar=123456789012');
    expect(result).toContain('aadhaar=[REDACTED]');
  });

  it('strips pan param value', () => {
    const result = sanitizePosthogUrl('https://example.com/?pan=ABCDE1234F');
    expect(result).toContain('pan=[REDACTED]');
  });

  it('strips customerEmail param value', () => {
    const result = sanitizePosthogUrl('https://example.com/?customerEmail=admin@test.com');
    expect(result).toContain('customerEmail=[REDACTED]');
  });

  it('strips technicianPhone param value', () => {
    const result = sanitizePosthogUrl('https://example.com/?technicianPhone=9123456789');
    expect(result).toContain('technicianPhone=[REDACTED]');
  });

  it('strips otp param value', () => {
    const result = sanitizePosthogUrl('https://example.com/?otp=123456');
    expect(result).toContain('otp=[REDACTED]');
  });

  it('strips token param value', () => {
    const result = sanitizePosthogUrl('https://example.com/?token=eyJabc123');
    expect(result).toContain('token=[REDACTED]');
  });

  it('leaves unrelated params intact', () => {
    const result = sanitizePosthogUrl('https://example.com/orders?status=active&page=2');
    expect(result).toContain('status=active');
    expect(result).toContain('page=2');
  });

  it('returns URL without query string unchanged', () => {
    const result = sanitizePosthogUrl('https://example.com/dashboard');
    expect(result).toBe('https://example.com/dashboard');
  });

  it('handles empty string gracefully', () => {
    expect(() => sanitizePosthogUrl('')).not.toThrow();
  });

  it('handles relative paths gracefully', () => {
    const result = sanitizePosthogUrl('/orders?customerPhone=9876543210');
    expect(result).toContain('customerPhone=[REDACTED]');
    expect(result).not.toContain('9876543210');
  });
});

describe('sanitizeProperties', () => {
  it('strips phone key from properties', () => {
    const result = sanitizeProperties({ phone: '9876543210', status: 'active' }, '$pageview');
    expect(result['phone']).toBeUndefined();
    expect(result['status']).toBe('active');
  });

  it('strips email key from properties', () => {
    const result = sanitizeProperties({ email: 'user@example.com', page: '/dashboard' }, '$pageview');
    expect(result['email']).toBeUndefined();
    expect(result['page']).toBe('/dashboard');
  });

  it('strips customerPhone from properties', () => {
    const result = sanitizeProperties({ customerPhone: '9876543210' }, '$pageview');
    expect(result['customerPhone']).toBeUndefined();
  });

  it('strips customerEmail from properties', () => {
    const result = sanitizeProperties({ customerEmail: 'c@example.com' }, '$pageview');
    expect(result['customerEmail']).toBeUndefined();
  });

  it('strips technicianPhone from properties', () => {
    const result = sanitizeProperties({ technicianPhone: '9876543210' }, '$pageview');
    expect(result['technicianPhone']).toBeUndefined();
  });

  it('strips technicianEmail from properties', () => {
    const result = sanitizeProperties({ technicianEmail: 't@example.com' }, '$pageview');
    expect(result['technicianEmail']).toBeUndefined();
  });

  it('strips aadhaar, pan, dob, address, otp, token keys', () => {
    const result = sanitizeProperties({
      aadhaar: '123456789012',
      pan: 'ABCDE1234F',
      dob: '1990-01-01',
      address: '123 Main St',
      otp: '123456',
      token: 'eyJabc',
    }, '$identify');
    expect(result['aadhaar']).toBeUndefined();
    expect(result['pan']).toBeUndefined();
    expect(result['dob']).toBeUndefined();
    expect(result['address']).toBeUndefined();
    expect(result['otp']).toBeUndefined();
    expect(result['token']).toBeUndefined();
  });

  it('sanitizes $current_url query params', () => {
    const result = sanitizeProperties(
      { $current_url: 'https://example.com/orders?customerPhone=9876543210' },
      '$pageview'
    );
    expect(String(result['$current_url'])).not.toContain('9876543210');
    expect(String(result['$current_url'])).toContain('customerPhone=[REDACTED]');
  });

  it('sanitizes $referrer query params', () => {
    const result = sanitizeProperties(
      { $referrer: 'https://example.com/?phone=9999999999' },
      '$pageview'
    );
    expect(String(result['$referrer'])).toContain('phone=[REDACTED]');
  });

  it('sanitizes $pathname query params', () => {
    const result = sanitizeProperties(
      { $pathname: '/orders?customerPhone=9876543210&status=active' },
      '$pageview'
    );
    expect(String(result['$pathname'])).toContain('customerPhone=[REDACTED]');
    expect(String(result['$pathname'])).toContain('status=active');
  });

  it('leaves properties without PII keys intact', () => {
    const result = sanitizeProperties({ $screen_name: 'Dashboard', count: 5 }, '$pageview');
    expect(result['$screen_name']).toBe('Dashboard');
    expect(result['count']).toBe(5);
  });

  it('handles empty properties', () => {
    expect(() => sanitizeProperties({}, '$pageview')).not.toThrow();
    expect(sanitizeProperties({}, '$pageview')).toEqual({});
  });

  it('is case-insensitive for key stripping', () => {
    const result = sanitizeProperties({ Phone: '9876543210', EMAIL: 'x@x.com' }, '$pageview');
    expect(result['Phone']).toBeUndefined();
    expect(result['EMAIL']).toBeUndefined();
  });
});
