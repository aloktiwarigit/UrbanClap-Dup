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

export async function sendOwnerRatingShieldAlert(payload: {
  bookingId: string;
  technicianId: string;
  draftOverall: number;
}): Promise<void> {
  await getFirebaseAdmin().messaging().send({
    topic: 'owner_alerts',
    data: {
      type: 'OWNER_RATING_SHIELD_ALERT',
      bookingId: payload.bookingId,
      technicianId: payload.technicianId,
      draftOverall: String(payload.draftOverall),
    },
  });
}

export async function sendNoShowCreditPush(
  customerId: string,
  bookingId: string,
  creditAmount: number,
): Promise<void> {
  await getFirebaseAdmin().messaging().send({
    topic: `customer_${customerId}`,
    data: {
      type: 'NO_SHOW_CREDIT_ISSUED',
      bookingId,
      creditAmount: String(creditAmount),
      bodyText: 'तकनीशियन नहीं आए — ₹500 credit आपके account में जोड़ा गया। नया तकनीशियन ढूंढ रहे हैं।',
    },
  });
}

export async function sendOwnerSosAlert(payload: {
  bookingId: string;
  customerId: string;
  technicianId: string;
  slotAddress: string;
}): Promise<void> {
  await getFirebaseAdmin().messaging().send({
    topic: 'owner_alerts',
    data: {
      type: 'SOS_ALERT',
      bookingId: payload.bookingId,
      customerId: payload.customerId,
      technicianId: payload.technicianId,
      slotAddress: payload.slotAddress,
    },
  });
}

export async function sendAbusiveShieldAlert(payload: {
  bookingId: string;
  technicianId: string;
  customerId: string;
}): Promise<void> {
  await getFirebaseAdmin().messaging().send({
    topic: 'owner_alerts',
    data: {
      type: 'ABUSIVE_SHIELD_ALERT',
      bookingId: payload.bookingId,
      technicianId: payload.technicianId,
      customerId: payload.customerId,
    },
  });
}

export async function sendAppealFiledAlert(payload: {
  appealId: string;
  technicianId: string;
  bookingId: string;
}): Promise<void> {
  await getFirebaseAdmin().messaging().send({
    topic: 'owner_alerts',
    data: {
      type: 'APPEAL_FILED_ALERT',
      appealId: payload.appealId,
      technicianId: payload.technicianId,
      bookingId: payload.bookingId,
    },
  });
}

export async function sendAppealDecisionPush(
  technicianId: string,
  payload: { appealId: string; decision: string; ownerNote: string },
): Promise<void> {
  await getFirebaseAdmin().messaging().send({
    topic: `technician_${technicianId}`,
    data: {
      type: 'APPEAL_DECISION',
      appealId: payload.appealId,
      decision: payload.decision,
      ownerNote: payload.ownerNote,
    },
  });
}

export async function sendRatingReceivedPush(
  technicianId: string,
  payload: { bookingId: string; overall: number; comment: string },
): Promise<void> {
  await getFirebaseAdmin().messaging().send({
    topic: `technician_${technicianId}`,
    data: {
      type: 'RATING_RECEIVED',
      bookingId: payload.bookingId,
      overall: String(payload.overall),
      comment: payload.comment,
    },
  });
}

export async function sendOwnerComplaintFiled(payload: {
  bookingId: string;
  filedBy: string;
  reasonCode: string;
}): Promise<void> {
  await getFirebaseAdmin().messaging().send({
    topic: 'owner_alerts',
    data: {
      type: 'OWNER_COMPLAINT_FILED',
      bookingId: payload.bookingId,
      filedBy: payload.filedBy,
      reasonCode: payload.reasonCode,
    },
  });
}

export async function sendOwnerComplaintSlaBreach(payload: {
  complaintId: string;
  bookingId: string;
  breachType: 'SLA_BREACH' | 'SLA_BREACH_ACK';
}): Promise<void> {
  await getFirebaseAdmin().messaging().send({
    topic: 'owner_alerts',
    data: {
      type: 'OWNER_COMPLAINT_SLA_BREACH',
      complaintId: payload.complaintId,
      bookingId: payload.bookingId,
      slaType: payload.breachType === 'SLA_BREACH' ? 'RESOLVE' : 'ACKNOWLEDGE',
    },
  });
}

/** DPDP §12 erasure cron: final-notice push at the moment of cascade execution. */
export async function sendErasureFinalNotice(payload: {
  userId: string;
  userRole: 'CUSTOMER' | 'TECHNICIAN';
  erasureId: string;
}): Promise<void> {
  const topic = payload.userRole === 'CUSTOMER'
    ? `customer_${payload.userId}`
    : `technician_${payload.userId}`;
  await getFirebaseAdmin().messaging().send({
    topic,
    data: {
      type: 'ERASURE_FINAL_NOTICE',
      erasureId: payload.erasureId,
    },
  });
}

/** DPDP §12 erasure denial: notify the data principal of the legal reason. */
export async function sendErasureDenied(payload: {
  userId: string;
  userRole: 'CUSTOMER' | 'TECHNICIAN';
  erasureId: string;
  reason: string;
}): Promise<void> {
  const topic = payload.userRole === 'CUSTOMER'
    ? `customer_${payload.userId}`
    : `technician_${payload.userId}`;
  await getFirebaseAdmin().messaging().send({
    topic,
    data: {
      type: 'ERASURE_DENIED',
      erasureId: payload.erasureId,
      reason: payload.reason,
    },
  });
}
