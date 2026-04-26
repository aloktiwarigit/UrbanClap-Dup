import { app } from '@azure/functions';
import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { verifyFirebaseIdToken } from '../../services/firebaseAdmin.js';
import { bookingRepo } from '../../cosmos/booking-repository.js';
import { queryComplaintsByBookingAndParty } from '../../cosmos/complaints-repository.js';
import type { PartnerComplaintResponse } from '../../schemas/complaint.js';

export async function partnerGetComplaintsHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
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

  const bookingId = req.params['bookingId'] ?? '';
  const booking = await bookingRepo.getById(bookingId);
  if (!booking) return { status: 404, jsonBody: { code: 'BOOKING_NOT_FOUND' } };
  const isCustomer = booking.customerId === uid;
  const isTechnician = booking.technicianId === uid;
  if (!isCustomer && !isTechnician) {
    return { status: 403, jsonBody: { code: 'FORBIDDEN' } };
  }

  const filedBy = isCustomer ? 'CUSTOMER' as const : 'TECHNICIAN' as const;
  const docs = await queryComplaintsByBookingAndParty(bookingId, uid, filedBy);
  const complaints: PartnerComplaintResponse[] = docs.map(doc => ({
    id: doc.id,
    status: doc.status,
    filedBy: doc.filedBy,
    reasonCode: doc.reasonCode,
    acknowledgeDeadlineAt: doc.acknowledgeDeadlineAt,
    slaDeadlineAt: doc.slaDeadlineAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }));
  return { status: 200, jsonBody: { complaints } };
}

app.http('partnerGetComplaints', {
  methods: ['GET'],
  route: 'v1/complaints/{bookingId}',
  authLevel: 'anonymous',
  handler: partnerGetComplaintsHandler,
});
