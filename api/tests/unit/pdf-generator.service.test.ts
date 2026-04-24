import { describe, it, expect } from 'vitest';
import { generateServiceReportPdf } from '../../src/services/pdf-generator.service.js';
import type { ReportData, PhotoSet } from '../../src/schemas/report.js';

const report: ReportData = {
  bookingId: 'bk-test', serviceName: 'AC Deep Clean', categoryId: 'ac-repair',
  completedAt: '2026-04-24T11:00:00.000Z', warrantyExpiresAt: '2026-05-01T11:00:00.000Z',
  nextServiceRecommendation: 'Schedule next AC service in 3 months.',
  technician: { id: 'tech-1', name: 'Ravi Kumar', rating: 4.8 },
  customer: { email: 'priya@example.com', displayName: 'Priya Sharma' },
  priceBreakdown: { baseAmount: 59900, approvedAddOns: [{ name: 'Gas Refill', price: 14900 }], finalAmount: 74900 },
};

describe('generateServiceReportPdf', () => {
  it('returns a Buffer that starts with PDF magic bytes', async () => {
    const result = await generateServiceReportPdf(report, []);
    expect(Buffer.isBuffer(result)).toBe(true);
    expect(result.slice(0, 5).toString()).toBe('%PDF-');
  });

  it('generates a non-trivially sized output', async () => {
    const result = await generateServiceReportPdf(report, []);
    expect(result.length).toBeGreaterThan(1000);
  });

  it('completes without error when photoSets is empty', async () => {
    const photoSets: PhotoSet[] = [];
    await expect(generateServiceReportPdf(report, photoSets)).resolves.toBeTruthy();
  });
});
