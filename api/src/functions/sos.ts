import { randomUUID } from 'node:crypto';
import type { HttpHandler } from '@azure/functions';
import { app } from '@azure/functions';
import { requireCustomer } from '../middleware/requireCustomer.js';
import type { CustomerHttpHandler } from '../middleware/requireCustomer.js';
import { bookingRepo } from '../cosmos/booking-repository.js';
import { sendOwnerSosAlert } from '../services/fcm.service.js';
import { appendAuditEntry } from '../cosmos/audit-log-repository.js';
import type { AuditLogDoc } from '../schemas/audit-log.js';

const sosInner: CustomerHttpHandler = async (req, ctx, customer) => {
  const bookingId = (req as unknown as { params: { bookingId: string } }).params.bookingId;

  const booking = await bookingRepo.getById(bookingId);
  if (!booking) return { status: 404, jsonBody: { code: 'BOOKING_NOT_FOUND' } };
  if (booking.customerId !== customer.customerId) return { status: 403, jsonBody: { code: 'FORBIDDEN' } };
  if (booking.status !== 'IN_PROGRESS') return { status: 409, jsonBody: { code: 'BOOKING_NOT_IN_PROGRESS' } };
  if (booking.sosActivatedAt) return { status: 200, jsonBody: { code: 'ALREADY_PROCESSED' } };

  await bookingRepo.markSosActivated(bookingId);

  const now = new Date().toISOString();
  const auditEntry: AuditLogDoc = {
    id: randomUUID(),
    adminId: customer.customerId,
    role: 'system',
    action: 'SOS_TRIGGERED',
    resourceType: 'booking',
    resourceId: bookingId,
    payload: { technicianId: booking.technicianId ?? '', slotAddress: booking.addressText },
    timestamp: now,
    partitionKey: now.slice(0, 7),
  };

  sendOwnerSosAlert({
    bookingId,
    customerId: customer.customerId,
    technicianId: booking.technicianId ?? '',
    slotAddress: booking.addressText,
  }).catch((err: unknown) => ctx.error('FCM SOS_ALERT failed', err));

  appendAuditEntry(auditEntry).catch((err: unknown) => ctx.error('Audit SOS_TRIGGERED failed', err));

  return { status: 201 };
};

export const sosHandler: HttpHandler = requireCustomer(sosInner);

app.http('sos', {
  methods: ['POST'],
  route: 'v1/sos/{bookingId}',
  authLevel: 'anonymous',
  handler: sosHandler,
});
