import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { InvocationContext } from '@azure/functions';

vi.mock('../../src/services/report-data.service.js');
vi.mock('../../src/services/pdf-generator.service.js');
vi.mock('../../src/services/acs-email.service.js');
vi.mock('../../src/firebase/admin.js');

import { generateAndSendReport } from '../../src/functions/trigger-service-report.js';
import { assembleReportData } from '../../src/services/report-data.service.js';
import { generateServiceReportPdf } from '../../src/services/pdf-generator.service.js';
import { sendServiceReportEmail } from '../../src/services/acs-email.service.js';
import { checkStorageFileExists, uploadBufferToStorage, downloadStorageFile }
  from '../../src/firebase/admin.js';

const ctx = { log: vi.fn() } as unknown as InvocationContext;

const completed = {
  id: 'bk-1', customerId: 'c-1', technicianId: 'tech-1', serviceId: 'ac-deep-clean',
  categoryId: 'ac-repair', slotDate: '2026-04-24', slotWindow: '09:00-11:00',
  addressText: '123 Main', addressLatLng: { lat: 12.9, lng: 77.6 },
  status: 'COMPLETED', paymentOrderId: 'o-1', paymentId: 'p-1', paymentSignature: 's-1',
  amount: 59900, createdAt: '2026-04-24T09:00:00.000Z', completedAt: '2026-04-24T11:00:00.000Z',
};

const reportData = {
  bookingId: 'bk-1', serviceName: 'AC Deep Clean', categoryId: 'ac-repair',
  completedAt: '2026-04-24T11:00:00.000Z', warrantyExpiresAt: '2026-05-01T11:00:00.000Z',
  nextServiceRecommendation: 'x',
  technician: { id: 'tech-1', name: 'Ravi', rating: 4.8 },
  customer: { email: 'p@example.com', displayName: 'Priya' },
  priceBreakdown: { baseAmount: 59900, approvedAddOns: [], finalAmount: 59900 },
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(checkStorageFileExists).mockResolvedValue(false);
  vi.mocked(assembleReportData).mockResolvedValue(reportData);
  vi.mocked(generateServiceReportPdf).mockResolvedValue(Buffer.from('%PDF-fake'));
  vi.mocked(uploadBufferToStorage).mockResolvedValue(undefined);
  vi.mocked(sendServiceReportEmail).mockResolvedValue(undefined);
  vi.mocked(downloadStorageFile).mockResolvedValue(Buffer.alloc(0));
});

describe('generateAndSendReport', () => {
  it('skips non-COMPLETED documents', async () => {
    await generateAndSendReport({ ...completed, status: 'IN_PROGRESS' }, ctx);
    expect(checkStorageFileExists).not.toHaveBeenCalled();
  });

  it('skips COMPLETED booking with no technicianId', async () => {
    await generateAndSendReport({ ...completed, technicianId: undefined }, ctx);
    expect(checkStorageFileExists).not.toHaveBeenCalled();
  });

  it('skips if report already exists in Firebase Storage', async () => {
    vi.mocked(checkStorageFileExists).mockResolvedValue(true);
    await generateAndSendReport(completed, ctx);
    expect(assembleReportData).not.toHaveBeenCalled();
  });

  it('generates PDF, uploads to Storage, and sends email on success', async () => {
    await generateAndSendReport(completed, ctx);
    expect(generateServiceReportPdf).toHaveBeenCalled();
    expect(uploadBufferToStorage).toHaveBeenCalledWith(
      'reports/bk-1/service-report.pdf', expect.any(Buffer), 'application/pdf',
    );
    expect(sendServiceReportEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'p@example.com', bookingId: 'bk-1' }),
    );
  });

  it('skips email when customer.email is empty', async () => {
    vi.mocked(assembleReportData).mockResolvedValue(
      { ...reportData, customer: { email: '', displayName: 'Priya' } },
    );
    await generateAndSendReport(completed, ctx);
    expect(uploadBufferToStorage).toHaveBeenCalled();
    expect(sendServiceReportEmail).not.toHaveBeenCalled();
  });

  it('isolates errors — does not throw on assembleReportData failure', async () => {
    vi.mocked(assembleReportData).mockRejectedValue(new Error('Cosmos down'));
    await expect(generateAndSendReport(completed, ctx)).resolves.toBeUndefined();
  });

  it('downloads photo bytes for booking.photos paths', async () => {
    const withPhotos = {
      ...completed,
      photos: { IN_PROGRESS: ['bookings/bk-1/photos/tech-1/IN_PROGRESS/1.jpg'] },
    };
    await generateAndSendReport(withPhotos, ctx);
    expect(downloadStorageFile).toHaveBeenCalledWith('bookings/bk-1/photos/tech-1/IN_PROGRESS/1.jpg');
  });
});
