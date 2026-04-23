import {
  type HttpRequest,
  type HttpResponseInit,
  type InvocationContext,
  app,
} from '@azure/functions';
import { z } from 'zod';
import { bookingRepo } from '../cosmos/booking-repository.js';
import { verifyTechnicianToken } from '../middleware/verifyTechnicianToken.js';

const PHOTO_STAGES = ['EN_ROUTE', 'REACHED', 'IN_PROGRESS', 'COMPLETED'] as const;

const RecordPhotoBodySchema = z.object({
  stage: z.enum(PHOTO_STAGES),
  photoUrl: z.string().url(),
});

export const activeJobPhotosHandler = async (
  req: HttpRequest,
  _ctx: InvocationContext,
): Promise<HttpResponseInit> => {
  let uid: string;
  try {
    const decoded = await verifyTechnicianToken(req);
    uid = decoded.uid;
  } catch {
    return { status: 401, jsonBody: { error: 'Unauthorized' } };
  }

  const bookingId = req.params['bookingId'];
  if (!bookingId) {
    return { status: 400, jsonBody: { error: 'Missing bookingId' } };
  }

  const rawBody = await req.json().catch(() => null);
  const parseResult = RecordPhotoBodySchema.safeParse(rawBody);
  if (!parseResult.success) {
    return {
      status: 400,
      jsonBody: { error: 'Validation failed', issues: parseResult.error.issues },
    };
  }

  const { stage, photoUrl } = parseResult.data;

  const booking = await bookingRepo.getById(bookingId);
  if (!booking) {
    return { status: 404, jsonBody: { error: 'Booking not found' } };
  }
  if (booking.technicianId !== uid) {
    return { status: 403, jsonBody: { error: 'Forbidden' } };
  }

  const updated = await bookingRepo.addPhoto(bookingId, stage, photoUrl);
  return { status: 200, jsonBody: { ok: true, photos: updated?.photos } };
};

app.http('activeJobPhotos', {
  route: 'v1/technicians/active-job/{bookingId}/photos',
  methods: ['POST'],
  handler: activeJobPhotosHandler,
});
