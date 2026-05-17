import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpRequest } from '@azure/functions';

vi.stubEnv('RAZORPAY_KEY_ID', 'rzp_test');
vi.stubEnv('RAZORPAY_KEY_SECRET', 'rzp_secret');

vi.mock('../../src/middleware/requireCustomer.js', () => ({
  requireCustomer: (h: (req: HttpRequest, ctx: unknown, claims: { customerId: string }) => Promise<unknown>) =>
    (req: HttpRequest, ctx: unknown) => h(req, ctx, { customerId: 'cust-1' }),
}));
vi.mock('../../src/middleware/verifyTechnicianToken.js', () => ({
  verifyTechnicianToken: vi.fn().mockResolvedValue({ uid: 'tech-1' }),
}));

vi.mock('../../src/cosmos/booking-repository.js', () => ({
  bookingRepo: {
    getById: vi.fn(),
    requestAddOn: vi.fn(),
    applyAddOnDecisions: vi.fn(),
  },
}));

vi.mock('../../src/firebase/admin.js', () => ({
  getStorageDownloadUrlWithTtl: vi.fn(),
  checkStorageFileExists: vi.fn(),
}));

import { getBookingHandler } from '../../src/functions/bookings.js';
import { bookingRepo } from '../../src/cosmos/booking-repository.js';
import { getStorageDownloadUrlWithTtl, checkStorageFileExists } from '../../src/firebase/admin.js';
import { GetBookingResponseSchema } from '../../src/schemas/booking.js';

type MockFn = ReturnType<typeof vi.fn>;

const baseBooking = {
  id: 'bk-1',
  customerId: 'cust-1',
  technicianId: 'tech-1',
  status: 'IN_PROGRESS' as const,
  amount: 59900,
  pendingAddOns: [],
  approvedAddOns: [],
};

function req(id: string) {
  const url = `http://localhost/api/v1/bookings/${id}`;
  const r = new HttpRequest({
    url,
    method: 'GET',
    headers: { 'content-type': 'application/json', authorization: 'Bearer tok' },
  });
  Object.assign(r, { params: { id } });
  return r;
}

describe('GET /v1/bookings/{id} — photos + reportSignedUrl projection', () => {
  beforeEach(() => {
    (bookingRepo.getById as MockFn).mockReset();
    (getStorageDownloadUrlWithTtl as MockFn).mockReset();
    (checkStorageFileExists as MockFn).mockReset();
  });

  it('T1 — no photos: omits photos key, reportSignedUrl is null', async () => {
    (bookingRepo.getById as MockFn).mockResolvedValue({ ...baseBooking });
    const res: any = await getBookingHandler(req('bk-1'), {} as any);
    expect(res.status).toBe(200);
    expect(res.jsonBody.photos).toBeUndefined();
    expect(res.jsonBody.reportSignedUrl).toBeNull();
  });

  it('T2 — photos on two stages: signs with 300s TTL', async () => {
    (bookingRepo.getById as MockFn).mockResolvedValue({
      ...baseBooking,
      photos: {
        EN_ROUTE: ['bookings/bk-1/photos/tech-1/EN_ROUTE/1.jpg'],
        REACHED: ['bookings/bk-1/photos/tech-1/REACHED/1.jpg', 'bookings/bk-1/photos/tech-1/REACHED/2.jpg'],
      },
    });
    (getStorageDownloadUrlWithTtl as MockFn).mockImplementation(async (path: string) =>
      `https://storage.example/${path}?Expires=999`,
    );

    const res: any = await getBookingHandler(req('bk-1'), {} as any);

    expect(res.status).toBe(200);
    expect(res.jsonBody.photos.EN_ROUTE.urls).toHaveLength(1);
    expect(res.jsonBody.photos.REACHED.urls).toHaveLength(2);

    // Every call must have used ttlSeconds=300
    const ttlArgs = (getStorageDownloadUrlWithTtl as MockFn).mock.calls.map((call) => call[1]);
    expect(ttlArgs.every((arg) => arg === 300)).toBe(true);
  });

  it('T3 — sign failure for one photo: filter, do not fail request', async () => {
    (bookingRepo.getById as MockFn).mockResolvedValue({
      ...baseBooking,
      photos: { EN_ROUTE: ['p1', 'p2', 'p3'] },
    });
    (getStorageDownloadUrlWithTtl as MockFn).mockImplementation(async (path: string) => {
      if (path === 'p2') throw new Error('sign failed');
      return `https://storage.example/${path}`;
    });

    const res: any = await getBookingHandler(req('bk-1'), {} as any);

    expect(res.status).toBe(200);
    expect(res.jsonBody.photos.EN_ROUTE.urls).toHaveLength(2);
    expect(res.jsonBody.photos.EN_ROUTE.urls).not.toContain('p2');
  });

  it('T4 — COMPLETED + report exists: reportSignedUrl is non-null', async () => {
    (bookingRepo.getById as MockFn).mockResolvedValue({
      ...baseBooking,
      status: 'COMPLETED' as const,
    });
    (checkStorageFileExists as MockFn).mockResolvedValue(true);
    (getStorageDownloadUrlWithTtl as MockFn).mockResolvedValue('https://storage.example/reports/bk-1.pdf?Expires=999');

    const res: any = await getBookingHandler(req('bk-1'), {} as any);

    expect(res.status).toBe(200);
    expect(checkStorageFileExists).toHaveBeenCalledWith('reports/bk-1.pdf');
    expect(getStorageDownloadUrlWithTtl).toHaveBeenCalledWith('reports/bk-1.pdf', 300);
    expect(res.jsonBody.reportSignedUrl).toMatch(/^https:\/\//);
  });

  it('T5 — COMPLETED + report NOT found: reportSignedUrl is null', async () => {
    (bookingRepo.getById as MockFn).mockResolvedValue({
      ...baseBooking,
      status: 'COMPLETED' as const,
    });
    (checkStorageFileExists as MockFn).mockResolvedValue(false);

    const res: any = await getBookingHandler(req('bk-1'), {} as any);

    expect(res.status).toBe(200);
    expect(checkStorageFileExists).toHaveBeenCalledWith('reports/bk-1.pdf');
    expect(getStorageDownloadUrlWithTtl).not.toHaveBeenCalledWith('reports/bk-1.pdf', expect.any(Number));
    expect(res.jsonBody.reportSignedUrl).toBeNull();
  });

  it('T6 — IN_PROGRESS: no existence check, reportSignedUrl null', async () => {
    (bookingRepo.getById as MockFn).mockResolvedValue({ ...baseBooking });

    const res: any = await getBookingHandler(req('bk-1'), {} as any);

    expect(res.status).toBe(200);
    expect(checkStorageFileExists).not.toHaveBeenCalled();
    expect(res.jsonBody.reportSignedUrl).toBeNull();
  });

  it('T7 — response validates against GetBookingResponseSchema', async () => {
    (bookingRepo.getById as MockFn).mockResolvedValue({
      ...baseBooking,
      status: 'COMPLETED' as const,
      finalAmount: 75000,
      photos: { IN_PROGRESS: ['p1'] },
    });
    (getStorageDownloadUrlWithTtl as MockFn).mockResolvedValue('https://storage.example/p1?Expires=999');
    (checkStorageFileExists as MockFn).mockResolvedValue(true);

    const res: any = await getBookingHandler(req('bk-1'), {} as any);
    const parsed = GetBookingResponseSchema.safeParse(res.jsonBody);
    expect(parsed.success).toBe(true);
  });

  it('T8 — 403 when customerId mismatch', async () => {
    (bookingRepo.getById as MockFn).mockResolvedValue({ ...baseBooking, customerId: 'other' });
    const res: any = await getBookingHandler(req('bk-1'), {} as any);
    expect(res.status).toBe(403);
  });

  it('T9 — 404 when booking not found', async () => {
    (bookingRepo.getById as MockFn).mockResolvedValue(null);
    const res: any = await getBookingHandler(req('bk-1'), {} as any);
    expect(res.status).toBe(404);
  });
});
