import '../../../bootstrap.js';
import { app } from '@azure/functions';
import type { HttpHandler } from '@azure/functions';
import { requireAdmin } from '../../../middleware/requireAdmin.js';
import type { AdminHttpHandler } from '../../../middleware/requireAdmin.js';
import { bookingRepo } from '../../../cosmos/booking-repository.js';

export const adminGetSosIncidentHandler: AdminHttpHandler = async (req, _ctx, _admin) => {
  const incidentId = (req as unknown as { params: { incidentId: string } }).params.incidentId;

  const booking = await bookingRepo.getById(incidentId);
  if (!booking) return { status: 404, jsonBody: { code: 'BOOKING_NOT_FOUND' } };
  if (!booking.sosActivatedAt) return { status: 404, jsonBody: { code: 'SOS_NOT_ACTIVATED' } };

  return {
    status: 200,
    jsonBody: {
      incidentId,
      bookingId: booking.id,
      customerId: booking.customerId,
      technicianId: booking.technicianId,
      slotAddress: booking.addressText,
      slotDate: booking.slotDate,
      slotWindow: booking.slotWindow,
      sosActivatedAt: booking.sosActivatedAt,
    },
  };
};

const handler: HttpHandler = requireAdmin(['super-admin', 'ops-manager'])(adminGetSosIncidentHandler);

app.http('adminGetSosIncident', {
  methods: ['GET'],
  route: 'v1/admin/sos/{incidentId}',
  authLevel: 'anonymous',
  handler,
});
