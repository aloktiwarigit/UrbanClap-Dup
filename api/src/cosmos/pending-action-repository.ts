/**
 * E11-S02 — pending_actions Cosmos repository.
 *
 * All queries MUST include userId in the WHERE clause to avoid cross-partition
 * scans (Cosmos Serverless has no provisioned RU budget to absorb them).
 */

import { getPendingActionsContainer } from './client.js';
import type { PendingActionDoc } from '../schemas/pendingActions.js';
import { PendingActionDocSchema } from '../schemas/pendingActions.js';

/** Read a single action by its deterministic id. Returns null if not found. */
export async function getPendingActionById(
  id: string,
  userId: string,
): Promise<(PendingActionDoc & { _etag?: string }) | null> {
  const { resource } = await getPendingActionsContainer()
    .item(id, userId)
    .read<PendingActionDoc & { _etag?: string }>();
  return resource ?? null;
}

/** Query ACTIVE pending actions for a user, ordered by priority asc, expiresAt asc. */
export async function getActivePendingActions(
  userId: string,
  nowIso: string,
): Promise<PendingActionDoc[]> {
  const { resources } = await getPendingActionsContainer()
    .items.query<PendingActionDoc>({
      query: `SELECT * FROM c
              WHERE c.userId = @userId
                AND c.status = 'ACTIVE'
                AND c.expiresAt > @now`,
      parameters: [
        { name: '@userId', value: userId },
        { name: '@now', value: nowIso },
      ],
    })
    .fetchAll();

  // Sort by priority asc then expiresAt asc in-memory; Cosmos Serverless sorts
  // on cross-partition queries only when a composite index is present, which
  // we provision in the container config script. In-memory sort is always safe.
  return resources.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.expiresAt.localeCompare(b.expiresAt);
  });
}

/** Raw upsert — used by the projector harness only (it manages ETag). */
export async function rawReplacePendingAction(
  doc: PendingActionDoc,
  etag: string,
  userId: string,
): Promise<PendingActionDoc | null> {
  try {
    const { resource } = await getPendingActionsContainer()
      .item(doc.id, userId)
      .replace<PendingActionDoc>(doc, {
        accessCondition: { type: 'IfMatch', condition: etag },
      });
    return resource ?? null;
  } catch (e: unknown) {
    if (isCosmosConflict(e)) return null; // 412 — caller retries
    throw e;
  }
}

/** Create a new pending action doc. Caller must not call this if id already exists. */
export async function createPendingAction(doc: PendingActionDoc): Promise<PendingActionDoc> {
  const validated = PendingActionDocSchema.parse(doc);
  const { resource } = await getPendingActionsContainer().items.create<PendingActionDoc>(validated);
  return resource!;
}

function isCosmosConflict(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as { code?: unknown }).code === 412
  );
}
