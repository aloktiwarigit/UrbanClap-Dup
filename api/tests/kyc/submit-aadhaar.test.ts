import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpRequest, InvocationContext } from '@azure/functions';

vi.mock('../../src/cosmos/technician-repository.js', () => ({
  upsertKycStatus: vi.fn(),
}));
vi.mock('../../src/middleware/verifyTechnicianToken.js', () => ({
  verifyTechnicianToken: vi.fn(),
}));
vi.mock('../../src/services/digilocker.service.js', () => ({
  exchangeCodeForAadhaar: vi.fn(),
}));

describe('POST /v1/kyc/aadhaar', () => {
  let handler: typeof import('../../src/functions/kyc/submit-aadhaar.js').submitAadhaar;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    const mod = await import('../../src/functions/kyc/submit-aadhaar.js');
    handler = mod.submitAadhaar;
  });

  it('returns 200 with masked number on successful DigiLocker exchange', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { exchangeCodeForAadhaar } = await import('../../src/services/digilocker.service.js');
    const { upsertKycStatus } = await import('../../src/cosmos/technician-repository.js');
    vi.mocked(verifyTechnicianToken).mockResolvedValue({ uid: 'tech-001' });
    vi.mocked(exchangeCodeForAadhaar).mockResolvedValue({ maskedNumber: 'XXXX-XXXX-1234' });
    vi.mocked(upsertKycStatus).mockResolvedValue(undefined);

    const req = new HttpRequest({
      method: 'POST',
      url: 'http://localhost/v1/kyc/aadhaar',
      headers: { Authorization: 'Bearer valid' },
      body: { string: JSON.stringify({ technicianId: 'tech-001', authCode: 'digicode', redirectUri: 'https://homeservices.app/digilocker' }) },
    });
    const res = await handler(req, new InvocationContext());

    expect(res.status).toBe(200);
    const body = res.jsonBody as Record<string, unknown>;
    expect(body['aadhaarVerified']).toBe(true);
    expect(body['aadhaarMaskedNumber']).toBe('XXXX-XXXX-1234');
    expect(body['kycStatus']).toBe('AADHAAR_DONE');
  });

  it('returns 200 with PENDING_MANUAL when DigiLocker returns null', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { exchangeCodeForAadhaar } = await import('../../src/services/digilocker.service.js');
    vi.mocked(verifyTechnicianToken).mockResolvedValue({ uid: 'tech-001' });
    vi.mocked(exchangeCodeForAadhaar).mockResolvedValue(null);

    const req = new HttpRequest({
      method: 'POST',
      url: 'http://localhost/v1/kyc/aadhaar',
      headers: { Authorization: 'Bearer valid' },
      body: { string: JSON.stringify({ technicianId: 'tech-001', authCode: '', redirectUri: 'https://homeservices.app/digilocker' }) },
    });
    const res = await handler(req, new InvocationContext());

    const body = res.jsonBody as Record<string, unknown>;
    expect(body['kycStatus']).toBe('PENDING_MANUAL');
    expect(body['aadhaarVerified']).toBe(false);
  });

  it('returns 401 on invalid token', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    vi.mocked(verifyTechnicianToken).mockRejectedValue(new Error('bad token'));

    const req = new HttpRequest({
      method: 'POST',
      url: 'http://localhost/v1/kyc/aadhaar',
      headers: {},
      body: { string: JSON.stringify({}) },
    });
    const res = await handler(req, new InvocationContext());

    expect(res.status).toBe(401);
  });
});
