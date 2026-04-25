import { EmailClient } from '@azure/communication-email';

export interface ServiceReportEmailParams {
  to: string;
  customerName: string;
  bookingId: string;
  pdfBuffer: Buffer;
}

export async function sendServiceReportEmail(params: ServiceReportEmailParams): Promise<void> {
  const conn = process.env['ACS_CONNECTION_STRING'];
  const sender = process.env['ACS_SENDER_ADDRESS'];
  if (!conn) throw new Error('Missing ACS_CONNECTION_STRING');
  if (!sender) throw new Error('Missing ACS_SENDER_ADDRESS');
  const poller = await new EmailClient(conn).beginSend({
    senderAddress: sender,
    recipients: { to: [{ address: params.to, displayName: params.customerName }] },
    content: {
      subject: `Your Service Report — Booking ${params.bookingId}`,
      plainText: `Dear ${params.customerName},\n\nPlease find your service report attached.\n\nThank you for using HomeServices!`,
      html: `<p>Dear ${params.customerName},</p><p>Please find your service report attached.</p><p>Thank you for using HomeServices!</p>`,
    },
    attachments: [{
      name: `service-report-${params.bookingId}.pdf`,
      contentType: 'application/pdf',
      contentInBase64: params.pdfBuffer.toString('base64'),
    }],
  });
  await poller.pollUntilDone();
}
