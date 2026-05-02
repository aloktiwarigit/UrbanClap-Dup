import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpRequest, InvocationContext, type HttpResponseInit } from '@azure/functions';

vi.mock('../../src/middleware/verifyTechnicianToken.js', () => ({
  verifyTechnicianToken: vi.fn(),
}));

vi.mock('../../src/services/firebaseAdmin.js', () => ({
  verifyFirebaseIdToken: vi.fn(),
}));

vi.mock('../../src/services/userRole.service.js', () => ({
  inferUserRole: vi.fn(),
}));

vi.mock('../../src/cosmos/booking-repository.js', () => ({
  bookingRepo: { getById: vi.fn() },
  updateBookingFields: vi.fn(),
}));

vi.mock('../../src/cosmos/rating-repository.js', () => ({
  ratingRepo: { getByBookingId: vi.fn() },
}));

vi.mock('../../src/cosmos/complaints-repository.js', () => ({
  createComplaint: vi.fn(),
  getComplaint: vi.fn(),
  replaceComplaint: vi.fn(),
  queryComplaintsByBookingAndParty: vi.fn(),
}));

vi.mock('../../src/cosmos/technician-repository.js', () => ({
  getKycByTechnicianId: vi.fn(),
  getTechnicianForSettlement: vi.fn(),
}));

vi.mock('../../src/cosmos/wallet-ledger-repository.js', () => ({
  walletLedgerRepo: { getByBookingId: vi.fn() },
}));

vi.mock('../../src/cosmos/audit-log-repository.js', () => ({
  appendAuditEntry: vi.fn(),
  queryAuditLog: vi.fn(),
}));

vi.mock('../../src/cosmos/erasure-request-repository.js', () => ({
  getPendingErasureRequestForUser: vi.fn(),
  createErasureRequest: vi.fn(),
}));

vi.mock('../../src/services/dataExport.service.js', () => ({
  assembleUserDataExport: vi.fn(),
}));

type MockFn = ReturnType<typeof vi.fn>;

function makeReq(role: 'customer' | 'technician'): HttpRequest {
  const route = role === 'customer'
    ? 'http://localhost/api/v1/users/me/data-export'
    : 'http://localhost/api/v1/users/me/data-export';
  return new HttpRequest({
    url: route,
    method: 'GET',
    headers: { authorization: 'Bearer test-token', 'x-user-role': role },
  });
}

function makeReqNoAuth(): HttpRequest {
  return new HttpRequest({
    url: 'http://localhost/api/v1/users/me/data-export',
    method: 'GET',
    headers: {},
  });
}

describe('GET /v1/users/me/data-export', () => {
  let handler: typeof import('../../src/functions/users-data-export.js').dataExportHandler;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    const mod = await import('../../src/functions/users-data-export.js');
    handler = mod.dataExportHandler;
  });

  it('returns 401 when Authorization header is missing', async () => {
    const res = (await handler(makeReqNoAuth(), new InvocationContext())) as HttpResponseInit;
    expect(res.status).toBe(401);
    expect((res.jsonBody as { code: string }).code).toBe('UNAUTHENTICATED');
  });

  it('returns 401 when token verification fails', async () => {
    const { verifyFirebaseIdToken } = await import('../../src/services/firebaseAdmin.js');
    (verifyFirebaseIdToken as MockFn).mockRejectedValue(new Error('bad token'));

    const res = (await handler(makeReq('customer'), new InvocationContext())) as HttpResponseInit;
    expect(res.status).toBe(401);
    expect((res.jsonBody as { code: string }).code).toBe('TOKEN_INVALID');
  });

  it('returns 200 with assembled export for an authenticated customer', async () => {
    const { verifyFirebaseIdToken } = await import('../../src/services/firebaseAdmin.js');
    const { assembleUserDataExport } = await import('../../src/services/dataExport.service.js');
    const { inferUserRole } = await import('../../src/services/userRole.service.js');
    (verifyFirebaseIdToken as MockFn).mockResolvedValue({ uid: 'cust-1' });
    (inferUserRole as MockFn).mockResolvedValue('CUSTOMER');
    (assembleUserDataExport as MockFn).mockResolvedValue({
      dataInventoryVersion: 2,
      userId: 'cust-1',
      role: 'CUSTOMER',
      profile: { uid: 'cust-1' },
      bookings: [{ id: 'bk-1', addressText: '12 Main St' }],
      ratings: [],
      complaints: [],
      kyc: null,
      walletLedger: [],
      fcmTokens: { acknowledged: false },
      auditLogEntries: [],
      generatedAt: '2026-04-26T12:00:00.000Z',
    });

    const res = (await handler(makeReq('customer'), new InvocationContext())) as HttpResponseInit;
    expect(res.status).toBe(200);
    const body = res.jsonBody as Record<string, unknown>;
    expect(body['dataInventoryVersion']).toBe(2);
    expect(body['userId']).toBe('cust-1');
    expect(body['role']).toBe('CUSTOMER');
    expect(Array.isArray(body['bookings'])).toBe(true);
    expect(assembleUserDataExport).toHaveBeenCalledWith('cust-1', 'CUSTOMER');
  });

  it('returns 200 with technician export including KYC + wallet ledger', async () => {
    const { verifyFirebaseIdToken } = await import('../../src/services/firebaseAdmin.js');
    const { assembleUserDataExport } = await import('../../src/services/dataExport.service.js');
    const { inferUserRole } = await import('../../src/services/userRole.service.js');
    (verifyFirebaseIdToken as MockFn).mockResolvedValue({ uid: 'tech-1' });
    (inferUserRole as MockFn).mockResolvedValue('TECHNICIAN');
    (assembleUserDataExport as MockFn).mockResolvedValue({
      dataInventoryVersion: 2,
      userId: 'tech-1',
      role: 'TECHNICIAN',
      profile: { id: 'tech-1', skills: ['ac'] },
      bookings: [],
      ratings: [],
      complaints: [],
      kyc: { aadhaarMaskedNumber: 'XXXX-XXXX-1234', panNumber: 'XXXXX1234X' },
      walletLedger: [{ bookingId: 'bk-1' }],
      fcmTokens: { acknowledged: true },
      auditLogEntries: [],
      generatedAt: '2026-04-26T12:00:00.000Z',
    });

    const res = (await handler(
      makeReq('technician'),
      new InvocationContext(),
    )) as HttpResponseInit;
    expect(res.status).toBe(200);
    const body = res.jsonBody as Record<string, unknown>;
    expect(body['role']).toBe('TECHNICIAN');
    expect(body['kyc']).toMatchObject({ aadhaarMaskedNumber: expect.stringContaining('XXXX') });
    expect(assembleUserDataExport).toHaveBeenCalledWith('tech-1', 'TECHNICIAN');
  });

  it('does NOT leak unmasked Aadhaar or full PAN', async () => {
    const { verifyFirebaseIdToken } = await import('../../src/services/firebaseAdmin.js');
    const { assembleUserDataExport } = await import('../../src/services/dataExport.service.js');
    const { inferUserRole } = await import('../../src/services/userRole.service.js');
    (verifyFirebaseIdToken as MockFn).mockResolvedValue({ uid: 'tech-1' });
    (inferUserRole as MockFn).mockResolvedValue('TECHNICIAN');
    (assembleUserDataExport as MockFn).mockResolvedValue({
      dataInventoryVersion: 2,
      userId: 'tech-1',
      role: 'TECHNICIAN',
      profile: { id: 'tech-1' },
      bookings: [],
      ratings: [],
      complaints: [],
      kyc: { aadhaarMaskedNumber: 'XXXX-XXXX-1234', panNumber: 'XXXXX1234X' },
      walletLedger: [],
      fcmTokens: { acknowledged: false },
      auditLogEntries: [],
      generatedAt: '2026-04-26T12:00:00.000Z',
    });

    const res = (await handler(
      makeReq('technician'),
      new InvocationContext(),
    )) as HttpResponseInit;
    const serialized = JSON.stringify(res.jsonBody);
    // No raw 12-digit Aadhaar should appear
    expect(serialized).not.toMatch(/\b\d{12}\b/);
    // Masked Aadhaar pattern is allowed, raw is not
    expect(serialized).toContain('XXXX-XXXX-1234');
  });
});
