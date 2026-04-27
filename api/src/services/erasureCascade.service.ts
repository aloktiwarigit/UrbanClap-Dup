import { createHash } from 'node:crypto';
import { userDataCascadeWrites } from '../cosmos/user-data-cascade-writes.js';
import type { ErasureDeletedCounts, ErasureRequestDoc } from '../schemas/erasure-request.js';

/**
 * Computes the irreversible anonymized hash from uid + per-request salt.
 * SHA-256 hex (64 chars). The salt is the only mechanism that links the
 * hash back to the natural-person uid — and only if regulatory hold
 * required us to retain it.
 */
export function computeAnonymizedHash(uid: string, salt: string): string {
  return createHash('sha256').update(`${uid}:${salt}`).digest('hex');
}

/**
 * Executes the DPDP §12 cascade for a single erasure request.
 *
 * Caller MUST have already transitioned the request to EXECUTING and persisted
 * the anonymizedHash (so admin retries are idempotent: each step's natural
 * predicate ("rows where customerId = uid") becomes a no-op once executed).
 *
 * Each cosmos cross-container step is independently retryable. Failures here
 * propagate up to the caller, which marks the request FAILED and may retry.
 */
export async function executeErasureCascade(
  request: Pick<ErasureRequestDoc, 'userId' | 'userRole' | 'anonymizationSalt'>,
): Promise<ErasureDeletedCounts> {
  const { userId, userRole, anonymizationSalt } = request;
  const hash = computeAnonymizedHash(userId, anonymizationSalt);

  // Anonymize across containers in parallel — they target disjoint containers.
  const [
    bookings,
    ratings,
    complaints,
    walletLedgerAnonymized,
    bookingEventsAnonymized,
    dispatchAttemptsAnonymized,
    auditLogAnonymized,
  ] = await Promise.all([
    userDataCascadeWrites.anonymizeBookings(userId, hash),
    userDataCascadeWrites.anonymizeRatings(userId, hash),
    userDataCascadeWrites.anonymizeComplaints(userId, hash),
    userRole === 'TECHNICIAN'
      ? userDataCascadeWrites.anonymizeWalletLedger(userId, hash)
      : Promise.resolve(0),
    userDataCascadeWrites.anonymizeBookingEvents(userId, hash),
    userDataCascadeWrites.anonymizeDispatchAttempts(userId, hash),
    userDataCascadeWrites.anonymizeAuditLogResourceId(userId, hash),
  ]);

  let technicianHardDeleted = false;
  let kycHardDeleted = false;
  let fcmTokensCleared = false;

  if (userRole === 'TECHNICIAN') {
    // Clear FCM token before hard-delete (so the doc still exists for the patch).
    fcmTokensCleared = await userDataCascadeWrites.clearFcmTokenForTechnician(userId);
    // KYC is nested inside the technician doc — hard-deleting the doc removes it too.
    technicianHardDeleted = await userDataCascadeWrites.hardDeleteTechnician(userId);
    kycHardDeleted = technicianHardDeleted;
  } else {
    // Customer FCM is topic-based (`customer_<uid>`); no per-doc cleanup needed.
    fcmTokensCleared = true;
  }

  return {
    bookings,
    ratings,
    complaints,
    walletLedgerAnonymized,
    bookingEventsAnonymized,
    dispatchAttemptsAnonymized,
    auditLogAnonymized,
    technicianHardDeleted,
    kycHardDeleted,
    fcmTokensCleared,
  };
}
