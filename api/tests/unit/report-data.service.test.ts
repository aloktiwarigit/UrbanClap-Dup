import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetUser = vi.fn();
vi.mock('firebase-admin/auth', () => ({ getAuth: () => ({ getUser: mockGetUser }) }));
vi.mock('../../src/cosmos/technician-repository.js', () => ({
  getTechnicianForReport: vi.fn(),
}));
vi.mock('../../src/cosmos/catalogue-repository.js', () => ({
  catalogueRepo: { getServiceByIdCrossPartition: vi.fn() },
}));

import { assembleReportData } from '../../src/services/report-data.service.js';
import { getTechnicianForReport } from '../../src/cosmos/technician-repository.js';
import { catalogueRepo } from '../../src/cosmos/catalogue-repository.js';

const baseBooking = {
  id: 'bk-1', customerId: 'cust-1', technicianId: 'tech-1',
  serviceId: 'ac-deep-clean', categoryId: 'ac-repair',
  slotDate: '2026-04-24', slotWindow: '09:00-11:00',
  addressText: '123 Main', addressLatLng: { lat: 12.9, lng: 77.6 },
  status: 'COMPLETED' as const, paymentOrderId: 'order-1',
  paymentId: 'pay-1', paymentSignature: 'sig-1', amount: 59900,
  createdAt: '2026-04-24T09:00:00.000Z', completedAt: '2026-04-24T11:00:00.000Z',
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getTechnicianForReport).mockResolvedValue({ displayName: 'Ravi Kumar', rating: 4.8 });
  vi.mocked(catalogueRepo.getServiceByIdCrossPartition).mockResolvedValue({
    id: 'ac-deep-clean', name: 'AC Deep Clean', categoryId: 'ac-repair',
    shortDescription: '', heroImageUrl: '', basePrice: 59900, commissionBps: 2250,
    durationMinutes: 90, includes: [], faq: [], addOns: [], photoStages: [],
    isActive: true, updatedBy: 'seed', createdAt: '', updatedAt: '',
  });
  mockGetUser.mockResolvedValue(
    { email: 'customer@example.com', displayName: 'Priya Sharma' } as any,
  );
});

describe('assembleReportData', () => {
  it('maps core fields: bookingId, serviceName, technician, customer', async () => {
    const report = await assembleReportData(baseBooking);
    expect(report.bookingId).toBe('bk-1');
    expect(report.serviceName).toBe('AC Deep Clean');
    expect(report.technician.name).toBe('Ravi Kumar');
    expect(report.technician.rating).toBe(4.8);
    expect(report.customer.email).toBe('customer@example.com');
  });

  it('sets warrantyExpiresAt to completedAt + 7 days', async () => {
    const report = await assembleReportData(baseBooking);
    const expected = new Date('2026-04-24T11:00:00.000Z').getTime() + 7 * 24 * 60 * 60 * 1000;
    expect(new Date(report.warrantyExpiresAt).getTime()).toBe(expected);
  });

  it('uses finalAmount + approvedAddOns when present', async () => {
    const booking = {
      ...baseBooking, finalAmount: 74900,
      approvedAddOns: [{ name: 'Gas Refill', price: 14900, triggerDescription: 'low' }],
    };
    const report = await assembleReportData(booking);
    expect(report.priceBreakdown.finalAmount).toBe(74900);
    expect(report.priceBreakdown.approvedAddOns).toEqual([{ name: 'Gas Refill', price: 14900 }]);
  });

  it('falls back to amount when finalAmount absent', async () => {
    const report = await assembleReportData(baseBooking);
    expect(report.priceBreakdown.finalAmount).toBe(59900);
    expect(report.priceBreakdown.approvedAddOns).toHaveLength(0);
  });

  it('falls back to current time when completedAt missing', async () => {
    const before = Date.now();
    const report = await assembleReportData({ ...baseBooking, completedAt: undefined });
    expect(new Date(report.completedAt).getTime()).toBeGreaterThanOrEqual(before);
  });

  it('returns next-service recommendation for known category', async () => {
    const report = await assembleReportData(baseBooking);
    expect(report.nextServiceRecommendation).toContain('3 months');
  });
});
