import { app } from '@azure/functions';
import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { verifyFirebaseIdToken } from '../../services/firebaseAdmin.js';
import { bookingRepo } from '../../cosmos/booking-repository.js';
import { createComplaint, getComplaint, replaceComplaint } from '../../cosmos/complaints-repository.js';
import { sendOwnerComplaintFiled } from '../../services/fcm.service.js';
import {
  CreateComplaintByPartnerBodySchema,
  CustomerReasonCodeEnum,
  TechnicianReasonCodeEnum,
} from '../../schemas/complaint.js';
import type { ComplaintDoc, PartnerComplaintResponse } from '../../schemas/complaint.js';

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

  const complaintId = `${data.bookingId}-complaint-${filedBy.toLowerCase()}`;
  const existing = await getComplaint(complaintId);
  if (existing && existing.doc.status !== 'RESOLVED') {
    return { status: 409, jsonBody: { code: 'COMPLAINT_ALREADY_FILED' } };
  }

  const now = new Date();
  const doc: ComplaintDoc = {
    id: complaintId,
    orderId: data.bookingId,
    customerId: booking.customerId,
    technicianId: booking.technicianId ?? '',
    description: data.description,
    status: 'NEW',
    internalNotes: [],
    slaDeadlineAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    acknowledgeDeadlineAt: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
    escalated: false,
    ackBreached: false,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    filedBy,
    reasonCode: data.reasonCode,
    ...(data.photoStoragePath ? { photoStoragePath: data.photoStoragePath } : {}),
  };

  if (existing) {
    // Refile after RESOLVED — replace atomically using etag so a concurrent refile loses
    try {
      await replaceComplaint(doc, existing.etag);
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && (err as { code?: number }).code === 412) {
        return { status: 409, jsonBody: { code: 'COMPLAINT_ALREADY_FILED' } };
      }
      throw err;
    }
  } else {
    // First filing — create; 409 means a concurrent request beat us to it
    try {
      await createComplaint(doc);
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && (err as { code?: number }).code === 409) {
        return { status: 409, jsonBody: { code: 'COMPLAINT_ALREADY_FILED' } };
      }
      throw err;
    }
  }

  sendOwnerComplaintFiled({ bookingId: data.bookingId, filedBy, reasonCode: data.reasonCode })
    .catch((err: unknown) => ctx.error('sendOwnerComplaintFiled failed', err));

  const response: PartnerComplaintResponse = {
    id: doc.id,
    status: doc.status,
    filedBy: doc.filedBy,
    reasonCode: doc.reasonCode,
    acknowledgeDeadlineAt: doc.acknowledgeDeadlineAt,
    slaDeadlineAt: doc.slaDeadlineAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
  return { status: 201, jsonBody: response };
}

app.http('partnerCreateComplaint', {
  methods: ['POST'],
  route: 'v1/complaints',
  authLevel: 'anonymous',
  handler: partnerCreateComplaintHandler,
});
