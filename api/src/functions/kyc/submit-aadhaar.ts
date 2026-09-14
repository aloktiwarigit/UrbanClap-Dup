import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { verifyTechnicianToken } from '../../middleware/verifyTechnicianToken.js';
import { exchangeCodeForAadhaar } from '../../services/digilocker.service.js';
import {
  upsertKycStatus,
  upsertKycStepAndDeriveStatus,
} from '../../cosmos/technician-repository.js';
import { SubmitAadhaarRequestSchema } from '../../schemas/kyc.js';
import { kycAuditEntry } from '../../services/kycAudit.service.js';

export async function submitAadhaar(
  req: HttpRequest,
  _ctx: InvocationContext
): Promise<HttpResponseInit> {
  let decoded: { uid: string };
  try {
    decoded = await verifyTechnicianToken(req);
  } catch {
    return { status: 401, jsonBody: { error: 'Unauthorized' } };
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { status: 400, jsonBody: { error: 'Invalid JSON' } };
  }

  const parsed = SubmitAadhaarRequestSchema.safeParse(body);
  if (!parsed.success) {
    return { status: 422, jsonBody: { error: parsed.error.flatten() } };
  }

  const { authCode, redirectUri } = parsed.data;
  // E21-S05a: the technician-app client sends no technicianId in the body — default to the
  // verified token's uid. An explicitly-supplied technicianId that differs from the token's
  // uid still trips the IDOR guard below; the guard is a no-op only when the value was
  // defaulted, never when it was supplied and mismatched.
  const technicianId = parsed.data.technicianId ?? decoded.uid;

  // P0: caller may only update their own KYC record (IDOR guard)
  if (decoded.uid !== technicianId) {
    return { status: 403, jsonBody: { code: 'FORBIDDEN' } };
  }

  const aadhaarResult = await exchangeCodeForAadhaar(authCode, redirectUri);

  if (!aadhaarResult) {
    await upsertKycStatus(technicianId, {
      aadhaarVerified: false,
      kycStatus: 'PENDING_MANUAL',
    });
    void kycAuditEntry(technicianId, 'AADHAAR', 'REJECTED');
    return {
      status: 200,
      jsonBody: { kycStatus: 'PENDING_MANUAL', aadhaarVerified: false, aadhaarMaskedNumber: null },
    };
  }

  const derivedStatus = await upsertKycStepAndDeriveStatus(technicianId, {
    aadhaarVerified: true,
    aadhaarMaskedNumber: aadhaarResult.maskedNumber,
  });
  void kycAuditEntry(technicianId, 'AADHAAR', 'VERIFIED');

  return {
    status: 200,
    jsonBody: {
      kycStatus: derivedStatus,
      aadhaarVerified: true,
      aadhaarMaskedNumber: aadhaarResult.maskedNumber,
    },
  };
}

app.http('submitAadhaar', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'v1/kyc/aadhaar',
  handler: submitAadhaar,
});
