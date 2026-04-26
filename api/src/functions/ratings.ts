import { type HttpHandler, type HttpResponseInit, type InvocationContext, app } from '@azure/functions';
import { verifyFirebaseIdToken } from '../services/firebaseAdmin.js';
import { bookingRepo } from '../cosmos/booking-repository.js';
import { ratingRepo } from '../cosmos/rating-repository.js';
import { SubmitRatingRequestSchema, type GetRatingResponse } from '../schemas/rating.js';
import type { CustomerSubScores, TechSubScores } from '../schemas/rating.js';

async function uidFromAuth(authHeader: string): Promise<string | null> {
  if (!authHeader.startsWith('Bearer ')) return null;
  try {
    const decoded = await verifyFirebaseIdToken(authHeader.slice(7));
    return decoded.uid;
  } catch {
    return null;
  }
}

export const submitRatingHandler: HttpHandler = async (req, _ctx: InvocationContext) => {
  const uid = await uidFromAuth(req.headers.get('authorization') ?? '');
  if (!uid) return { status: 401, jsonBody: { code: 'UNAUTHORIZED' } };

  let body: unknown;
  try { body = await req.json(); } catch { return { status: 400, jsonBody: { code: 'PARSE_ERROR' } }; }
  const parsed = SubmitRatingRequestSchema.safeParse(body);
  if (!parsed.success) {
    return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', issues: parsed.error.issues } };
  }
  const data = parsed.data;

  const booking = await bookingRepo.getById(data.bookingId);
  if (!booking) return { status: 404, jsonBody: { code: 'BOOKING_NOT_FOUND' } };

  const isCustomer = booking.customerId === uid;
  const isTechnician = booking.technicianId === uid;
  if (!isCustomer && !isTechnician) return { status: 403, jsonBody: { code: 'FORBIDDEN' } };
  if (data.side === 'CUSTOMER_TO_TECH' && !isCustomer) return { status: 403, jsonBody: { code: 'FORBIDDEN' } };
  if (data.side === 'TECH_TO_CUSTOMER' && !isTechnician) return { status: 403, jsonBody: { code: 'FORBIDDEN' } };
  if (booking.status !== 'CLOSED') {
    return { status: 409, jsonBody: { code: 'BOOKING_NOT_CLOSED', status: booking.status } };
  }
  if (!booking.technicianId) return { status: 409, jsonBody: { code: 'NO_TECHNICIAN' } };
  // Rating Shield (E07-S02) is advisory — it notifies the owner and starts a 2-hour window,
  // but the customer can always post their rating at any time ("Post anyway" button, or after
  // the timer expires). The shield does NOT block submission here; enforcement is client-side.
  // See docs/stories/E07-S02-rating-shield-escalation.md § AC-4 and AC-5.

  const result = await ratingRepo.submitSide({
    bookingId: data.bookingId,
    customerId: booking.customerId,
    technicianId: booking.technicianId,
    side: data.side,
    overall: data.overall,
    subScores: data.subScores,
    ...(data.comment !== undefined ? { comment: data.comment } : {}),
  });
  if (!result) return { status: 409, jsonBody: { code: 'RATING_ALREADY_SUBMITTED' } };
  return { status: 201, jsonBody: { bookingId: result.bookingId } };
};

type SideProjection =
  | { status: 'PENDING' }
  | { status: 'SUBMITTED'; overall: number; subScores: CustomerSubScores | TechSubScores; submittedAt: string; comment?: string };

function projectSide(
  overall: number | undefined,
  subScores: CustomerSubScores | TechSubScores | undefined,
  comment: string | undefined,
  submittedAt: string | undefined,
  reveal: boolean,
): SideProjection {
  if (!submittedAt || overall === undefined || !subScores) return { status: 'PENDING' };
  if (!reveal) return { status: 'PENDING' };
  return {
    status: 'SUBMITTED',
    overall,
    subScores,
    submittedAt,
    ...(comment !== undefined ? { comment } : {}),
  };
}

export const getRatingHandler: HttpHandler = async (req, _ctx: InvocationContext): Promise<HttpResponseInit> => {
  const uid = await uidFromAuth(req.headers.get('authorization') ?? '');
  if (!uid) return { status: 401, jsonBody: { code: 'UNAUTHORIZED' } };

  const bookingId = (req as unknown as { params: { bookingId: string } }).params.bookingId;
  const booking = await bookingRepo.getById(bookingId);
  if (!booking) return { status: 404, jsonBody: { code: 'BOOKING_NOT_FOUND' } };
  const isCustomer = booking.customerId === uid;
  const isTechnician = booking.technicianId === uid;
  if (!isCustomer && !isTechnician) return { status: 403, jsonBody: { code: 'FORBIDDEN' } };

  const doc = await ratingRepo.getByBookingId(bookingId);
  if (!doc) {
    const empty: GetRatingResponse = {
      bookingId, status: 'PENDING',
      customerSide: { status: 'PENDING' }, techSide: { status: 'PENDING' },
    };
    return { status: 200, jsonBody: empty };
  }

  const customerHas = doc.customerSubmittedAt !== undefined;
  const techHas = doc.techSubmittedAt !== undefined;
  const revealed = customerHas && techHas;
  const status: GetRatingResponse['status'] = revealed
    ? 'REVEALED'
    : (customerHas || techHas ? 'PARTIALLY_SUBMITTED' : 'PENDING');

  const customerVisible = revealed || (isCustomer && customerHas);
  const techVisible = revealed || (isTechnician && techHas);

  const response: GetRatingResponse = {
    bookingId,
    status,
    ...(doc.revealedAt !== undefined ? { revealedAt: doc.revealedAt } : {}),
    customerSide: projectSide(
      doc.customerOverall, doc.customerSubScores, doc.customerComment,
      doc.customerSubmittedAt, customerVisible,
    ),
    techSide: projectSide(
      doc.techOverall, doc.techSubScores, doc.techComment,
      doc.techSubmittedAt, techVisible,
    ),
  };
  return { status: 200, jsonBody: response };
};

app.http('submitRating', { route: 'v1/ratings', methods: ['POST'], handler: submitRatingHandler });
app.http('getRating', { route: 'v1/ratings/{bookingId}', methods: ['GET'], handler: getRatingHandler });
