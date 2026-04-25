import { getFirebaseAdmin } from './firebaseAdmin.js';

export async function sendPriceApprovalPush(customerId: string, bookingId: string): Promise<void> {
  await getFirebaseAdmin().messaging().send({
    topic: `customer_${customerId}`,
    data: { type: 'ADDON_APPROVAL_REQUESTED', bookingId },
  });
}

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

export async function sendRatingPromptCustomerPush(customerId: string, bookingId: string): Promise<void> {
  await getFirebaseAdmin().messaging().send({
    topic: `customer_${customerId}`,
    data: { type: 'RATING_PROMPT_CUSTOMER', bookingId },
  });
}

export async function sendRatingPromptTechnicianPush(technicianId: string, bookingId: string): Promise<void> {
  await getFirebaseAdmin().messaging().send({
    topic: `technician_${technicianId}`,
    data: { type: 'RATING_PROMPT_TECHNICIAN', bookingId },
  });
}

export async function sendOwnerRouteAlert(payload: {
  stalePending: number;
  failed: number;
}): Promise<void> {
  await getFirebaseAdmin().messaging().send({
    topic: 'owner_alerts',
    data: {
      type: 'RECON_MISMATCH_ALERT',
      stalePending: String(payload.stalePending),
      failed: String(payload.failed),
    },
  });
}
