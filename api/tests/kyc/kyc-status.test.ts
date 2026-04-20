import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpRequest, InvocationContext } from '@azure/functions';

vi.mock('../../src/cosmos/technician-repository', () => ({
  getKycByTechnicianId: vi.fn(),
}));
vi.mock('../../src/middleware/verifyTechnicianToken', () => ({
  verifyTechnicianToken: vi.fn(),
}));

describe('GET /v1/kyc/status', () => {
  let handler: typeof import('../../src/functions/kyc/get-kyc-status').getKycStatus;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    const mod = await import('../../src/functions/kyc/get-kyc-status');
    handler = mod.getKycStatus;
  });

  it('returns 200 with KYC status for authenticated technician', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken');
    const { getKycByTechnicianId } = await import('../../src/cosmos/technician-repository');
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
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken');
    const { getKycByTechnicianId } = await import('../../src/cosmos/technician-repository');
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
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken');
    vi.mocked(verifyTechnicianToken).mockRejectedValue(new Error('bad token'));

    const req = new HttpRequest({
      method: 'GET',
      url: 'http://localhost/v1/kyc/status?technicianId=tech-001',
      headers: {},
    });
    const res = await handler(req, new InvocationContext());

    expect(res.status).toBe(401);
  });
});
