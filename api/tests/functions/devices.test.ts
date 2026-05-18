import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpRequest } from '@azure/functions';
import type { InvocationContext } from '@azure/functions';

// ── Mocks (declared before any module imports) ────────────────────────────────

vi.mock('../../src/bootstrap.js', () => ({}));

vi.mock('../../src/cosmos/device-token-repository.js', () => ({
  deviceTokenRepo: {
    registerDeviceToken: vi.fn().mockResolvedValue(undefined),
    unregisterDeviceToken: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../src/middleware/verifyTechnicianToken.js', () => ({
  verifyTechnicianToken: vi.fn(),
}));

// ── Imports (after mocks) ──────────────────────────────────────────────────────

import {
  customerRegisterDeviceHandler,
  customerUnregisterDeviceHandler,
  technicianRegisterDeviceHandler,
  technicianUnregisterDeviceHandler,
  adminRegisterDeviceHandler,
  adminUnregisterDeviceHandler,
} from '../../src/functions/devices.js';
import { deviceTokenRepo } from '../../src/cosmos/device-token-repository.js';
import { verifyTechnicianToken } from '../../src/middleware/verifyTechnicianToken.js';

// ── Shared fixtures ───────────────────────────────────────────────────────────

const mockCtx = {} as InvocationContext;

/** FCM tokens must be ≥100 chars per RegisterDeviceTokenBodySchema */
const VALID_TOKEN = 'x'.repeat(150);
const VALID_PLATFORM = 'android';

const mockCustomer = { customerId: 'cust_123' };
const mockAdmin = { adminId: 'admin_1', role: 'super-admin' as const, sessionId: 'sess_1' };

function makeJsonReq(method: string, url: string, body?: unknown): HttpRequest {
  return new HttpRequest({
    url,
    method,
    body: body !== undefined ? { string: JSON.stringify(body) } : undefined,
    headers: body !== undefined ? { 'content-type': 'application/json' } : {},
  });
}

function makeReqWithParams(
  method: string,
  url: string,
  params: Record<string, string>,
  body?: unknown,
): HttpRequest {
  const req = new HttpRequest({
    url,
    method,
    body: body !== undefined ? { string: JSON.stringify(body) } : undefined,
    headers: body !== undefined ? { 'content-type': 'application/json' } : {},
  });
  // HttpRequest.params is populated by the runtime from route bindings;
  // in tests we inject them directly as the admin/detail tests do.
  (req as unknown as { params: Record<string, string> }).params = params;
  return req;
}

// ── Customer: POST /v1/devices/register ───────────────────────────────────────

describe('customerRegisterDeviceHandler', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 204 and upserts token on valid body', async () => {
    const req = makeJsonReq('POST', 'http://localhost/', {
      deviceToken: VALID_TOKEN,
      platform: VALID_PLATFORM,
    });
    const res = await customerRegisterDeviceHandler(req, mockCtx, mockCustomer);
    expect(res.status).toBe(204);
    expect(vi.mocked(deviceTokenRepo.registerDeviceToken)).toHaveBeenCalledWith(
      'cust_123', 'customer', VALID_TOKEN, VALID_PLATFORM, undefined,
    );
  });

  it('passes appBuild when provided', async () => {
    const req = makeJsonReq('POST', 'http://localhost/', {
      deviceToken: VALID_TOKEN,
      platform: VALID_PLATFORM,
      appBuild: '2.1.0',
    });
    const res = await customerRegisterDeviceHandler(req, mockCtx, mockCustomer);
    expect(res.status).toBe(204);
    expect(vi.mocked(deviceTokenRepo.registerDeviceToken)).toHaveBeenCalledWith(
      'cust_123', 'customer', VALID_TOKEN, VALID_PLATFORM, '2.1.0',
    );
  });

  it('returns 400 INVALID_BODY when deviceToken is missing', async () => {
    const req = makeJsonReq('POST', 'http://localhost/', { platform: VALID_PLATFORM });
    const res = await customerRegisterDeviceHandler(req, mockCtx, mockCustomer);
    expect(res.status).toBe(400);
    expect((res.jsonBody as { code: string }).code).toBe('INVALID_BODY');
  });

  it('returns 400 INVALID_BODY when deviceToken is too short (< 100 chars)', async () => {
    const req = makeJsonReq('POST', 'http://localhost/', {
      deviceToken: 'short',
      platform: VALID_PLATFORM,
    });
    const res = await customerRegisterDeviceHandler(req, mockCtx, mockCustomer);
    expect(res.status).toBe(400);
    expect((res.jsonBody as { code: string }).code).toBe('INVALID_BODY');
  });

  it('returns 400 INVALID_BODY on non-JSON body', async () => {
    const req = new HttpRequest({
      url: 'http://localhost/',
      method: 'POST',
      body: { string: '!!not-json!!' },
    });
    const res = await customerRegisterDeviceHandler(req, mockCtx, mockCustomer);
    expect(res.status).toBe(400);
    expect((res.jsonBody as { code: string }).code).toBe('INVALID_BODY');
  });
});

// ── Customer: DELETE /v1/devices/{deviceToken} ────────────────────────────────

describe('customerUnregisterDeviceHandler', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 204 and removes token when deviceToken param present', async () => {
    const req = makeReqWithParams('DELETE', 'http://localhost/', { deviceToken: VALID_TOKEN });
    const res = await customerUnregisterDeviceHandler(req, mockCtx, mockCustomer);
    expect(res.status).toBe(204);
    expect(vi.mocked(deviceTokenRepo.unregisterDeviceToken)).toHaveBeenCalledWith(
      'cust_123', VALID_TOKEN,
    );
  });

  it('returns 400 MISSING_TOKEN when deviceToken param absent', async () => {
    const req = makeReqWithParams('DELETE', 'http://localhost/', {});
    const res = await customerUnregisterDeviceHandler(req, mockCtx, mockCustomer);
    expect(res.status).toBe(400);
    expect((res.jsonBody as { code: string }).code).toBe('MISSING_TOKEN');
  });
});

// ── Technician: POST /v1/technician/devices/register ─────────────────────────

describe('technicianRegisterDeviceHandler', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 204 and upserts token on valid body and token', async () => {
    vi.mocked(verifyTechnicianToken).mockResolvedValue({ uid: 'tech_456' });
    const req = makeJsonReq('POST', 'http://localhost/', {
      deviceToken: VALID_TOKEN,
      platform: VALID_PLATFORM,
    });
    req.headers.set('authorization', 'Bearer firebase-id-token');
    const res = await technicianRegisterDeviceHandler(req, mockCtx);
    expect(res.status).toBe(204);
    expect(vi.mocked(deviceTokenRepo.registerDeviceToken)).toHaveBeenCalledWith(
      'tech_456', 'technician', VALID_TOKEN, VALID_PLATFORM, undefined,
    );
  });

  it('returns 400 INVALID_BODY on missing deviceToken', async () => {
    vi.mocked(verifyTechnicianToken).mockResolvedValue({ uid: 'tech_456' });
    const req = makeJsonReq('POST', 'http://localhost/', { platform: VALID_PLATFORM });
    const res = await technicianRegisterDeviceHandler(req, mockCtx);
    expect(res.status).toBe(400);
    expect((res.jsonBody as { code: string }).code).toBe('INVALID_BODY');
  });

  it('returns 401 UNAUTHENTICATED when verifyTechnicianToken throws', async () => {
    vi.mocked(verifyTechnicianToken).mockRejectedValue(new Error('No token'));
    const req = makeJsonReq('POST', 'http://localhost/', {
      deviceToken: VALID_TOKEN,
      platform: VALID_PLATFORM,
    });
    const res = await technicianRegisterDeviceHandler(req, mockCtx);
    expect(res.status).toBe(401);
    expect((res.jsonBody as { code: string }).code).toBe('UNAUTHENTICATED');
  });
});

// ── Technician: DELETE /v1/technician/devices/{deviceToken} ──────────────────

describe('technicianUnregisterDeviceHandler', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 204 and removes token when auth and param are valid', async () => {
    vi.mocked(verifyTechnicianToken).mockResolvedValue({ uid: 'tech_456' });
    const req = makeReqWithParams('DELETE', 'http://localhost/', { deviceToken: VALID_TOKEN });
    const res = await technicianUnregisterDeviceHandler(req, mockCtx);
    expect(res.status).toBe(204);
    expect(vi.mocked(deviceTokenRepo.unregisterDeviceToken)).toHaveBeenCalledWith(
      'tech_456', VALID_TOKEN,
    );
  });

  it('returns 400 MISSING_TOKEN when deviceToken param absent', async () => {
    vi.mocked(verifyTechnicianToken).mockResolvedValue({ uid: 'tech_456' });
    const req = makeReqWithParams('DELETE', 'http://localhost/', {});
    const res = await technicianUnregisterDeviceHandler(req, mockCtx);
    expect(res.status).toBe(400);
    expect((res.jsonBody as { code: string }).code).toBe('MISSING_TOKEN');
  });

  it('returns 401 UNAUTHENTICATED when verifyTechnicianToken throws', async () => {
    vi.mocked(verifyTechnicianToken).mockRejectedValue(new Error('Invalid token'));
    const req = makeReqWithParams('DELETE', 'http://localhost/', { deviceToken: VALID_TOKEN });
    const res = await technicianUnregisterDeviceHandler(req, mockCtx);
    expect(res.status).toBe(401);
    expect((res.jsonBody as { code: string }).code).toBe('UNAUTHENTICATED');
  });
});

// ── Admin: POST /admin/v1/devices/register ─────────────────────────────────────

describe('adminRegisterDeviceHandler', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 204 and upserts token on valid body', async () => {
    const req = makeJsonReq('POST', 'http://localhost/', {
      deviceToken: VALID_TOKEN,
      platform: VALID_PLATFORM,
    });
    const res = await adminRegisterDeviceHandler(req, mockCtx, mockAdmin);
    expect(res.status).toBe(204);
    expect(vi.mocked(deviceTokenRepo.registerDeviceToken)).toHaveBeenCalledWith(
      'admin_1', 'admin', VALID_TOKEN, VALID_PLATFORM, undefined,
    );
  });

  it('returns 400 INVALID_BODY on empty body', async () => {
    const req = makeJsonReq('POST', 'http://localhost/', {});
    const res = await adminRegisterDeviceHandler(req, mockCtx, mockAdmin);
    expect(res.status).toBe(400);
    expect((res.jsonBody as { code: string }).code).toBe('INVALID_BODY');
  });
});

// ── Admin: DELETE /admin/v1/devices/{deviceToken} ──────────────────────────────

describe('adminUnregisterDeviceHandler', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 204 and removes token when deviceToken param present', async () => {
    const req = makeReqWithParams('DELETE', 'http://localhost/', { deviceToken: VALID_TOKEN });
    const res = await adminUnregisterDeviceHandler(req, mockCtx, mockAdmin);
    expect(res.status).toBe(204);
    expect(vi.mocked(deviceTokenRepo.unregisterDeviceToken)).toHaveBeenCalledWith(
      'admin_1', VALID_TOKEN,
    );
  });

  it('returns 400 MISSING_TOKEN when deviceToken param absent', async () => {
    const req = makeReqWithParams('DELETE', 'http://localhost/', {});
    const res = await adminUnregisterDeviceHandler(req, mockCtx, mockAdmin);
    expect(res.status).toBe(400);
    expect((res.jsonBody as { code: string }).code).toBe('MISSING_TOKEN');
  });
});
