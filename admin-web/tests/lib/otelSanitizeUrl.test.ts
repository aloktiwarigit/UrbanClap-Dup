import { describe, it, expect } from 'vitest';
import { sanitizeUrl } from '../../src/lib/otelSanitizeUrl';

describe('sanitizeUrl', () => {
  it('strips query string from absolute URL', () => {
    const { path, full } = sanitizeUrl('https://api.example.com/v1/customers?customerPhone=9876543210');
    expect(path).toBe('/v1/customers');
    expect(full).toBe('https://api.example.com/v1/customers');
    expect(full).not.toContain('9876543210');
  });

  it('strips query string from relative path', () => {
    const { path, full } = sanitizeUrl('/v1/customers?customerPhone=9876543210');
    expect(path).toBe('/v1/customers');
    expect(full).not.toContain('9876543210');
  });

  it('replaces UUID path segment with :id', () => {
    const { path } = sanitizeUrl('/v1/orders/a1b2c3d4e5f6a1b2');
    expect(path).toBe('/v1/orders/:id');
  });

  it('replaces MongoDB ObjectId-like segment with :id', () => {
    const { path } = sanitizeUrl('/v1/bookings/507f1f77bcf86cd7');
    expect(path).toBe('/v1/bookings/:id');
  });

  it('preserves short non-ID path segments', () => {
    const { path } = sanitizeUrl('/v1/admin/orders');
    expect(path).toBe('/v1/admin/orders');
  });

  it('handles URL with no query string', () => {
    const { path, full } = sanitizeUrl('https://api.example.com/v1/health');
    expect(path).toBe('/v1/health');
    expect(full).toBe('https://api.example.com/v1/health');
  });

  it('strips both query string AND replaces ID segment', () => {
    const { path, full } = sanitizeUrl('/v1/orders/abc123def456?status=paid');
    expect(path).toBe('/v1/orders/:id');
    expect(full).not.toContain('status=paid');
    expect(full).not.toContain('abc123def456');
  });

  it('handles empty string without throwing', () => {
    expect(() => sanitizeUrl('')).not.toThrow();
  });

  it('returns path-only for relative path with no leading slash', () => {
    const { path } = sanitizeUrl('v1/customers');
    expect(path).toContain('customers');
  });

  it('full URL does not contain query string', () => {
    const { full } = sanitizeUrl('https://example.com/orders?customerPhone=9876543210&status=active');
    expect(full).not.toContain('?');
    expect(full).not.toContain('customerPhone');
  });

  it('replaces multiple ID segments in the same path', () => {
    const { path } = sanitizeUrl('/v1/technicians/a1b2c3d4e5f6a1b2/bookings/b2c3d4e5f6a1b2c3');
    expect(path).toBe('/v1/technicians/:id/bookings/:id');
  });
});
