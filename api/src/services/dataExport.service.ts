import { userDataExportReads } from '../cosmos/user-data-export-reads.js';

/** Bumped any time the shape of the export response changes. */
export const DATA_INVENTORY_VERSION = 1;

/** Audit log lookback for the export response (last 90 days). */
const AUDIT_LOG_LOOKBACK_DAYS = 90;

export interface UserDataExportResponse {
  dataInventoryVersion: number;
  userId: string;
  role: 'CUSTOMER' | 'TECHNICIAN';
  /** Profile fields (technician = stored profile; customer = uid stub). */
  profile: Record<string, unknown>;
  bookings: Array<Record<string, unknown>>;
  ratings: Array<Record<string, unknown>>;
  complaints: Array<Record<string, unknown>>;
  /** Technician-only — Aadhaar masked, PAN masked. null for customers. */
  kyc: { aadhaarMaskedNumber: string | null; panNumber: string | null } | null;
  /** Technician-only — financial ledger entries (retained 7y per RBI). */
  walletLedger: Array<Record<string, unknown>>;
  /** Acknowledgment of FCM topic subscriptions; never the raw token. */
  fcmTokens: { acknowledged: boolean };
  /** Audit log entries where this user is the resource (last 90d). */
  auditLogEntries: Array<Record<string, unknown>>;
  generatedAt: string;
}

function maskPan(pan: string | null | undefined): string | null {
  if (!pan) return null;
  // PAN format: AAAAA9999A — mask first 5
  return pan.replace(/^.{5}/, 'XXXXX');
}

/**
 * Project a booking for the caller. The counterparty's uid is omitted under
 * DPDP §11 — a data principal is entitled to *their* personal data, not the
 * other party's identifier returned in machine-readable bulk form.
 */
function projectBooking(
  b: Record<string, unknown>,
  callerRole: 'CUSTOMER' | 'TECHNICIAN',
): Record<string, unknown> {
  return {
    id: b['id'],
    serviceId: b['serviceId'],
    categoryId: b['categoryId'],
    slotDate: b['slotDate'],
    slotWindow: b['slotWindow'],
    addressText: b['addressText'],
    addressLatLng: b['addressLatLng'],
    status: b['status'],
    amount: b['amount'],
    finalAmount: b['finalAmount'],
    ...(callerRole === 'CUSTOMER' ? { customerId: b['customerId'] } : {}),
    ...(callerRole === 'TECHNICIAN' ? { technicianId: b['technicianId'] } : {}),
    createdAt: b['createdAt'],
    completedAt: b['completedAt'],
  };
}

/**
 * Project a rating for the caller. We strip the side that belongs to the
 * other party — a customer's export shouldn't include the technician's
 * private comment about them, and vice versa.
 */
function projectRating(
  r: Record<string, unknown>,
  callerRole: 'CUSTOMER' | 'TECHNICIAN',
): Record<string, unknown> {
  if (callerRole === 'CUSTOMER') {
    return {
      id: r['id'],
      bookingId: r['bookingId'],
      customerOverall: r['customerOverall'],
      customerSubScores: r['customerSubScores'],
      customerComment: r['customerComment'],
      customerSubmittedAt: r['customerSubmittedAt'],
    };
  }
  return {
    id: r['id'],
    bookingId: r['bookingId'],
    techOverall: r['techOverall'],
    techSubScores: r['techSubScores'],
    techComment: r['techComment'],
    techSubmittedAt: r['techSubmittedAt'],
  };
}

/**
 * Project a complaint. Free-text fields (description, photoStoragePath) are
 * the *filer's* personal narrative — returning them to the non-filer leaks
 * the other party's testimony about them. We only emit those fields when
 * the caller's role matches `filedBy`.
 */
function projectComplaint(
  c: Record<string, unknown>,
  callerRole: 'CUSTOMER' | 'TECHNICIAN',
): Record<string, unknown> {
  const callerIsAuthor = c['filedBy'] === callerRole;
  return {
    id: c['id'],
    orderId: c['orderId'],
    status: c['status'],
    filedBy: c['filedBy'],
    reasonCode: c['reasonCode'],
    createdAt: c['createdAt'],
    resolvedAt: c['resolvedAt'],
    ...(callerIsAuthor && {
      description: c['description'],
      photoStoragePath: c['photoStoragePath'],
    }),
  };
}

export async function assembleUserDataExport(
  userId: string,
  role: 'CUSTOMER' | 'TECHNICIAN',
): Promise<UserDataExportResponse> {
  const generatedAt = new Date().toISOString();
  const sinceIso = new Date(
    Date.now() - AUDIT_LOG_LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const [bookings, ratings, complaints, auditEntries] = await Promise.all([
    userDataExportReads.listBookingsForUser(userId, role),
    userDataExportReads.listRatingsForUser(userId, role),
    userDataExportReads.listComplaintsForUser(userId),
    userDataExportReads.listAuditLogForUser(userId, sinceIso),
  ]);

  let profile: Record<string, unknown> = { uid: userId };
  let kyc: UserDataExportResponse['kyc'] = null;
  let walletLedger: Array<Record<string, unknown>> = [];
  let fcmAcknowledged = false;

  if (role === 'TECHNICIAN') {
    const techDoc = await userDataExportReads.readTechnicianFullDoc(userId);
    if (techDoc.profile) {
      profile = { ...techDoc.profile, uid: userId };
    }
    if (techDoc.kyc) {
      kyc = {
        aadhaarMaskedNumber: techDoc.kyc.aadhaarMaskedNumber ?? null,
        panNumber: maskPan(techDoc.kyc.panNumber),
      };
    } else {
      kyc = { aadhaarMaskedNumber: null, panNumber: null };
    }
    fcmAcknowledged = techDoc.fcmToken !== null && techDoc.fcmToken !== undefined;
    const ledger = await userDataExportReads.listWalletLedgerForTechnician(userId);
    walletLedger = ledger.map((l) => ({
      id: l.id,
      bookingId: l.bookingId,
      bookingAmount: l.bookingAmount,
      commissionAmount: l.commissionAmount,
      techAmount: l.techAmount,
      payoutStatus: l.payoutStatus,
      createdAt: l.createdAt,
      settledAt: l.settledAt,
    }));
  }

  return {
    dataInventoryVersion: DATA_INVENTORY_VERSION,
    userId,
    role,
    profile,
    bookings: bookings.map((b) => projectBooking(b, role)),
    ratings: ratings.map((r) => projectRating(r, role)),
    complaints: complaints.map((c) => projectComplaint(c, role)),
    kyc,
    walletLedger,
    fcmTokens: { acknowledged: fcmAcknowledged },
    auditLogEntries: auditEntries.map((e) => ({
      id: e.id,
      action: e.action,
      resourceType: e.resourceType,
      timestamp: e.timestamp,
    })),
    generatedAt,
  };
}
