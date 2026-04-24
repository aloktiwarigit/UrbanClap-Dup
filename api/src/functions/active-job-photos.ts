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

// Each booking status maps to exactly one valid photo stage: the next transition target.
// Prevents backfilling evidence photos for stages that haven't occurred yet.
const VALID_PHOTO_STAGE: Partial<Record<string, string>> = {
  ASSIGNED: 'EN_ROUTE',
  EN_ROUTE: 'REACHED',
  REACHED: 'IN_PROGRESS',
  IN_PROGRESS: 'COMPLETED',
};

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

  // Validate that the stage being photographed matches the next expected transition.
  const expectedStage = VALID_PHOTO_STAGE[booking.status];
  if (!expectedStage || stage !== expectedStage) {
    return {
      status: 409,
      jsonBody: { error: `Photo stage '${stage}' is not valid for booking in status '${booking.status}'` },
    };
  }

  try {
    const updated = await bookingRepo.addPhoto(bookingId, stage, photoUrl);
    return { status: 200, jsonBody: { ok: true, photos: updated?.photos } };
  } catch (err: unknown) {
    // Cosmos ETag conflict — another request updated the document between our read and write.
    // Return 409 so the client can retry immediately.
    if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: number }).code === 412) {
      return { status: 409, jsonBody: { error: 'Conflict — please retry' } };
    }
    throw err;
  }
};

app.http('activeJobPhotos', {
  route: 'v1/technicians/active-job/{bookingId}/photos',
  methods: ['POST'],
  handler: activeJobPhotosHandler,
});
