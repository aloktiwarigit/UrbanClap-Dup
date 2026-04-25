import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@azure/communication-email', () => {
  const mockPollUntilDone = vi.fn().mockResolvedValue({ status: 'Succeeded' });
  const mockBeginSend = vi.fn().mockResolvedValue({ pollUntilDone: mockPollUntilDone });
  const MockEmailClient = vi.fn().mockImplementation(() => ({ beginSend: mockBeginSend }));
  return { EmailClient: MockEmailClient };
});

import { sendServiceReportEmail } from '../../src/services/acs-email.service.js';
import { EmailClient } from '@azure/communication-email';

const mockBeginSend = vi.fn();
const mockPollUntilDone = vi.fn();

beforeEach(() => {
  mockPollUntilDone.mockResolvedValue({ status: 'Succeeded' });
  mockBeginSend.mockResolvedValue({ pollUntilDone: mockPollUntilDone });
  vi.mocked(EmailClient).mockImplementation(() => ({ beginSend: mockBeginSend }) as unknown as EmailClient);

  process.env['ACS_CONNECTION_STRING'] = 'endpoint=https://test.communication.azure.com;accesskey=abc123';
  process.env['ACS_SENDER_ADDRESS'] = 'DoNotReply@test.azurecomm.net';
});

afterEach(() => {
  delete process.env['ACS_CONNECTION_STRING'];
  delete process.env['ACS_SENDER_ADDRESS'];
  vi.clearAllMocks();
});

describe('sendServiceReportEmail', () => {
  const params = {
    to: 'customer@example.com',
    customerName: 'Priya',
    bookingId: 'bk-42',
    pdfBuffer: Buffer.from('%PDF-1.4 fake'),
  };

  it('creates EmailClient with ACS_CONNECTION_STRING', async () => {
    await sendServiceReportEmail(params);
    expect(EmailClient).toHaveBeenCalledWith(
      'endpoint=https://test.communication.azure.com;accesskey=abc123',
    );
  });

  it('calls beginSend with correct recipient, subject, and attachment', async () => {
    await sendServiceReportEmail(params);
    expect(mockBeginSend).toHaveBeenCalledWith(
      expect.objectContaining({
        senderAddress: 'DoNotReply@test.azurecomm.net',
        recipients: { to: [{ address: 'customer@example.com', displayName: 'Priya' }] },
        content: expect.objectContaining({
          subject: 'Your Service Report — Booking bk-42',
        }),
        attachments: [
          expect.objectContaining({
            name: 'service-report-bk-42.pdf',
            contentType: 'application/pdf',
          }),
        ],
      }),
    );
  });

  it('encodes PDF buffer as base64 in attachment', async () => {
    await sendServiceReportEmail(params);
    const call = mockBeginSend.mock.calls[0]![0]!;
    expect(call.attachments[0].contentInBase64).toBe(params.pdfBuffer.toString('base64'));
  });

  it('calls pollUntilDone to await send completion', async () => {
    await sendServiceReportEmail(params);
    expect(mockPollUntilDone).toHaveBeenCalledOnce();
  });

  it('throws when ACS_CONNECTION_STRING is missing', async () => {
    delete process.env['ACS_CONNECTION_STRING'];
    await expect(sendServiceReportEmail(params)).rejects.toThrow('Missing ACS_CONNECTION_STRING');
  });

  it('throws when ACS_SENDER_ADDRESS is missing', async () => {
    delete process.env['ACS_SENDER_ADDRESS'];
    await expect(sendServiceReportEmail(params)).rejects.toThrow('Missing ACS_SENDER_ADDRESS');
  });
});
