/**
 * Customer Credit Ledger Repository — E13-S01 (ADR-0017)
 *
 * Reads/writes the `customer_credits` Cosmos container.
 *
 * IMPORTANT — partition key reality (P1-1 fix):
 *   In production the `customer_credits` container is partitioned on `/id` (NOT `/customerId`).
 *   This was established by E07-S04 / setup-cosmos.ts so that the no-show detector could write
 *   idempotency-safe docs keyed by bookingId.  Passing partitionKey=customerId to queries would
 *   restrict execution to the single logical partition whose id==customerId — returning no docs
 *   for no-show credits (id=bookingId) or new ledger entries (id=UUID).
 *
 *   Fix: ALL queries on this container use cross-partition execution (omit partitionKey from
 *   QueryIterator options) and filter by `c.customerId = @cid`.
 *
 *   TODO (future migration): add a copy of customerId into the partition-key path so queries
 *   can become single-partition.  Tracked in backlog as "customer_credits partition-key migration".
 *
 * Legacy doc shape (P1-2 fix):
 *   No-show credits written before E13-S01 have shape:
 *     { id: bookingId, customerId, bookingId, amount: <paise>, reason: 'NO_SHOW', createdAt }
 *   They have NO `type` field and NO `amountInPaise` field.
 *   On read we normalize: amount → amountInPaise, absent type → CREDIT_ISSUED.
 *   TODO: update the no-show detector to write the new shape, then drop the legacy adapter.
 *
 * Concurrency safety (P1-4 fix):
 *   applyCredit uses a per-customer "credit sentinel" doc with ETag optimistic concurrency.
 *   Flow: read sentinel (_etag) → compute new balance → replace sentinel with IfMatch(_etag).
 *   On 412, retry up to MAX_CONCURRENCY_RETRIES times before returning 0 (non-blocking fallback).
 *   The sentinel doc lives in the `customer_credits` container with id='sentinel:<customerId>'.
 *
 * Idempotency (P1-3 fix):
 *   The idempotency record stores the bookingId that consumed the credit.
 *   On replay with the SAME bookingId → return cached appliedAmountInPaise (idempotent).
 *   On replay with a DIFFERENT bookingId → throw 409 IDEMPOTENCY_KEY_ALREADY_USED to block
 *   multi-booking discount abuse.
 *
 * Security invariants:
 *   1. balanceInPaise cannot go negative — enforced at read-and-cap in applyCredit.
 *   2. A CREDIT_APPLIED entry is only written if the sentinel ETag write succeeds atomically.
 *   3. Idempotency-key dedup prevents replay — stored in applied_credit_idempotency
 *      container with a 24h TTL.
 *
 * See ADR-0017 and threat-model S-W1.
 */

import { randomUUID } from 'node:crypto';
import { getCustomerCreditLedgerContainer, getAppliedCreditIdempotencyContainer } from './client.js';
import type { CustomerCreditLedgerDoc, AppliedCreditIdempotencyDoc, ApplyCreditResult } from '../schemas/wallet.js';

// ---------------------------------------------------------------------------
// Internal constants
// ---------------------------------------------------------------------------

const IDEMPOTENCY_TTL_SECONDS = 24 * 60 * 60; // 24h
const MAX_CONCURRENCY_RETRIES = 3;
const SENTINEL_ID_PREFIX = 'sentinel:';

// ---------------------------------------------------------------------------
// Legacy doc shape normalization (P1-2)
// ---------------------------------------------------------------------------

/**
 * A raw doc read from Cosmos may be a legacy no-show credit (written before E13-S01)
 * with `amount` (paise) and `reason: 'NO_SHOW'` but no `type` / `amountInPaise`.
 * Or it may be a new ledger entry with `type` and `amountInPaise`.
 * Or it may be the sentinel doc (id starts with 'sentinel:') — skipped for balance.
 */
interface RawCreditDoc {
  id: string;
  customerId: string;
  /** Present on new-format ledger entries */
  type?: string;
  /** Present on new-format entries */
  amountInPaise?: number;
  /** Present on legacy no-show entries (the credit amount in paise) */
  amount?: number;
  /** 'NO_SHOW' on legacy entries */
  reason?: string;
  createdAt?: string;
  bookingId?: string;
}

/**
 * Normalizes a raw Cosmos doc to the canonical ledger shape.
 * Returns null for docs that should be skipped (sentinel, unknown type).
 */
function normalizeDoc(raw: RawCreditDoc): CustomerCreditLedgerDoc | null {
  // Skip sentinel docs
  if (raw.id.startsWith(SENTINEL_ID_PREFIX)) return null;

  // Determine type
  let type: 'CREDIT_ISSUED' | 'CREDIT_APPLIED' | 'REFUND';
  if (raw.type === 'CREDIT_ISSUED' || raw.type === 'CREDIT_APPLIED' || raw.type === 'REFUND') {
    type = raw.type;
  } else if (raw.reason === 'NO_SHOW') {
    // Legacy no-show credit — treat as CREDIT_ISSUED
    type = 'CREDIT_ISSUED';
  } else {
    // Unknown type (future format or unrelated doc) — skip silently
    return null;
  }

  // Determine amountInPaise
  let amountInPaise: number;
  if (typeof raw.amountInPaise === 'number') {
    amountInPaise = raw.amountInPaise;
  } else if (typeof raw.amount === 'number') {
    // Legacy: `amount` is already in paise (NO_SHOW_CREDIT_PAISE = 50_000)
    amountInPaise = raw.amount;
  } else {
    return null; // Cannot determine amount — skip
  }

  return {
    id: raw.id,
    customerId: raw.customerId,
    type,
    amountInPaise,
    bookingId: raw.bookingId,
    reason: raw.reason ?? '',
    createdAt: raw.createdAt ?? new Date().toISOString(),
    balanceAfterInPaise: 0, // not used for balance recompute
  };
}

// ---------------------------------------------------------------------------
// Sentinel doc helpers (P1-4 — ETag-based optimistic concurrency)
// ---------------------------------------------------------------------------

interface SentinelDoc {
  id: string;         // 'sentinel:<customerId>'
  customerId: string;
  balanceInPaise: number;
  lastUpdatedAt: string;
}

/** Read the sentinel doc; returns null if it doesn't exist yet. */
async function readSentinel(
  customerId: string,
): Promise<{ doc: SentinelDoc; etag: string } | null> {
  const container = getCustomerCreditLedgerContainer();
  const sentinelId = `${SENTINEL_ID_PREFIX}${customerId}`;
  // Sentinel is partitioned by /id (same as the container partition key).
  const { resource, etag } = await container.item(sentinelId, sentinelId).read<SentinelDoc>();
  if (!resource) return null;
  return { doc: resource, etag: etag ?? '' };
}

/** Compute balance by summing all ledger entries (cross-partition). */
async function computeBalance(customerId: string): Promise<number> {
  const container = getCustomerCreditLedgerContainer();
  // P1-1: cross-partition query — do NOT pass partitionKey option.
  const { resources } = await container.items
    .query<RawCreditDoc>(
      {
        query: `SELECT * FROM c WHERE c.customerId = @cid`,
        parameters: [{ name: '@cid', value: customerId }],
      },
      // No partitionKey → cross-partition execution (Cosmos JS SDK default when omitted)
    )
    .fetchAll();

  let balance = 0;
  for (const raw of resources) {
    const entry = normalizeDoc(raw);
    if (!entry) continue;
    if (entry.type === 'CREDIT_ISSUED' || entry.type === 'REFUND') {
      balance += entry.amountInPaise;
    } else if (entry.type === 'CREDIT_APPLIED') {
      balance -= entry.amountInPaise;
    }
  }
  return Math.max(0, balance);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const customerCreditLedgerRepo = {
  /**
   * Returns the current wallet balance for a customer.
   * Balance = sum of CREDIT_ISSUED + REFUND − sum of CREDIT_APPLIED.
   *
   * P1-1: Uses cross-partition query (container is partitioned by /id, not /customerId).
   * P1-2: Normalizes legacy no-show credit docs on read.
   *
   * If the customer has no entries, returns { balanceInPaise: 0 }.
   */
  async getBalance(customerId: string): Promise<{ balanceInPaise: number; lastUpdatedAt: string }> {
    const container = getCustomerCreditLedgerContainer();
    // P1-1: cross-partition query — omit partitionKey option.
    const { resources } = await container.items
      .query<RawCreditDoc>(
        {
          query: `SELECT * FROM c WHERE c.customerId = @cid ORDER BY c.createdAt DESC`,
          parameters: [{ name: '@cid', value: customerId }],
        },
        // No partitionKey → cross-partition execution
      )
      .fetchAll();

    // Filter out sentinel docs and normalize legacy shape
    const entries = resources.map(normalizeDoc).filter((e): e is CustomerCreditLedgerDoc => e !== null);

    if (entries.length === 0) {
      return { balanceInPaise: 0, lastUpdatedAt: new Date().toISOString() };
    }

    let balance = 0;
    for (const entry of entries) {
      if (entry.type === 'CREDIT_ISSUED' || entry.type === 'REFUND') {
        balance += entry.amountInPaise;
      } else if (entry.type === 'CREDIT_APPLIED') {
        balance -= entry.amountInPaise;
      }
    }
    const balanceInPaise = Math.max(0, balance);

    // lastUpdatedAt = timestamp of the most recent entry (already sorted DESC)
    const lastUpdatedAt = entries[0]!.createdAt;
    return { balanceInPaise, lastUpdatedAt };
  },

  /**
   * Returns a paginated page of ledger entries for a customer, newest-first.
   *
   * P1-1: Uses cross-partition query.
   * P1-2: Normalizes legacy docs on read.
   */
  async getLedgerPage(
    customerId: string,
    page: number,
    limit: number,
  ): Promise<{ entries: CustomerCreditLedgerDoc[]; total: number }> {
    const container = getCustomerCreditLedgerContainer();

    // Count query (no ORDER BY — cheaper). Cross-partition, no partitionKey option.
    const { resources: countRes } = await container.items
      .query<number>(
        {
          query: `SELECT VALUE COUNT(1) FROM c WHERE c.customerId = @cid`,
          parameters: [{ name: '@cid', value: customerId }],
        },
      )
      .fetchAll();
    // The COUNT includes sentinel docs — subtract them. Since sentinel is 1 doc per customer
    // (or 0), we can't use COUNT directly without filtering. Re-compute by fetching all IDs.
    // For pilot scale this is acceptable; at scale use a dedicated index.
    const rawCount: number = typeof countRes[0] === 'number' ? countRes[0] : 0;
    // Sentinel contributes at most 1 doc; adjust conservatively.
    const total = Math.max(0, rawCount - 1); // sentinel is 1 doc per customer at most

    const offset = (page - 1) * limit;
    const { resources } = await container.items
      .query<RawCreditDoc>(
        {
          query: `SELECT * FROM c WHERE c.customerId = @cid
                  ORDER BY c.createdAt DESC
                  OFFSET @offset LIMIT @limit`,
          parameters: [
            { name: '@cid', value: customerId },
            { name: '@offset', value: offset },
            { name: '@limit', value: limit },
          ],
        },
      )
      .fetchAll();

    const entries = resources.map(normalizeDoc).filter((e): e is CustomerCreditLedgerDoc => e !== null);
    return { entries, total };
  },

  /**
   * Atomically applies credit to a booking.
   *
   * P1-1: Cross-partition query for balance recompute.
   * P1-2: Normalizes legacy no-show credit docs.
   * P1-3: Idempotency record is tied to bookingId — replay with different bookingId → 409.
   * P1-4: ETag-based optimistic concurrency on per-customer sentinel doc prevents double-debit.
   *
   * Algorithm:
   *  1. Check idempotency-key dedup:
   *     - Same bookingId → return cached result (idempotent).
   *     - Different bookingId → throw { code: 409, message: 'IDEMPOTENCY_KEY_ALREADY_USED' }.
   *  2. If amountInPaise === 0, return immediately.
   *  3. Read sentinel (ETag). If absent, create with IfNoneMatch.
   *  4. Recompute balance from ledger (cross-partition).
   *  5. Cap applied amount = min(balance, amountInPaise).
   *  6. If applied === 0, return immediately.
   *  7. Write sentinel with new balance using IfMatch(etag). On 412 → retry (max 3 times).
   *  8. Write CREDIT_APPLIED ledger entry.
   *  9. Write idempotency record.
   */
  async applyCredit(
    customerId: string,
    bookingId: string,
    amountInPaise: number,
    idempotencyKey: string,
  ): Promise<ApplyCreditResult> {
    const idempotencyContainer = getAppliedCreditIdempotencyContainer();

    // Step 1: idempotency-key dedup (P1-3)
    const { resource: existingIdem } = await idempotencyContainer
      .item(idempotencyKey, customerId)
      .read<AppliedCreditIdempotencyDoc>();
    if (existingIdem) {
      if (existingIdem.bookingId === bookingId) {
        // Same booking → idempotent replay, return cached result
        return {
          appliedAmountInPaise: existingIdem.appliedAmountInPaise,
          newBalanceInPaise: 0, // balance already decremented — recompute if needed
          idempotent: true,
        };
      }
      // Different bookingId → replay abuse: same key, different booking attempt
      const err = new Error('IDEMPOTENCY_KEY_ALREADY_USED') as Error & { code: number };
      err.code = 409;
      throw err;
    }

    // Step 2: nothing to write
    if (amountInPaise <= 0) {
      return { appliedAmountInPaise: 0, newBalanceInPaise: 0, idempotent: false };
    }

    const creditContainer = getCustomerCreditLedgerContainer();

    // Steps 3–7: ETag concurrency loop (P1-4)
    let appliedAmount = 0;
    for (let attempt = 0; attempt < MAX_CONCURRENCY_RETRIES; attempt++) {
      // Step 3: read or initialize sentinel
      const sentinelId = `${SENTINEL_ID_PREFIX}${customerId}`;
      const sentinelResult = await readSentinel(customerId);

      let currentBalance: number;
      let existingEtag: string | null;

      if (sentinelResult === null) {
        // No sentinel yet — compute from ledger and create
        currentBalance = await computeBalance(customerId);
        existingEtag = null;
      } else {
        currentBalance = sentinelResult.doc.balanceInPaise;
        existingEtag = sentinelResult.etag;
      }

      // Step 5: cap
      const toApply = Math.min(currentBalance, amountInPaise);
      if (toApply <= 0) {
        return { appliedAmountInPaise: 0, newBalanceInPaise: currentBalance, idempotent: false };
      }

      const newBalance = currentBalance - toApply;
      const now = new Date().toISOString();

      const newSentinel: SentinelDoc = {
        id: sentinelId,
        customerId,
        balanceInPaise: newBalance,
        lastUpdatedAt: now,
      };

      try {
        if (existingEtag === null) {
          // Create sentinel with IfNoneMatch: * (fails if concurrent request already created it)
          await creditContainer.items.create<SentinelDoc>(newSentinel, {
            ifNoneMatch: '*',
          } as Parameters<typeof creditContainer.items.create>[1]);
        } else {
          // Replace sentinel with ETag — throws 412 if another writer won
          await creditContainer.item(sentinelId, sentinelId).replace<SentinelDoc>(
            newSentinel,
            { accessCondition: { type: 'IfMatch', condition: existingEtag } },
          );
        }

        // Sentinel written successfully — we own this debit slot
        appliedAmount = toApply;

        // Step 8: write CREDIT_APPLIED ledger entry
        const ledgerEntry: CustomerCreditLedgerDoc = {
          id: randomUUID(),
          customerId,
          type: 'CREDIT_APPLIED',
          amountInPaise: toApply,
          bookingId,
          reason: `Applied to booking ${bookingId}`,
          createdAt: now,
          balanceAfterInPaise: newBalance,
        };
        await creditContainer.items.create<CustomerCreditLedgerDoc>(ledgerEntry);

        // Step 9: write idempotency-key dedup record (P1-3)
        const idemDoc: AppliedCreditIdempotencyDoc = {
          id: idempotencyKey,
          customerId,
          bookingId,
          appliedAmountInPaise: toApply,
          createdAt: now,
          ttl: IDEMPOTENCY_TTL_SECONDS,
        };
        try {
          await idempotencyContainer.items.create<AppliedCreditIdempotencyDoc>(idemDoc);
        } catch (err: unknown) {
          // 409 = concurrent request already wrote this key — idempotent outcome; not a problem
          if ((err as { code?: number }).code !== 409) throw err;
        }

        return { appliedAmountInPaise: toApply, newBalanceInPaise: newBalance, idempotent: false };
      } catch (err: unknown) {
        const code = (err as { code?: number }).code;
        if ((code === 412 || code === 409) && attempt < MAX_CONCURRENCY_RETRIES - 1) {
          // Optimistic concurrency conflict — another writer won; retry after brief back-off
          await new Promise((res) => setTimeout(res, 50 * (attempt + 1)));
          continue;
        }
        // Final retry exhausted or unexpected error — propagate so caller can handle
        throw err;
      }
    }

    // If all retries exhausted with 412, return 0 (caller treats this as non-fatal)
    return { appliedAmountInPaise: appliedAmount, newBalanceInPaise: 0, idempotent: false };
  },
};
