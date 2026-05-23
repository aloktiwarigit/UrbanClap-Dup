import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpRequest, InvocationContext } from '@azure/functions';

vi.mock('../../src/cosmos/technician-repository.js', () => ({
  getKycByTechnicianId: vi.fn(),
}));
vi.mock('../../src/middleware/verifyTechnicianToken.js', () => ({
  verifyTechnicianToken: vi.fn(),
}));

describe('GET /v1/kyc/status', () => {
  let handler: typeof import('../../src/functions/kyc/get-kyc-status.js').getKycStatus;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    const mod = await import('../../src/functions/kyc/get-kyc-status.js');
    handler = mod.getKycStatus;
  });

  it('returns 200 with KYC status for authenticated technician', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { getKycByTechnicianId } = await import('../../src/cosmos/technician-repository.js');
    vi.mocked(verifyTechnicianToken).mockResolvedValue({ uid: 'tech-001' });
    vi.mocked(getKycByTechnicianId).mockResolvedValue({
      aadhaarVerified: true,
      aadhaarMaskedNumber: 'XXXX-XXXX-1234',
      panNumber: null,
      panImagePath: null,
      kycStatus: 'AADHAAR_DONE',
      updatedAt: '2026-04-19T10:00:00Z',
    });

    const req = new HttpRequest({
      method: 'GET',
      url: 'http://localhost/v1/kyc/status?technicianId=tech-001',
      headers: { Authorization: 'Bearer valid' },
    });
    const res = await handler(req, new InvocationContext());

    expect(res.status).toBe(200);
    const body = res.jsonBody as Record<string, unknown>;
    expect(body['kycStatus']).toBe('AADHAAR_DONE');
    expect(body['aadhaarVerified']).toBe(true);
  });

  it('returns 404 when no KYC record found', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { getKycByTechnicianId } = await import('../../src/cosmos/technician-repository.js');
    vi.mocked(verifyTechnicianToken).mockResolvedValue({ uid: 'tech-002' });
    vi.mocked(getKycByTechnicianId).mockResolvedValue(null);

    const req = new HttpRequest({
      method: 'GET',
      url: 'http://localhost/v1/kyc/status?technicianId=tech-002',
      headers: { Authorization: 'Bearer valid' },
    });
    const res = await handler(req, new InvocationContext());

    expect(res.status).toBe(404);
  });

  it('returns 401 on invalid token', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    vi.mocked(verifyTechnicianToken).mockRejectedValue(new Error('bad token'));

    const req = new HttpRequest({
      method: 'GET',
      url: 'http://localhost/v1/kyc/status?technicianId=tech-001',
      headers: {},
    });
    const res = await handler(req, new InvocationContext());

    expect(res.status).toBe(401);
  });

  it('[P1-B] returns 403 when token uid does not match requested technicianId (IDOR guard)', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    vi.mocked(verifyTechnicianToken).mockResolvedValue({ uid: 'tech-001' });

    const req = new HttpRequest({
      method: 'GET',
      url: 'http://localhost/v1/kyc/status?technicianId=tech-002',
      headers: { Authorization: 'Bearer valid' },
    });
    const res = await handler(req, new InvocationContext());

    expect(res.status).toBe(403);
  });

  it('[T10] response does NOT expose panNumberEncrypted (encrypted blob stays server-side)', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { getKycByTechnicianId } = await import('../../src/cosmos/technician-repository.js');
    vi.mocked(verifyTechnicianToken).mockResolvedValue({ uid: 'tech-001' });
    vi.mocked(getKycByTechnicianId).mockResolvedValue({
      aadhaarVerified: true,
      aadhaarMaskedNumber: 'XXXX-XXXX-1234',
      panNumber: null,
      panMaskedNumber: 'XXXXX1234F',
      panImagePath: null,
      kycStatus: 'PAN_DONE',
      updatedAt: '2026-04-29T10:00:00Z',
      panNumberEncrypted: { iv: 'aXY=', ciphertext: 'Y2lw', tag: 'dGFn', v: 1 },
    });

    const req = new HttpRequest({
      method: 'GET',
      url: 'http://localhost/v1/kyc/status?technicianId=tech-001',
      headers: { Authorization: 'Bearer valid' },
    });
    const res = await handler(req, new InvocationContext());

    expect(res.status).toBe(200);
    const body = res.jsonBody as Record<string, unknown>;
    expect(body['panNumberEncrypted']).toBeUndefined();
    expect(body['panMaskedNumber']).toBe('XXXXX1234F');
    // Legacy alias present for technician-app compat (migration window)
    expect(body['panNumber']).toBe('XXXXX1234F');
  });

  it('[E19-S01 / S-001] non-canonical panNumber (already-masked #### format) escalates to MANUAL_REVIEW — never returns raw value', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { getKycByTechnicianId } = await import('../../src/cosmos/technician-repository.js');
    vi.mocked(verifyTechnicianToken).mockResolvedValue({ uid: 'tech-001' });

    vi.mocked(getKycByTechnicianId).mockResolvedValue({
      aadhaarVerified: true,
      aadhaarMaskedNumber: null,
      panNumber: 'ABCDE####F',  // non-canonical: maskPan returns null; S-001 fix escalates to MANUAL_REVIEW
      panImagePath: null,
      kycStatus: 'PAN_DONE',
      updatedAt: '2026-04-01T00:00:00Z',
    });

    const req = new HttpRequest({
      method: 'GET',
      url: 'http://localhost/v1/kyc/status?technicianId=tech-001',
      headers: { Authorization: 'Bearer valid' },
    });
    const res = await handler(req, new InvocationContext());

    const body = res.jsonBody as Record<string, unknown>;
    expect(body['panMaskedNumber']).toBeNull();
    expect(body['panNumber']).toBeNull();
    expect(body['kycStatus']).toBe('MANUAL_REVIEW');
  });

  it('[S-001-Codex] non-canonical panMaskedNumber (#### legacy format) escalates to MANUAL_REVIEW', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { getKycByTechnicianId } = await import('../../src/cosmos/technician-repository.js');
    vi.mocked(verifyTechnicianToken).mockResolvedValue({ uid: 'tech-001' });

    vi.mocked(getKycByTechnicianId).mockResolvedValue({
      aadhaarVerified: true,
      aadhaarMaskedNumber: null,
      panNumber: null,
      panMaskedNumber: 'ABCDE####F',  // legacy migration script wrote this non-canonical shape
      panImagePath: null,
      kycStatus: 'PAN_DONE',
      updatedAt: '2026-04-01T00:00:00Z',
    });

    const req = new HttpRequest({
      method: 'GET',
      url: 'http://localhost/v1/kyc/status?technicianId=tech-001',
      headers: { Authorization: 'Bearer valid' },
    });
    const res = await handler(req, new InvocationContext());

    const body = res.jsonBody as Record<string, unknown>;
    expect(body['panMaskedNumber']).toBeNull();
    expect(body['panNumber']).toBeNull();
    expect(body['kycStatus']).toBe('MANUAL_REVIEW');
  });

  it('[S-001] OCR-noise panNumber (interior space) returns null — never exposes raw PAN', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { getKycByTechnicianId } = await import('../../src/cosmos/technician-repository.js');
    vi.mocked(verifyTechnicianToken).mockResolvedValue({ uid: 'tech-001' });

    vi.mocked(getKycByTechnicianId).mockResolvedValue({
      aadhaarVerified: true,
      aadhaarMaskedNumber: null,
      panNumber: 'ABCDE 1234F',  // raw PAN captured with interior space from OCR
      panImagePath: null,
      kycStatus: 'PAN_DONE',
      updatedAt: '2026-04-01T00:00:00Z',
    });

    const req = new HttpRequest({
      method: 'GET',
      url: 'http://localhost/v1/kyc/status?technicianId=tech-001',
      headers: { Authorization: 'Bearer valid' },
    });
    const res = await handler(req, new InvocationContext());

    const body = res.jsonBody as Record<string, unknown>;
    expect(body['panMaskedNumber']).toBeNull();
    expect(body['panNumber']).toBeNull();
    expect(body['kycStatus']).toBe('MANUAL_REVIEW');
  });

  it('[E19-S01-P2A] applies maskPan to raw canonical panNumber in legacy docs to avoid raw PAN exposure', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { getKycByTechnicianId } = await import('../../src/cosmos/technician-repository.js');
    vi.mocked(verifyTechnicianToken).mockResolvedValue({ uid: 'tech-001' });

    vi.mocked(getKycByTechnicianId).mockResolvedValue({
      aadhaarVerified: true,
      aadhaarMaskedNumber: null,
      panNumber: 'ABCDE1234F',  // pre-E18-S06 raw PAN — must be masked before returning
      panImagePath: null,
      kycStatus: 'PAN_DONE',
      updatedAt: '2026-03-01T00:00:00Z',
    });

    const req = new HttpRequest({
      method: 'GET',
      url: 'http://localhost/v1/kyc/status?technicianId=tech-001',
      headers: { Authorization: 'Bearer valid' },
    });
    const res = await handler(req, new InvocationContext());

    const body = res.jsonBody as Record<string, unknown>;
    expect(body['panMaskedNumber']).toBe('XXXXX1234F');
    expect(body['panMaskedNumber']).not.toBe('ABCDE1234F');  // raw PAN must never appear
  });
});
