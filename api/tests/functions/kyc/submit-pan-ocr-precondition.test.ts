import { describe, it, expect, vi, beforeEach } from 'vitest';

const verifyTechnicianToken = vi.fn();
const getKycByTechnicianId = vi.fn();
const extractPanFromStoragePath = vi.fn();
const upsertKycStepAndDeriveStatus = vi.fn().mockResolvedValue('COMPLETE');
const upsertKycStatus = vi.fn().mockResolvedValue(undefined);

vi.mock('../../../src/middleware/verifyTechnicianToken.js', () => ({ verifyTechnicianToken }));
vi.mock('../../../src/cosmos/technician-repository.js', () => ({
  getKycByTechnicianId,
  upsertKycStepAndDeriveStatus,
  upsertKycStatus,
}));
vi.mock('../../../src/services/formRecognizer.service.js', () => ({ extractPanFromStoragePath }));
vi.mock('../../../src/services/kycAudit.service.js', () => ({ kycAuditEntry: vi.fn() }));

const { submitPanOcr } = await import('../../../src/functions/kyc/submit-pan-ocr.js');

function reqFor(technicianId: string) {
  return {
    json: async () => ({ technicianId, firebaseStoragePath: 'kyc/t1/pan.jpg' }),
  } as never;
}

describe('submitPanOcr — Aadhaar-first precondition', () => {
  beforeEach(() => {
    verifyTechnicianToken.mockResolvedValue({ uid: 't1' });
    extractPanFromStoragePath.mockReset();
    upsertKycStepAndDeriveStatus.mockClear();
  });

  it('rejects with 409 when Aadhaar is not yet verified', async () => {
    getKycByTechnicianId.mockResolvedValue({ aadhaarVerified: false, panHash: null });

    const res = await submitPanOcr(reqFor('t1'), {} as never);

    expect(res.status).toBe(409);
    expect((res.jsonBody as { code: string }).code).toBe('AADHAAR_REQUIRED_FIRST');
  });

  it('rejects with 409 when the technician has no kyc sub-object at all', async () => {
    getKycByTechnicianId.mockResolvedValue(null);

    const res = await submitPanOcr(reqFor('t1'), {} as never);

    expect(res.status).toBe(409);
  });

  it('does not spend an OCR call when the precondition fails', async () => {
    getKycByTechnicianId.mockResolvedValue({ aadhaarVerified: false, panHash: null });

    await submitPanOcr(reqFor('t1'), {} as never);

    expect(extractPanFromStoragePath).not.toHaveBeenCalled();
  });

  it('proceeds and returns the derived status when Aadhaar is verified', async () => {
    getKycByTechnicianId.mockResolvedValue({ aadhaarVerified: true, panHash: null });
    extractPanFromStoragePath.mockResolvedValue({
      status: 'PAN_DONE',
      panMaskedNumber: 'XXXXX1234F',
      panHash: 'e'.repeat(64),
    });

    const res = await submitPanOcr(reqFor('t1'), {} as never);

    expect(res.status).toBe(200);
    expect((res.jsonBody as { kycStatus: string }).kycStatus).toBe('COMPLETE');
    expect(upsertKycStepAndDeriveStatus).toHaveBeenCalled();
  });
});
