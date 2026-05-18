import { getFirebaseAdmin } from './firebaseAdmin.js';
import { deviceTokenRepo } from '../cosmos/device-token-repository.js';

// ---------------------------------------------------------------------------
// Internal helpers — device-token fan-out
// ---------------------------------------------------------------------------

/**
 * Sends an FCM data message to all registered devices for a given user.
 * Uses sendEachForMulticast when the user has multiple devices, send() for one.
 * Logs stale-token warnings for observability without surfacing them to callers.
 */
async function sendToUserTokens(
  userId: string,
  data: Record<string, string>,
): Promise<void> {
  const tokens = await deviceTokenRepo.getDeviceTokensForUser(userId);
  if (tokens.length === 0) {
    console.warn(`[FCM] no device tokens for user ${userId}, skipping send`);
    return;
  }
  if (tokens.length === 1) {
    await getFirebaseAdmin().messaging().send({ token: tokens[0]!, data });
  } else {
    const result = await getFirebaseAdmin()
      .messaging()
      .sendEachForMulticast({ tokens, data });
    result.responses.forEach((r, i) => {
      if (
        !r.success &&
        r.error?.code === 'messaging/registration-token-not-registered'
      ) {
        console.warn(`[FCM] stale token for user ${userId}, token index ${i}`);
      }
    });
  }
}

/**
 * Sends an FCM data message to the owner_alerts topic.
 * This helper is intentionally topic-based and restricted to payloads with
 * no per-user PII — only aggregate counts or non-user identifiers are allowed.
 * Approved exception: ADR-0026 §5 ("owner_alerts topic may carry non-PII
 * aggregate metrics until admin device enrollment is live").
 */
async function sendToOwnerAlertsTopic(data: Record<string, string>): Promise<void> {
  await getFirebaseAdmin().messaging().send({ topic: 'owner_alerts', data });
}

// ---------------------------------------------------------------------------
// Group A — Customer sends
// ---------------------------------------------------------------------------

export async function sendPriceApprovalPush(customerId: string, bookingId: string): Promise<void> {
  await sendToUserTokens(customerId, { type: 'ADDON_APPROVAL_REQUESTED', bookingId });
}

export async function sendBookingStatusUpdatePush(payload: {
  customerId: string;
  bookingId: string;
  status: string;
}): Promise<void> {
  await sendToUserTokens(payload.customerId, {
    type: 'BOOKING_STATUS_UPDATE',
    bookingId: payload.bookingId,
    status: payload.status,
  });
}

export async function sendLocationUpdatePush(payload: {
  customerId: string;
  bookingId: string;
  lat: number;
  lng: number;
  etaMinutes: number;
  techName?: string;
  techPhotoUrl?: string;
}): Promise<void> {
  await sendToUserTokens(payload.customerId, {
    type: 'LOCATION_UPDATE',
    bookingId: payload.bookingId,
    lat: String(payload.lat),
    lng: String(payload.lng),
    etaMinutes: String(payload.etaMinutes),
    techName: payload.techName ?? '',
    techPhotoUrl: payload.techPhotoUrl ?? '',
  });
}

export async function sendRatingPromptCustomerPush(customerId: string, bookingId: string): Promise<void> {
  await sendToUserTokens(customerId, { type: 'RATING_PROMPT_CUSTOMER', bookingId });
}

export async function sendNoShowCreditPush(
  customerId: string,
  bookingId: string,
  creditAmount: number,
): Promise<void> {
  await sendToUserTokens(customerId, {
    type: 'NO_SHOW_CREDIT_ISSUED',
    bookingId,
    creditAmount: String(creditAmount),
    bodyText: 'तकनीशियन नहीं आए — ₹500 credit आपके account में जोड़ा गया। नया तकनीशियन ढूंढ रहे हैं।',
  });
}

export async function sendPeriodicLocationPush(payload: {
  customerId: string;
  bookingId: string;
  lat: number;
  lng: number;
  capturedAt: number;
}): Promise<void> {
  await sendToUserTokens(payload.customerId, {
    type: 'LOCATION_UPDATE',
    bookingId: payload.bookingId,
    lat: String(payload.lat),
    lng: String(payload.lng),
    capturedAt: String(payload.capturedAt),
  });
}

// ---------------------------------------------------------------------------
// Group B — Technician sends
// ---------------------------------------------------------------------------

export async function sendTechnicianBookingStatusUpdatePush(payload: {
  technicianId: string;
  bookingId: string;
  status: string;
  priceApprovedPaise?: number;
}): Promise<void> {
  const data: Record<string, string> = {
    type: 'BOOKING_STATUS_UPDATE',
    bookingId: payload.bookingId,
    status: payload.status,
  };
  if (payload.priceApprovedPaise !== undefined) {
    data.priceApprovedPaise = String(payload.priceApprovedPaise);
  }
  await sendToUserTokens(payload.technicianId, data);
}

export async function sendTechEarningsUpdate(
  technicianId: string,
  payload: { bookingId: string; techAmount: number },
): Promise<void> {
  await sendToUserTokens(technicianId, {
    type: 'EARNINGS_UPDATE',
    bookingId: payload.bookingId,
    techAmount: String(payload.techAmount),
  });
}

export async function sendRatingPromptTechnicianPush(technicianId: string, bookingId: string): Promise<void> {
  await sendToUserTokens(technicianId, { type: 'RATING_PROMPT_TECHNICIAN', bookingId });
}

export async function sendAppealDecisionPush(
  technicianId: string,
  payload: { appealId: string; decision: string; ownerNote: string },
): Promise<void> {
  await sendToUserTokens(technicianId, {
    type: 'APPEAL_DECISION',
    appealId: payload.appealId,
    decision: payload.decision,
    ownerNote: payload.ownerNote,
  });
}

export async function sendRatingReceivedPush(
  technicianId: string,
  payload: { bookingId: string; overall: number; comment: string },
): Promise<void> {
  await sendToUserTokens(technicianId, {
    type: 'RATING_RECEIVED',
    bookingId: payload.bookingId,
    overall: String(payload.overall),
    comment: payload.comment,
  });
}

// ---------------------------------------------------------------------------
// Group C — Owner / admin sends
// ---------------------------------------------------------------------------

/**
 * Route reconciliation alert — only aggregate counts, no user IDs.
 * Approved non-PII exception: stays on owner_alerts topic (ADR-0026 §5).
 */
export async function sendOwnerRouteAlert(payload: {
  stalePending: number;
  failed: number;
}): Promise<void> {
  // Non-PII: only aggregate metrics (counts), no user identifiers.
  // Approved to remain on owner_alerts topic per ADR-0026 §5.
  await sendToOwnerAlertsTopic({
    type: 'RECON_MISMATCH_ALERT',
    stalePending: String(payload.stalePending),
    failed: String(payload.failed),
  });
}

/**
 * Rating-shield alert — technicianId kept for owner triage; no customerId.
 * TODO E19-S02: migrate to admin device tokens once admin-app enrollment is live.
 */
export async function sendOwnerRatingShieldAlert(payload: {
  bookingId: string;
  technicianId: string;
  draftOverall: number;
}): Promise<void> {
  // technicianId retained — required for owner triage action; no customerId exposed.
  // TODO E19-S02: switch to sendToAdminTokens once admin device enrollment is live.
  await sendToOwnerAlertsTopic({
    type: 'OWNER_RATING_SHIELD_ALERT',
    bookingId: payload.bookingId,
    technicianId: payload.technicianId,
    draftOverall: String(payload.draftOverall),
  });
}

/**
 * SOS alert — customerId and technicianId trimmed from payload (PII per ADR-0026).
 * Only bookingId + incidentId are forwarded; owner cross-references Cosmos for details.
 * TODO E19-S02: migrate to admin device tokens once admin-app enrollment is live.
 */
export async function sendOwnerSosAlert(payload: {
  bookingId: string;
  customerId: string;
  technicianId: string;
  incidentId: string;
}): Promise<void> {
  // PII trim: customerId and technicianId are NOT included in the FCM payload.
  // Owner retrieves those from Cosmos using bookingId + incidentId.
  // TODO E19-S02: switch to sendToAdminTokens once admin device enrollment is live.
  await sendToOwnerAlertsTopic({
    type: 'SOS_ALERT',
    bookingId: payload.bookingId,
    incidentId: payload.incidentId,
  });
}

/**
 * Abusive-content shield alert — customerId trimmed from payload (PII per ADR-0026).
 * technicianId retained for owner triage.
 * TODO E19-S02: migrate to admin device tokens once admin-app enrollment is live.
 */
export async function sendAbusiveShieldAlert(payload: {
  bookingId: string;
  technicianId: string;
  customerId: string;
}): Promise<void> {
  // PII trim: customerId removed. technicianId kept for owner action.
  // TODO E19-S02: switch to sendToAdminTokens once admin device enrollment is live.
  await sendToOwnerAlertsTopic({
    type: 'ABUSIVE_SHIELD_ALERT',
    bookingId: payload.bookingId,
    technicianId: payload.technicianId,
  });
}

/**
 * Appeal filed — technicianId retained for owner triage.
 * TODO E19-S02: migrate to admin device tokens once admin-app enrollment is live.
 */
export async function sendAppealFiledAlert(payload: {
  appealId: string;
  technicianId: string;
  bookingId: string;
}): Promise<void> {
  // TODO E19-S02: switch to sendToAdminTokens once admin device enrollment is live.
  await sendToOwnerAlertsTopic({
    type: 'APPEAL_FILED_ALERT',
    appealId: payload.appealId,
    technicianId: payload.technicianId,
    bookingId: payload.bookingId,
  });
}

/**
 * Complaint filed — filedBy is a role string (e.g. "CUSTOMER"), not a UID.
 * TODO E19-S02: migrate to admin device tokens once admin-app enrollment is live.
 */
export async function sendOwnerComplaintFiled(payload: {
  bookingId: string;
  filedBy: string;
  reasonCode: string;
}): Promise<void> {
  // filedBy is a role enum value, not a userId — acceptable in owner_alerts topic.
  // TODO E19-S02: switch to sendToAdminTokens once admin device enrollment is live.
  await sendToOwnerAlertsTopic({
    type: 'OWNER_COMPLAINT_FILED',
    bookingId: payload.bookingId,
    filedBy: payload.filedBy,
    reasonCode: payload.reasonCode,
  });
}

/**
 * Complaint SLA breach.
 * TODO E19-S02: migrate to admin device tokens once admin-app enrollment is live.
 */
export async function sendOwnerComplaintSlaBreach(payload: {
  complaintId: string;
  bookingId: string;
  breachType: 'SLA_BREACH' | 'SLA_BREACH_ACK';
}): Promise<void> {
  // TODO E19-S02: switch to sendToAdminTokens once admin device enrollment is live.
  await sendToOwnerAlertsTopic({
    type: 'OWNER_COMPLAINT_SLA_BREACH',
    complaintId: payload.complaintId,
    bookingId: payload.bookingId,
    slaType: payload.breachType === 'SLA_BREACH' ? 'RESOLVE' : 'ACKNOWLEDGE',
  });
}

// ---------------------------------------------------------------------------
// DPDP §12 erasure notifications
// ---------------------------------------------------------------------------

/** DPDP §12 erasure cron: final-notice push at the moment of cascade execution. */
export async function sendErasureFinalNotice(payload: {
  userId: string;
  userRole: 'CUSTOMER' | 'TECHNICIAN';
  erasureId: string;
}): Promise<void> {
  await sendToUserTokens(payload.userId, {
    type: 'ERASURE_FINAL_NOTICE',
    erasureId: payload.erasureId,
  });
}

/** DPDP §12 erasure denial: notify the data principal of the legal reason. */
export async function sendErasureDenied(payload: {
  userId: string;
  userRole: 'CUSTOMER' | 'TECHNICIAN';
  erasureId: string;
  reason: string;
}): Promise<void> {
  await sendToUserTokens(payload.userId, {
    type: 'ERASURE_DENIED',
    erasureId: payload.erasureId,
    reason: payload.reason,
  });
}
