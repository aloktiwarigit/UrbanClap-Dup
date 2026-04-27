import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AdminContext } from '../../src/types/admin.js';

vi.mock('../../src/services/auditLog.service.js', () => ({
  auditLog: vi.fn().mockResolvedValue(undefined),
}));

import { catalogueAuditEntry } from '../../src/services/catalogueAudit.service.js';
import { auditLog } from '../../src/services/auditLog.service.js';

const mockAdmin: AdminContext = { adminId: 'admin-1', role: 'ops-manager', sessionId: 'sess-1' };

beforeEach(() => vi.clearAllMocks());

describe('catalogueAuditEntry', () => {
  it('calls auditLog with admin context and action for category', () => {
    catalogueAuditEntry(mockAdmin, 'CATALOGUE_CATEGORY_CREATED', 'category', 'plumbing', { id: 'plumbing' });
    expect(vi.mocked(auditLog)).toHaveBeenCalledWith(
      expect.objectContaining({ adminId: 'admin-1', role: 'ops-manager', sessionId: 'sess-1' }),
      'CATALOGUE_CATEGORY_CREATED',
      'category',
      'plumbing',
      expect.objectContaining({ id: 'plumbing' }),
    );
  });

  it('calls auditLog with admin context and action for service', () => {
    catalogueAuditEntry(mockAdmin, 'CATALOGUE_SERVICE_UPDATED', 'service', 'leak-fix', { id: 'leak-fix' });
    expect(vi.mocked(auditLog)).toHaveBeenCalledWith(
      expect.objectContaining({ adminId: 'admin-1' }),
      'CATALOGUE_SERVICE_UPDATED',
      'service',
      'leak-fix',
      expect.objectContaining({ id: 'leak-fix' }),
    );
  });
});
