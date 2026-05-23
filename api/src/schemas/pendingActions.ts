/**
 * E11-S02 — Pending Actions schema (Cosmos container: pending_actions)
 *
 * Partition key: /userId
 * Composite index: (userId, status, expiresAt)
 * Individual indexes: priority, createdAt, type
 *
 * The `version` field is a monotonic int bumped on every mutation via
 * Cosmos optimistic concurrency (ETag/IfMatch). Semantic no-op mutations
 * do NOT bump version.
 */

import { z } from 'zod';

/** Maps 1:1 with FCM wire types (E11 spec §3.1 + §9.2). No invented names. */
export const PendingActionTypeSchema = z.enum([
  'ADDON_APPROVAL_REQUESTED',
  'RATING_PROMPT_CUSTOMER',
  'COMPLAINT_UPDATE',
  'RATING_RECEIVED',
  'KYC_RESUME',
  'JOB_OFFER',
]);

export const PendingActionStatusSchema = z.enum([
  'ACTIVE',
  'RESOLVED',
  'EXPIRED',
]);

/** Which app role this action targets. Used by read-API to scope queries. */
export const PendingActionRoleSchema = z.enum(['customer', 'technician']);

export const PendingActionDocSchema = z.object({
  /** Deterministic id: `<type>:<userId>:<sourceId>` — enables idempotent upsert. */
  id: z.string().min(1),
  /** Cosmos partition key. */
  userId: z.string().min(1),
  type: PendingActionTypeSchema,
  status: PendingActionStatusSchema,
  role: PendingActionRoleSchema,
  /** Monotonic int. Bumped on every non-no-op mutation. */
  version: z.number().int().nonnegative(),
  /** ISO 8601 expiry. Projector sets per action type. */
  expiresAt: z.string().datetime(),
  /** Lower number = higher priority. */
  priority: z.number().int().nonnegative(),
  /** ISO 8601 creation timestamp. */
  createdAt: z.string().datetime(),
  /** ISO 8601 last-updated timestamp. */
  updatedAt: z.string().datetime(),
  /** Source document id (booking id, rating id, etc.). */
  sourceId: z.string().min(1),
  /**
   * Arbitrary action-specific metadata.
   * Stored as a plain record so projectors can attach context without
   * schema churn (bookingId, technicianId, addonTotal, etc.).
   */
  payload: z.record(z.string(), z.unknown()).optional(),
});

export const PendingActionsListResponseSchema = z.object({
  items: z.array(PendingActionDocSchema),
  fetchedAt: z.string().datetime(),
});

export type PendingActionType = z.infer<typeof PendingActionTypeSchema>;
export type PendingActionStatus = z.infer<typeof PendingActionStatusSchema>;
export type PendingActionRole = z.infer<typeof PendingActionRoleSchema>;
export type PendingActionDoc = z.infer<typeof PendingActionDocSchema>;
export type PendingActionsListResponse = z.infer<typeof PendingActionsListResponseSchema>;

/** Build a deterministic Cosmos document id for a pending action. */
export function buildPendingActionId(
  type: PendingActionType,
  userId: string,
  sourceId: string,
): string {
  return `${type}:${userId}:${sourceId}`;
}
