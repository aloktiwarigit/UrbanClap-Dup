import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/cosmos/user-data-export-reads.js', () => ({
  userDataExportReads: {
    listBookingsForUser: vi.fn(),
    listRatingsForUser: vi.fn(),
    listComplaintsForUser: vi.fn(),
    listWalletLedgerForTechnician: vi.fn().mockResolvedValue([]),
    listBookingEventsForUser: vi.fn().mockResolvedValue([]),
    listDispatchAttemptsForUser: vi.fn().mockResolvedValue([]),
    readTechnicianFullDoc: vi.fn().mockResolvedValue({ profile: null, kyc: null, fcmToken: null }),
    listAuditLogForUser: vi.fn().mockResolvedValue([]),
  },
}));

type MockFn = ReturnType<typeof vi.fn>;

const aBooking = (over: Record<string, unknown> = {}) => ({
  id: 'bk-1',
  customerId: 'cust-1',
  technicianId: 'tech-9',
  serviceId: 'svc-1',
  categoryId: 'cat-1',
  slotDate: '2026-05-01',
  slotWindow: '10:00-12:00',
  addressText: '12 Main St',
  addressLatLng: { lat: 12.9, lng: 77.6 },
  status: 'CLOSED',
  paymentOrderId: 'o-1',
  paymentId: 'p-1',
  paymentSignature: 's-1',
  amount: 50000,
  createdAt: '2026-04-15T10:00:00.000Z',
  ...over,
});

const aRating = (over: Record<string, unknown> = {}) => ({
  id: 'r-1',
  bookingId: 'bk-1',
  customerId: 'cust-1',
  technicianId: 'tech-9',
  customerOverall: 5,
  customerSubScores: { punctuality: 5, skill: 5, behaviour: 5 },
  customerComment: 'great service',
  customerSubmittedAt: '2026-04-16T00:00:00.000Z',
  techOverall: 4,
  techSubScores: { behaviour: 4, communication: 4 },
  techComment: 'private tech-side note about customer',
  techSubmittedAt: '2026-04-16T00:00:00.000Z',
  ...over,
});

const aComplaint = (filedBy: 'CUSTOMER' | 'TECHNICIAN', over: Record<string, unknown> = {}) => ({
  id: 'c-1',
  orderId: 'bk-1',
  customerId: 'cust-1',
  technicianId: 'tech-9',
  description: filedBy === 'CUSTOMER' ? "customer's verbatim accusation" : "technician's narrative",
  status: 'NEW',
  filedBy,
  reasonCode: 'OTHER',
  photoStoragePath: 'storage/path/secret.jpg',
  internalNotes: [],
  slaDeadlineAt: '2026-04-26T00:00:00.000Z',
  createdAt: '2026-04-25T00:00:00.000Z',
  updatedAt: '2026-04-25T00:00:00.000Z',
  escalated: false,
  ackBreached: false,
  type: 'STANDARD',
  ...over,
});

describe('assembleUserDataExport — privacy projections', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('CUSTOMER caller: booking projection omits technicianId (counterparty leak guard)', async () => {
    const { userDataExportReads } = await import('../../src/cosmos/user-data-export-reads.js');
    (userDataExportReads.listBookingsForUser as MockFn).mockResolvedValue([aBooking()]);
    (userDataExportReads.listRatingsForUser as MockFn).mockResolvedValue([]);
    (userDataExportReads.listComplaintsForUser as MockFn).mockResolvedValue([]);

    const { assembleUserDataExport } = await import('../../src/services/dataExport.service.js');
    const out = await assembleUserDataExport('cust-1', 'CUSTOMER');
    const booking = out.bookings[0]!;
    expect(booking).toHaveProperty('customerId', 'cust-1');
    expect(booking).not.toHaveProperty('technicianId');
  });

  it('TECHNICIAN caller: booking projection omits customerId (counterparty leak guard)', async () => {
    const { userDataExportReads } = await import('../../src/cosmos/user-data-export-reads.js');
    (userDataExportReads.listBookingsForUser as MockFn).mockResolvedValue([aBooking()]);
    (userDataExportReads.listRatingsForUser as MockFn).mockResolvedValue([]);
    (userDataExportReads.listComplaintsForUser as MockFn).mockResolvedValue([]);

    const { assembleUserDataExport } = await import('../../src/services/dataExport.service.js');
    const out = await assembleUserDataExport('tech-9', 'TECHNICIAN');
    const booking = out.bookings[0]!;
    expect(booking).toHaveProperty('technicianId', 'tech-9');
    expect(booking).not.toHaveProperty('customerId');
  });

  it('CUSTOMER caller: rating projection includes customer side, omits tech side comment', async () => {
    const { userDataExportReads } = await import('../../src/cosmos/user-data-export-reads.js');
    (userDataExportReads.listBookingsForUser as MockFn).mockResolvedValue([]);
    (userDataExportReads.listRatingsForUser as MockFn).mockResolvedValue([aRating()]);
    (userDataExportReads.listComplaintsForUser as MockFn).mockResolvedValue([]);

    const { assembleUserDataExport } = await import('../../src/services/dataExport.service.js');
    const out = await assembleUserDataExport('cust-1', 'CUSTOMER');
    const r = out.ratings[0]!;
    expect(r).toHaveProperty('customerComment', 'great service');
    expect(r).not.toHaveProperty('techComment');
  });

  it('TECHNICIAN caller: rating projection includes tech side, omits customer side comment', async () => {
    const { userDataExportReads } = await import('../../src/cosmos/user-data-export-reads.js');
    (userDataExportReads.listBookingsForUser as MockFn).mockResolvedValue([]);
    (userDataExportReads.listRatingsForUser as MockFn).mockResolvedValue([aRating()]);
    (userDataExportReads.listComplaintsForUser as MockFn).mockResolvedValue([]);

    const { assembleUserDataExport } = await import('../../src/services/dataExport.service.js');
    const out = await assembleUserDataExport('tech-9', 'TECHNICIAN');
    const r = out.ratings[0]!;
    expect(r).not.toHaveProperty('customerComment');
    expect(r).toHaveProperty('techComment');
  });

  it('CUSTOMER caller: complaint authored by CUSTOMER returns description', async () => {
    const { userDataExportReads } = await import('../../src/cosmos/user-data-export-reads.js');
    (userDataExportReads.listBookingsForUser as MockFn).mockResolvedValue([]);
    (userDataExportReads.listRatingsForUser as MockFn).mockResolvedValue([]);
    (userDataExportReads.listComplaintsForUser as MockFn).mockResolvedValue([aComplaint('CUSTOMER')]);

    const { assembleUserDataExport } = await import('../../src/services/dataExport.service.js');
    const out = await assembleUserDataExport('cust-1', 'CUSTOMER');
    const c = out.complaints[0]!;
    expect(c).toHaveProperty('description', "customer's verbatim accusation");
    expect(c).toHaveProperty('photoStoragePath');
  });

  it('CUSTOMER caller: complaint authored by TECHNICIAN does NOT leak description (P1-1)', async () => {
    const { userDataExportReads } = await import('../../src/cosmos/user-data-export-reads.js');
    (userDataExportReads.listBookingsForUser as MockFn).mockResolvedValue([]);
    (userDataExportReads.listRatingsForUser as MockFn).mockResolvedValue([]);
    (userDataExportReads.listComplaintsForUser as MockFn).mockResolvedValue([
      aComplaint('TECHNICIAN'),
    ]);

    const { assembleUserDataExport } = await import('../../src/services/dataExport.service.js');
    const out = await assembleUserDataExport('cust-1', 'CUSTOMER');
    const c = out.complaints[0]!;
    expect(c).not.toHaveProperty('description');
    expect(c).not.toHaveProperty('photoStoragePath');
    expect(c.filedBy).toBe('TECHNICIAN');
    expect(c.id).toBe('c-1');
  });

  it('TECHNICIAN caller: complaint authored by CUSTOMER does NOT leak description (P1-1, reverse)', async () => {
    const { userDataExportReads } = await import('../../src/cosmos/user-data-export-reads.js');
    (userDataExportReads.listBookingsForUser as MockFn).mockResolvedValue([]);
    (userDataExportReads.listRatingsForUser as MockFn).mockResolvedValue([]);
    (userDataExportReads.listComplaintsForUser as MockFn).mockResolvedValue([
      aComplaint('CUSTOMER'),
    ]);

    const { assembleUserDataExport } = await import('../../src/services/dataExport.service.js');
    const out = await assembleUserDataExport('tech-9', 'TECHNICIAN');
    const c = out.complaints[0]!;
    expect(c).not.toHaveProperty('description');
    expect(c).not.toHaveProperty('photoStoragePath');
  });
});
