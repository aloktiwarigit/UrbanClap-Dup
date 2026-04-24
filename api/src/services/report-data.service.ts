import { getAuth } from 'firebase-admin/auth';
import { getTechnicianForReport } from '../cosmos/technician-repository.js';
import { catalogueRepo } from '../cosmos/catalogue-repository.js';
import type { BookingDoc } from '../schemas/booking.js';
import type { ReportData } from '../schemas/report.js';

const NEXT_SERVICE_RECS: Record<string, string> = {
  'ac-repair': 'Schedule your next AC service in 3 months to maintain cooling efficiency.',
  'deep-cleaning': 'Book your next deep clean in 6 months for a healthy home.',
  'plumbing': 'An annual plumbing inspection is recommended to prevent leaks.',
  'electrical': 'Schedule an annual electrical safety check for peace of mind.',
  'pest-control': 'A follow-up pest treatment in 3 months ensures lasting protection.',
};

export async function assembleReportData(booking: BookingDoc): Promise<ReportData> {
  const completedAt = booking.completedAt ?? new Date().toISOString();
  const warrantyExpiresAt = new Date(
    new Date(completedAt).getTime() + 7 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const [tech, service, userRecord] = await Promise.all([
    getTechnicianForReport(booking.technicianId!),
    catalogueRepo.getServiceByIdCrossPartition(booking.serviceId),
    // Wrap getUser so a deleted or not-yet-provisioned Auth record degrades gracefully
    // rather than aborting the entire report assembly via Promise.all rejection.
    getAuth().getUser(booking.customerId).catch(() => null),
  ]);

  return {
    bookingId: booking.id,
    serviceName: service?.name ?? 'Home Service',
    categoryId: booking.categoryId,
    completedAt,
    warrantyExpiresAt,
    nextServiceRecommendation:
      NEXT_SERVICE_RECS[booking.categoryId] ?? 'Regular maintenance ensures best results.',
    technician: {
      id: booking.technicianId!,
      name: tech?.displayName ?? 'Your Technician',
      rating: tech?.rating ?? 0,
    },
    customer: {
      email: userRecord?.email ?? '',
      displayName: userRecord?.displayName ?? 'Valued Customer',
    },
    priceBreakdown: {
      baseAmount: booking.amount,
      approvedAddOns: (booking.approvedAddOns ?? []).map(a => ({ name: a.name, price: a.price })),
      finalAmount: booking.finalAmount ?? booking.amount,
    },
  };
}
