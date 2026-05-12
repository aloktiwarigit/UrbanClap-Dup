/**
 * E11-S02 — Pending Action Projector harness.
 *
 * STRICT ORDERING INVARIANT: upsertAction() MUST be called and awaited before
 * emitFcmForAction() in any caller. The Semgrep rule `pending-action-fcm-ordering`
 * enforces this in trigger-projector-*.ts files.
 *
 * ETag/IfMatch optimistic concurrency (max 3 retries, exponential backoff):
 *   1. read row by id (returns _etag)
 *   2. compute new state; version = existing.version + 1 (skip if semantic no-op)
 *   3. replace with IfMatch: <_etag>
 *   4. on null (412) → re-read + retry
 *   5. on 3rd failure → throw
 */

import {
  getPendingActionById,
  createPendingAction,
  rawReplacePendingAction,
} from '../cosmos/pending-action-repository.js';
import type { PendingActionDoc, PendingActionRole, PendingActionType } from '../schemas/pendingActions.js';
import { buildPendingActionId } from '../schemas/pendingActions.js';
import { getFirebaseAdmin } from './firebaseAdmin.js';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UpsertActionInput {
  id: string;
  userId: string;
  type: PendingActionType;
  role: PendingActionRole;
  sourceId: string;
  expiresAt: string;
  priority: number;
  payload?: Record<string, unknown>;
}

export interface UpsertActionResult {
  doc: PendingActionDoc;
  created: boolean;
  noOp: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 50;

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function now(): string {
  return new Date().toISOString();
}

/**
 * Determine if a proposed mutation is semantically equivalent to the current
 * stored state (i.e., no meaningful change). If so, skip the write entirely
 * so version does not inflate on duplicate change-feed deliveries.
 */
function isSemanticNoOp(
  existing: PendingActionDoc,
  input: UpsertActionInput,
): boolean {
  if (existing.status !== 'ACTIVE') return false; // status change is always meaningful
  if (existing.type !== input.type) return false;
  if (existing.expiresAt !== input.expiresAt) return false;
  if (existing.priority !== input.priority) return false;
  // Deep-compare payload — only check top-level keys for perf
  const ep = JSON.stringify(existing.payload ?? {});
  const np = JSON.stringify(input.payload ?? {});
  return ep === np;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Idempotent upsert with ETag/IfMatch optimistic concurrency.
 *
 * Creates the action if it doesn't exist; bumps version and updates fields
 * if the mutation is real; returns noOp=true if the state is unchanged.
 */
export async function upsertAction(input: UpsertActionInput): Promise<UpsertActionResult> {
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    const existing = await getPendingActionById(input.id, input.userId);

    if (!existing) {
      // First time seeing this action — create it
      const doc: PendingActionDoc = {
        id: input.id,
        userId: input.userId,
        type: input.type,
        status: 'ACTIVE',
        role: input.role,
        version: 0,
        expiresAt: input.expiresAt,
        priority: input.priority,
        createdAt: now(),
        updatedAt: now(),
        sourceId: input.sourceId,
        payload: input.payload,
      };
      const created = await createPendingAction(doc);
      _log('pending_action_upsert', {
        id: created.id,
        version: created.version,
        action_type: created.type,
        projector_source: 'create',
      });
      return { doc: created, created: true, noOp: false };
    }

    // Semantic no-op check — skip write and version bump
    if (isSemanticNoOp(existing, input)) {
      _log('pending_action_stale_drop', {
        id: existing.id,
        existing_version: existing.version,
        incoming_version: existing.version, // same — no bump
      });
      return { doc: existing, created: false, noOp: true };
    }

    const etag = existing._etag ?? '';
    const updated: PendingActionDoc = {
      ...existing,
      type: input.type,
      expiresAt: input.expiresAt,
      priority: input.priority,
      payload: input.payload,
      version: existing.version + 1,
      updatedAt: now(),
    };

    const replaced = await rawReplacePendingAction(updated, etag, existing.userId);

    if (replaced !== null) {
      _log('pending_action_upsert', {
        id: replaced.id,
        version: replaced.version,
        action_type: replaced.type,
        projector_source: 'update',
      });
      return { doc: replaced, created: false, noOp: false };
    }

    // null → 412 ETag conflict; re-read and retry
    attempt++;
    if (attempt < MAX_RETRIES) {
      await sleep(BASE_DELAY_MS * Math.pow(2, attempt - 1));
    }
  }

  throw new Error(
    `upsertAction: max retries (${MAX_RETRIES}) exhausted for id=${input.id}`,
  );
}

/**
 * Mark a pending action as RESOLVED (e.g., booking moves to PAID after add-on).
 * Bumps version via ETag optimistic concurrency. Is a no-op if already RESOLVED.
 */
export async function resolveAction(
  id: string,
  userId: string,
): Promise<PendingActionDoc | null> {
  return _transitionStatus(id, userId, 'RESOLVED');
}

/**
 * Mark a pending action as EXPIRED (e.g., dispatch_attempts TTL elapsed).
 * Bumps version via ETag optimistic concurrency.
 */
export async function expireAction(
  id: string,
  userId: string,
): Promise<PendingActionDoc | null> {
  return _transitionStatus(id, userId, 'EXPIRED');
}

/**
 * Send an FCM push notification for a pending action.
 *
 * MUST be called AFTER upsertAction() — never before.
 * The Semgrep rule `pending-action-fcm-ordering` enforces this in projector files.
 *
 * Does not retry inline on failure; relies on next change-feed re-delivery.
 */
export async function emitFcmForAction(
  doc: PendingActionDoc,
  _projectorSource: string,
): Promise<void> {
  const topic = doc.role === 'customer'
    ? `customer_${doc.userId}`
    : `technician_${doc.userId}`;

  const start = Date.now();
  _log('fcm_send_attempt', { action_id: doc.id, target_user_id: doc.userId });

  try {
    await getFirebaseAdmin().messaging().send({
      topic,
      data: {
        type: doc.type,
        actionId: doc.id,
        sourceId: doc.sourceId,
        ...(doc.payload ? { payload: JSON.stringify(doc.payload) } : {}),
      },
    });
    _log('fcm_send_success', { action_id: doc.id, ms_elapsed: Date.now() - start });
  } catch (err: unknown) {
    const errorCode = err instanceof Error ? err.message : String(err);
    _log('fcm_send_failure', { action_id: doc.id, error_code: errorCode });
    // No inline retry — rely on next reconcile via change-feed re-delivery
  }
}

/**
 * Convenience factory for building a deterministic action id.
 * Re-exported from schema module for projector use.
 */
export { buildPendingActionId };

// ── Private helpers ───────────────────────────────────────────────────────────

async function _transitionStatus(
  id: string,
  userId: string,
  targetStatus: 'RESOLVED' | 'EXPIRED',
): Promise<PendingActionDoc | null> {
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    const existing = await getPendingActionById(id, userId);
    if (!existing) return null;
    if (existing.status === targetStatus) return existing; // already in target state — no-op

    const etag = existing._etag ?? '';
    const updated: PendingActionDoc = {
      ...existing,
      status: targetStatus,
      version: existing.version + 1,
      updatedAt: now(),
    };

    const replaced = await rawReplacePendingAction(updated, etag, userId);
    if (replaced !== null) {
      _log('pending_action_upsert', {
        id: replaced.id,
        version: replaced.version,
        action_type: replaced.type,
        projector_source: `transition_to_${targetStatus.toLowerCase()}`,
      });
      return replaced;
    }

    attempt++;
    if (attempt < MAX_RETRIES) {
      await sleep(BASE_DELAY_MS * Math.pow(2, attempt - 1));
    }
  }

  throw new Error(
    `_transitionStatus(${targetStatus}): max retries exhausted for id=${id}`,
  );
}

/**
 * Structured OTel log — emits via console.log so Azure Functions / Application
 * Insights pick it up through the existing OpenTelemetry pipeline configured
 * in api/src/observability/otel.ts.
 *
 * Format mirrors the existing InvocationContext-based structured logs used
 * across the codebase (JSON-serialisable key-value pairs).
 */
function _log(event: string, fields: Record<string, unknown>): void {
  try {
    console.log(JSON.stringify({ event, ...fields, ts: new Date().toISOString() }));
  } catch {
    // Logging must never throw
  }
}
