import { app } from '@azure/functions';
import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { verifyFirebaseIdToken } from '../../services/firebaseAdmin.js';
import { bookingRepo } from '../../cosmos/booking-repository.js';
import { queryComplaintsByBookingAndParty } from '../../cosmos/complaints-repository.js';

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
  if (booking.customerId !== uid && booking.technicianId !== uid) {
    return { status: 403, jsonBody: { code: 'FORBIDDEN' } };
  }

  const complaints = await queryComplaintsByBookingAndParty(bookingId, uid);
  return { status: 200, jsonBody: { complaints } };
}

app.http('partnerGetComplaints', {
  methods: ['GET'],
  route: 'v1/complaints/{bookingId}',
  authLevel: 'anonymous',
  handler: partnerGetComplaintsHandler,
});
