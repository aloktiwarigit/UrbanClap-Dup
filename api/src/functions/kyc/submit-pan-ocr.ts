import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { extractPanFromStoragePath } from '../../services/formRecognizer.service.js';
import { upsertKycStatus } from '../../cosmos/technician-repository.js';
import { verifyTechnicianToken } from '../../middleware/verifyTechnicianToken.js';
import { SubmitPanOcrRequestSchema } from '../../schemas/kyc.js';
import { kycAuditEntry } from '../../services/kycAudit.service.js';

export async function submitPanOcr(
  req: HttpRequest,
  _ctx: InvocationContext
): Promise<HttpResponseInit> {
  let decodedToken: { uid: string };
  try {
    decodedToken = await verifyTechnicianToken(req);
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

  // P1-C: caller may only update their own KYC record
  if (decodedToken.uid !== technicianId) {
    return { status: 403, jsonBody: { error: 'Forbidden' } };
  }

  const ocrResult = await extractPanFromStoragePath(firebaseStoragePath);

  if (ocrResult.status === 'PAN_DONE') {
    // Raw PAN discarded inside formRecognizer.service; only hash+mask reach here
    await upsertKycStatus(technicianId, {
      panMaskedNumber: ocrResult.panMaskedNumber,
      panHash: ocrResult.panHash,
      panNumber: null,           // explicitly clear legacy field
      panNumberEncrypted: undefined, // explicitly clear
      panImagePath: firebaseStoragePath,
      kycStatus: 'PAN_DONE',
    });
    void kycAuditEntry(technicianId, 'PAN', 'VERIFIED');
    return {
      status: 200,
      jsonBody: {
        kycStatus: 'PAN_DONE',
        panMaskedNumber: ocrResult.panMaskedNumber,
        panNumber: ocrResult.panMaskedNumber, // legacy alias — technician-app reads panNumber (migration window)
      },
    };
  }

  // Explicitly clear any stale PAN fields — a rejected submission must not leave
  // a previous panMaskedNumber visible via getKycStatus while status is MANUAL_REVIEW.
  await upsertKycStatus(technicianId, {
    panMaskedNumber: null,
    panHash: null,
    panNumber: null,
    panNumberEncrypted: undefined,
    panImagePath: firebaseStoragePath,
    kycStatus: 'MANUAL_REVIEW',
  });
  void kycAuditEntry(technicianId, 'PAN', 'REJECTED');
  return { status: 200, jsonBody: { kycStatus: 'MANUAL_REVIEW', panMaskedNumber: null } };
}

app.http('submitPanOcr', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'v1/kyc/pan-ocr',
  handler: submitPanOcr,
});
