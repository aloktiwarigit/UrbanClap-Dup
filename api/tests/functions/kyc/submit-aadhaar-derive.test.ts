import { describe, it, expect, vi, beforeEach } from 'vitest';

const verifyTechnicianToken = vi.fn();
const exchangeCodeForAadhaar = vi.fn();
const upsertKycStepAndDeriveStatus = vi.fn();
const upsertKycStatus = vi.fn().mockResolvedValue(undefined);

vi.mock('../../../src/middleware/verifyTechnicianToken.js', () => ({ verifyTechnicianToken }));
vi.mock('../../../src/cosmos/technician-repository.js', () => ({
  upsertKycStepAndDeriveStatus,
  upsertKycStatus,
  getKycByTechnicianId: vi.fn(),
}));
vi.mock('../../../src/services/digilocker.service.js', () => ({ exchangeCodeForAadhaar }));
vi.mock('../../../src/services/kycAudit.service.js', () => ({ kycAuditEntry: vi.fn() }));

const { submitAadhaar } = await import('../../../src/functions/kyc/submit-aadhaar.js');

const req = {
  json: async () => ({
    technicianId: 't1',
    authCode: 'code',
    redirectUri: 'homeservices://kyc/aadhaar-callback',
  }),
} as never;

describe('submitAadhaar — derived status', () => {
  beforeEach(() => {
    verifyTechnicianToken.mockResolvedValue({ uid: 't1' });
    upsertKycStepAndDeriveStatus.mockReset();
  });

  it('returns COMPLETE when a PAN was already on file', async () => {
    exchangeCodeForAadhaar.mockResolvedValue({ maskedNumber: 'XXXXXXXX1234' });
    upsertKycStepAndDeriveStatus.mockResolvedValue('COMPLETE');

    const res = await submitAadhaar(req, {} as never);

    expect((res.jsonBody as { kycStatus: string }).kycStatus).toBe('COMPLETE');
  });

  it('returns AADHAAR_DONE when no PAN is on file yet', async () => {
    exchangeCodeForAadhaar.mockResolvedValue({ maskedNumber: 'XXXXXXXX1234' });
    upsertKycStepAndDeriveStatus.mockResolvedValue('AADHAAR_DONE');

    const res = await submitAadhaar(req, {} as never);

    expect((res.jsonBody as { kycStatus: string }).kycStatus).toBe('AADHAAR_DONE');
  });

  it('still forces PENDING_MANUAL on a DigiLocker rejection, bypassing derivation', async () => {
    exchangeCodeForAadhaar.mockResolvedValue(null);

    const res = await submitAadhaar(req, {} as never);

    expect((res.jsonBody as { kycStatus: string }).kycStatus).toBe('PENDING_MANUAL');
    expect(upsertKycStepAndDeriveStatus).not.toHaveBeenCalled();
    expect(upsertKycStatus).toHaveBeenCalled();
    expect(upsertKycStatus).toHaveBeenCalledWith(
      't1',
      expect.objectContaining({ kycStatus: 'PENDING_MANUAL' })
    );
  });
});
