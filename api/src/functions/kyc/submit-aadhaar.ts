import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { verifyTechnicianToken } from '../../middleware/verifyTechnicianToken.js';
import { exchangeCodeForAadhaar } from '../../services/digilocker.service.js';
import { upsertKycStatus } from '../../cosmos/technician-repository.js';
import { SubmitAadhaarRequestSchema } from '../../schemas/kyc.js';
import { kycAuditEntry } from '../../services/kycAudit.service.js';

export async function submitAadhaar(
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

  const parsed = SubmitAadhaarRequestSchema.safeParse(body);
  if (!parsed.success) {
    return { status: 422, jsonBody: { error: parsed.error.flatten() } };
  }

  const { technicianId, authCode, redirectUri } = parsed.data;
  const aadhaarResult = await exchangeCodeForAadhaar(authCode, redirectUri);

  if (!aadhaarResult) {
    await upsertKycStatus(technicianId, {
      aadhaarVerified: false,
      kycStatus: 'PENDING_MANUAL',
    });
    kycAuditEntry(technicianId, 'aadhaar', 'PENDING_MANUAL', null);
    return {
      status: 200,
      jsonBody: { kycStatus: 'PENDING_MANUAL', aadhaarVerified: false, aadhaarMaskedNumber: null },
    };
  }

  await upsertKycStatus(technicianId, {
    aadhaarVerified: true,
    aadhaarMaskedNumber: aadhaarResult.maskedNumber,
    kycStatus: 'AADHAAR_DONE',
  });
  kycAuditEntry(technicianId, 'aadhaar', 'AADHAAR_DONE', aadhaarResult.maskedNumber);

  return {
    status: 200,
    jsonBody: {
      kycStatus: 'AADHAAR_DONE',
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
