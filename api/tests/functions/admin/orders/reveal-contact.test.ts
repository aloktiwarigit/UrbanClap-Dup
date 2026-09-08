import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HttpRequest, InvocationContext } from '@azure/functions';
import type { AdminContext } from '../../../../src/types/admin.js';

const getOrderById = vi.fn();
const getTechniciansByIds = vi.fn();
const appendAuditEntry = vi.fn().mockResolvedValue(undefined);
const consume = vi.fn().mockResolvedValue({ allowed: true });
const getUsers = vi.fn();

vi.mock('../../../../src/cosmos/orders-repository.js', () => ({ getOrderById }));
vi.mock('../../../../src/cosmos/technician-repository.js', () => ({ getTechniciansByIds }));
vi.mock('../../../../src/cosmos/audit-log-repository.js', () => ({ appendAuditEntry }));
vi.mock('../../../../src/cosmos/rate-limit-repository.js', () => ({ consume }));
vi.mock('../../../../src/services/firebaseAdmin.js', () => ({
  getFirebaseAdmin: () => ({ auth: () => ({ getUsers }) }),
}));

const { revealContactHandler } = await import(
  '../../../../src/functions/admin/orders/reveal-contact.js'
);

const admin: AdminContext = { adminId: 'adm_1', role: 'ops-manager', sessionId: 'sess_1' };
const ctx = {} as InvocationContext;

function request(body: unknown, id = 'ord_1'): HttpRequest {
  return { params: { id }, json: async () => body } as unknown as HttpRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
  consume.mockResolvedValue({ allowed: true });
  getOrderById.mockResolvedValue({
    id: 'ord_1',
    customerId: 'cust_1',
    customerPhone: '+91 XXXXX-X9999',
    technicianId: 'tech_1',
  });
  getTechniciansByIds.mockResolvedValue([{ id: 'tech_1', technicianId: 'tech_1' }]);
  // The mock must honour the requested uid: the handler resolves one subject
  // at a time via getUsers([{ uid }]) and reads users[0]. A mock that always
  // returns both users would make the technician case assert the customer's
  // number and pass for the wrong reason.
  const directory: Record<string, string> = {
    cust_1: '+919999999999',
    tech_1: '+919876544321',
  };
  getUsers.mockImplementation(async (identifiers: Array<{ uid: string }>) => ({
    users: identifiers
      .filter(({ uid }) => directory[uid] !== undefined)
      .map(({ uid }) => ({ uid, phoneNumber: directory[uid] })),
  }));
});

describe('POST /v1/admin/orders/{id}/reveal-contact', () => {
  it('returns the full customer number', async () => {
    const res = await revealContactHandler(request({ party: 'CUSTOMER' }), ctx, admin);
    expect(res.status).toBe(200);
    expect((res.jsonBody as { phone: string }).phone).toBe('+919999999999');
    expect((res.jsonBody as { party: string }).party).toBe('CUSTOMER');
  });

  it('returns the full technician number', async () => {
    const res = await revealContactHandler(request({ party: 'TECHNICIAN' }), ctx, admin);
    expect(res.status).toBe(200);
    expect((res.jsonBody as { phone: string }).phone).toBe('+919876544321');
  });

  it('writes a PII_CONTACT_REVEALED audit entry naming the admin and the party', async () => {
    await revealContactHandler(request({ party: 'CUSTOMER' }), ctx, admin);
    expect(appendAuditEntry).toHaveBeenCalledTimes(1);
    const entry = appendAuditEntry.mock.calls[0]![0] as {
      action: string; adminId: string; resourceId: string; payload: Record<string, unknown>;
    };
    expect(entry.action).toBe('PII_CONTACT_REVEALED');
    expect(entry.adminId).toBe('adm_1');
    expect(entry.resourceId).toBe('ord_1');
    expect(entry.payload['party']).toBe('CUSTOMER');
  });

  it('never writes the full number into the audit payload', async () => {
    await revealContactHandler(request({ party: 'CUSTOMER' }), ctx, admin);
    const entry = appendAuditEntry.mock.calls[0]![0] as { payload: Record<string, unknown> };
    expect(JSON.stringify(entry.payload)).not.toContain('+919999999999');
    expect(JSON.stringify(entry.payload)).not.toContain('9999999999');
    expect(entry.payload['phoneMasked']).toBe('+91 XXXXX-X9999');
    expect(entry.payload['phoneLast4']).toBe('9999');
  });

  it('rejects an unknown party with 422 and does not audit', async () => {
    const res = await revealContactHandler(request({ party: 'COURIER' }), ctx, admin);
    expect(res.status).toBe(422);
    expect(appendAuditEntry).not.toHaveBeenCalled();
  });

  it('returns 404 when the order does not exist', async () => {
    getOrderById.mockResolvedValue(null);
    const res = await revealContactHandler(request({ party: 'CUSTOMER' }), ctx, admin);
    expect(res.status).toBe(404);
    expect((res.jsonBody as { code: string }).code).toBe('ORDER_NOT_FOUND');
  });

  it('returns 404 PARTY_NOT_AVAILABLE when no technician is assigned', async () => {
    getOrderById.mockResolvedValue({ id: 'ord_1', customerId: 'cust_1' });
    const res = await revealContactHandler(request({ party: 'TECHNICIAN' }), ctx, admin);
    expect(res.status).toBe(404);
    expect((res.jsonBody as { code: string }).code).toBe('PARTY_NOT_AVAILABLE');
  });

  it('returns 404 PHONE_UNAVAILABLE when the number cannot be resolved', async () => {
    getUsers.mockImplementation(async () => ({ users: [] }));
    const res = await revealContactHandler(request({ party: 'CUSTOMER' }), ctx, admin);
    expect(res.status).toBe(404);
    expect((res.jsonBody as { code: string }).code).toBe('PHONE_UNAVAILABLE');
  });

  it('returns 429 with Retry-After when the per-admin budget is spent', async () => {
    consume.mockResolvedValue({ allowed: false, retryAfterMs: 4000 });
    const res = await revealContactHandler(request({ party: 'CUSTOMER' }), ctx, admin);
    expect(res.status).toBe(429);
    expect((res.jsonBody as { code: string }).code).toBe('RATE_LIMITED');
    expect((res.headers as Record<string, string> | undefined)?.['Retry-After']).toBe('4');
    expect(appendAuditEntry).not.toHaveBeenCalled();
  });

  it('rate-limits per admin at 30 per minute', async () => {
    await revealContactHandler(request({ party: 'CUSTOMER' }), ctx, admin);
    expect(consume).toHaveBeenCalledWith('rl:pii-reveal:adm_1', 30, 0.5);
  });
});
