import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpRequest, InvocationContext } from '@azure/functions';

vi.mock('../../src/services/formRecognizer.service.js', () => ({
  extractPanFromStoragePath: vi.fn(),
}));
vi.mock('../../src/cosmos/technician-repository.js', () => ({
  upsertKycStatus: vi.fn(),
}));
vi.mock('../../src/middleware/verifyTechnicianToken.js', () => ({
  verifyTechnicianToken: vi.fn(),
}));
vi.mock('../../src/services/kycAudit.service.js', () => ({ kycAuditEntry: vi.fn().mockResolvedValue(undefined) }));

describe('POST /v1/kyc/pan-ocr', () => {
  let handler: typeof import('../../src/functions/kyc/submit-pan-ocr.js').submitPanOcr;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    const mod = await import('../../src/functions/kyc/submit-pan-ocr.js');
    handler = mod.submitPanOcr;
  });

  it('returns 200 with panNumber on OCR success', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { extractPanFromStoragePath } = await import('../../src/services/formRecognizer.service.js');
    const { upsertKycStatus } = await import('../../src/cosmos/technician-repository.js');
    vi.mocked(verifyTechnicianToken).mockResolvedValue({ uid: 'tech-001' });
    vi.mocked(extractPanFromStoragePath).mockResolvedValue({ status: 'PAN_DONE', panNumber: 'ABCDE1234F' });
    vi.mocked(upsertKycStatus).mockResolvedValue(undefined);

    const req = new HttpRequest({
      method: 'POST',
      url: 'http://localhost/v1/kyc/pan-ocr',
      headers: { Authorization: 'Bearer valid-token' },
      body: { string: JSON.stringify({ technicianId: 'tech-001', firebaseStoragePath: 'technicians/tech-001/pan.jpg' }) },
    });
    const ctx = new InvocationContext();

    const res = await handler(req, ctx);
    expect(res.status).toBe(200);
    const body = res.jsonBody as { kycStatus: string; panNumber: string };
    expect(body.kycStatus).toBe('PAN_DONE');
    expect(body.panNumber).toBe('ABCDE1234F');
  });

  it('returns 200 with MANUAL_REVIEW on OCR failure', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { extractPanFromStoragePath } = await import('../../src/services/formRecognizer.service.js');
    vi.mocked(verifyTechnicianToken).mockResolvedValue({ uid: 'tech-001' });
    vi.mocked(extractPanFromStoragePath).mockResolvedValue({ status: 'MANUAL_REVIEW', panNumber: null });

    const req = new HttpRequest({
      method: 'POST',
      url: 'http://localhost/v1/kyc/pan-ocr',
      headers: { Authorization: 'Bearer valid-token' },
      body: { string: JSON.stringify({ technicianId: 'tech-001', firebaseStoragePath: 'technicians/tech-001/pan.jpg' }) },
    });
    const ctx = new InvocationContext();

    const res = await handler(req, ctx);
    const body = res.jsonBody as { kycStatus: string; panNumber: null };
    expect(body.kycStatus).toBe('MANUAL_REVIEW');
    expect(body.panNumber).toBeNull();
  });

  it('emits KYC_PAN_VERIFIED audit entry on OCR success', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { extractPanFromStoragePath } = await import('../../src/services/formRecognizer.service.js');
    const { upsertKycStatus } = await import('../../src/cosmos/technician-repository.js');
    const { kycAuditEntry } = await import('../../src/services/kycAudit.service.js');
    vi.mocked(verifyTechnicianToken).mockResolvedValue({ uid: 'tech-001' });
    vi.mocked(extractPanFromStoragePath).mockResolvedValue({ status: 'PAN_DONE', panNumber: 'ABCDE1234F' });
    vi.mocked(upsertKycStatus).mockResolvedValue(undefined);

    const req = new HttpRequest({
      method: 'POST', url: 'http://localhost/v1/kyc/pan-ocr',
      headers: { Authorization: 'Bearer valid-token' },
      body: { string: JSON.stringify({ technicianId: 'tech-001', firebaseStoragePath: 'technicians/tech-001/pan.jpg' }) },
    });
    await handler(req, new InvocationContext());

    expect(vi.mocked(kycAuditEntry)).toHaveBeenCalledWith('tech-001', 'PAN', 'VERIFIED');
  });

  it('emits KYC_PAN_REJECTED audit entry on OCR failure', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { extractPanFromStoragePath } = await import('../../src/services/formRecognizer.service.js');
    const { kycAuditEntry } = await import('../../src/services/kycAudit.service.js');
    vi.mocked(verifyTechnicianToken).mockResolvedValue({ uid: 'tech-001' });
    vi.mocked(extractPanFromStoragePath).mockResolvedValue({ status: 'MANUAL_REVIEW', panNumber: null });

    const req = new HttpRequest({
      method: 'POST', url: 'http://localhost/v1/kyc/pan-ocr',
      headers: { Authorization: 'Bearer valid-token' },
      body: { string: JSON.stringify({ technicianId: 'tech-001', firebaseStoragePath: 'technicians/tech-001/pan.jpg' }) },
    });
    await handler(req, new InvocationContext());

    expect(vi.mocked(kycAuditEntry)).toHaveBeenCalledWith('tech-001', 'PAN', 'REJECTED');
  });

  it('returns 401 when token invalid', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    vi.mocked(verifyTechnicianToken).mockRejectedValue(new Error('Invalid token'));

    const req = new HttpRequest({
      method: 'POST',
      url: 'http://localhost/v1/kyc/pan-ocr',
      headers: { Authorization: 'Bearer bad-token' },
      body: { string: JSON.stringify({ technicianId: 'tech-001', firebaseStoragePath: 'path' }) },
    });
    const ctx = new InvocationContext();

    const res = await handler(req, ctx);
    expect(res.status).toBe(401);
  });

  it('returns 422 when request body fails Zod validation', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    vi.mocked(verifyTechnicianToken).mockResolvedValue({ uid: 'tech-001' });

    const req = new HttpRequest({
      method: 'POST',
      url: 'http://localhost/v1/kyc/pan-ocr',
      headers: { Authorization: 'Bearer valid-token' },
      body: { string: JSON.stringify({ technicianId: '' }) }, // missing firebaseStoragePath
    });
    const ctx = new InvocationContext();

    const res = await handler(req, ctx);
    expect(res.status).toBe(422);
  });
});
