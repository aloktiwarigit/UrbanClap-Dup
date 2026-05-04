import '../../../bootstrap.js';
import { app } from '@azure/functions';
import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { requireAdmin } from '../../../middleware/requireAdmin.js';
import type { AdminContext } from '../../../types/admin.js';
import { bookingRepo } from '../../../cosmos/booking-repository.js';
import { getTechnicianCandidatesForBooking } from '../../../cosmos/technician-repository.js';
import { TechnicianCandidateListResponseSchema } from '../../../schemas/order.js';

const DEFAULT_RADIUS_KM = 10;

export async function adminGetOrderTechnicianCandidatesHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
  _admin: AdminContext,
): Promise<HttpResponseInit> {
  const id = req.params['id'];
  if (!id) return { status: 400, jsonBody: { code: 'MISSING_ID' } };

  const booking = await bookingRepo.getById(id);
  if (!booking) return { status: 404, jsonBody: { code: 'ORDER_NOT_FOUND' } };

  const technicians = await getTechnicianCandidatesForBooking(booking, DEFAULT_RADIUS_KM);
  return {
    status: 200,
    jsonBody: TechnicianCandidateListResponseSchema.parse({ technicians }),
  };
}

app.http('adminGetOrderTechnicianCandidates', {
  methods: ['GET'],
  route: 'v1/admin/orders/{id}/technician-candidates',
  authLevel: 'anonymous',
  handler: requireAdmin(['super-admin', 'ops-manager'])(adminGetOrderTechnicianCandidatesHandler),
});
