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
    try {
      await getFirebaseAdmin().messaging().send({ token: tokens[0]!, data });
    } catch (err: unknown) {
      const code = (err as { errorInfo?: { code?: string } }).errorInfo?.code ?? '';
      if (code === 'messaging/registration-token-not-registered') {
        console.warn(`[FCM] stale single token for user ${userId}, skipping send`);
        return;
      }
      throw err; // re-throw unexpected errors
    }
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
 * Sends an FCM data message to all enrolled admin device tokens.
 * Falls back to the owner_alerts topic when no admin tokens are registered,
 * so alerts are never silently dropped during the rollout window.
 * Fallback payload must contain no per-user PII (non-PII fields only).
 */
async function sendToAdminTokens(data: Record<string, string>): Promise<void> {
  const tokens = await deviceTokenRepo.getAllAdminDeviceTokens();
  if (tokens.length === 0) {
    // Fallback to owner_alerts topic until admin-web enrollment is fully live.
    // Non-PII fields only in the fallback (no customerId, technicianId).
    console.warn('[FCM] no admin device tokens, falling back to owner_alerts topic');
    await getFirebaseAdmin().messaging().send({ topic: 'owner_alerts', data });
    return;
  }
  if (tokens.length === 1) {
    try {
      await getFirebaseAdmin().messaging().send({ token: tokens[0]!, data });
    } catch (err: unknown) {
      const code = (err as { errorInfo?: { code?: string } }).errorInfo?.code ?? '';
      if (code === 'messaging/registration-token-not-registered') {
        console.warn('[FCM] stale single admin token, skipping send');
        return;
      }
      throw err; // re-throw unexpected errors
    }
  } else {
    await getFirebaseAdmin().messaging().sendEachForMulticast({ tokens, data });
  }
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
  payload: { bookingId: string; techAmount?: number; commissionDue?: number },
): Promise<void> {
  await sendToUserTokens(technicianId, {
    type: 'EARNINGS_UPDATE',
    bookingId: payload.bookingId,
    ...(payload.techAmount !== undefined ? { techAmount: String(payload.techAmount) } : {}),
    ...(payload.commissionDue !== undefined ? { commissionDue: String(payload.commissionDue) } : {}),
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
  await getFirebaseAdmin().messaging().send({
    topic: 'owner_alerts',
    data: {
      type: 'RECON_MISMATCH_ALERT',
      stalePending: String(payload.stalePending),
      failed: String(payload.failed),
    },
  });
}

/**
 * Rating-shield alert — technicianId kept for owner triage; no customerId.
 * E19-S02: migrated to sendToAdminTokens (admin device tokens with topic fallback).
 */
export async function sendOwnerRatingShieldAlert(payload: {
  bookingId: string;
  technicianId: string;
  draftOverall: number;
}): Promise<void> {
  // technicianId retained — required for owner triage action; no customerId exposed.
  await sendToAdminTokens({
    type: 'OWNER_RATING_SHIELD_ALERT',
    bookingId: payload.bookingId,
    technicianId: payload.technicianId,
    draftOverall: String(payload.draftOverall),
  });
}

/**
 * SOS alert — customerId and technicianId trimmed from payload (PII per ADR-0026).
 * Only bookingId + incidentId are forwarded; owner cross-references Cosmos for details.
 * E19-S02: migrated to sendToAdminTokens (admin device tokens with topic fallback).
 */
export async function sendOwnerSosAlert(payload: {
  bookingId: string;
  customerId: string;
  technicianId: string;
  incidentId: string;
}): Promise<void> {
  // PII trim: customerId and technicianId are NOT included in the FCM payload.
  // Owner retrieves those from Cosmos using bookingId + incidentId.
  await sendToAdminTokens({
    type: 'SOS_ALERT',
    bookingId: payload.bookingId,
    incidentId: payload.incidentId,
  });
}

/**
 * Abusive-content shield alert — customerId trimmed from payload (PII per ADR-0026).
 * technicianId retained for owner triage.
 * E19-S02: migrated to sendToAdminTokens (admin device tokens with topic fallback).
 */
export async function sendAbusiveShieldAlert(payload: {
  bookingId: string;
  technicianId: string;
  customerId: string;
}): Promise<void> {
  // PII trim: customerId removed. technicianId kept for owner action.
  await sendToAdminTokens({
    type: 'ABUSIVE_SHIELD_ALERT',
    bookingId: payload.bookingId,
    technicianId: payload.technicianId,
  });
}

/**
 * Appeal filed — technicianId retained for owner triage.
 * E19-S02: migrated to sendToAdminTokens (admin device tokens with topic fallback).
 */
export async function sendAppealFiledAlert(payload: {
  appealId: string;
  technicianId: string;
  bookingId: string;
}): Promise<void> {
  await sendToAdminTokens({
    type: 'APPEAL_FILED_ALERT',
    appealId: payload.appealId,
    technicianId: payload.technicianId,
    bookingId: payload.bookingId,
  });
}

/**
 * Complaint filed — filedBy is a role string (e.g. "CUSTOMER"), not a UID.
 * E19-S02: migrated to sendToAdminTokens (admin device tokens with topic fallback).
 */
export async function sendOwnerComplaintFiled(payload: {
  bookingId: string;
  filedBy: string;
  reasonCode: string;
}): Promise<void> {
  // filedBy is a role enum value, not a userId — acceptable in owner_alerts topic.
  await sendToAdminTokens({
    type: 'OWNER_COMPLAINT_FILED',
    bookingId: payload.bookingId,
    filedBy: payload.filedBy,
    reasonCode: payload.reasonCode,
  });
}

/**
 * Complaint SLA breach.
 * E19-S02: migrated to sendToAdminTokens (admin device tokens with topic fallback).
 */
export async function sendOwnerComplaintSlaBreach(payload: {
  complaintId: string;
  bookingId: string;
  breachType: 'SLA_BREACH' | 'SLA_BREACH_ACK';
}): Promise<void> {
  await sendToAdminTokens({
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
