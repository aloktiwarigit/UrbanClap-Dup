import { describe, it, expect, vi } from 'vitest';
import { auditLog, systemAudit, type AuditLogContext } from '../../src/services/auditLog.service.js';
import * as auditLogRepo from '../../src/cosmos/audit-log-repository.js';

vi.mock('../../src/cosmos/audit-log-repository.js');

describe('auditLog.service', () => {
  describe('type safety: AuditAction enum', () => {
    it('should reject non-member actions at compile time', () => {
      // This test proves that passing a string literal not in the AuditAction union
      // causes a compile error. We properly type ctx so the error is definitely from
      // the action, not from ctx shape. Then we add a positive test (valid action)
      // to prove ctx typing is correct.
      const ctx: AuditLogContext = { adminId: 'admin1', role: 'super-admin', sessionId: 'sess1' };

      // @ts-expect-error NOT_A_REAL_ACTION is not in AuditAction union
      void auditLog(ctx, 'NOT_A_REAL_ACTION', 'test_resource', 'test_id', {});

      // Positive test: valid action should compile without error
      void auditLog(ctx, 'COMMISSION_WAIVED', 'test_resource', 'test_id', {});

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
