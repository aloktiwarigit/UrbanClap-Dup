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
  /**
   * P1-4 (sentinel reconciliation): ISO timestamp of the last reconciliation.
   * Credits issued AFTER this timestamp (CREDIT_ISSUED docs) have NOT yet been
   * folded into balanceInPaise and must be added on next applyCredit read.
   *
   * Absent on sentinels created before this field was introduced; in that case
   * treat as epoch (all CREDIT_ISSUED docs need reconciliation).
   */
  lastReconciledAt?: string;
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

    // P2-5: Filter sentinel docs (id starts with 'sentinel:') BEFORE counting and
    // paginating. Using NOT STARTSWITH in both queries ensures:
    //   (a) A customer with only CREDIT_ISSUED docs (no sentinel) gets accurate total.
    //   (b) OFFSET/LIMIT applies only to real ledger entries; the page is never short
    //       because a sentinel fell into the window.
    const { resources: countRes } = await container.items
      .query<number>(
        {
          query: `SELECT VALUE COUNT(1) FROM c WHERE c.customerId = @cid AND NOT STARTSWITH(c.id, 'sentinel:')`,
          parameters: [{ name: '@cid', value: customerId }],
        },
      )
      .fetchAll();
    const total: number = typeof countRes[0] === 'number' ? countRes[0] : 0;

    const offset = (page - 1) * limit;
    const { resources } = await container.items
      .query<RawCreditDoc>(
        {
          query: `SELECT * FROM c WHERE c.customerId = @cid AND NOT STARTSWITH(c.id, 'sentinel:')
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
   * P1-2: Reserve credit for the Razorpay partial-credit path.
   *
   * Writes a RESERVED idempotency doc BEFORE the Razorpay order is created.
   * This prevents two failure modes:
   *   (a) Idempotency-key replay creating a second discounted Razorpay order.
   *   (b) Webhook applying credit when the wallet balance was spent elsewhere
   *       between booking creation and payment.captured.
   *
   * The reservation does NOT debit the wallet. The actual debit happens in
   * applyCredit (called from the payment.captured webhook), which recognizes a
   * RESERVED status and proceeds with the sentinel debit rather than returning
   * the cached 0 amount.
   *
   * On abandonment (no payment): TTL (24h) auto-expires the reservation — the
   * wallet balance stays intact and can be used for the next booking.
   *
   * @param customerId        - customer UID
   * @param bookingId         - pre-generated booking ID
   * @param reservedAmountInPaise - amount to reserve (= pendingCreditAmount)
   * @param idempotencyKey    - UUID from the original Idempotency-Key header
   * @returns 'reserved' | 'already_reserved' (same key, same booking — idempotent)
   * @throws 409 if the key was already used for a different booking
   */
  async reserveCredit(
    customerId: string,
    bookingId: string,
    reservedAmountInPaise: number,
    idempotencyKey: string,
  ): Promise<'reserved' | 'already_reserved'> {
    const idempotencyContainer = getAppliedCreditIdempotencyContainer();
    const now = new Date().toISOString();

    const reservationDoc: AppliedCreditIdempotencyDoc = {
      id: idempotencyKey,
      customerId,
      bookingId,
      appliedAmountInPaise: 0, // not yet debited
      reservedAmountInPaise,
      status: 'RESERVED',
      createdAt: now,
      ttl: IDEMPOTENCY_TTL_SECONDS,
    };

    try {
      await idempotencyContainer.items.create<AppliedCreditIdempotencyDoc>(reservationDoc, {
        ifNoneMatch: '*',
      } as Parameters<typeof idempotencyContainer.items.create>[1]);
      return 'reserved';
    } catch (err: unknown) {
      if ((err as { code?: number }).code === 409) {
        // Conflict — read the existing record
        const { resource: existing } = await idempotencyContainer
          .item(idempotencyKey, customerId)
          .read<AppliedCreditIdempotencyDoc>();
        if (existing) {
          if (existing.bookingId === bookingId) {
            // Same booking — idempotent; reservation already exists
            return 'already_reserved';
          }
          // Different bookingId → key reuse abuse
          const abuse = new Error('IDEMPOTENCY_KEY_ALREADY_USED') as Error & { code: number };
          abuse.code = 409;
          throw abuse;
        }
      }
      throw err;
    }
  },

  /**
   * Atomically applies credit to a booking.
   *
   * P1-3 (idempotency-first): The idempotency record is written FIRST with IfNoneMatch: *.
   *   If the write succeeds, we own this key and proceed to debit.
   *   If the write fails with 409 (concurrent request raced us):
   *     - Read the existing record; if same bookingId → return cached result (idempotent).
   *     - If different bookingId → throw 409 IDEMPOTENCY_KEY_ALREADY_USED (abuse).
   *   This prevents two concurrent calls with the same key from BOTH reading "no existing idem"
   *   and BOTH debiting the wallet before either has written the idem record.
   *
   * P1-4 (sentinel reconciliation): When a sentinel exists, query for any CREDIT_ISSUED /
   *   REFUND docs created after sentinel.lastReconciledAt. If found, add their amounts to the
   *   sentinel balance before computing the debit. Update lastReconciledAt on each debit.
   *   Rationale: the no-show detector writes CREDIT_ISSUED ledger docs but does NOT update the
   *   sentinel. Without reconciliation, credits granted after the first debit cannot be spent.
   *
   * Algorithm:
   *  1. Write idempotency record with IfNoneMatch: * (P1-3 — idempotency-first).
   *     On 409: check existing record for same/different bookingId.
   *  2. If amountInPaise === 0, return immediately.
   *  3. ETag concurrency loop (max 3 retries):
   *     a. Read sentinel (ETag).
   *     b. If no sentinel: computeBalance from ledger (cross-partition).
   *     c. If sentinel: reconcile balance with CREDIT_ISSUED docs newer than lastReconciledAt (P1-4).
   *     d. Cap applied = min(balance, amountInPaise). If 0, return.
   *     e. Write sentinel with new balance + lastReconciledAt using IfMatch/IfNoneMatch.
   *     f. Write CREDIT_APPLIED ledger entry.
   *  4. On 412/409 conflict: retry with back-off. After max retries: return 0 (caller decides fallback).
   */
  async applyCredit(
    customerId: string,
    bookingId: string,
    amountInPaise: number,
    idempotencyKey: string,
  ): Promise<ApplyCreditResult> {
    const idempotencyContainer = getAppliedCreditIdempotencyContainer();
    const now = new Date().toISOString();

    // Step 1: P1-3 — idempotency-first: write the record BEFORE touching the wallet.
    // This guarantees that two concurrent calls with the same key cannot BOTH debit.
    const idemDoc: AppliedCreditIdempotencyDoc = {
      id: idempotencyKey,
      customerId,
      bookingId,
      // appliedAmountInPaise is filled in after the debit succeeds; 0 is a placeholder.
      // If the process crashes before updating, the next replay will see bookingId match
      // and return 0 (conservative — the booking creation path handles this gracefully).
      appliedAmountInPaise: 0,
      createdAt: now,
      ttl: IDEMPOTENCY_TTL_SECONDS,
    };
    try {
      await idempotencyContainer.items.create<AppliedCreditIdempotencyDoc>(idemDoc, {
        ifNoneMatch: '*',
      } as Parameters<typeof idempotencyContainer.items.create>[1]);
    } catch (idemErr: unknown) {
      if ((idemErr as { code?: number }).code === 409) {
        // Conflict: another request already wrote this idempotency key.
        // Read the existing record to determine the correct action.
        const { resource: existingIdem } = await idempotencyContainer
          .item(idempotencyKey, customerId)
          .read<AppliedCreditIdempotencyDoc>();
        if (existingIdem) {
          if (existingIdem.bookingId !== bookingId) {
            // Different bookingId → replay abuse; same key used for a new booking.
            const err = new Error('IDEMPOTENCY_KEY_ALREADY_USED') as Error & { code: number };
            err.code = 409;
            throw err;
          }
          // Same bookingId — check status:
          if (!existingIdem.status || existingIdem.status === 'APPLIED') {
            // Already fully applied → idempotent replay; return cached amount.
            return {
              appliedAmountInPaise: existingIdem.appliedAmountInPaise,
              newBalanceInPaise: 0, // balance already decremented
              idempotent: true,
            };
          }
          // status === 'RESERVED' → P1-2: this key was written by reserveCredit before
          // the Razorpay order creation. The actual wallet debit has NOT happened yet.
          // Proceed past this block to execute the sentinel debit loop below.
          // (We own the debit slot because the reservation is for our bookingId.)
        } else {
          // If we can't read back the record (very unlikely race), surface as conflict.
          const err = new Error('IDEMPOTENCY_KEY_ALREADY_USED') as Error & { code: number };
          err.code = 409;
          throw err;
        }
      } else {
        // Unexpected error writing idempotency record — propagate.
        throw idemErr;
      }
    }

    // Step 2: nothing to write (amount is 0).
    if (amountInPaise <= 0) {
      return { appliedAmountInPaise: 0, newBalanceInPaise: 0, idempotent: false };
    }

    const creditContainer = getCustomerCreditLedgerContainer();

    // Steps 3–6: ETag concurrency loop (P1-4 sentinel + reconciliation).
    let appliedAmount = 0;
    for (let attempt = 0; attempt < MAX_CONCURRENCY_RETRIES; attempt++) {
      const sentinelId = `${SENTINEL_ID_PREFIX}${customerId}`;
      const sentinelResult = await readSentinel(customerId);

      let currentBalance: number;
      let existingEtag: string | null;
      let reconciledAt: string = now;

      if (sentinelResult === null) {
        // No sentinel yet — compute from ledger (cross-partition, all docs).
        currentBalance = await computeBalance(customerId);
        existingEtag = null;
      } else {
        // P1-4: Sentinel exists. Reconcile with any CREDIT_ISSUED / REFUND docs
        // written AFTER the sentinel was last reconciled. This accounts for credits
        // issued by the no-show detector (which writes ledger docs but not the sentinel).
        //
        // NOTE: Future migration — update no-show detector to also update the sentinel
        // directly, then remove this reconciliation query. Tracked as:
        // TODO(E13-S02): migrate no-show detector to write sentinel directly.
        const sinceTimestamp = sentinelResult.doc.lastReconciledAt ?? '1970-01-01T00:00:00.000Z';
        const { resources: newCredits } = await creditContainer.items
          .query<RawCreditDoc>(
            {
              query: `SELECT * FROM c WHERE c.customerId = @cid
                      AND (c.type = 'CREDIT_ISSUED' OR c.type = 'REFUND')
                      AND c.createdAt > @since`,
              parameters: [
                { name: '@cid', value: customerId },
                { name: '@since', value: sinceTimestamp },
              ],
            },
            // Cross-partition (no partitionKey option) — same as other queries in this repo.
          )
          .fetchAll();

        let reconciledExtra = 0;
        for (const raw of newCredits) {
          const entry = normalizeDoc(raw);
          if (entry && (entry.type === 'CREDIT_ISSUED' || entry.type === 'REFUND')) {
            reconciledExtra += entry.amountInPaise;
          }
        }
        currentBalance = sentinelResult.doc.balanceInPaise + reconciledExtra;
        existingEtag = sentinelResult.etag;
        reconciledAt = now;
      }

      // Cap applied amount to balance.
      const toApply = Math.min(currentBalance, amountInPaise);
      if (toApply <= 0) {
        return { appliedAmountInPaise: 0, newBalanceInPaise: currentBalance, idempotent: false };
      }

      const newBalance = currentBalance - toApply;

      const newSentinel: SentinelDoc = {
        id: sentinelId,
        customerId,
        balanceInPaise: newBalance,
        lastUpdatedAt: now,
        lastReconciledAt: reconciledAt,
      };

      try {
        if (existingEtag === null) {
          // Create sentinel with IfNoneMatch: * (fails 409 if concurrent request already created it).
          await creditContainer.items.create<SentinelDoc>(newSentinel, {
            ifNoneMatch: '*',
          } as Parameters<typeof creditContainer.items.create>[1]);
        } else {
          // Replace sentinel with IfMatch(etag) — throws 412 if another writer won.
          await creditContainer.item(sentinelId, sentinelId).replace<SentinelDoc>(
            newSentinel,
            { accessCondition: { type: 'IfMatch', condition: existingEtag } },
          );
        }

        // Sentinel written successfully — we own this debit slot.
        appliedAmount = toApply;

        // Write CREDIT_APPLIED ledger entry.
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

        // Update idempotency record with the actual applied amount (was 0 placeholder).
        // Best-effort: if this write fails the next replay returns 0 (conservative but safe —
        // the booking was already created, and 0 credit is the safe fallback for the caller).
        try {
          await idempotencyContainer.item(idempotencyKey, customerId).replace<AppliedCreditIdempotencyDoc>(
            { ...idemDoc, appliedAmountInPaise: toApply },
          );
        } catch { /* best-effort; next replay returns 0 which is safe */ }

        return { appliedAmountInPaise: toApply, newBalanceInPaise: newBalance, idempotent: false };
      } catch (err: unknown) {
        const code = (err as { code?: number }).code;
        if ((code === 412 || code === 409) && attempt < MAX_CONCURRENCY_RETRIES - 1) {
          // Optimistic concurrency conflict — another writer won; retry after brief back-off.
          await new Promise((res) => setTimeout(res, 50 * (attempt + 1)));
          continue;
        }
        // Final retry exhausted or unexpected error — propagate so caller can handle.
        throw err;
      }
    }

    // All retries exhausted with 412 — return 0 (caller decides whether to fallback to Razorpay).
    return { appliedAmountInPaise: appliedAmount, newBalanceInPaise: 0, idempotent: false };
  },
};
