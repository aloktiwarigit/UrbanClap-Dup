import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpRequest } from '@azure/functions';
import type { InvocationContext, HttpResponseInit } from '@azure/functions';
import type { AdminContext } from '../../../../src/types/admin.js';
import { MASK_PLACEHOLDER } from '../../../../src/lib/pii/mask.js';

process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-hs256-minimum-32-chars!!';

const getOrderById = vi.fn();
const getTechniciansByIds = vi.fn();
const bookingRepoGetById = vi.fn();
const appendAuditEntry = vi.fn().mockResolvedValue(undefined);
const auditLog = vi.fn().mockResolvedValue(undefined);
const consumeStrict = vi.fn().mockResolvedValue({ allowed: true });
const getUsers = vi.fn();
const touchAndGetSession = vi.fn();

vi.mock('../../../../src/cosmos/orders-repository.js', () => ({ getOrderById }));
vi.mock('../../../../src/cosmos/technician-repository.js', () => ({ getTechniciansByIds }));
vi.mock('../../../../src/cosmos/booking-repository.js', () => ({
  bookingRepo: { getById: bookingRepoGetById },
}));
vi.mock('../../../../src/cosmos/audit-log-repository.js', () => ({ appendAuditEntry }));
vi.mock('../../../../src/services/auditLog.service.js', () => ({ auditLog }));
vi.mock('../../../../src/cosmos/rate-limit-repository.js', () => ({ consumeStrict }));
vi.mock('../../../../src/services/firebaseAdmin.js', () => ({
  getFirebaseAdmin: () => ({ auth: () => ({ getUsers }) }),
}));
vi.mock('../../../../src/services/adminSession.service.js', () => ({ touchAndGetSession }));
vi.mock('@sentry/node', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  withScope: (cb: (s: unknown) => void) => cb({ setLevel: vi.fn() }),
}));

const { revealContactHandler, adminRevealOrderContactHandler } = await import(
  '../../../../src/functions/admin/orders/reveal-contact.js'
);
const { signAccessToken } = await import('../../../../src/services/jwt.service.js');
const Sentry = await import('@sentry/node');

const admin: AdminContext = { adminId: 'adm_1', role: 'ops-manager', sessionId: 'sess_1' };
const ctx = {} as InvocationContext;

function request(body: unknown, id = 'ord_1'): HttpRequest {
  return { params: { id }, json: async () => body } as unknown as HttpRequest;
}

async function requestAs(
  role: 'super-admin' | 'ops-manager' | 'finance' | 'support-agent',
  body: unknown,
  id = 'ord_1',
): Promise<HttpRequest> {
  const token = await signAccessToken({ sub: 'adm_x', role, sessionId: 'sess_x' });
  return new HttpRequest({
    url: `http://localhost/api/v1/admin/orders/${id}/reveal-contact`,
    method: 'POST',
    headers: { cookie: `hs_access=${token}` },
    params: { id },
    body: { string: JSON.stringify(body) },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  consumeStrict.mockResolvedValue({ allowed: true });
  touchAndGetSession.mockResolvedValue({ sessionId: 'sess_x' });
  getOrderById.mockResolvedValue({
    id: 'ord_1',
    customerId: 'cust_1',
    customerPhone: '+91 XXXXX-X9999',
    technicianId: 'tech_1',
  });
  // Default: no raw booking phone on file, so the customer path falls
  // through to phoneForUid(order.customerId) exactly as before Finding 1's
  // fix — this keeps every pre-existing customer-reveal test unaffected.
  bookingRepoGetById.mockResolvedValue({ id: 'ord_1', customerId: 'cust_1', customerPhone: undefined });
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

  it('sets Cache-Control: no-store on the 200 response', async () => {
    const res = await revealContactHandler(request({ party: 'CUSTOMER' }), ctx, admin);
    expect(res.status).toBe(200);
    expect((res.headers as Record<string, string> | undefined)?.['Cache-Control']).toBe('no-store');
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

  it('does not leak a short number in cleartext via phoneLast4 when maskPhone returns the placeholder', async () => {
    getUsers.mockImplementation(async () => ({ users: [{ uid: 'cust_1', phoneNumber: '123' }] }));
    await revealContactHandler(request({ party: 'CUSTOMER' }), ctx, admin);
    const entry = appendAuditEntry.mock.calls[0]![0] as { payload: Record<string, unknown> };
    expect(entry.payload['phoneMasked']).toBe(MASK_PLACEHOLDER);
    expect(entry.payload['phoneLast4']).toBe('');
    expect(JSON.stringify(entry.payload)).not.toContain('123');
  });

  it('rejects an unknown party with 422 and does not audit', async () => {
    const res = await revealContactHandler(request({ party: 'COURIER' }), ctx, admin);
    expect(res.status).toBe(422);
    expect(appendAuditEntry).not.toHaveBeenCalled();
  });

  it('rejects a body with an unexpected extra key as 422 (strict schema)', async () => {
    const res = await revealContactHandler(
      request({ party: 'CUSTOMER', extra: 'nope' }),
      ctx,
      admin,
    );
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

  it('returns 502 CONTACT_LOOKUP_FAILED and reports to Sentry when Firebase Auth throws', async () => {
    getUsers.mockRejectedValue(new Error('firebase outage'));
    const res = await revealContactHandler(request({ party: 'CUSTOMER' }), ctx, admin);
    expect(res.status).toBe(502);
    expect((res.jsonBody as { code: string }).code).toBe('CONTACT_LOOKUP_FAILED');
    expect(Sentry.captureException).toHaveBeenCalled();
    expect(appendAuditEntry).not.toHaveBeenCalled();
  });

  it('returns 429 with Retry-After when the per-admin budget is spent', async () => {
    consumeStrict.mockResolvedValue({ allowed: false, retryAfterMs: 4000 });
    const res = await revealContactHandler(request({ party: 'CUSTOMER' }), ctx, admin);
    expect(res.status).toBe(429);
    expect((res.jsonBody as { code: string }).code).toBe('RATE_LIMITED');
    expect((res.headers as Record<string, string> | undefined)?.['Retry-After']).toBe('4');
    expect(appendAuditEntry).not.toHaveBeenCalled();
  });

  it('rate-limits per admin at 30 per minute', async () => {
    await revealContactHandler(request({ party: 'CUSTOMER' }), ctx, admin);
    expect(consumeStrict).toHaveBeenCalledWith('rl:pii-reveal:adm_1', 30, 0.5);
  });

  it('returns 503 RATE_LIMIT_UNAVAILABLE (fails closed) when the rate limiter cannot establish a budget', async () => {
    consumeStrict.mockRejectedValue(new Error('Cosmos throttled'));
    const res = await revealContactHandler(request({ party: 'CUSTOMER' }), ctx, admin);
    expect(res.status).toBe(503);
    expect((res.jsonBody as { code: string }).code).toBe('RATE_LIMIT_UNAVAILABLE');
    expect((res.jsonBody as { phone?: string }).phone).toBeUndefined();
    expect(JSON.stringify(res.jsonBody)).not.toMatch(/\+91\d{10}/);
    expect(appendAuditEntry).not.toHaveBeenCalled();
    expect(Sentry.captureException).toHaveBeenCalled();
  });

  describe('technician uid disambiguation (getTechniciansByIds has no ORDER BY)', () => {
    it('picks the exact id match over an unrelated doc whose technicianId happens to collide', async () => {
      // doc A: id=tech_Y (an unrelated technician) but technicianId=tech_X
      // doc B: id=tech_X (the actual assigned technician), technicianId=tech_X
      // The booking's technicianId is 'tech_1' by default in beforeEach —
      // reuse that value here so the exact-id doc is the one that matters.
      getTechniciansByIds.mockResolvedValue([
        { id: 'tech_Y', technicianId: 'tech_1' },
        { id: 'tech_1', technicianId: 'tech_1' },
      ]);
      const res = await revealContactHandler(request({ party: 'TECHNICIAN' }), ctx, admin);
      expect(res.status).toBe(200);
      expect((res.jsonBody as { phone: string }).phone).toBe('+919876544321');
    });

    it('refuses to guess and returns PARTY_NOT_AVAILABLE when only an ambiguous technicianId match exists', async () => {
      // Two unrelated docs both carry technicianId=tech_1; neither has id=tech_1.
      // There is no exact match and the technicianId match is not unique.
      getTechniciansByIds.mockResolvedValue([
        { id: 'tech_Y1', technicianId: 'tech_1' },
        { id: 'tech_Y2', technicianId: 'tech_1' },
      ]);
      const res = await revealContactHandler(request({ party: 'TECHNICIAN' }), ctx, admin);
      expect(res.status).toBe(404);
      expect((res.jsonBody as { code: string }).code).toBe('PARTY_NOT_AVAILABLE');
      expect(appendAuditEntry).not.toHaveBeenCalled();
    });

    // Codex round 4, Finding 2: a technician-lookup outage (getTechniciansByIds
    // throwing) must surface as 502 CONTACT_LOOKUP_FAILED, not be swallowed
    // into the same 404 PARTY_NOT_AVAILABLE used for a genuine absence or an
    // ambiguous match. See docs/reviews/codex-20260909-0838-round4.md.
    it('returns 502 CONTACT_LOOKUP_FAILED and reports to Sentry when getTechniciansByIds throws', async () => {
      getTechniciansByIds.mockRejectedValue(new Error('technicians container throttled'));
      const res = await revealContactHandler(request({ party: 'TECHNICIAN' }), ctx, admin);
      expect(res.status).toBe(502);
      expect((res.jsonBody as { code: string }).code).toBe('CONTACT_LOOKUP_FAILED');
      expect(Sentry.captureException).toHaveBeenCalled();
      expect(appendAuditEntry).not.toHaveBeenCalled();
    });

    it('exact match still resolves correctly when getTechniciansByIds does not throw', async () => {
      getTechniciansByIds.mockResolvedValue([{ id: 'tech_1', technicianId: 'tech_1' }]);
      const res = await revealContactHandler(request({ party: 'TECHNICIAN' }), ctx, admin);
      expect(res.status).toBe(200);
      expect((res.jsonBody as { phone: string }).phone).toBe('+919876544321');
    });
  });

  describe('Codex round 2, Finding 1 — audit payload must never carry a raw subject identifier', () => {
    it('does not write a subjectId key into the audit payload', async () => {
      await revealContactHandler(request({ party: 'CUSTOMER' }), ctx, admin);
      const entry = appendAuditEntry.mock.calls[0]![0] as { payload: Record<string, unknown> };
      expect(entry.payload).not.toHaveProperty('subjectId');
    });

    it('writes a subjectRef that is a 16-character hex string', async () => {
      await revealContactHandler(request({ party: 'CUSTOMER' }), ctx, admin);
      const entry = appendAuditEntry.mock.calls[0]![0] as { payload: Record<string, unknown> };
      expect(entry.payload['subjectRef']).toMatch(/^[0-9a-f]{16}$/);
    });

    it('does not leak a phone-shaped customerId into the serialized payload', async () => {
      getOrderById.mockResolvedValue({
        id: 'ord_1',
        customerId: '+919999999999',
        customerPhone: '+91 XXXXX-X9999',
        technicianId: 'tech_1',
      });
      bookingRepoGetById.mockResolvedValue({ id: 'ord_1', customerId: '+919999999999', customerPhone: undefined });
      getUsers.mockImplementation(async (identifiers: Array<{ uid: string }>) => ({
        users: identifiers
          .filter(({ uid }) => uid === '+919999999999')
          .map(({ uid }) => ({ uid, phoneNumber: '+919999999999' })),
      }));
      await revealContactHandler(request({ party: 'CUSTOMER' }), ctx, admin);
      const entry = appendAuditEntry.mock.calls[0]![0] as { payload: Record<string, unknown> };
      expect(JSON.stringify(entry.payload)).not.toContain('9999999999');
    });

    it('derives the same subjectRef for the same subject id every time (stable hash)', async () => {
      await revealContactHandler(request({ party: 'CUSTOMER' }), ctx, admin);
      const first = (appendAuditEntry.mock.calls[0]![0] as { payload: Record<string, unknown> }).payload[
        'subjectRef'
      ];
      appendAuditEntry.mockClear();
      await revealContactHandler(request({ party: 'CUSTOMER' }), ctx, admin);
      const second = (appendAuditEntry.mock.calls[0]![0] as { payload: Record<string, unknown> }).payload[
        'subjectRef'
      ];
      expect(second).toBe(first);
    });
  });

  describe('Finding 1 — customer reveal must fall back to the booking-persisted phone', () => {
    it('returns the booking-persisted number when Auth holds none for the customer', async () => {
      bookingRepoGetById.mockResolvedValue({
        id: 'ord_1',
        customerId: 'cust_1',
        customerPhone: '+919888888888',
      });
      getUsers.mockImplementation(async () => ({ users: [] })); // Auth has no phone
      const res = await revealContactHandler(request({ party: 'CUSTOMER' }), ctx, admin);
      expect(res.status).toBe(200);
      expect((res.jsonBody as { phone: string }).phone).toBe('+919888888888');
    });

    it('returns the Auth-sourced number when the booking holds none', async () => {
      bookingRepoGetById.mockResolvedValue({ id: 'ord_1', customerId: 'cust_1', customerPhone: undefined });
      // getUsers directory (set in the outer beforeEach) already resolves cust_1.
      const res = await revealContactHandler(request({ party: 'CUSTOMER' }), ctx, admin);
      expect(res.status).toBe(200);
      expect((res.jsonBody as { phone: string }).phone).toBe('+919999999999');
    });

    it('returns 404 PHONE_UNAVAILABLE only when both the booking and Auth have no number', async () => {
      bookingRepoGetById.mockResolvedValue({ id: 'ord_1', customerId: 'cust_1', customerPhone: undefined });
      getUsers.mockImplementation(async () => ({ users: [] }));
      const res = await revealContactHandler(request({ party: 'CUSTOMER' }), ctx, admin);
      expect(res.status).toBe(404);
      expect((res.jsonBody as { code: string }).code).toBe('PHONE_UNAVAILABLE');
    });
  });

  describe('E09-S08 hardening — denial auditing (Change 1) and daily cap (Change 2)', () => {
    it('FORBIDDEN — finance and support-agent get 403 and a PII_CONTACT_REVEAL_DENIED row', async () => {
      for (const role of ['finance', 'support-agent'] as const) {
        auditLog.mockClear();
        const forbiddenAdmin: AdminContext = { adminId: 'adm_2', role, sessionId: 'sess_2' };
        const res = await revealContactHandler(request({ party: 'CUSTOMER' }), ctx, forbiddenAdmin);
        expect(res.status).toBe(403);
        expect(res.jsonBody).toEqual({ code: 'FORBIDDEN', requiredRoles: ['super-admin', 'ops-manager'] });
        expect(auditLog).toHaveBeenCalledTimes(1);
        const [, action, resourceType, resourceId, payload] = auditLog.mock.calls[0]!;
        expect(action).toBe('PII_CONTACT_REVEAL_DENIED');
        expect(resourceType).toBe('booking');
        expect(resourceId).toBe('ord_1');
        expect((payload as Record<string, unknown>)['reason']).toBe('FORBIDDEN');
        expect(appendAuditEntry).not.toHaveBeenCalled();
      }
    });

    it('per-minute exhaustion returns 429 RATE_LIMITED and writes a denial row', async () => {
      consumeStrict.mockResolvedValue({ allowed: false, retryAfterMs: 4000 });
      const res = await revealContactHandler(request({ party: 'CUSTOMER' }), ctx, admin);
      expect(res.status).toBe(429);
      expect((res.jsonBody as { code: string }).code).toBe('RATE_LIMITED');
      expect(auditLog).toHaveBeenCalledTimes(1);
      const [, action, , , payload] = auditLog.mock.calls[0]!;
      expect(action).toBe('PII_CONTACT_REVEAL_DENIED');
      expect((payload as Record<string, unknown>)['reason']).toBe('RATE_LIMITED');
      expect((payload as Record<string, unknown>)['party']).toBe('CUSTOMER');
      expect(payload).not.toHaveProperty('subjectRef');
    });

    it('daily exhaustion (minute allowed, daily denied) returns 429 RATE_LIMITED_DAILY, consumes the daily bucket, and writes a denial row', async () => {
      consumeStrict.mockImplementation(async (key: string) => {
        if (key.startsWith('rl:pii-reveal-day:')) return { allowed: false, retryAfterMs: 9000 };
        return { allowed: true };
      });
      const res = await revealContactHandler(request({ party: 'CUSTOMER' }), ctx, admin);
      expect(res.status).toBe(429);
      expect((res.jsonBody as { code: string }).code).toBe('RATE_LIMITED_DAILY');
      expect((res.jsonBody as { retryAfterMs: number }).retryAfterMs).toBe(9000);
      expect(consumeStrict).toHaveBeenCalledWith('rl:pii-reveal-day:adm_1', 50, 50 / 86400);
      expect(auditLog).toHaveBeenCalledTimes(1);
      const [, action, , , payload] = auditLog.mock.calls[0]!;
      expect(action).toBe('PII_CONTACT_REVEAL_DENIED');
      expect((payload as Record<string, unknown>)['reason']).toBe('RATE_LIMITED_DAILY');
    });

    it('order not found writes a denial row reason NOT_FOUND (no subjectRef — no subject resolved)', async () => {
      getOrderById.mockResolvedValue(null);
      const res = await revealContactHandler(request({ party: 'CUSTOMER' }), ctx, admin);
      expect(res.status).toBe(404);
      const [, action, , , payload] = auditLog.mock.calls[0]!;
      expect(action).toBe('PII_CONTACT_REVEAL_DENIED');
      expect((payload as Record<string, unknown>)['reason']).toBe('NOT_FOUND');
      expect(payload).not.toHaveProperty('subjectRef');
    });

    it('no phone on file writes a denial row reason NOT_FOUND (subjectRef present — subject WAS resolved)', async () => {
      getUsers.mockImplementation(async () => ({ users: [] }));
      const res = await revealContactHandler(request({ party: 'CUSTOMER' }), ctx, admin);
      expect(res.status).toBe(404);
      expect((res.jsonBody as { code: string }).code).toBe('PHONE_UNAVAILABLE');
      const [, action, , , payload] = auditLog.mock.calls[0]!;
      expect(action).toBe('PII_CONTACT_REVEAL_DENIED');
      expect((payload as Record<string, unknown>)['reason']).toBe('NOT_FOUND');
      expect((payload as Record<string, unknown>)['subjectRef']).toMatch(/^[0-9a-f]{16}$/);
    });

    it('502 lookup failure writes a denial row reason LOOKUP_FAILED', async () => {
      getUsers.mockRejectedValue(new Error('firebase outage'));
      const res = await revealContactHandler(request({ party: 'CUSTOMER' }), ctx, admin);
      expect(res.status).toBe(502);
      const [, action, , , payload] = auditLog.mock.calls[0]!;
      expect(action).toBe('PII_CONTACT_REVEAL_DENIED');
      expect((payload as Record<string, unknown>)['reason']).toBe('LOOKUP_FAILED');
    });

    it('502 technician-lookup failure writes a denial row reason LOOKUP_FAILED with no phone in the body', async () => {
      getTechniciansByIds.mockRejectedValue(new Error('technicians container throttled'));
      const res = await revealContactHandler(request({ party: 'TECHNICIAN' }), ctx, admin);
      expect(res.status).toBe(502);
      expect((res.jsonBody as { code: string }).code).toBe('CONTACT_LOOKUP_FAILED');
      expect((res.jsonBody as { phone?: string }).phone).toBeUndefined();
      const [, action, , , payload] = auditLog.mock.calls[0]!;
      expect(action).toBe('PII_CONTACT_REVEAL_DENIED');
      expect((payload as Record<string, unknown>)['reason']).toBe('LOOKUP_FAILED');
      expect(appendAuditEntry).not.toHaveBeenCalled();
    });

    it('503 rate-limit-store failure writes a denial row reason RATE_LIMIT_UNAVAILABLE', async () => {
      consumeStrict.mockRejectedValue(new Error('Cosmos throttled'));
      const res = await revealContactHandler(request({ party: 'CUSTOMER' }), ctx, admin);
      expect(res.status).toBe(503);
      const [, action, , , payload] = auditLog.mock.calls[0]!;
      expect(action).toBe('PII_CONTACT_REVEAL_DENIED');
      expect((payload as Record<string, unknown>)['reason']).toBe('RATE_LIMIT_UNAVAILABLE');
    });

    it('a successful reveal still writes exactly one PII_CONTACT_REVEALED row and no denial row', async () => {
      const res = await revealContactHandler(request({ party: 'CUSTOMER' }), ctx, admin);
      expect(res.status).toBe(200);
      expect(appendAuditEntry).toHaveBeenCalledTimes(1);
      expect((appendAuditEntry.mock.calls[0]![0] as { action: string }).action).toBe('PII_CONTACT_REVEALED');
      expect(auditLog).not.toHaveBeenCalled();
    });

    it('never puts a raw phone number or a raw subject id into any denial payload', async () => {
      // Phone-shaped customerId, mirroring truecaller-verify's phone-as-uid pattern —
      // exercises the PHONE_UNAVAILABLE (NOT_FOUND) path, which DOES include subjectRef.
      getOrderById.mockResolvedValue({
        id: 'ord_1',
        customerId: '+919999999999',
        customerPhone: '+91 XXXXX-X9999',
        technicianId: 'tech_1',
      });
      bookingRepoGetById.mockResolvedValue({
        id: 'ord_1',
        customerId: '+919999999999',
        customerPhone: undefined,
      });
      getUsers.mockImplementation(async () => ({ users: [] }));
      await revealContactHandler(request({ party: 'CUSTOMER' }), ctx, admin);
      expect(auditLog).toHaveBeenCalledTimes(1);
      const payload = auditLog.mock.calls[0]![4];
      const serialized = JSON.stringify(payload);
      expect(serialized).not.toContain('9999999999');
      expect(serialized).not.toContain('+919999999999');
    });
  });
});

describe('RBAC — the composed (requireAdmin-wrapped) handler as actually registered', () => {
  it.each(['finance', 'support-agent'] as const)(
    'returns 403 for role %s',
    async (role) => {
      const req = await requestAs(role, { party: 'CUSTOMER' });
      const res = (await adminRevealOrderContactHandler(req, ctx)) as HttpResponseInit;
      expect(res.status).toBe(403);
    },
  );

  it.each(['super-admin', 'ops-manager'] as const)(
    'does not return 403 for role %s (passes the gate)',
    async (role) => {
      const req = await requestAs(role, { party: 'CUSTOMER' });
      const res = (await adminRevealOrderContactHandler(req, ctx)) as HttpResponseInit;
      expect(res.status).not.toBe(403);
      expect(res.status).toBe(200);
    },
  );
});
