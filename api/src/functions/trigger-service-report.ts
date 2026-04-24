import '../bootstrap.js';
import { app } from '@azure/functions';
import type { InvocationContext } from '@azure/functions';
import * as Sentry from '@sentry/node';
import { BookingDocSchema } from '../schemas/booking.js';
import { assembleReportData } from '../services/report-data.service.js';
import { generateServiceReportPdf } from '../services/pdf-generator.service.js';
import { sendServiceReportEmail } from '../services/acs-email.service.js';
import { checkStorageFileExists, uploadBufferToStorage, downloadStorageFile }
  from '../firebase/admin.js';
import type { PhotoSet } from '../schemas/report.js';

const DB_NAME = process.env['COSMOS_DATABASE'] ?? 'homeservices';

async function downloadPhotoSets(photos: Record<string, string[]>): Promise<PhotoSet[]> {
  const sets = await Promise.all(
    Object.entries(photos).map(async ([stage, paths]) => ({
      stage,
      photos: (await Promise.all(
        paths.map(p => downloadStorageFile(p).catch(() => Buffer.alloc(0))),
      )).filter(b => b.length > 0),
    })),
  );
  return sets.filter(s => s.photos.length > 0);
}

export async function generateAndSendReport(
  bookingRaw: unknown,
  ctx: InvocationContext,
): Promise<void> {
  const parsed = BookingDocSchema.safeParse(bookingRaw);
  if (!parsed.success || parsed.data.status !== 'COMPLETED') return;

  const booking = parsed.data;
  if (!booking.technicianId) { ctx.log(`no technicianId on ${booking.id}`); return; }

  const reportPath = `reports/${booking.id}/service-report.pdf`;
  if (await checkStorageFileExists(reportPath)) {
    ctx.log(`report already exists for ${booking.id} — skipping`);
    return;
  }

  try {
    const [reportData, photoSets] = await Promise.all([
      assembleReportData(booking),
      downloadPhotoSets(booking.photos ?? {}),
    ]);
    const pdfBuffer = await generateServiceReportPdf(reportData, photoSets);
    await uploadBufferToStorage(reportPath, pdfBuffer, 'application/pdf');
    if (reportData.customer.email) {
      await sendServiceReportEmail({
        to: reportData.customer.email,
        customerName: reportData.customer.displayName,
        bookingId: booking.id,
        pdfBuffer,
      });
    }
    ctx.log(`report generated for ${booking.id}`);
  } catch (err: unknown) {
    Sentry.captureException(err);
    ctx.log(`ERROR ${booking.id}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

app.cosmosDB('triggerServiceReport', {
  connection: 'COSMOS_CONNECTION_STRING',
  databaseName: DB_NAME,
  containerName: 'bookings',
  leaseContainerName: 'booking_report_leases',
  createLeaseContainerIfNotExists: true,
  startFromBeginning: false,
  handler: async (docs: unknown[], context: InvocationContext): Promise<void> => {
    for (const doc of docs) await generateAndSendReport(doc, context);
  },
});
