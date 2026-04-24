import { getFirebaseAdmin } from './firebaseAdmin.js';

export async function sendTechEarningsUpdate(
  technicianId: string,
  payload: { bookingId: string; techAmount: number },
): Promise<void> {
  await getFirebaseAdmin().messaging().send({
    topic: `technician_${technicianId}`,
    data: {
      type: 'EARNINGS_UPDATE',
      bookingId: payload.bookingId,
      techAmount: String(payload.techAmount),
    },
  });
}

export async function sendOwnerRouteAlert(payload: {
  stalePending: number;
  failed: number;
}): Promise<void> {
  await getFirebaseAdmin().messaging().send({
    topic: 'owner_ops_alerts',
    data: {
      type: 'ROUTE_TRANSFER_MISMATCH',
      stalePending: String(payload.stalePending),
      failed: String(payload.failed),
    },
  });
}
