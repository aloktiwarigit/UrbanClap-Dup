import { app } from '@azure/functions';
import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { verifyFirebaseIdToken } from '../../services/firebaseAdmin.js';
import { bookingRepo } from '../../cosmos/booking-repository.js';
import {
  createComplaint,
  findActiveComplaintByBookingAndParty,
} from '../../cosmos/complaints-repository.js';
import { sendOwnerComplaintFiled } from '../../services/fcm.service.js';
import {
  CreateComplaintByPartnerBodySchema,
  CustomerReasonCodeEnum,
  TechnicianReasonCodeEnum,
} from '../../schemas/complaint.js';
import type { ComplaintDoc } from '../../schemas/complaint.js';
import { randomUUID } from 'crypto';

export async function partnerCreateComplaintHandler(
  req: HttpRequest,
  ctx: InvocationContext,
): Promise<HttpResponseInit> {
  const auth = req.headers.get('authorization') ?? '';
  if (!auth.startsWith('Bearer ')) return { status: 401, jsonBody: { code: 'UNAUTHENTICATED' } };

  let uid: string;
  try {
    const decoded = await verifyFirebaseIdToken(auth.slice(7));
    uid = decoded.uid;
  } catch {
    return { status: 401, jsonBody: { code: 'TOKEN_INVALID' } };
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return { status: 400, jsonBody: { code: 'INVALID_JSON' } };
  }
  const parsed = CreateComplaintByPartnerBodySchema.safeParse(body);
  if (!parsed.success) {
    return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', issues: parsed.error.issues } };
  }
  const data = parsed.data;

  const booking = await bookingRepo.getById(data.bookingId);
  if (!booking) return { status: 404, jsonBody: { code: 'BOOKING_NOT_FOUND' } };

  const isCustomer = booking.customerId === uid;
  const isTechnician = booking.technicianId === uid;
  if (!isCustomer && !isTechnician) return { status: 403, jsonBody: { code: 'FORBIDDEN' } };
  if (booking.status !== 'CLOSED') {
    return { status: 409, jsonBody: { code: 'BOOKING_NOT_ELIGIBLE', status: booking.status } };
  }

  const filedBy = isCustomer ? 'CUSTOMER' as const : 'TECHNICIAN' as const;
  const reasonValid = filedBy === 'CUSTOMER'
    ? CustomerReasonCodeEnum.safeParse(data.reasonCode).success
    : TechnicianReasonCodeEnum.safeParse(data.reasonCode).success;
  if (!reasonValid) return { status: 400, jsonBody: { code: 'INVALID_REASON_CODE' } };

  const existing = await findActiveComplaintByBookingAndParty(data.bookingId, uid);
  if (existing) return { status: 409, jsonBody: { code: 'COMPLAINT_ALREADY_FILED' } };

  const now = new Date();
  const doc: ComplaintDoc = {
    id: randomUUID(),
    orderId: data.bookingId,
    customerId: booking.customerId,
    technicianId: booking.technicianId ?? '',
    description: data.description,
    status: 'NEW',
    internalNotes: [],
    slaDeadlineAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    acknowledgeDeadlineAt: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
    escalated: false,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    filedBy,
    reasonCode: data.reasonCode,
    ...(data.photoStoragePath ? { photoStoragePath: data.photoStoragePath } : {}),
  };

  await createComplaint(doc);

  sendOwnerComplaintFiled({ bookingId: data.bookingId, filedBy, reasonCode: data.reasonCode })
    .catch((err: unknown) => ctx.error('sendOwnerComplaintFiled failed', err));

  return { status: 201, jsonBody: doc };
}

app.http('partnerCreateComplaint', {
  methods: ['POST'],
  route: 'v1/complaints',
  authLevel: 'anonymous',
  handler: partnerCreateComplaintHandler,
});
