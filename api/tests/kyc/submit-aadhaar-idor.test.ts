/**
 * IDOR guard tests for POST /v1/kyc/aadhaar
 *
 * Verifies that an authenticated technician (tech-A) cannot mark a different
 * technician's (tech-B) Aadhaar as verified — the P0 IDOR fix in E12-S01.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpRequest, InvocationContext } from '@azure/functions';

vi.mock('../../src/cosmos/technician-repository.js', () => ({
  upsertKycStatus: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../../src/middleware/verifyTechnicianToken.js', () => ({
  verifyTechnicianToken: vi.fn(),
}));
vi.mock('../../src/services/digilocker.service.js', () => ({
  exchangeCodeForAadhaar: vi.fn(),
}));
vi.mock('../../src/services/kycAudit.service.js', () => ({
  kycAuditEntry: vi.fn().mockResolvedValue(undefined),
}));

describe('POST /v1/kyc/aadhaar — IDOR guard', () => {
  let handler: typeof import('../../src/functions/kyc/submit-aadhaar.js').submitAadhaar;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    const mod = await import('../../src/functions/kyc/submit-aadhaar.js');
    handler = mod.submitAadhaar;
  });

  it('returns 403 when authenticated uid (tech-A) differs from body technicianId (tech-B)', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    vi.mocked(verifyTechnicianToken).mockResolvedValue({ uid: 'tech-A' });

    const req = new HttpRequest({
      method: 'POST',
      url: 'http://localhost/v1/kyc/aadhaar',
      headers: { Authorization: 'Bearer valid' },
      body: {
        string: JSON.stringify({
          technicianId: 'tech-B',   // different from authenticated uid
          authCode: 'some-code',
          redirectUri: 'https://homeservices.app/digilocker',
        }),
      },
    });

    const res = await handler(req, new InvocationContext());

    expect(res.status).toBe(403);
    const body = res.jsonBody as Record<string, unknown>;
    expect(body['code']).toBe('FORBIDDEN');
  });

  it('proceeds normally when authenticated uid matches body technicianId', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { exchangeCodeForAadhaar } = await import('../../src/services/digilocker.service.js');
    const { upsertKycStatus } = await import('../../src/cosmos/technician-repository.js');

    vi.mocked(verifyTechnicianToken).mockResolvedValue({ uid: 'tech-A' });
    vi.mocked(exchangeCodeForAadhaar).mockResolvedValue({ maskedNumber: 'XXXX-XXXX-1234' });
    vi.mocked(upsertKycStatus).mockResolvedValue(undefined);

    const req = new HttpRequest({
      method: 'POST',
      url: 'http://localhost/v1/kyc/aadhaar',
      headers: { Authorization: 'Bearer valid' },
      body: {
        string: JSON.stringify({
          technicianId: 'tech-A',   // same as authenticated uid — allowed
          authCode: 'some-code',
          redirectUri: 'https://homeservices.app/digilocker',
        }),
      },
    });

    const res = await handler(req, new InvocationContext());

    expect(res.status).toBe(200);
    const body = res.jsonBody as Record<string, unknown>;
    expect(body['kycStatus']).toBe('AADHAAR_DONE');
  });

  it('upsertKycStatus is never called for the forbidden (tech-B) case', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { upsertKycStatus } = await import('../../src/cosmos/technician-repository.js');

    vi.mocked(verifyTechnicianToken).mockResolvedValue({ uid: 'tech-A' });

    const req = new HttpRequest({
      method: 'POST',
      url: 'http://localhost/v1/kyc/aadhaar',
      headers: { Authorization: 'Bearer valid' },
      body: {
        string: JSON.stringify({
          technicianId: 'tech-B',
          authCode: 'some-code',
          redirectUri: 'https://homeservices.app/digilocker',
        }),
      },
    });

    await handler(req, new InvocationContext());

    expect(vi.mocked(upsertKycStatus)).not.toHaveBeenCalled();
  });
});
