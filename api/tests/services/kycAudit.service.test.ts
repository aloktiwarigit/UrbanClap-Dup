import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/services/auditLog.service.js', () => ({
  auditLog: vi.fn().mockResolvedValue(undefined),
}));

import { kycAuditEntry } from '../../src/services/kycAudit.service.js';
import { auditLog } from '../../src/services/auditLog.service.js';

beforeEach(() => vi.clearAllMocks());

describe('kycAuditEntry', () => {
  it('emits KYC_AADHAAR_VERIFIED action on AADHAAR_DONE status', () => {
    kycAuditEntry('tech-1', 'aadhaar', 'AADHAAR_DONE', 'XXXX-XXXX-5678');
    expect(vi.mocked(auditLog)).toHaveBeenCalledWith(
      expect.objectContaining({ adminId: 'system', role: 'system' }),
      'KYC_AADHAAR_VERIFIED',
      'kyc',
      'tech-1',
      expect.objectContaining({ kycStatus: 'AADHAAR_DONE', maskedIdentifier: 'XXXX-XXXX-5678' }),
    );
  });

  it('emits KYC_AADHAAR_REJECTED action on PENDING_MANUAL status', () => {
    kycAuditEntry('tech-1', 'aadhaar', 'PENDING_MANUAL', null);
    expect(vi.mocked(auditLog)).toHaveBeenCalledWith(
      expect.anything(),
      'KYC_AADHAAR_REJECTED',
      'kyc',
      'tech-1',
      expect.objectContaining({ maskedIdentifier: null }),
    );
  });

  it('emits KYC_PAN_VERIFIED action on PAN_DONE status', () => {
    kycAuditEntry('tech-2', 'pan', 'PAN_DONE', 'ABCDE1234F');
    expect(vi.mocked(auditLog)).toHaveBeenCalledWith(
      expect.anything(),
      'KYC_PAN_VERIFIED',
      'kyc',
      'tech-2',
      expect.objectContaining({ maskedIdentifier: 'ABCDE####F' }),
    );
  });

  it('emits KYC_PAN_REJECTED action on MANUAL_REVIEW status', () => {
    kycAuditEntry('tech-2', 'pan', 'MANUAL_REVIEW', null);
    expect(vi.mocked(auditLog)).toHaveBeenCalledWith(
      expect.anything(),
      'KYC_PAN_REJECTED',
      'kyc',
      'tech-2',
      expect.objectContaining({ maskedIdentifier: null }),
    );
  });

  it('masks PAN correctly — ABCDE####F format', () => {
    kycAuditEntry('tech-3', 'pan', 'PAN_DONE', 'XYZAB9876G');
    const call = vi.mocked(auditLog).mock.calls[0]!;
    const payload = call[4] as Record<string, unknown>;
    expect(payload['maskedIdentifier']).toBe('XYZAB####G');
  });

  it('returns placeholder for invalid-length PAN', () => {
    kycAuditEntry('tech-3', 'pan', 'PAN_DONE', 'SHORT');
    const call = vi.mocked(auditLog).mock.calls[0]!;
    const payload = call[4] as Record<string, unknown>;
    expect(payload['maskedIdentifier']).toBe('##########');
  });

  it('passes Aadhaar maskedNumber through without re-masking', () => {
    kycAuditEntry('tech-4', 'aadhaar', 'AADHAAR_DONE', 'XXXX-XXXX-9999');
    const call = vi.mocked(auditLog).mock.calls[0]!;
    const payload = call[4] as Record<string, unknown>;
    expect(payload['maskedIdentifier']).toBe('XXXX-XXXX-9999');
  });
});
