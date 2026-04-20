import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HttpRequest, InvocationContext } from '@azure/functions';

vi.mock('../../../../src/cosmos/orders-repository.js', () => ({
  getOrderById: vi.fn(),
}));

vi.mock('../../../../src/cosmos/booking-repository.js', () => ({
  updateBookingFields: vi.fn(),
  bookingRepo: { getById: vi.fn() },
}));

vi.mock('../../../../src/cosmos/audit-log-repository.js', () => ({
  appendAuditEntry: vi.fn(),
}));

import { getOrderById } from '../../../../src/cosmos/orders-repository.js';
import { updateBookingFields, bookingRepo } from '../../../../src/cosmos/booking-repository.js';
import { appendAuditEntry } from '../../../../src/cosmos/audit-log-repository.js';
import {
  reassignOrderHandler,
  completeOrderHandler,
  refundOrderHandler,
  waiveFeeOrderHandler,
  escalateOrderHandler,
  noteOrderHandler,
} from '../../../../src/functions/admin/orders/overrides.js';

function makeReq(id: string, body: unknown): HttpRequest {
  return {
    params: { id },
    query: { get: () => null },
    json: async () => body,
  } as unknown as HttpRequest;
}

const mockCtx = {} as InvocationContext;
const mockAdmin = { adminId: 'admin_1', role: 'super-admin' as const, sessionId: 'sess_1' };

const sampleOrder = {
  id: 'ord_1',
  customerId: 'cust_1',
  customerName: 'Rahul',
  customerPhone: '9999999999',
  status: 'ASSIGNED' as const,
  city: 'Bengaluru',
  scheduledAt: new Date().toISOString(),
  amount: 599,
  createdAt: new Date().toISOString(),
};

const sampleBooking = {
  id: 'ord_1',
  customerId: 'cust_1',
  serviceId: 'svc_1',
  categoryId: 'cat_1',
  slotDate: '2026-04-20',
  slotWindow: '10:00-12:00',
  addressText: '123 Main St',
  addressLatLng: { lat: 12.9, lng: 77.6 },
  status: 'ASSIGNED' as const,
  paymentOrderId: 'pay_ord_1',
  paymentId: null,
  paymentSignature: null,
  amount: 599,
  createdAt: new Date().toISOString(),
};

describe('reassignOrderHandler', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with updated order on happy path', async () => {
    (updateBookingFields as ReturnType<typeof vi.fn>).mockResolvedValue(sampleBooking);
    (getOrderById as ReturnType<typeof vi.fn>).mockResolvedValue(sampleOrder);
    (appendAuditEntry as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const res = await reassignOrderHandler(
      makeReq('ord_1', { technicianId: 'tech_2', reason: 'Customer requested' }),
      mockCtx,
      mockAdmin,
    );
    expect(res.status).toBe(200);
    expect((res.jsonBody as typeof sampleOrder).id).toBe('ord_1');
  });

  it('returns 422 when reason is too short', async () => {
    const res = await reassignOrderHandler(
      makeReq('ord_1', { technicianId: 'tech_2', reason: 'x' }),
      mockCtx,
      mockAdmin,
    );
    expect(res.status).toBe(422);
    expect((res.jsonBody as { code: string }).code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 when order not found', async () => {
    (updateBookingFields as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (getOrderById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const res = await reassignOrderHandler(
      makeReq('nonexistent', { technicianId: 'tech_2', reason: 'Customer requested' }),
      mockCtx,
      mockAdmin,
    );
    expect(res.status).toBe(404);
    expect((res.jsonBody as { code: string }).code).toBe('ORDER_NOT_FOUND');
  });
});

describe('completeOrderHandler', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with updated order on happy path', async () => {
    (updateBookingFields as ReturnType<typeof vi.fn>).mockResolvedValue(sampleBooking);
    (getOrderById as ReturnType<typeof vi.fn>).mockResolvedValue(sampleOrder);
    (appendAuditEntry as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const res = await completeOrderHandler(
      makeReq('ord_1', { reason: 'Job done by technician' }),
      mockCtx,
      mockAdmin,
    );
    expect(res.status).toBe(200);
    expect((res.jsonBody as typeof sampleOrder).id).toBe('ord_1');
  });

  it('returns 422 when reason is too short', async () => {
    const res = await completeOrderHandler(
      makeReq('ord_1', { reason: 'x' }),
      mockCtx,
      mockAdmin,
    );
    expect(res.status).toBe(422);
    expect((res.jsonBody as { code: string }).code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 when order not found', async () => {
    (updateBookingFields as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const res = await completeOrderHandler(
      makeReq('nonexistent', { reason: 'Job done by technician' }),
      mockCtx,
      mockAdmin,
    );
    expect(res.status).toBe(404);
    expect((res.jsonBody as { code: string }).code).toBe('ORDER_NOT_FOUND');
  });
});

describe('refundOrderHandler', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with order on happy path (stub)', async () => {
    (getOrderById as ReturnType<typeof vi.fn>).mockResolvedValue(sampleOrder);
    (appendAuditEntry as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const res = await refundOrderHandler(
      makeReq('ord_1', { reason: 'Customer unhappy with service' }),
      mockCtx,
      mockAdmin,
    );
    expect(res.status).toBe(200);
    expect((res.jsonBody as typeof sampleOrder).id).toBe('ord_1');
  });

  it('returns 422 when reason is too short', async () => {
    const res = await refundOrderHandler(
      makeReq('ord_1', { reason: 'bad' }),
      mockCtx,
      mockAdmin,
    );
    expect(res.status).toBe(422);
    expect((res.jsonBody as { code: string }).code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 when order not found', async () => {
    (getOrderById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const res = await refundOrderHandler(
      makeReq('nonexistent', { reason: 'Customer unhappy with service' }),
      mockCtx,
      mockAdmin,
    );
    expect(res.status).toBe(404);
    expect((res.jsonBody as { code: string }).code).toBe('ORDER_NOT_FOUND');
  });
});

describe('waiveFeeOrderHandler', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with updated order on happy path', async () => {
    (updateBookingFields as ReturnType<typeof vi.fn>).mockResolvedValue(sampleBooking);
    (getOrderById as ReturnType<typeof vi.fn>).mockResolvedValue(sampleOrder);
    (appendAuditEntry as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const res = await waiveFeeOrderHandler(
      makeReq('ord_1', { reason: 'Service quality issue' }),
      mockCtx,
      mockAdmin,
    );
    expect(res.status).toBe(200);
    expect((res.jsonBody as typeof sampleOrder).id).toBe('ord_1');
  });

  it('returns 422 when reason is too short', async () => {
    const res = await waiveFeeOrderHandler(
      makeReq('ord_1', { reason: 'x' }),
      mockCtx,
      mockAdmin,
    );
    expect(res.status).toBe(422);
    expect((res.jsonBody as { code: string }).code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 when order not found', async () => {
    (updateBookingFields as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const res = await waiveFeeOrderHandler(
      makeReq('nonexistent', { reason: 'Service quality issue' }),
      mockCtx,
      mockAdmin,
    );
    expect(res.status).toBe(404);
    expect((res.jsonBody as { code: string }).code).toBe('ORDER_NOT_FOUND');
  });
});

describe('escalateOrderHandler', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with updated order on happy path', async () => {
    (updateBookingFields as ReturnType<typeof vi.fn>).mockResolvedValue(sampleBooking);
    (getOrderById as ReturnType<typeof vi.fn>).mockResolvedValue(sampleOrder);
    (appendAuditEntry as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const res = await escalateOrderHandler(
      makeReq('ord_1', { reason: 'Customer complaint', priority: 'HIGH' as const }),
      mockCtx,
      mockAdmin,
    );
    expect(res.status).toBe(200);
    expect((res.jsonBody as typeof sampleOrder).id).toBe('ord_1');
  });

  it('returns 422 when reason is too short', async () => {
    const res = await escalateOrderHandler(
      makeReq('ord_1', { reason: 'bad', priority: 'HIGH' }),
      mockCtx,
      mockAdmin,
    );
    expect(res.status).toBe(422);
    expect((res.jsonBody as { code: string }).code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 when order not found', async () => {
    (updateBookingFields as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const res = await escalateOrderHandler(
      makeReq('nonexistent', { reason: 'Customer complaint', priority: 'HIGH' }),
      mockCtx,
      mockAdmin,
    );
    expect(res.status).toBe(404);
    expect((res.jsonBody as { code: string }).code).toBe('ORDER_NOT_FOUND');
  });
});

describe('noteOrderHandler', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with updated order on happy path', async () => {
    (bookingRepo.getById as ReturnType<typeof vi.fn>).mockResolvedValue(sampleBooking);
    (updateBookingFields as ReturnType<typeof vi.fn>).mockResolvedValue(sampleBooking);
    (getOrderById as ReturnType<typeof vi.fn>).mockResolvedValue(sampleOrder);
    (appendAuditEntry as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const res = await noteOrderHandler(
      makeReq('ord_1', { note: 'Customer requested callback' }),
      mockCtx,
      mockAdmin,
    );
    expect(res.status).toBe(200);
    expect((res.jsonBody as typeof sampleOrder).id).toBe('ord_1');
  });

  it('returns 422 when note is empty', async () => {
    const res = await noteOrderHandler(
      makeReq('ord_1', { note: '' }),
      mockCtx,
      mockAdmin,
    );
    expect(res.status).toBe(422);
    expect((res.jsonBody as { code: string }).code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 when order not found', async () => {
    (bookingRepo.getById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const res = await noteOrderHandler(
      makeReq('nonexistent', { note: 'Some note here' }),
      mockCtx,
      mockAdmin,
    );
    expect(res.status).toBe(404);
    expect((res.jsonBody as { code: string }).code).toBe('ORDER_NOT_FOUND');
  });
});
