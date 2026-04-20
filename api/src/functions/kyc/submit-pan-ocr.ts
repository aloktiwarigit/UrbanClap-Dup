import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { extractPanFromStoragePath } from '../../services/formRecognizer.service.js';
import { upsertKycStatus } from '../../cosmos/technician-repository.js';
import { verifyTechnicianToken } from '../../middleware/verifyTechnicianToken.js';
import { SubmitPanOcrRequestSchema } from '../../schemas/kyc.js';

export async function submitPanOcr(
  req: HttpRequest,
  _ctx: InvocationContext
): Promise<HttpResponseInit> {
  try {
    await verifyTechnicianToken(req);
  } catch {
    return { status: 401, jsonBody: { error: 'Unauthorized' } };
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { status: 400, jsonBody: { error: 'Invalid JSON' } };
  }

  const parsed = SubmitPanOcrRequestSchema.safeParse(body);
  if (!parsed.success) {
    return { status: 422, jsonBody: { error: parsed.error.flatten() } };
  }

  const { technicianId, firebaseStoragePath } = parsed.data;
  const ocrResult = await extractPanFromStoragePath(firebaseStoragePath);

  if (ocrResult.status === 'PAN_DONE') {
    await upsertKycStatus(technicianId, {
      panNumber: ocrResult.panNumber,
      panImagePath: firebaseStoragePath,
      kycStatus: 'PAN_DONE',
    });
    return { status: 200, jsonBody: { kycStatus: 'PAN_DONE', panNumber: ocrResult.panNumber } };
  }

  await upsertKycStatus(technicianId, {
    panImagePath: firebaseStoragePath,
    kycStatus: 'MANUAL_REVIEW',
  });
  return { status: 200, jsonBody: { kycStatus: 'MANUAL_REVIEW', panNumber: null } };
}

app.http('submitPanOcr', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'v1/kyc/pan-ocr',
  handler: submitPanOcr,
});
