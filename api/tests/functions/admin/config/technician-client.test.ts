import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HttpResponseInit, InvocationContext } from '@azure/functions';
import { HttpRequest } from '@azure/functions';

process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-hs256-minimum-32-chars!!';

vi.mock('../../../../src/cosmos/system-docs-repository.js');
vi.mock('../../../../src/services/adminSession.service.js', () => ({
  touchAndGetSession: vi.fn(),
}));
vi.mock('../../../../src/services/auditLog.service.js');

import { systemDocsRepo } from '../../../../src/cosmos/system-docs-repository.js';
import { touchAndGetSession } from '../../../../src/services/adminSession.service.js';
import { auditLog } from '../../../../src/services/auditLog.service.js';
import { requireAdmin } from '../../../../src/middleware/requireAdmin.js';
import { signAccessToken } from '../../../../src/services/jwt.service.js';
import {
  getTechnicianClientConfigHandler,
  putTechnicianClientConfigHandler,
} from '../../../../src/functions/admin/config/technician-client.js';

const superAdminCtx = { adminId: 'admin-1', role: 'super-admin' as const, sessionId: 's1' };
const financeCtx = { adminId: 'admin-2', role: 'finance' as const, sessionId: 's2' };
const fakeCtx = {} as InvocationContext;

function getReq(): HttpRequest {
  return new HttpRequest({
    url: 'http://localhost/api/v1/admin/config/technician-client',
    method: 'GET',
  });
}

function putReq(body: unknown): HttpRequest {
  return new HttpRequest({
    url: 'http://localhost/api/v1/admin/config/technician-client',
    method: 'PUT',
    body: { string: JSON.stringify(body) },
    headers: { 'content-type': 'application/json' },
  });
}

beforeEach(() => vi.clearAllMocks());

describe('getTechnicianClientConfigHandler', () => {
  it('returns defaults when the doc has no features set', async () => {
    vi.mocked(systemDocsRepo.getTechnicianClientConfig).mockResolvedValue({ id: 'technician-client-config' });

    const res = (await getTechnicianClientConfigHandler(getReq(), fakeCtx, financeCtx)) as HttpResponseInit;

    expect(res.status).toBe(200);
    expect(res.jsonBody).toMatchObject({
      features: { wallet: false, duesBanner: false, upiQr: false, incentives: false, addOnRequests: false },
      minSupportedVersionCode: 0,
    });
  });

  it('returns defaults when the doc is missing entirely', async () => {
    vi.mocked(systemDocsRepo.getTechnicianClientConfig).mockResolvedValue(null);

    const res = (await getTechnicianClientConfigHandler(getReq(), fakeCtx, superAdminCtx)) as HttpResponseInit;

    expect(res.status).toBe(200);
    expect(res.jsonBody).toMatchObject({
      features: { wallet: false, duesBanner: false, upiQr: false, incentives: false, addOnRequests: false },
      minSupportedVersionCode: 0,
    });
  });

  it('passes through set fields untouched', async () => {
    vi.mocked(systemDocsRepo.getTechnicianClientConfig).mockResolvedValue({
      id: 'technician-client-config',
      features: { wallet: true },
      minSupportedVersionCode: 12,
      updatedBy: 'admin-1',
      updatedAt: '2026-09-01T00:00:00.000Z',
    });

    const res = (await getTechnicianClientConfigHandler(getReq(), fakeCtx, superAdminCtx)) as HttpResponseInit;

    expect(res.status).toBe(200);
    expect(res.jsonBody).toMatchObject({
      features: { wallet: true, duesBanner: false, upiQr: false, incentives: false, addOnRequests: false },
      minSupportedVersionCode: 12,
      updatedBy: 'admin-1',
      updatedAt: '2026-09-01T00:00:00.000Z',
    });
  });

  it('returns 502 on upstream error', async () => {
    vi.mocked(systemDocsRepo.getTechnicianClientConfig).mockRejectedValue(new Error('timeout'));

    const res = (await getTechnicianClientConfigHandler(getReq(), fakeCtx, superAdminCtx)) as HttpResponseInit;

    expect(res.status).toBe(502);
  });

  it('finance can reach GET through RBAC wrapping', async () => {
    vi.mocked(touchAndGetSession).mockResolvedValue({ sessionId: 's2', adminId: 'admin-2', role: 'finance' } as any);
    vi.mocked(systemDocsRepo.getTechnicianClientConfig).mockResolvedValue({ id: 'technician-client-config' });
    const token = await signAccessToken({ sub: 'admin-2', role: 'finance', sessionId: 's2' });
    const wrapped = requireAdmin(['super-admin', 'finance'])(getTechnicianClientConfigHandler);

    const req = new HttpRequest({
      url: 'http://localhost/api/v1/admin/config/technician-client',
      method: 'GET',
      headers: { cookie: `hs_access=${token}` },
    });
    const res = (await wrapped(req, fakeCtx)) as HttpResponseInit;

    expect(res.status).toBe(200);
  });
});

describe('putTechnicianClientConfigHandler', () => {
  it('PUT rejects a non-super-admin', async () => {
    vi.mocked(touchAndGetSession).mockResolvedValue({ sessionId: 's2', adminId: 'admin-2', role: 'finance' } as any);
    const token = await signAccessToken({ sub: 'admin-2', role: 'finance', sessionId: 's2' });
    const wrapped = requireAdmin(['super-admin'])(putTechnicianClientConfigHandler);

    const req = new HttpRequest({
      url: 'http://localhost/api/v1/admin/config/technician-client',
      method: 'PUT',
      body: { string: JSON.stringify({ features: { wallet: true } }) },
      headers: { 'content-type': 'application/json', cookie: `hs_access=${token}` },
    });
    const res = (await wrapped(req, fakeCtx)) as HttpResponseInit;

    expect(res.status).toBe(403);
    expect(systemDocsRepo.patchTechnicianClientConfig).not.toHaveBeenCalled();
  });

  it('PUT rejects an empty patch', async () => {
    const res = (await putTechnicianClientConfigHandler(putReq({}), fakeCtx, superAdminCtx)) as HttpResponseInit;

    expect(res.status).toBe(400);
    expect(systemDocsRepo.patchTechnicianClientConfig).not.toHaveBeenCalled();
  });

  it('PUT patches and audits', async () => {
    vi.mocked(systemDocsRepo.patchTechnicianClientConfig).mockResolvedValue({
      id: 'technician-client-config',
      features: { wallet: true },
      minSupportedVersionCode: 0,
      updatedBy: 'admin-1',
      updatedAt: '2026-09-07T00:00:00.000Z',
    });

    const res = (await putTechnicianClientConfigHandler(
      putReq({ features: { wallet: true } }),
      fakeCtx,
      superAdminCtx,
    )) as HttpResponseInit;

    expect(res.status).toBe(200);
    expect(res.jsonBody).toMatchObject({
      features: { wallet: true, duesBanner: false, upiQr: false, incentives: false, addOnRequests: false },
      minSupportedVersionCode: 0,
    });
    expect(systemDocsRepo.patchTechnicianClientConfig).toHaveBeenCalledWith(
      { features: { wallet: true } },
      'admin-1',
    );
    expect(auditLog).toHaveBeenCalledWith(
      expect.objectContaining({ adminId: 'admin-1', role: 'super-admin' }),
      'TECHNICIAN_CLIENT_CONFIG_UPDATED',
      'technician-client-config',
      'technician-client-config',
      expect.any(Object),
    );
  });

  it('returns 400 VALIDATION_ERROR for an unknown field (strict schema)', async () => {
    const res = (await putTechnicianClientConfigHandler(
      putReq({ notARealField: true }),
      fakeCtx,
      superAdminCtx,
    )) as HttpResponseInit;

    expect(res.status).toBe(400);
    expect((res.jsonBody as { code: string }).code).toBe('VALIDATION_ERROR');
  });

  it('returns 502 on upstream error', async () => {
    vi.mocked(systemDocsRepo.patchTechnicianClientConfig).mockRejectedValue(new Error('timeout'));

    const res = (await putTechnicianClientConfigHandler(
      putReq({ minSupportedVersionCode: 5 }),
      fakeCtx,
      superAdminCtx,
    )) as HttpResponseInit;

    expect(res.status).toBe(502);
  });
});
