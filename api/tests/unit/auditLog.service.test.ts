import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/cosmos/audit-log-repository.js', () => ({
  appendAuditEntry: vi.fn(),
}));

vi.mock('@sentry/node', () => ({
  captureException: vi.fn(),
}));

import { auditLog } from '../../src/services/auditLog.service.js';
import { appendAuditEntry } from '../../src/cosmos/audit-log-repository.js';
import * as Sentry from '@sentry/node';

const mockAppendAuditEntry = vi.mocked(appendAuditEntry);
const mockCaptureException = vi.mocked(Sentry.captureException);

const ctx = { adminId: 'admin-1', role: 'super-admin' as const, sessionId: 'sess-abc' };

describe('auditLog()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls appendAuditEntry with correct shape', async () => {
    mockAppendAuditEntry.mockResolvedValue(undefined);
    await auditLog(ctx, 'admin.login', 'admin_session', 'sess-abc', { from: 'test' });

    expect(mockAppendAuditEntry).toHaveBeenCalledOnce();
    const [doc] = mockAppendAuditEntry.mock.calls[0] as [Record<string, unknown>];
    expect(doc['adminId']).toBe('admin-1');
    expect(doc['role']).toBe('super-admin');
    expect(doc['action']).toBe('admin.login');
    expect(doc['resourceType']).toBe('admin_session');
    expect(doc['resourceId']).toBe('sess-abc');
    expect(doc['payload']).toEqual({ from: 'test' });
    expect(typeof doc['id']).toBe('string');
    expect(typeof doc['timestamp']).toBe('string');
    expect(typeof doc['partitionKey']).toBe('string');
  });

  it('includes optional ip and userAgent when provided', async () => {
    mockAppendAuditEntry.mockResolvedValue(undefined);
    await auditLog(ctx, 'admin.logout', 'admin_session', 'sess-1', {}, {
      ip: '1.2.3.4',
      userAgent: 'Mozilla/5.0',
    });

    const [doc] = mockAppendAuditEntry.mock.calls[0] as [Record<string, unknown>];
    expect(doc['ip']).toBe('1.2.3.4');
    expect(doc['userAgent']).toBe('Mozilla/5.0');
  });

  it('does not include ip key when ip is absent', async () => {
    mockAppendAuditEntry.mockResolvedValue(undefined);
    await auditLog(ctx, 'admin.login', 'admin_session', 'sess-1', {});

    const [doc] = mockAppendAuditEntry.mock.calls[0] as [Record<string, unknown>];
    expect('ip' in doc).toBe(false);
    expect('userAgent' in doc).toBe(false);
  });

  it('never throws when appendAuditEntry rejects — swallows error', async () => {
    mockAppendAuditEntry.mockRejectedValue(new Error('Cosmos down'));
    await expect(
      auditLog(ctx, 'admin.login', 'admin_session', 'sess-1', {}),
    ).resolves.toBeUndefined();
  });

  it('calls Sentry.captureException when appendAuditEntry rejects', async () => {
    const err = new Error('Cosmos down');
    mockAppendAuditEntry.mockRejectedValue(err);
    await auditLog(ctx, 'admin.login', 'admin_session', 'sess-1', {});
    expect(mockCaptureException).toHaveBeenCalledWith(err);
  });
});
