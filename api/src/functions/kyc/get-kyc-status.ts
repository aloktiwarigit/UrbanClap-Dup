import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { verifyTechnicianToken } from '../../middleware/verifyTechnicianToken.js';
import { getKycByTechnicianId } from '../../cosmos/technician-repository.js';

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

  return {
    status: 200,
    jsonBody: {
      technicianId,
      kycStatus: kyc.kycStatus,
      aadhaarVerified: kyc.aadhaarVerified,
      aadhaarMaskedNumber: kyc.aadhaarMaskedNumber,
      panNumber: kyc.panNumber,
    },
  };
}

app.http('getKycStatus', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'v1/kyc/status',
  handler: getKycStatus,
});
