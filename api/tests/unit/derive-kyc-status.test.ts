import { describe, it, expect } from 'vitest';
import { deriveKycStatus } from '../../src/cosmos/technician-repository.js';

describe('deriveKycStatus', () => {
  it('returns COMPLETE when both facts are true', () => {
    expect(deriveKycStatus({ aadhaarVerified: true, panHash: 'a'.repeat(64) })).toBe('COMPLETE');
  });

  it('returns AADHAAR_DONE when only Aadhaar succeeded', () => {
    expect(deriveKycStatus({ aadhaarVerified: true, panHash: null })).toBe('AADHAAR_DONE');
    expect(deriveKycStatus({ aadhaarVerified: true, panHash: undefined })).toBe('AADHAAR_DONE');
  });

  // Unreachable end-to-end once Task 3's precondition lands, but the function must still be
  // correct in isolation: a future manual-KYC or admin path could write PAN without Aadhaar,
  // and ADR-0032's whole point is that the completion fact must not depend on call order.
  it('returns PAN_DONE when only PAN succeeded', () => {
    expect(deriveKycStatus({ aadhaarVerified: false, panHash: 'b'.repeat(64) })).toBe('PAN_DONE');
  });

  it('returns PENDING when neither succeeded', () => {
    expect(deriveKycStatus({ aadhaarVerified: false, panHash: null })).toBe('PENDING');
  });

  // The null trap from ADR-0032: a rejected PAN submission writes an explicit null, which must
  // revoke an earlier pass rather than read as "a PAN exists".
  it('treats an explicit null panHash as not verified, revoking an earlier pass', () => {
    expect(deriveKycStatus({ aadhaarVerified: true, panHash: null })).not.toBe('COMPLETE');
  });

  it('treats an empty-string panHash as not verified', () => {
    expect(deriveKycStatus({ aadhaarVerified: true, panHash: '' })).toBe('AADHAAR_DONE');
  });
});
