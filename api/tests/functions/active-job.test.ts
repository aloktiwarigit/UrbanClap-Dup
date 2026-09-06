import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpRequest, InvocationContext, type HttpResponseInit } from '@azure/functions';

vi.mock('@sentry/node', () => ({
  captureMessage: vi.fn(),
  captureException: vi.fn(),
  withScope: vi.fn((cb: (scope: { setLevel: (l: string) => void; setExtras: (e: Record<string, unknown>) => void }) => void) => {
    cb({ setLevel: vi.fn(), setExtras: vi.fn() });
  }),
}));

vi.mock('../../src/middleware/verifyTechnicianToken.js', () => ({
  verifyTechnicianToken: vi.fn(),
}));

vi.mock('../../src/cosmos/booking-repository.js', () => ({
  bookingRepo: { getById: vi.fn() },
  updateBookingFields: vi.fn(),
}));

vi.mock('../../src/cosmos/booking-event-repository.js', () => ({
  bookingEventRepo: { append: vi.fn() },
}));

vi.mock('../../src/cosmos/catalogue-repository.js', () => ({
  catalogueRepo: { getServiceByIdCrossPartition: vi.fn() },
}));

vi.mock('../../src/services/fcm.service.js', () => ({
  sendBookingStatusUpdatePush: vi.fn().mockResolvedValue(undefined),
  sendLocationUpdatePush: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../src/services/commission-settlement.service.js', () => ({
  recordCommissionDue: vi.fn().mockResolvedValue({ created: true, commissionDue: 0, commissionBps: 0, commissionResolvedFrom: 'GLOBAL' }),
  finalizeLedgerForTechnician: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../src/services/auditLog.service.js', () => ({
  auditLog: vi.fn().mockResolvedValue(undefined),
}));

type MockFn = ReturnType<typeof vi.fn>;

const aBooking = (status = 'ASSIGNED') => ({
  id: 'bk-1', customerId: 'c-1', serviceId: 'svc-1', categoryId: 'cat-1',
  slotDate: '2026-05-01', slotWindow: '10:00-12:00',
  addressText: '12 Main St', addressLatLng: { lat: 12.9, lng: 77.6 },
  status, paymentOrderId: 'o-1', paymentId: null, paymentSignature: null,
  amount: 50000, technicianId: 'tech-1', createdAt: new Date().toISOString(),
});

const aService = () => ({
  id: 'svc-1', name: 'AC Repair', basePrice: 50000, isActive: true,
  categoryId: 'cat-1', createdAt: '', updatedAt: '', updatedBy: '',
});

function makeGetReq(bookingId: string): HttpRequest {
  const req = new HttpRequest({
    url: `http://localhost/api/v1/technicians/active-job/${bookingId}`,
    method: 'GET',
    headers: { authorization: 'Bearer test-token' },
  });
  Object.assign(req, { params: { bookingId } });
  return req;
}

function makePatchReq(bookingId: string, body: unknown): HttpRequest {
  const req = new HttpRequest({
    url: `http://localhost/api/v1/technicians/active-job/${bookingId}/transition`,
    method: 'PATCH',
    headers: { authorization: 'Bearer test-token' },
    body: { string: JSON.stringify(body) },
  });
  Object.assign(req, { params: { bookingId } });
  return req;
}

describe('GET /v1/technicians/active-job/:bookingId', () => {
  let getActiveJobHandler: typeof import('../../src/functions/active-job.js').getActiveJobHandler;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    const mod = await import('../../src/functions/active-job.js');
    getActiveJobHandler = mod.getActiveJobHandler;
  });

  it('returns 200 with enriched booking for assigned technician', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { bookingRepo } = await import('../../src/cosmos/booking-repository.js');
    const { catalogueRepo } = await import('../../src/cosmos/catalogue-repository.js');

    (verifyTechnicianToken as MockFn).mockResolvedValue({ uid: 'tech-1' });
    (bookingRepo.getById as MockFn).mockResolvedValue({
      ...aBooking(),
      addressText: '12%20Main%20St',
    });
    (catalogueRepo.getServiceByIdCrossPartition as MockFn).mockResolvedValue(aService());

    const res = await getActiveJobHandler(makeGetReq('bk-1'), new InvocationContext()) as HttpResponseInit;

    expect(res.status).toBe(200);
    const body = res.jsonBody as Record<string, unknown>;
    expect(body['status']).toBe('ASSIGNED');
    expect(body['serviceName']).toBe('AC Repair');
    expect(body['addressText']).toBe('12 Main St');
  });

  it('returns 403 if booking.technicianId !== caller uid', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { bookingRepo } = await import('../../src/cosmos/booking-repository.js');

    (verifyTechnicianToken as MockFn).mockResolvedValue({ uid: 'tech-99' });
    (bookingRepo.getById as MockFn).mockResolvedValue(aBooking());

    const res = await getActiveJobHandler(makeGetReq('bk-1'), new InvocationContext()) as HttpResponseInit;

    expect(res.status).toBe(403);
    expect((res.jsonBody as { code: string }).code).toBe('FORBIDDEN');
  });

  it('returns 404 when booking not found', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { bookingRepo } = await import('../../src/cosmos/booking-repository.js');

    (verifyTechnicianToken as MockFn).mockResolvedValue({ uid: 'tech-1' });
    (bookingRepo.getById as MockFn).mockResolvedValue(null);

    const res = await getActiveJobHandler(makeGetReq('bk-1'), new InvocationContext()) as HttpResponseInit;

    expect(res.status).toBe(404);
  });
});

describe('PATCH /v1/technicians/active-job/:bookingId/transition', () => {
  let transitionHandler: typeof import('../../src/functions/active-job.js').transitionStatusHandler;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    const mod = await import('../../src/functions/active-job.js');
    transitionHandler = mod.transitionStatusHandler;
  });

  it('returns 200 when ASSIGNED → EN_ROUTE (legal one-step forward)', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { bookingRepo, updateBookingFields } = await import('../../src/cosmos/booking-repository.js');
    const { catalogueRepo } = await import('../../src/cosmos/catalogue-repository.js');

    (verifyTechnicianToken as MockFn).mockResolvedValue({ uid: 'tech-1' });
    (bookingRepo.getById as MockFn).mockResolvedValue(aBooking('ASSIGNED'));
    (updateBookingFields as MockFn).mockResolvedValue(aBooking('EN_ROUTE'));
    (catalogueRepo.getServiceByIdCrossPartition as MockFn).mockResolvedValue(aService());

    const res = await transitionHandler(makePatchReq('bk-1', { targetStatus: 'EN_ROUTE' }), new InvocationContext()) as HttpResponseInit;

    expect(res.status).toBe(200);
    expect((res.jsonBody as { status: string }).status).toBe('EN_ROUTE');
  });

  it('returns 409 when ASSIGNED → IN_PROGRESS (skips a step)', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { bookingRepo } = await import('../../src/cosmos/booking-repository.js');

    (verifyTechnicianToken as MockFn).mockResolvedValue({ uid: 'tech-1' });
    (bookingRepo.getById as MockFn).mockResolvedValue(aBooking('ASSIGNED'));

    const res = await transitionHandler(makePatchReq('bk-1', { targetStatus: 'IN_PROGRESS' }), new InvocationContext()) as HttpResponseInit;

    expect(res.status).toBe(409);
    expect((res.jsonBody as { code: string }).code).toBe('ILLEGAL_TRANSITION');
  });

  it('returns 403 when caller is not the assigned technician', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { bookingRepo } = await import('../../src/cosmos/booking-repository.js');

    (verifyTechnicianToken as MockFn).mockResolvedValue({ uid: 'tech-99' });
    (bookingRepo.getById as MockFn).mockResolvedValue(aBooking('ASSIGNED'));

    const res = await transitionHandler(makePatchReq('bk-1', { targetStatus: 'EN_ROUTE' }), new InvocationContext()) as HttpResponseInit;

    expect(res.status).toBe(403);
  });

  it('appends STATUS_TRANSITION BookingEvent with from/to metadata', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { bookingRepo, updateBookingFields } = await import('../../src/cosmos/booking-repository.js');
    const { bookingEventRepo } = await import('../../src/cosmos/booking-event-repository.js');
    const { catalogueRepo } = await import('../../src/cosmos/catalogue-repository.js');
    const { sendBookingStatusUpdatePush } = await import('../../src/services/fcm.service.js');

    (verifyTechnicianToken as MockFn).mockResolvedValue({ uid: 'tech-1' });
    (bookingRepo.getById as MockFn).mockResolvedValue(aBooking('EN_ROUTE'));
    (updateBookingFields as MockFn).mockResolvedValue(aBooking('REACHED'));
    (catalogueRepo.getServiceByIdCrossPartition as MockFn).mockResolvedValue(aService());

    await transitionHandler(makePatchReq('bk-1', { targetStatus: 'REACHED' }), new InvocationContext());

    const appendCalls = (bookingEventRepo.append as MockFn).mock.calls;
    expect(appendCalls).toHaveLength(1);
    const arg = appendCalls[0]![0] as Record<string, unknown>;
    expect(arg['event']).toBe('STATUS_TRANSITION');
    expect(arg['technicianId']).toBe('tech-1');
    expect(arg['metadata']).toEqual({ from: 'EN_ROUTE', to: 'REACHED' });
    expect(sendBookingStatusUpdatePush).toHaveBeenCalledWith({
      customerId: 'c-1',
      bookingId: 'bk-1',
      status: 'REACHED',
    });
  });

  it('sends LOCATION_UPDATE when transition includes technician GPS', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { bookingRepo, updateBookingFields } = await import('../../src/cosmos/booking-repository.js');
    const { catalogueRepo } = await import('../../src/cosmos/catalogue-repository.js');
    const { sendLocationUpdatePush } = await import('../../src/services/fcm.service.js');

    (verifyTechnicianToken as MockFn).mockResolvedValue({ uid: 'tech-1' });
    (bookingRepo.getById as MockFn).mockResolvedValue(aBooking('ASSIGNED'));
    (updateBookingFields as MockFn).mockResolvedValue(aBooking('EN_ROUTE'));
    (catalogueRepo.getServiceByIdCrossPartition as MockFn).mockResolvedValue(aService());

    const res = await transitionHandler(
      makePatchReq('bk-1', {
        targetStatus: 'EN_ROUTE',
        currentLocation: { lat: 12.91, lng: 77.61 },
      }),
      new InvocationContext(),
    ) as HttpResponseInit;

    expect(res.status).toBe(200);
    expect(sendLocationUpdatePush).toHaveBeenCalledWith({
      customerId: 'c-1',
      bookingId: 'bk-1',
      lat: 12.91,
      lng: 77.61,
      etaMinutes: expect.any(Number),
    });
  });

  it('returns 200 and fires Sentry warning when attestation.isMock is true', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { bookingRepo, updateBookingFields } = await import('../../src/cosmos/booking-repository.js');
    const { catalogueRepo } = await import('../../src/cosmos/catalogue-repository.js');
    const Sentry = await import('@sentry/node');

    (verifyTechnicianToken as MockFn).mockResolvedValue({ uid: 'tech-1' });
    (bookingRepo.getById as MockFn).mockResolvedValue(aBooking('EN_ROUTE'));
    (updateBookingFields as MockFn).mockResolvedValue(aBooking('REACHED'));
    (catalogueRepo.getServiceByIdCrossPartition as MockFn).mockResolvedValue(aService());

    const res = await transitionHandler(
      makePatchReq('bk-1', {
        targetStatus: 'REACHED',
        attestation: { isMock: true, gpsAccuracyM: 1.0 },
      }),
      new InvocationContext(),
    ) as HttpResponseInit;

    // Non-blocking: transition succeeds even with mock GPS
    expect(res.status).toBe(200);
    expect(Sentry.captureMessage).toHaveBeenCalledWith('MARK_REACHED with mock location');
  });

  it('does NOT fire Sentry warning when attestation.isMock is false', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { bookingRepo, updateBookingFields } = await import('../../src/cosmos/booking-repository.js');
    const { catalogueRepo } = await import('../../src/cosmos/catalogue-repository.js');
    const Sentry = await import('@sentry/node');

    (verifyTechnicianToken as MockFn).mockResolvedValue({ uid: 'tech-1' });
    (bookingRepo.getById as MockFn).mockResolvedValue(aBooking('EN_ROUTE'));
    (updateBookingFields as MockFn).mockResolvedValue(aBooking('REACHED'));
    (catalogueRepo.getServiceByIdCrossPartition as MockFn).mockResolvedValue(aService());

    const res = await transitionHandler(
      makePatchReq('bk-1', {
        targetStatus: 'REACHED',
        attestation: { isMock: false, gpsAccuracyM: 10.0 },
      }),
      new InvocationContext(),
    ) as HttpResponseInit;

    expect(res.status).toBe(200);
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
  });

  it('does NOT fire Sentry warning when attestation is absent', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { bookingRepo, updateBookingFields } = await import('../../src/cosmos/booking-repository.js');
    const { catalogueRepo } = await import('../../src/cosmos/catalogue-repository.js');
    const Sentry = await import('@sentry/node');

    (verifyTechnicianToken as MockFn).mockResolvedValue({ uid: 'tech-1' });
    (bookingRepo.getById as MockFn).mockResolvedValue(aBooking('EN_ROUTE'));
    (updateBookingFields as MockFn).mockResolvedValue(aBooking('REACHED'));
    (catalogueRepo.getServiceByIdCrossPartition as MockFn).mockResolvedValue(aService());

    const res = await transitionHandler(
      makePatchReq('bk-1', { targetStatus: 'REACHED' }),
      new InvocationContext(),
    ) as HttpResponseInit;

    expect(res.status).toBe(200);
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
  });

  describe('E21-S01: cash collection on COMPLETED transition', () => {
    it('sets cashCollectionStatus=COLLECTED when cashCollected=true', async () => {
      const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
      const { bookingRepo, updateBookingFields } = await import('../../src/cosmos/booking-repository.js');
      const { catalogueRepo } = await import('../../src/cosmos/catalogue-repository.js');

      (verifyTechnicianToken as MockFn).mockResolvedValue({ uid: 'tech-1' });
      (bookingRepo.getById as MockFn).mockResolvedValue(aBooking('IN_PROGRESS'));
      (updateBookingFields as MockFn).mockResolvedValue(aBooking('COMPLETED'));
      (catalogueRepo.getServiceByIdCrossPartition as MockFn).mockResolvedValue(aService());

      await transitionHandler(
        makePatchReq('bk-1', { targetStatus: 'COMPLETED', cashCollected: true, collectedAmount: 50000 }),
        new InvocationContext(),
      );

      const [, fields] = (updateBookingFields as MockFn).mock.calls[0] as [string, Record<string, unknown>];
      expect(fields['cashCollectionStatus']).toBe('COLLECTED');
      expect(fields['cashCollectedAt']).toBeDefined();
      expect(fields['cashCollectedAmount']).toBe(50000);
    });

    it('does NOT set cashCollectionStatus when cashCollected is absent', async () => {
      const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
      const { bookingRepo, updateBookingFields } = await import('../../src/cosmos/booking-repository.js');
      const { catalogueRepo } = await import('../../src/cosmos/catalogue-repository.js');

      (verifyTechnicianToken as MockFn).mockResolvedValue({ uid: 'tech-1' });
      (bookingRepo.getById as MockFn).mockResolvedValue(aBooking('IN_PROGRESS'));
      (updateBookingFields as MockFn).mockResolvedValue(aBooking('COMPLETED'));
      (catalogueRepo.getServiceByIdCrossPartition as MockFn).mockResolvedValue(aService());

      await transitionHandler(
        makePatchReq('bk-1', { targetStatus: 'COMPLETED' }),
        new InvocationContext(),
      );

      const [, fields] = (updateBookingFields as MockFn).mock.calls[0] as [string, Record<string, unknown>];
      expect(fields['cashCollectionStatus']).toBeUndefined();
    });
  });

  describe('E21-S02: synchronous settlement + collectionMethod + cash audit', () => {
    it('patches all four cash fields, calls recordCommissionDue with the updated booking, finalizes the ledger, and writes CASH_COLLECTION_RECORDED audit', async () => {
      const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
      const { bookingRepo, updateBookingFields } = await import('../../src/cosmos/booking-repository.js');
      const { catalogueRepo } = await import('../../src/cosmos/catalogue-repository.js');
      const { recordCommissionDue, finalizeLedgerForTechnician } = await import('../../src/services/commission-settlement.service.js');
      const { auditLog } = await import('../../src/services/auditLog.service.js');

      const updatedBooking = {
        ...aBooking('COMPLETED'),
        cashCollectionStatus: 'COLLECTED',
        cashCollectedAmount: 90000,
        collectionMethod: 'UPI_QR',
        shortCollectionReason: 'customer_short',
      };

      (verifyTechnicianToken as MockFn).mockResolvedValue({ uid: 'tech-1' });
      (bookingRepo.getById as MockFn).mockResolvedValue(aBooking('IN_PROGRESS'));
      (updateBookingFields as MockFn).mockResolvedValue(updatedBooking);
      (catalogueRepo.getServiceByIdCrossPartition as MockFn).mockResolvedValue(aService());

      const res = await transitionHandler(
        makePatchReq('bk-1', {
          targetStatus: 'COMPLETED',
          cashCollected: true,
          collectedAmount: 90000,
          collectionMethod: 'UPI_QR',
          shortCollectionReason: 'customer_short',
        }),
        new InvocationContext(),
      ) as HttpResponseInit;

      expect(res.status).toBe(200);

      const [, fields] = (updateBookingFields as MockFn).mock.calls[0] as [string, Record<string, unknown>];
      expect(fields['cashCollectionStatus']).toBe('COLLECTED');
      expect(fields['cashCollectedAmount']).toBe(90000);
      expect(fields['collectionMethod']).toBe('UPI_QR');
      expect(fields['shortCollectionReason']).toBe('customer_short');

      expect(recordCommissionDue).toHaveBeenCalledWith(updatedBooking);
      expect(finalizeLedgerForTechnician).toHaveBeenCalledWith('tech-1');

      expect(auditLog).toHaveBeenCalledWith(
        { adminId: 'system', role: 'system' },
        'CASH_COLLECTION_RECORDED',
        'booking',
        'bk-1',
        {
          technicianId: 'tech-1',
          collectedAmount: 90000,
          collectionMethod: 'UPI_QR',
          shortCollectionReason: 'customer_short',
        },
      );
    });

    it('still returns 200 and captures the error in Sentry when recordCommissionDue rejects', async () => {
      const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
      const { bookingRepo, updateBookingFields } = await import('../../src/cosmos/booking-repository.js');
      const { catalogueRepo } = await import('../../src/cosmos/catalogue-repository.js');
      const { recordCommissionDue } = await import('../../src/services/commission-settlement.service.js');
      const Sentry = await import('@sentry/node');

      (verifyTechnicianToken as MockFn).mockResolvedValue({ uid: 'tech-1' });
      (bookingRepo.getById as MockFn).mockResolvedValue(aBooking('IN_PROGRESS'));
      (updateBookingFields as MockFn).mockResolvedValue(aBooking('COMPLETED'));
      (catalogueRepo.getServiceByIdCrossPartition as MockFn).mockResolvedValue(aService());
      (recordCommissionDue as MockFn).mockRejectedValueOnce(new Error('boom'));

      const res = await transitionHandler(
        makePatchReq('bk-1', { targetStatus: 'COMPLETED' }),
        new InvocationContext(),
      ) as HttpResponseInit;

      expect(res.status).toBe(200);
      expect(Sentry.captureException).toHaveBeenCalled();
    });

    it('does not write an audit entry when cashCollected is absent, but still calls settlement', async () => {
      const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
      const { bookingRepo, updateBookingFields } = await import('../../src/cosmos/booking-repository.js');
      const { catalogueRepo } = await import('../../src/cosmos/catalogue-repository.js');
      const { recordCommissionDue, finalizeLedgerForTechnician } = await import('../../src/services/commission-settlement.service.js');
      const { auditLog } = await import('../../src/services/auditLog.service.js');

      (verifyTechnicianToken as MockFn).mockResolvedValue({ uid: 'tech-1' });
      (bookingRepo.getById as MockFn).mockResolvedValue(aBooking('IN_PROGRESS'));
      (updateBookingFields as MockFn).mockResolvedValue(aBooking('COMPLETED'));
      (catalogueRepo.getServiceByIdCrossPartition as MockFn).mockResolvedValue(aService());

      const res = await transitionHandler(
        makePatchReq('bk-1', { targetStatus: 'COMPLETED' }),
        new InvocationContext(),
      ) as HttpResponseInit;

      expect(res.status).toBe(200);
      expect(auditLog).not.toHaveBeenCalled();
      expect(recordCommissionDue).toHaveBeenCalled();
      expect(finalizeLedgerForTechnician).toHaveBeenCalledWith('tech-1');
    });

    it('does not call the settlement service for non-COMPLETED transitions', async () => {
      const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
      const { bookingRepo, updateBookingFields } = await import('../../src/cosmos/booking-repository.js');
      const { catalogueRepo } = await import('../../src/cosmos/catalogue-repository.js');
      const { recordCommissionDue, finalizeLedgerForTechnician } = await import('../../src/services/commission-settlement.service.js');

      (verifyTechnicianToken as MockFn).mockResolvedValue({ uid: 'tech-1' });
      (bookingRepo.getById as MockFn).mockResolvedValue(aBooking('REACHED'));
      (updateBookingFields as MockFn).mockResolvedValue(aBooking('IN_PROGRESS'));
      (catalogueRepo.getServiceByIdCrossPartition as MockFn).mockResolvedValue(aService());

      const res = await transitionHandler(
        makePatchReq('bk-1', { targetStatus: 'IN_PROGRESS' }),
        new InvocationContext(),
      ) as HttpResponseInit;

      expect(res.status).toBe(200);
      expect(recordCommissionDue).not.toHaveBeenCalled();
      expect(finalizeLedgerForTechnician).not.toHaveBeenCalled();
    });

    it('defaults collectionMethod to CASH when cashCollected=true and no collectionMethod is given', async () => {
      const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
      const { bookingRepo, updateBookingFields } = await import('../../src/cosmos/booking-repository.js');
      const { catalogueRepo } = await import('../../src/cosmos/catalogue-repository.js');
      const { auditLog } = await import('../../src/services/auditLog.service.js');

      (verifyTechnicianToken as MockFn).mockResolvedValue({ uid: 'tech-1' });
      (bookingRepo.getById as MockFn).mockResolvedValue(aBooking('IN_PROGRESS'));
      (updateBookingFields as MockFn).mockResolvedValue(aBooking('COMPLETED'));
      (catalogueRepo.getServiceByIdCrossPartition as MockFn).mockResolvedValue(aService());

      const res = await transitionHandler(
        makePatchReq('bk-1', { targetStatus: 'COMPLETED', cashCollected: true, collectedAmount: 50000 }),
        new InvocationContext(),
      ) as HttpResponseInit;

      expect(res.status).toBe(200);

      const [, fields] = (updateBookingFields as MockFn).mock.calls[0] as [string, Record<string, unknown>];
      expect(fields['collectionMethod']).toBe('CASH');

      expect(auditLog).toHaveBeenCalledWith(
        { adminId: 'system', role: 'system' },
        'CASH_COLLECTION_RECORDED',
        'booking',
        'bk-1',
        expect.objectContaining({ collectionMethod: 'CASH' }),
      );
    });

    it('returns 400 for an invalid collectionMethod', async () => {
      const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
      const { bookingRepo } = await import('../../src/cosmos/booking-repository.js');

      (verifyTechnicianToken as MockFn).mockResolvedValue({ uid: 'tech-1' });
      (bookingRepo.getById as MockFn).mockResolvedValue(aBooking('IN_PROGRESS'));

      const res = await transitionHandler(
        makePatchReq('bk-1', { targetStatus: 'COMPLETED', cashCollected: true, collectionMethod: 'BITCOIN' }),
        new InvocationContext(),
      ) as HttpResponseInit;

      expect(res.status).toBe(400);
    });
  });
});
