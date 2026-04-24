import PDFDocument from 'pdfkit';
import type { ReportData, PhotoSet } from '../schemas/report.js';

function paise(n: number): string { return `₹${(n / 100).toFixed(2)}`; }
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium' });
}

export function generateServiceReportPdf(report: ReportData, photoSets: PhotoSet[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(22).font('Helvetica-Bold').text('Service Report', { align: 'center' });
    doc.fontSize(10).font('Helvetica').fillColor('#666')
       .text(`Booking ID: ${report.bookingId}`, { align: 'center' }).fillColor('#000').moveDown();

    doc.fontSize(14).font('Helvetica-Bold').text('Service Details');
    doc.fontSize(11).font('Helvetica')
       .text(`Service: ${report.serviceName}`)
       .text(`Completed: ${fmtDate(report.completedAt)}`).moveDown();

    doc.fontSize(14).font('Helvetica-Bold').text('Technician');
    doc.fontSize(11).font('Helvetica').text(`Name: ${report.technician.name}`);
    if (report.technician.rating > 0) doc.text(`Rating: ${report.technician.rating.toFixed(1)} / 5.0`);
    doc.moveDown();

    doc.fontSize(14).font('Helvetica-Bold').text('Price Breakdown');
    doc.fontSize(11).font('Helvetica').text(`Base: ${paise(report.priceBreakdown.baseAmount)}`);
    for (const a of report.priceBreakdown.approvedAddOns) doc.text(`${a.name}: +${paise(a.price)}`);
    doc.font('Helvetica-Bold').text(`Total: ${paise(report.priceBreakdown.finalAmount)}`);
    doc.font('Helvetica').moveDown();

    doc.fontSize(14).font('Helvetica-Bold').text('Warranty');
    doc.fontSize(11).font('Helvetica').text(`Valid until: ${fmtDate(report.warrantyExpiresAt)}`).moveDown();

    doc.fontSize(14).font('Helvetica-Bold').text('Next Service Recommendation');
    doc.fontSize(11).font('Helvetica').text(report.nextServiceRecommendation).moveDown();

    if (photoSets.length > 0) {
      doc.fontSize(14).font('Helvetica-Bold').text('Job Photos').moveDown(0.5);
      for (const set of photoSets) {
        doc.fontSize(12).font('Helvetica-Bold').text(set.stage.replace(/_/g, ' '), { underline: true });
        for (const buf of set.photos) {
          try { doc.image(buf, { fit: [450, 280], align: 'center' }).moveDown(0.5); } catch { /* skip malformed */ }
        }
        doc.moveDown();
      }
    }

    doc.fontSize(9).fillColor('#999')
       .text('Thank you for choosing HomeServices.', { align: 'center' });
    doc.end();
  });
}
