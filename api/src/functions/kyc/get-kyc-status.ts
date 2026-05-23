import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { verifyTechnicianToken } from '../../middleware/verifyTechnicianToken.js';
import { getKycByTechnicianId } from '../../cosmos/technician-repository.js';
import { maskPan } from '../../services/pan.utils.js';

export async function getKycStatus(
  req: HttpRequest,
  _ctx: InvocationContext
): Promise<HttpResponseInit> {
  let decodedToken: { uid: string };
  try {
    decodedToken = await verifyTechnicianToken(req);
  } catch {
    return { status: 401, jsonBody: { error: 'Unauthorized' } };
  }

  const technicianId = req.query.get('technicianId');
  if (!technicianId) {
    return { status: 400, jsonBody: { error: 'technicianId query param required' } };
  }

  // P1-B: caller may only read their own KYC record
  if (decodedToken.uid !== technicianId) {
    return { status: 403, jsonBody: { error: 'Forbidden' } };
  }

  const kyc = await getKycByTechnicianId(technicianId);
  if (!kyc) {
    return { status: 404, jsonBody: { error: 'KYC record not found' } };
  }

  // S-001: validate both fields before returning any PAN data to the client.
  // panMaskedNumber could contain a legacy non-canonical mask (e.g. ABCDE####F written by an
  // old migration script); panNumber could be a raw PAN that maskPan() cannot normalize.
  // Either non-canonical case escalates to MANUAL_REVIEW — never leak non-canonical values.
  const CANONICAL_PAN_MASK = /^X{5}\d{4}[A-Z]$/;
  const canonicalMasked =
    kyc.panMaskedNumber != null && CANONICAL_PAN_MASK.test(kyc.panMaskedNumber)
      ? kyc.panMaskedNumber
      : null;
  const maskedFromLegacy = canonicalMasked == null && kyc.panNumber ? maskPan(kyc.panNumber) : null;
  const panMaskedValue = canonicalMasked ?? maskedFromLegacy;
  const hasPanData = kyc.panMaskedNumber != null || kyc.panNumber != null;
  const effectiveKycStatus =
    hasPanData && panMaskedValue === null ? ('MANUAL_REVIEW' as const) : kyc.kycStatus;

  return {
    status: 200,
    jsonBody: {
      technicianId,
      kycStatus: effectiveKycStatus,
      aadhaarVerified: kyc.aadhaarVerified,
      aadhaarMaskedNumber: kyc.aadhaarMaskedNumber,
      panMaskedNumber: panMaskedValue,
      panNumber: panMaskedValue, // legacy alias — technician-app KycStatusResponse reads panNumber (migration window)
    },
  };
}

app.http('getKycStatus', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'v1/kyc/status',
  handler: getKycStatus,
});
