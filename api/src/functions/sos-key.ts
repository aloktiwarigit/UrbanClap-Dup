import '../bootstrap.js';
import { randomUUID } from 'node:crypto';
import type { HttpHandler } from '@azure/functions';
import { app } from '@azure/functions';
import { requireCustomer } from '../middleware/requireCustomer.js';
import type { CustomerHttpHandler } from '../middleware/requireCustomer.js';
import { bookingRepo } from '../cosmos/booking-repository.js';
import { putKeyDoc, getKeyDoc } from '../cosmos/sos-incident-key-repository.js';
import { appendAuditEntry } from '../cosmos/audit-log-repository.js';
import type { AuditLogDoc } from '../schemas/audit-log.js';
import { SosKeyUploadRequest } from '../schemas/sos.js';

const sosKeyInner: CustomerHttpHandler = async (req, ctx, customer) => {
  const incidentId = (req as unknown as { params: { incidentId: string } }).params.incidentId;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { status: 400, jsonBody: { code: 'INVALID_JSON' } };
  }

  const parsed = SosKeyUploadRequest.safeParse(raw);
  if (!parsed.success) {
    return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', issues: parsed.error.issues } };
  }

  const { keyB64, ivB64, storagePath } = parsed.data;

  const booking = await bookingRepo.getById(incidentId);
  if (!booking) return { status: 404, jsonBody: { code: 'BOOKING_NOT_FOUND' } };
  if (booking.customerId !== customer.customerId) {
    return { status: 403, jsonBody: { code: 'FORBIDDEN' } };
  }

  if (!booking.sosActivatedAt) {
    return { status: 409, jsonBody: { code: 'SOS_NOT_ACTIVATED' } };
  }

  const canonicalPath = `sos-audio/${customer.customerId}/${incidentId}.enc`;
  if (storagePath !== canonicalPath) {
    return { status: 422, jsonBody: { code: 'INVALID_STORAGE_PATH', expected: canonicalPath } };
  }

  const existing = await getKeyDoc(incidentId, customer.customerId);
  if (existing) {
    return { status: 200, jsonBody: { code: 'ALREADY_PROCESSED' } };
  }

  await putKeyDoc({
    id: incidentId,
    customerId: customer.customerId,
    keyB64,
    ivB64,
    storagePath,
  });

  const now = new Date().toISOString();
  const auditEntry: AuditLogDoc = {
    id: randomUUID(),
    adminId: customer.customerId,
    role: 'system',
    action: 'SOS_KEY_UPLOADED',
    resourceType: 'booking',
    resourceId: incidentId,
    payload: { incidentId, storagePath },
    timestamp: now,
    partitionKey: now.slice(0, 7),
  };
  appendAuditEntry(auditEntry).catch((err: unknown) => ctx.error('Audit SOS_KEY_UPLOADED failed', err));

  return { status: 201 };
};

export const sosKeyHandler: HttpHandler = requireCustomer(sosKeyInner);

app.http('sosKey', {
  methods: ['POST'],
  route: 'v1/sos/{incidentId}/key',
  authLevel: 'anonymous',
  handler: sosKeyHandler,
});
