import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpRequest } from '@azure/functions';

vi.mock('../../../../src/cosmos/booking-repository.js', () => ({
  updateBookingFields: vi.fn(),
  bookingRepo: { getById: vi.fn() },
}));
vi.mock('../../../../src/cosmos/orders-repository.js', () => ({ getOrderById: vi.fn() }));
vi.mock('../../../../src/cosmos/audit-log-repository.js', () => ({ appendAuditEntry: vi.fn() }));
vi.mock('../../../../src/cosmos/technician-repository.js', () => ({
  readTechnicianGateState: vi.fn(),
}));

import { updateBookingFields } from '../../../../src/cosmos/booking-repository.js';
import { getOrderById } from '../../../../src/cosmos/orders-repository.js';
import { appendAuditEntry } from '../../../../src/cosmos/audit-log-repository.js';
import { readTechnicianGateState } from '../../../../src/cosmos/technician-repository.js';
import { reassignOrderHandler } from '../../../../src/functions/admin/orders/overrides.js';

const admin = { adminId: 'a1', role: 'super-admin' as const, sessionId: 's1' };

function req(body: unknown) {
  const r = new HttpRequest({
    url: 'http://localhost/api/v1/admin/orders/bk-1/reassign',
    method: 'POST',
    body: { string: JSON.stringify(body) },
  });
  Object.assign(r, { params: { id: 'bk-1' } });
  return r;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(updateBookingFields).mockResolvedValue({ id: 'bk-1' } as never);
  vi.mocked(getOrderById).mockResolvedValue({ id: 'bk-1' } as never);
  vi.mocked(appendAuditEntry).mockResolvedValue(undefined as never);
});

describe('reassignOrderHandler hold enrichment', () => {
  it('records the target technician hold state, balance and suspension in the audit payload', async () => {
    vi.mocked(readTechnicianGateState).mockResolvedValue({
      exists: true,
      hold: {
        outstandingPaise: 620000, dueCount: 4, state: 'BLOCKED',
        evaluatedAt: '2026-09-08T00:00:00.000Z',
      },
      suspended: false,
    });

    const res = await reassignOrderHandler(req({ technicianId: 'tech-9', reason: 'customer request' }), {} as never, admin);

    expect(res.status).toBe(200);
    expect(appendAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'REASSIGN',
        payload: {
          technicianId: 'tech-9',
          reason: 'customer request',
          targetHoldState: 'BLOCKED',
          targetOutstandingPaise: 620000,
          targetSuspended: false,
        },
      }),
    );
  });

  it('does NOT block the reassign when the target is BLOCKED (sanctioned override)', async () => {
    vi.mocked(readTechnicianGateState).mockResolvedValue({
      exists: true,
      hold: {
        outstandingPaise: 999999, dueCount: 9, state: 'BLOCKED',
        evaluatedAt: '2026-09-08T00:00:00.000Z',
      },
      suspended: true,
    });
    const res = await reassignOrderHandler(req({ technicianId: 'tech-9', reason: 'owner override' }), {} as never, admin);
    expect(res.status).toBe(200);
    expect(updateBookingFields).toHaveBeenCalledWith('bk-1', { technicianId: 'tech-9' });
  });

  it('records a legacy technician with no hold as CLEAR/0', async () => {
    vi.mocked(readTechnicianGateState).mockResolvedValue({ exists: true, hold: null, suspended: false });
    await reassignOrderHandler(req({ technicianId: 'tech-legacy', reason: 'owner request' }), {} as never, admin);
    expect(appendAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: {
          technicianId: 'tech-legacy',
          reason: 'owner request',
          targetHoldState: 'CLEAR',
          targetOutstandingPaise: 0,
          targetSuspended: false,
        },
      }),
    );
  });

  it('records TECHNICIAN_NOT_FOUND and omits numeric fields when the target technician does not exist', async () => {
    vi.mocked(readTechnicianGateState).mockResolvedValue({ exists: false, hold: null, suspended: false });
    const res = await reassignOrderHandler(req({ technicianId: 'tech-typo', reason: 'owner request' }), {} as never, admin);
    expect(res.status).toBe(200);
    expect(appendAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: {
          technicianId: 'tech-typo',
          reason: 'owner request',
          targetHoldState: 'TECHNICIAN_NOT_FOUND',
        },
      }),
    );
  });

  it('still completes the reassign and writes the audit entry when the gate-state read throws', async () => {
    vi.mocked(readTechnicianGateState).mockRejectedValue(new Error('cosmos down'));
    const res = await reassignOrderHandler(req({ technicianId: 'tech-9', reason: 'override request' }), {} as never, admin);
    expect(res.status).toBe(200);
    expect(appendAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: {
          technicianId: 'tech-9',
          reason: 'override request',
          targetHoldState: 'UNKNOWN',
        },
      }),
    );
  });
});
