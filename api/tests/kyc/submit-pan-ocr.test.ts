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

  it('returns 200 with panMaskedNumber on OCR success (cleartext PAN never in response)', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { extractPanFromStoragePath } = await import('../../src/services/formRecognizer.service.js');
    const { upsertKycStatus } = await import('../../src/cosmos/technician-repository.js');
    vi.mocked(verifyTechnicianToken).mockResolvedValue({ uid: 'tech-001' });
    vi.mocked(extractPanFromStoragePath).mockResolvedValue({
      status: 'PAN_DONE',
      panMaskedNumber: 'XXXXX1234F',
      panHash: 'a'.repeat(64),
    });
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
    const body = res.jsonBody as { kycStatus: string; panMaskedNumber: string; panNumber: string };
    expect(body.kycStatus).toBe('PAN_DONE');
    expect(body.panMaskedNumber).toBe('XXXXX1234F');
    // Legacy alias for technician-app backward compat (migration window)
    expect(body.panNumber).toBe('XXXXX1234F');
    // Response must not expose raw PAN
    expect(JSON.stringify(body)).not.toContain('ABCDE1234F');
  });

  it('returns 200 with MANUAL_REVIEW on OCR failure', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { extractPanFromStoragePath } = await import('../../src/services/formRecognizer.service.js');
    const { upsertKycStatus } = await import('../../src/cosmos/technician-repository.js');
    vi.mocked(verifyTechnicianToken).mockResolvedValue({ uid: 'tech-001' });
    vi.mocked(extractPanFromStoragePath).mockResolvedValue({ status: 'MANUAL_REVIEW', panMaskedNumber: null, panHash: null });
    vi.mocked(upsertKycStatus).mockResolvedValue(undefined);

    const req = new HttpRequest({
      method: 'POST',
      url: 'http://localhost/v1/kyc/pan-ocr',
      headers: { Authorization: 'Bearer valid-token' },
      body: { string: JSON.stringify({ technicianId: 'tech-001', firebaseStoragePath: 'technicians/tech-001/pan.jpg' }) },
    });
    const ctx = new InvocationContext();

    const res = await handler(req, ctx);
    const body = res.jsonBody as { kycStatus: string; panMaskedNumber: null };
    expect(body.kycStatus).toBe('MANUAL_REVIEW');
    expect(body.panMaskedNumber).toBeNull();
  });

  it('[E19-S01-P2B] MANUAL_REVIEW clears stale panMaskedNumber + panHash from previous successful scan', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { extractPanFromStoragePath } = await import('../../src/services/formRecognizer.service.js');
    const { upsertKycStatus } = await import('../../src/cosmos/technician-repository.js');
    vi.mocked(verifyTechnicianToken).mockResolvedValue({ uid: 'tech-001' });
    vi.mocked(extractPanFromStoragePath).mockResolvedValue({ status: 'MANUAL_REVIEW', panMaskedNumber: null, panHash: null });
    vi.mocked(upsertKycStatus).mockResolvedValue(undefined);

    const req = new HttpRequest({
      method: 'POST',
      url: 'http://localhost/v1/kyc/pan-ocr',
      headers: { Authorization: 'Bearer valid-token' },
      body: { string: JSON.stringify({ technicianId: 'tech-001', firebaseStoragePath: 'technicians/tech-001/pan.jpg' }) },
    });
    await handler(req, new InvocationContext());

    const call = vi.mocked(upsertKycStatus).mock.calls[0];
    const patch = call?.[1] as Record<string, unknown>;
    expect(patch['panMaskedNumber']).toBeNull();
    expect(patch['panHash']).toBeNull();
    expect(patch['panNumber']).toBeNull();
    expect(patch['panNumberEncrypted']).toBeUndefined();
  });

  it('emits KYC_PAN_VERIFIED audit entry on OCR success', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { extractPanFromStoragePath } = await import('../../src/services/formRecognizer.service.js');
    const { upsertKycStatus } = await import('../../src/cosmos/technician-repository.js');
    const { kycAuditEntry } = await import('../../src/services/kycAudit.service.js');
    vi.mocked(verifyTechnicianToken).mockResolvedValue({ uid: 'tech-001' });
    vi.mocked(extractPanFromStoragePath).mockResolvedValue({
      status: 'PAN_DONE',
      panMaskedNumber: 'XXXXX1234F',
      panHash: 'a'.repeat(64),
    });
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
    vi.mocked(extractPanFromStoragePath).mockResolvedValue({ status: 'MANUAL_REVIEW', panMaskedNumber: null, panHash: null });

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
    const res = await handler(req, new InvocationContext());
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
    const res = await handler(req, new InvocationContext());
    expect(res.status).toBe(422);
  });

  // ── PII hash+mask regression tests (E19-S01) ────────────────────────────────

  it('[E19-S01-T1] successful submit stores panMaskedNumber + panHash, clears panNumber + panNumberEncrypted', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { extractPanFromStoragePath } = await import('../../src/services/formRecognizer.service.js');
    const { upsertKycStatus } = await import('../../src/cosmos/technician-repository.js');
    const fakeHash = 'b'.repeat(64);
    vi.mocked(verifyTechnicianToken).mockResolvedValue({ uid: 'tech-001' });
    vi.mocked(extractPanFromStoragePath).mockResolvedValue({
      status: 'PAN_DONE',
      panMaskedNumber: 'XXXXX1234F',
      panHash: fakeHash,
    });
    vi.mocked(upsertKycStatus).mockResolvedValue(undefined);

    const req = new HttpRequest({
      method: 'POST',
      url: 'http://localhost/v1/kyc/pan-ocr',
      headers: { Authorization: 'Bearer valid-token' },
      body: { string: JSON.stringify({ technicianId: 'tech-001', firebaseStoragePath: 'technicians/tech-001/pan.jpg' }) },
    });
    await handler(req, new InvocationContext());

    const call = vi.mocked(upsertKycStatus).mock.calls[0];
    const patch = call?.[1] as Record<string, unknown>;
    expect(patch['panMaskedNumber']).toBe('XXXXX1234F');
    expect(patch['panHash']).toBe(fakeHash);
    expect(patch['panNumber']).toBeNull();
    expect(patch['panNumberEncrypted']).toBeUndefined();
  });

  it('[E19-S01-T2] patch written to Cosmos must not contain cleartext PAN', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { extractPanFromStoragePath } = await import('../../src/services/formRecognizer.service.js');
    const { upsertKycStatus } = await import('../../src/cosmos/technician-repository.js');
    vi.mocked(verifyTechnicianToken).mockResolvedValue({ uid: 'tech-001' });
    vi.mocked(extractPanFromStoragePath).mockResolvedValue({
      status: 'PAN_DONE',
      panMaskedNumber: 'XXXXX1234F',
      panHash: 'c'.repeat(64),
    });
    vi.mocked(upsertKycStatus).mockResolvedValue(undefined);

    const req = new HttpRequest({
      method: 'POST',
      url: 'http://localhost/v1/kyc/pan-ocr',
      headers: { Authorization: 'Bearer valid-token' },
      body: { string: JSON.stringify({ technicianId: 'tech-001', firebaseStoragePath: 'technicians/tech-001/pan.jpg' }) },
    });
    await handler(req, new InvocationContext());

    const call = vi.mocked(upsertKycStatus).mock.calls[0];
    const patchJson = JSON.stringify(call?.[1]);
    // Raw PAN must never appear in any Cosmos write
    expect(patchJson).not.toContain('ABCDE1234F');
  });

  // ── Security: IDOR guard (P1-C) ──────────────────────────────────────────────

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
});
