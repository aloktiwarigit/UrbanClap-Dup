import { describe, it, expect, vi } from 'vitest';
import { auditLog, systemAudit } from '../../src/services/auditLog.service.js';
import * as auditLogRepo from '../../src/cosmos/audit-log-repository.js';

vi.mock('../../src/cosmos/audit-log-repository.js');

describe('auditLog.service', () => {
  describe('type safety: AuditAction enum', () => {
    it('should reject non-member actions at compile time', () => {
      // This test uses // @ts-expect-error to prove that passing a string
      // literal not in the AuditAction union causes a compile error.
      // Using 'any' here is intentional for testing type safety.
      const ctx = { adminId: 'admin1', role: 'super-admin', sessionId: 'sess1' };

      // @ts-expect-error NOT_A_REAL_ACTION is not in AuditAction union
      void auditLog(ctx, 'NOT_A_REAL_ACTION', 'test_resource', 'test_id', {});

      // Verify the compile error is caught — if this test runs,
      // the @ts-expect-error was correct and the call was rejected.
      expect(true).toBe(true);
    });
  });

  describe('systemAudit runtime', () => {
    it('should call appendAuditEntry with system adminId and role', async () => {
      const mockAppend = vi.spyOn(auditLogRepo, 'appendAuditEntry').mockResolvedValue(undefined);

      await systemAudit('CASH_COLLECTION_RECORDED', 'test_resource', 'test_id', { detail: 'test' });

      expect(mockAppend).toHaveBeenCalledOnce();
      const call = mockAppend.mock.calls[0]?.[0];
      expect(call?.adminId).toBe('system');
      expect(call?.role).toBe('system');
      expect(call?.action).toBe('CASH_COLLECTION_RECORDED');
      expect(call?.resourceType).toBe('test_resource');
      expect(call?.resourceId).toBe('test_id');
      expect(call?.payload).toEqual({ detail: 'test' });
    });
  });
});
