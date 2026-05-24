import '../../bootstrap.js';
import { app } from '@azure/functions';
import type { HttpRequest, InvocationContext, HttpResponseInit } from '@azure/functions';
import { verifyTechnicianToken } from '../../middleware/verifyTechnicianToken.js';
import { commissionReceivableRepo } from '../../cosmos/commission-receivable-repository.js';

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
    const entries = await commissionReceivableRepo.getOutstandingByTechnician(uid);
    const totalOutstandingPaise = entries.reduce((acc, e) => acc + e.commissionDue, 0);
    return {
      status: 200,
      jsonBody: {
        totalOutstandingPaise,
        dueCount: entries.length,
        entries: entries.map((e) => ({
          bookingId: e.bookingId,
          bookingAmount: e.bookingAmount,
          commissionDue: e.commissionDue,
          createdAt: e.createdAt,
        })),
      },
    };
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
