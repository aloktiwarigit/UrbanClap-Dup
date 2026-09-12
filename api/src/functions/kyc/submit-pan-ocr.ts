import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { extractPanFromStoragePath } from '../../services/formRecognizer.service.js';
import {
  upsertKycStatus,
  upsertKycStepAndDeriveStatus,
  getKycByTechnicianId,
} from '../../cosmos/technician-repository.js';
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

  const { firebaseStoragePath } = parsed.data;
  // E21-S05a: the technician-app client sends no technicianId in the body — default to the
  // verified token's uid. An explicitly-supplied technicianId that differs from the token's
  // uid still trips the IDOR guard below; the guard is a no-op only when the value was
  // defaulted, never when it was supplied and mismatched.
  const technicianId = parsed.data.technicianId ?? decodedToken.uid;

  // P1-C: caller may only update their own KYC record
  if (decodedToken.uid !== technicianId) {
    return { status: 403, jsonBody: { error: 'Forbidden' } };
  }

  // Step order is enforced here, not merely encouraged in the UI. Before this guard a PAN-first
  // technician reached PAN_DONE with no route to a terminal state: `kyc.kycStatus` cannot express
  // "both done", and once ANY KYC write lands the technician stops matching dispatch's fail-open
  // `NOT IS_DEFINED(c.kyc)` disjunct. See ADR-0036.
  const existingKyc = await getKycByTechnicianId(technicianId);
  if (existingKyc?.aadhaarVerified !== true) {
    return { status: 409, jsonBody: { code: 'AADHAAR_REQUIRED_FIRST' } };
  }

  const ocrResult = await extractPanFromStoragePath(firebaseStoragePath);

  if (ocrResult.status === 'PAN_DONE') {
    // Raw PAN discarded inside formRecognizer.service; only hash+mask reach here
    const derivedStatus = await upsertKycStepAndDeriveStatus(technicianId, {
      panMaskedNumber: ocrResult.panMaskedNumber,
      panHash: ocrResult.panHash,
      panNumber: null,           // explicitly clear legacy field
      panNumberEncrypted: undefined, // explicitly clear
      panImagePath: firebaseStoragePath,
    });
    void kycAuditEntry(technicianId, 'PAN', 'VERIFIED');
    return {
      status: 200,
      jsonBody: {
        kycStatus: derivedStatus,
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
