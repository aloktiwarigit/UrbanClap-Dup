import '../bootstrap.js';
import { app } from '@azure/functions';
import type { HttpHandler, HttpRequest, InvocationContext } from '@azure/functions';
import * as Sentry from '@sentry/node';
import { z } from 'zod';
import { verifyTechnicianToken } from '../middleware/verifyTechnicianToken.js';
import { patchPaymentProfile } from '../cosmos/technician-repository.js';
import { isValidVpaFormat } from '../lib/pii/vpa-format.js';

const UpdatePaymentProfileBodySchema = z.object({
  upiVpa: z.string().refine(isValidVpaFormat, { message: 'malformed VPA' }),
});

export const updatePaymentProfileHandler: HttpHandler = async (
  req: HttpRequest,
  ctx: InvocationContext,
) => {
  let uid: string;
  try {
    ({ uid } = await verifyTechnicianToken(req));
  } catch {
    return { status: 401, jsonBody: { code: 'UNAUTHENTICATED' } };
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { status: 400, jsonBody: { code: 'INVALID_VPA' } };
  }

  const parsed = UpdatePaymentProfileBodySchema.safeParse(body);
  if (!parsed.success) {
    return { status: 400, jsonBody: { code: 'INVALID_VPA', details: parsed.error.flatten() } };
  }

  const upiUpdatedAt = new Date().toISOString();
  try {
    await patchPaymentProfile(uid, { upiVpa: parsed.data.upiVpa, upiUpdatedAt });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'TECHNICIAN_NOT_FOUND') {
      return { status: 404, jsonBody: { code: 'TECHNICIAN_NOT_FOUND' } };
    }
    Sentry.captureException(err);
    ctx.error('patchPaymentProfile failed', err);
    return { status: 500, jsonBody: { code: 'INTERNAL_ERROR' } };
  }

  return { status: 200, jsonBody: { upiVpa: parsed.data.upiVpa, upiUpdatedAt } };
};

app.http('updatePaymentProfile', {
  route: 'v1/technicians/me/payment-profile',
  methods: ['PATCH'],
  authLevel: 'anonymous',
  handler: updatePaymentProfileHandler,
});
