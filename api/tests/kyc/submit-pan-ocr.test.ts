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
vi.mock('../../src/services/piiCrypto.service.js', () => ({
  encryptPan: vi.fn(),
  maskPan: vi.fn(),
}));

describe('POST /v1/kyc/pan-ocr', () => {
  let handler: typeof import('../../src/functions/kyc/submit-pan-ocr.js').submitPanOcr;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    const mod = await import('../../src/functions/kyc/submit-pan-ocr.js');
    handler = mod.submitPanOcr;
  });

  it('returns 200 with masked panNumber on OCR success (cleartext PAN never in response)', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { extractPanFromStoragePath } = await import('../../src/services/formRecognizer.service.js');
    const { upsertKycStatus } = await import('../../src/cosmos/technician-repository.js');
    const { encryptPan, maskPan } = await import('../../src/services/piiCrypto.service.js');
    vi.mocked(verifyTechnicianToken).mockResolvedValue({ uid: 'tech-001' });
    vi.mocked(extractPanFromStoragePath).mockResolvedValue({ status: 'PAN_DONE', panNumber: 'ABCDE1234F' });
    vi.mocked(upsertKycStatus).mockResolvedValue(undefined);
    vi.mocked(maskPan).mockReturnValue('ABCDE####F');
    vi.mocked(encryptPan).mockReturnValue({ iv: 'aXY=', ciphertext: 'Y2lw', tag: 'dGFn', v: 1 });

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
    // Response must return masked PAN, never cleartext
    expect(body.panNumber).toBe('ABCDE####F');
    expect(body.panNumber).not.toBe('ABCDE1234F');
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
    const { encryptPan, maskPan } = await import('../../src/services/piiCrypto.service.js');
    vi.mocked(verifyTechnicianToken).mockResolvedValue({ uid: 'tech-001' });
    vi.mocked(extractPanFromStoragePath).mockResolvedValue({ status: 'PAN_DONE', panNumber: 'ABCDE1234F' });
    vi.mocked(upsertKycStatus).mockResolvedValue(undefined);
    vi.mocked(maskPan).mockReturnValue('ABCDE####F');
    vi.mocked(encryptPan).mockReturnValue({ iv: 'aXY=', ciphertext: 'Y2lw', tag: 'dGFn', v: 1 });

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

  // ── PII encryption regression tests ──────────────────────────────────────────

  it('[T7] successful submit stores panNumberEncrypted AND masked panNumber in Cosmos', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { extractPanFromStoragePath } = await import('../../src/services/formRecognizer.service.js');
    const { upsertKycStatus } = await import('../../src/cosmos/technician-repository.js');
    const { encryptPan, maskPan } = await import('../../src/services/piiCrypto.service.js');
    const mockBlob = { iv: 'aXY=', ciphertext: 'Y2lw', tag: 'dGFn', v: 1 as const };
    vi.mocked(verifyTechnicianToken).mockResolvedValue({ uid: 'tech-001' });
    vi.mocked(extractPanFromStoragePath).mockResolvedValue({ status: 'PAN_DONE', panNumber: 'ABCDE1234F' });
    vi.mocked(upsertKycStatus).mockResolvedValue(undefined);
    vi.mocked(maskPan).mockReturnValue('ABCDE####F');
    vi.mocked(encryptPan).mockReturnValue(mockBlob);

    const req = new HttpRequest({
      method: 'POST',
      url: 'http://localhost/v1/kyc/pan-ocr',
      headers: { Authorization: 'Bearer valid-token' },
      body: { string: JSON.stringify({ technicianId: 'tech-001', firebaseStoragePath: 'technicians/tech-001/pan.jpg' }) },
    });
    await handler(req, new InvocationContext());

    const call = vi.mocked(upsertKycStatus).mock.calls[0];
    const patch = call?.[1] as Record<string, unknown>;
    expect(patch['panNumberEncrypted']).toEqual(mockBlob);
    expect(patch['panNumber']).toBe('ABCDE####F');
  });

  it('[T8] panNumber stored in Cosmos must NOT equal the original extracted PAN (cleartext regression guard)', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { extractPanFromStoragePath } = await import('../../src/services/formRecognizer.service.js');
    const { upsertKycStatus } = await import('../../src/cosmos/technician-repository.js');
    const { encryptPan, maskPan } = await import('../../src/services/piiCrypto.service.js');
    vi.mocked(verifyTechnicianToken).mockResolvedValue({ uid: 'tech-001' });
    vi.mocked(extractPanFromStoragePath).mockResolvedValue({ status: 'PAN_DONE', panNumber: 'ABCDE1234F' });
    vi.mocked(upsertKycStatus).mockResolvedValue(undefined);
    vi.mocked(maskPan).mockReturnValue('ABCDE####F');
    vi.mocked(encryptPan).mockReturnValue({ iv: 'aXY=', ciphertext: 'Y2lw', tag: 'dGFn', v: 1 });

    const req = new HttpRequest({
      method: 'POST',
      url: 'http://localhost/v1/kyc/pan-ocr',
      headers: { Authorization: 'Bearer valid-token' },
      body: { string: JSON.stringify({ technicianId: 'tech-001', firebaseStoragePath: 'technicians/tech-001/pan.jpg' }) },
    });
    await handler(req, new InvocationContext());

    const call = vi.mocked(upsertKycStatus).mock.calls[0];
    const storedPan = (call?.[1] as Record<string, unknown>)['panNumber'];
    expect(storedPan).not.toBe('ABCDE1234F'); // cleartext PAN must never reach Cosmos
  });

  it('[T9] COSMOS_PAN_ENCRYPTION_KEY not set → endpoint returns 500', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { extractPanFromStoragePath } = await import('../../src/services/formRecognizer.service.js');
    const { encryptPan, maskPan } = await import('../../src/services/piiCrypto.service.js');
    vi.mocked(verifyTechnicianToken).mockResolvedValue({ uid: 'tech-001' });
    vi.mocked(extractPanFromStoragePath).mockResolvedValue({ status: 'PAN_DONE', panNumber: 'ABCDE1234F' });
    vi.mocked(maskPan).mockReturnValue('ABCDE####F');
    vi.mocked(encryptPan).mockImplementation(() => {
      throw new Error('COSMOS_PAN_ENCRYPTION_KEY env var not set');
    });

    const req = new HttpRequest({
      method: 'POST',
      url: 'http://localhost/v1/kyc/pan-ocr',
      headers: { Authorization: 'Bearer valid-token' },
      body: { string: JSON.stringify({ technicianId: 'tech-001', firebaseStoragePath: 'technicians/tech-001/pan.jpg' }) },
    });
    const res = await handler(req, new InvocationContext());

    expect(res.status).toBe(500);
  });

  // ── Security: IDOR + maskPan format guard (P1-A, P1-C) ──────────────────────

  it('[P1-C] returns 403 when token uid does not match requested technicianId (IDOR guard)', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    vi.mocked(verifyTechnicianToken).mockResolvedValue({ uid: 'tech-001' });

    const req = new HttpRequest({
      method: 'POST',
      url: 'http://localhost/v1/kyc/pan-ocr',
      headers: { Authorization: 'Bearer valid-token' },
      body: { string: JSON.stringify({ technicianId: 'tech-002', firebaseStoragePath: 'technicians/tech-002/pan.jpg' }) },
    });
    const res = await handler(req, new InvocationContext());

    expect(res.status).toBe(403);
  });

  it('[P1-A] non-canonical PAN format from OCR routes to MANUAL_REVIEW without Cosmos write', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { extractPanFromStoragePath } = await import('../../src/services/formRecognizer.service.js');
    const { upsertKycStatus } = await import('../../src/cosmos/technician-repository.js');
    const { maskPan } = await import('../../src/services/piiCrypto.service.js');
    vi.mocked(verifyTechnicianToken).mockResolvedValue({ uid: 'tech-001' });
    vi.mocked(extractPanFromStoragePath).mockResolvedValue({ status: 'PAN_DONE', panNumber: 'ABCDE 1234 F' });
    vi.mocked(upsertKycStatus).mockResolvedValue(undefined);
    vi.mocked(maskPan).mockReturnValue(null); // non-canonical format

    const req = new HttpRequest({
      method: 'POST',
      url: 'http://localhost/v1/kyc/pan-ocr',
      headers: { Authorization: 'Bearer valid-token' },
      body: { string: JSON.stringify({ technicianId: 'tech-001', firebaseStoragePath: 'technicians/tech-001/pan.jpg' }) },
    });
    const res = await handler(req, new InvocationContext());

    expect(res.status).toBe(200);
    const body = res.jsonBody as { kycStatus: string };
    expect(body.kycStatus).toBe('MANUAL_REVIEW');
    // Cosmos must NOT receive a cleartext PAN
    const call = vi.mocked(upsertKycStatus).mock.calls[0];
    const patch = call?.[1] as Record<string, unknown>;
    expect(patch['panNumber']).toBeUndefined();
    expect(patch['panNumberEncrypted']).toBeUndefined();
  });
});
