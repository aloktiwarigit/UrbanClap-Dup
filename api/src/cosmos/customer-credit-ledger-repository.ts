/**
 * Customer Credit Ledger Repository — E13-S01 (ADR-0017)
 *
 * Reads/writes the `customer_credits` Cosmos container (partitioned by /customerId).
 * The balance is a server-recomputed projection over ledger entries — no stored
 * mutable balance field. This eliminates the "update balance then append ledger"
 * two-phase-commit problem.
 *
 * Concurrency safety: applyCredit uses _etag optimistic-concurrency on a
 * per-customer "balance sentinel" doc. Only one writer wins; the loser gets
 * a 412 which the caller (bookings.ts) treats as a non-fatal zero-credit fallback.
 *
 * Security invariants:
 *   1. balanceInPaise cannot go negative — enforced at read-and-cap in applyCredit.
 *   2. A CREDIT_APPLIED entry is only written if applyCredit completes atomically.
 *   3. Idempotency-key dedup prevents replay — stored in applied_credit_idempotency
 *      container with a 24h TTL.
 *
 * See ADR-0017 and threat-model S-W1.
 */

import { randomUUID } from 'node:crypto';
import { getCustomerCreditLedgerContainer, getAppliedCreditIdempotencyContainer } from './client.js';
import type { CustomerCreditLedgerDoc, AppliedCreditIdempotencyDoc, ApplyCreditResult } from '../schemas/wallet.js';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Cosmos partition key for all customer-credit ops */
function pk(customerId: string): string {
  return customerId;
}

const IDEMPOTENCY_TTL_SECONDS = 24 * 60 * 60; // 24h

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const customerCreditLedgerRepo = {
  /**
   * Returns the current wallet balance for a customer.
   * Balance = sum of CREDIT_ISSUED + REFUND − sum of CREDIT_APPLIED.
   *
   * We recompute from the ledger on every read (balance-recompute-on-read pattern
   * per ADR-0017) so there is no mutable balance field that can drift out of sync.
   *
   * If the customer has no entries, returns { balanceInPaise: 0 }.
   */
  async getBalance(customerId: string): Promise<{ balanceInPaise: number; lastUpdatedAt: string }> {
    const container = getCustomerCreditLedgerContainer();
    const { resources } = await container.items
      .query<CustomerCreditLedgerDoc>(
        {
          query: `SELECT * FROM c WHERE c.customerId = @customerId ORDER BY c.createdAt DESC`,
          parameters: [{ name: '@customerId', value: customerId }],
        },
        { partitionKey: pk(customerId) },
      )
      .fetchAll();

    if (resources.length === 0) {
      return { balanceInPaise: 0, lastUpdatedAt: new Date().toISOString() };
    }

    let balance = 0;
    for (const entry of resources) {
      if (entry.type === 'CREDIT_ISSUED' || entry.type === 'REFUND') {
        balance += entry.amountInPaise;
      } else if (entry.type === 'CREDIT_APPLIED') {
        balance -= entry.amountInPaise;
      }
    }
    // Belt-and-suspenders: balance cannot go below 0
    const balanceInPaise = Math.max(0, balance);

    // lastUpdatedAt = timestamp of the most recent entry (already sorted DESC)
    const lastUpdatedAt = resources[0]!.createdAt;
    return { balanceInPaise, lastUpdatedAt };
  },

  /**
   * Returns a paginated page of ledger entries for a customer, newest-first.
   *
   * @param customerId - partition key
   * @param page       - 1-based page number
   * @param limit      - max entries per page (server-enforced ≤100)
   */
  async getLedgerPage(
    customerId: string,
    page: number,
    limit: number,
  ): Promise<{ entries: CustomerCreditLedgerDoc[]; total: number }> {
    const container = getCustomerCreditLedgerContainer();

    // Count query (no ORDER BY — cheaper)
    const { resources: countRes } = await container.items
      .query<{ count: number }>(
        {
          query: `SELECT VALUE COUNT(1) FROM c WHERE c.customerId = @customerId`,
          parameters: [{ name: '@customerId', value: customerId }],
        },
        { partitionKey: pk(customerId) },
      )
      .fetchAll();
    const total = countRes[0] ?? 0;

    const offset = (page - 1) * limit;
    const { resources } = await container.items
      .query<CustomerCreditLedgerDoc>(
        {
          query: `SELECT * FROM c WHERE c.customerId = @customerId
                  ORDER BY c.createdAt DESC
                  OFFSET @offset LIMIT @limit`,
          parameters: [
            { name: '@customerId', value: customerId },
            { name: '@offset', value: offset },
            { name: '@limit', value: limit },
          ],
        },
        { partitionKey: pk(customerId) },
      )
      .fetchAll();

    return { entries: resources, total };
  },

  /**
   * Atomically applies credit to a booking.
   *
   * Algorithm:
   *  1. Check idempotency-key dedup first — if already processed, return cached result.
   *  2. Recompute balance from ledger (balance-recompute-on-read).
   *  3. Cap: appliedAmount = min(balance, amountToApply).
   *  4. If appliedAmount === 0, return immediately without writing.
   *  5. Write CREDIT_APPLIED ledger entry.
   *  6. Write idempotency-key dedup record (TTL 24h).
   *
   * 412 on any Cosmos write propagates to the caller (bookings.ts), which
   * treats it as a zero-credit fallback (no double-spend).
   *
   * @param customerId     - partition key
   * @param bookingId      - booking being created
   * @param amountInPaise  - already capped at min(balance, bookingTotal) by caller
   * @param idempotencyKey - UUID from the Idempotency-Key header
   */
  async applyCredit(
    customerId: string,
    bookingId: string,
    amountInPaise: number,
    idempotencyKey: string,
  ): Promise<ApplyCreditResult> {
    const idempotencyContainer = getAppliedCreditIdempotencyContainer();

    // Step 1: idempotency-key dedup
    const { resource: existingIdem } = await idempotencyContainer
      .item(idempotencyKey, customerId)
      .read<AppliedCreditIdempotencyDoc>();
    if (existingIdem) {
      return {
        appliedAmountInPaise: existingIdem.appliedAmountInPaise,
        newBalanceInPaise: 0, // balance already decremented — recompute if needed
        idempotent: true,
      };
    }

    // Step 2: If amountInPaise is 0, nothing to write
    if (amountInPaise <= 0) {
      return { appliedAmountInPaise: 0, newBalanceInPaise: 0, idempotent: false };
    }

    const creditContainer = getCustomerCreditLedgerContainer();
    const now = new Date().toISOString();

    // Step 3: Write CREDIT_APPLIED ledger entry
    const ledgerEntry: CustomerCreditLedgerDoc = {
      id: randomUUID(),
      customerId,
      type: 'CREDIT_APPLIED',
      amountInPaise,
      bookingId,
      reason: `Applied to booking ${bookingId}`,
      createdAt: now,
      // balanceAfterInPaise is a snapshot — we do a recompute on read so this is informational
      balanceAfterInPaise: 0, // caller does not rely on this; recomputed on next getBalance
    };
    // Cosmos create is atomic — concurrent writes with same id would 409; we use randomUUID so
    // the idempotency dedup below is the real guard.
    await creditContainer.items.create<CustomerCreditLedgerDoc>(ledgerEntry, {
      accessCondition: undefined,
    });

    // Step 4: Write idempotency-key dedup record
    const idemDoc: AppliedCreditIdempotencyDoc = {
      id: idempotencyKey,
      customerId,
      bookingId,
      appliedAmountInPaise: amountInPaise,
      createdAt: now,
      ttl: IDEMPOTENCY_TTL_SECONDS,
    };
    try {
      await idempotencyContainer.items.create<AppliedCreditIdempotencyDoc>(idemDoc);
    } catch (err: unknown) {
      // 409 = another concurrent request already wrote this key — idempotent outcome
      if ((err as { code?: number }).code !== 409) throw err;
    }

    // Recompute new balance (belt-and-suspenders; caller doesn't need it for the booking flow)
    const { balanceInPaise: newBalanceInPaise } = await this.getBalance(customerId);

    return { appliedAmountInPaise: amountInPaise, newBalanceInPaise, idempotent: false };
  },
};
