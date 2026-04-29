import '../bootstrap.js';
import { app } from '@azure/functions';
import type { HttpHandler, HttpRequest, InvocationContext } from '@azure/functions';
import * as Sentry from '@sentry/node';
import { z } from 'zod';
import { verifyTechnicianToken } from '../middleware/verifyTechnicianToken.js';
import { updatePayoutCadence } from '../cosmos/technician-repository.js';

const IST_OFFSET_MS = 5.5 * 3600000;

const UpdateCadenceBodySchema = z.object({
  cadence: z.enum(['WEEKLY', 'NEXT_DAY', 'INSTANT']),
});

function computeNextPayoutAt(cadence: 'WEEKLY' | 'NEXT_DAY' | 'INSTANT'): string | null {
  if (cadence === 'INSTANT') return null;

  const now = new Date();
  const istNow = new Date(now.getTime() + IST_OFFSET_MS);

  if (cadence === 'NEXT_DAY') {
    const tomorrow = new Date(istNow);
    tomorrow.setUTCDate(istNow.getUTCDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);
    return `${tomorrowStr}T04:30:00.000Z`; // 10:00 AM IST = 04:30 UTC
  }

  // WEEKLY: next Monday at 10:00 IST (04:30 UTC)
  const dayOfWeek = istNow.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  // If today is Monday, go to NEXT Monday (7 days), otherwise go to upcoming Monday
  const daysUntilMonday = dayOfWeek === 1 ? 7 : (8 - dayOfWeek) % 7 || 7;
  const nextMondayIst = new Date(istNow);
  nextMondayIst.setUTCDate(istNow.getUTCDate() + daysUntilMonday);
  const nextMondayStr = nextMondayIst.toISOString().slice(0, 10);
  return `${nextMondayStr}T04:30:00.000Z`;
}

export const updatePayoutCadenceHandler: HttpHandler = async (req: HttpRequest, ctx: InvocationContext) => {
  let uid: string;
  try {
    const decoded = await verifyTechnicianToken(req);
    uid = decoded.uid;
  } catch {
    return { status: 401, jsonBody: { code: 'UNAUTHENTICATED' } };
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { status: 400, jsonBody: { code: 'INVALID_CADENCE' } };
  }

  const parsed = UpdateCadenceBodySchema.safeParse(body);
  if (!parsed.success) {
    return { status: 400, jsonBody: { code: 'INVALID_CADENCE', details: parsed.error.flatten() } };
  }

  const { cadence } = parsed.data;

  try {
    await updatePayoutCadence(uid, cadence);
  } catch (err: unknown) {
    Sentry.captureException(err);
    ctx.error('updatePayoutCadence failed', err);
    return { status: 500, jsonBody: { code: 'INTERNAL_ERROR' } };
  }

  const nextPayoutAt = computeNextPayoutAt(cadence);
  return { status: 200, jsonBody: { cadence, nextPayoutAt } };
};

app.http('updatePayoutCadence', {
  route: 'v1/technicians/me/payout-cadence',
  methods: ['PATCH'],
  authLevel: 'anonymous',
  handler: updatePayoutCadenceHandler,
});
