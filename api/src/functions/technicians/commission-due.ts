import '../../bootstrap.js';
import { app } from '@azure/functions';
import type { HttpRequest, InvocationContext, HttpResponseInit } from '@azure/functions';
import { verifyTechnicianToken } from '../../middleware/verifyTechnicianToken.js';
import { commissionReceivableRepo } from '../../cosmos/commission-receivable-repository.js';
import { readCommissionHold } from '../../cosmos/technician-repository.js';
import { getCommissionConfig } from '../../services/commission-config.service.js';
import { buildCommissionDueResponse } from '../../services/commission-view.service.js';

export const techCommissionDueHandler = async (
  req: HttpRequest,
  _ctx: InvocationContext,
): Promise<HttpResponseInit> => {
  let uid: string;
  try {
    ({ uid } = await verifyTechnicianToken(req));
  } catch {
    return { status: 401, jsonBody: { code: 'UNAUTHORIZED' } };
  }

  try {
    const [ledger, { hold }, cfg] = await Promise.all([
      commissionReceivableRepo.listLedger(uid),
      readCommissionHold(uid),
      getCommissionConfig(),
    ]);

    const body = buildCommissionDueResponse({ ledger, hold, cfg, now: new Date() });

    return { status: 200, jsonBody: body };
  } catch {
    return { status: 502, jsonBody: { code: 'UPSTREAM_ERROR' } };
  }
};

app.http('techCommissionDue', {
  methods: ['GET'],
  route: 'v1/technicians/me/commission-due',
  authLevel: 'anonymous',
  handler: techCommissionDueHandler,
});
