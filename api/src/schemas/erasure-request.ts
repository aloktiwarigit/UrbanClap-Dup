import { z } from 'zod';

export const ErasureRequestStatusEnum = z.enum([
  'PENDING',
  'EXECUTING',
  'EXECUTED',
  'REVOKED',
  'DENIED',
  'FAILED',
]);
export type ErasureRequestStatus = z.infer<typeof ErasureRequestStatusEnum>;

export const ErasureRequestUserRoleEnum = z.enum(['CUSTOMER', 'TECHNICIAN']);
export type ErasureRequestUserRole = z.infer<typeof ErasureRequestUserRoleEnum>;

export const ErasureRequestActionEnum = z.enum(['EXECUTE', 'DENY']);
export type ErasureRequestAction = z.infer<typeof ErasureRequestActionEnum>;

export const ErasureDenialReasonEnum = z.enum([
  'legal-hold',
  'regulatory-retention-conflict',
  'fraud-investigation',
]);
export type ErasureDenialReason = z.infer<typeof ErasureDenialReasonEnum>;

/** Per-container counts captured at EXECUTED time; auditor-visible. */
export const ErasureDeletedCountsSchema = z.object({
  bookings: z.number().int().nonnegative(),
  ratings: z.number().int().nonnegative(),
  complaints: z.number().int().nonnegative(),
  walletLedgerAnonymized: z.number().int().nonnegative(),
  bookingEventsAnonymized: z.number().int().nonnegative(),
  dispatchAttemptsAnonymized: z.number().int().nonnegative(),
  auditLogAnonymized: z.number().int().nonnegative(),
  technicianHardDeleted: z.boolean(),
  kycHardDeleted: z.boolean(),
  fcmTokensCleared: z.boolean(),
});
export type ErasureDeletedCounts = z.infer<typeof ErasureDeletedCountsSchema>;

export const ErasureRequestDocSchema = z.object({
  id: z.string(),
  partitionKey: z.string(),
  userId: z.string().min(1),
  userRole: ErasureRequestUserRoleEnum,
  status: ErasureRequestStatusEnum,
  reason: z.string().max(1000).optional(),
  requestedAt: z.string(),
  scheduledDeletionAt: z.string(),
  /** Per-request salt; only mechanism that links anonymizedHash back to userId. */
  /**
   * Per-request salt (32 hex chars at submit time). Wiped to empty string on
   * EXECUTED so that the natural-person uid cannot be re-derived from the
   * surviving doc. Schema accepts empty so the post-erasure shape parses.
   */
  anonymizationSalt: z.string(),
  /** SHA-256(userId + salt); set at EXECUTING and retained for ops cross-reference. */
  anonymizedHash: z.string().optional(),
  /**
   * Set true on EXECUTED — userId has been replaced with anonymizedHash on
   * this doc so re-identification requires inputs no longer present.
   */
  userIdWiped: z.boolean().optional(),
  executedAt: z.string().optional(),
  revokedAt: z.string().optional(),
  deniedAt: z.string().optional(),
  denialReason: ErasureDenialReasonEnum.optional(),
  failedAt: z.string().optional(),
  failureReason: z.string().optional(),
  deletedCounts: ErasureDeletedCountsSchema.optional(),
});
export type ErasureRequestDoc = z.infer<typeof ErasureRequestDocSchema>;

/** Hardcoded confirmation phrase (case-sensitive). Defends against accidental deletion. */
export const ERASURE_CONFIRMATION_PHRASE = 'DELETE MY ACCOUNT';

export const ErasureRequestSubmitBodySchema = z.object({
  reason: z.string().max(1000).optional(),
  confirmationPhrase: z.literal(ERASURE_CONFIRMATION_PHRASE),
});
export type ErasureRequestSubmitBody = z.infer<typeof ErasureRequestSubmitBodySchema>;

export const ErasureRequestSubmitResponseSchema = z.object({
  erasureId: z.string(),
  scheduledDeletionAt: z.string(),
  status: ErasureRequestStatusEnum,
});
export type ErasureRequestSubmitResponse = z.infer<typeof ErasureRequestSubmitResponseSchema>;

export const AdminErasureExecuteBodySchema = z.object({
  action: z.literal('EXECUTE'),
});

export const AdminErasureDenyBodySchema = z.object({
  action: z.literal('DENY'),
  reason: ErasureDenialReasonEnum,
});

export const AdminErasurePatchBodySchema = z.discriminatedUnion('action', [
  AdminErasureExecuteBodySchema,
  AdminErasureDenyBodySchema,
]);
export type AdminErasurePatchBody = z.infer<typeof AdminErasurePatchBodySchema>;

/** Grace period (DPDP cool-off): 7 days from request to scheduled deletion. */
export const ERASURE_GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000;
