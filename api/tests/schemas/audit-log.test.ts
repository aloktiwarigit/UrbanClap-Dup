import { describe, it, expect } from 'vitest';
import {
  AuditLogEntrySchema,
  AuditLogQuerySchema,
} from '../../src/schemas/audit-log.js';

const validEntry = {
  id: '00000000-0000-0000-0000-000000000001',
  adminId: 'admin-1',
  role: 'super-admin' as const,
  action: 'admin.login',
  resourceType: 'admin_session',
  resourceId: 'sess-abc',
  payload: { ip: '1.2.3.4' },
  timestamp: '2026-04-20T10:00:00.000Z',
};

describe('AuditLogEntrySchema', () => {
  it('accepts a valid entry without optional fields', () => {
    const result = AuditLogEntrySchema.safeParse(validEntry);
    expect(result.success).toBe(true);
  });

  it('accepts optional ip and userAgent fields', () => {
    const result = AuditLogEntrySchema.safeParse({
      ...validEntry,
      ip: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
    });
    expect(result.success).toBe(true);
  });

  it('strips unknown fields like partitionKey', () => {
    const result = AuditLogEntrySchema.safeParse({
      ...validEntry,
      partitionKey: '2026-04',
      _etag: '"abc123"',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>)['partitionKey']).toBeUndefined();
    }
  });

  it('rejects an invalid role', () => {
    const result = AuditLogEntrySchema.safeParse({ ...validEntry, role: 'hacker' });
    expect(result.success).toBe(false);
  });

  it('rejects a non-UUID id', () => {
    const result = AuditLogEntrySchema.safeParse({ ...validEntry, id: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing required field', () => {
    const { resourceType: _dropped, ...rest } = validEntry;
    const result = AuditLogEntrySchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

describe('AuditLogQuerySchema', () => {
  it('parses an empty object with defaults', () => {
    const result = AuditLogQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.pageSize).toBe(20);
  });

  it('coerces pageSize from string', () => {
    const result = AuditLogQuerySchema.safeParse({ pageSize: '10' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.pageSize).toBe(10);
  });

  it('rejects pageSize > 100', () => {
    const result = AuditLogQuerySchema.safeParse({ pageSize: 200 });
    expect(result.success).toBe(false);
  });

  it('accepts all optional filter fields', () => {
    const result = AuditLogQuerySchema.safeParse({
      adminId: 'a1',
      action: 'admin.login',
      resourceType: 'admin_session',
      resourceId: 'sess-1',
      dateFrom: '2026-01-01T00:00:00.000Z',
      dateTo: '2026-12-31T23:59:59.999Z',
      continuationToken: 'tok',
    });
    expect(result.success).toBe(true);
  });
});
