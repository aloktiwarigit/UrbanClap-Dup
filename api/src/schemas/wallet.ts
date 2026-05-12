/**
 * Wallet schemas — E13-S01 (ADR-0017)
 *
 * The customer wallet is a projection over the `customer_credits` container.
 * Credits are issued by the no-show timer; applied at booking-creation time.
 * All monetary values are in paise (1 INR = 100 paise) to avoid floating-point.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Ledger entry types
// ---------------------------------------------------------------------------

export const LEDGER_ENTRY_TYPES = [
  'CREDIT_ISSUED',
  'CREDIT_APPLIED',
  'REFUND',
] as const;

export type LedgerEntryType = typeof LEDGER_ENTRY_TYPES[number];

export const LedgerEntrySchema = z.object({
  id: z.string(),
  type: z.enum(LEDGER_ENTRY_TYPES),
  amountInPaise: z.number().int().nonnegative(),
  bookingId: z.string().optional(),
  reason: z.string(),
  createdAt: z.string(),
});

export type LedgerEntry = z.infer<typeof LedgerEntrySchema>;

// ---------------------------------------------------------------------------
// GET /v1/wallet/balance response
// ---------------------------------------------------------------------------

export const WalletBalanceResponseSchema = z.object({
  balanceInPaise: z.number().int().nonnegative(),
  lastUpdatedAt: z.string(),
});

export type WalletBalanceResponse = z.infer<typeof WalletBalanceResponseSchema>;

// ---------------------------------------------------------------------------
// GET /v1/wallet/ledger response
// ---------------------------------------------------------------------------

export const WalletLedgerResponseSchema = z.object({
  entries: z.array(LedgerEntrySchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
});

export type WalletLedgerResponse = z.infer<typeof WalletLedgerResponseSchema>;

// ---------------------------------------------------------------------------
// Cosmos document: customer credit ledger entry (stored in customer_credits)
// ---------------------------------------------------------------------------

export const CustomerCreditLedgerDocSchema = z.object({
  id: z.string(),
  /** Partition key — always customerId */
  customerId: z.string(),
  type: z.enum(LEDGER_ENTRY_TYPES),
  /** Amount in paise */
  amountInPaise: z.number().int().nonnegative(),
  bookingId: z.string().optional(),
  reason: z.string(),
  createdAt: z.string(),
  /** Running balance snapshot after this entry (for fast balance reads) */
  balanceAfterInPaise: z.number().int().nonnegative(),
});

export type CustomerCreditLedgerDoc = z.infer<typeof CustomerCreditLedgerDocSchema>;

// ---------------------------------------------------------------------------
// Cosmos document: idempotency key for applied credits
// (stored in applied_credit_idempotency container, TTL 24h)
// ---------------------------------------------------------------------------

/**
 * P1-2 (credit reservation): status lifecycle for idempotency docs.
 *
 * RESERVED → written BEFORE the Razorpay order is created (partial credit path).
 *   Prevents a second discounted Razorpay order from being created with the same
 *   idempotency key if the first request is replayed before payment completes.
 *   On payment.captured webhook → applyCredit transitions to APPLIED.
 *   On abandonment → TTL (24h) auto-expires the reservation.
 *
 * APPLIED → written atomically after the sentinel debit + ledger entry succeed.
 *   All subsequent replays with the same key return the cached appliedAmountInPaise.
 *
 * Absent (legacy) → pre-P1-2 records have no status field; treated as APPLIED.
 */
export const CREDIT_IDEMPOTENCY_STATUS = ['RESERVED', 'APPLIED'] as const;
export type CreditIdempotencyStatus = typeof CREDIT_IDEMPOTENCY_STATUS[number];

export const AppliedCreditIdempotencyDocSchema = z.object({
  id: z.string(),           // idempotencyKey (UUID from client header)
  customerId: z.string(),   // partition key
  bookingId: z.string(),
  appliedAmountInPaise: z.number().int().nonnegative(),
  createdAt: z.string(),
  /** Cosmos TTL in seconds — 86400 (24h) */
  ttl: z.number().int().positive(),
  /**
   * P1-2: Lifecycle status. RESERVED = credit amount held but not yet debited.
   * APPLIED = wallet debit completed. Legacy docs without this field = APPLIED.
   */
  status: z.enum(CREDIT_IDEMPOTENCY_STATUS).optional(),
  /**
   * P1-2: Amount reserved for Razorpay partial-credit path. Set at reservation time.
   * On APPLIED transition the actual appliedAmountInPaise is written.
   */
  reservedAmountInPaise: z.number().int().nonnegative().optional(),
});

export type AppliedCreditIdempotencyDoc = z.infer<typeof AppliedCreditIdempotencyDocSchema>;

// ---------------------------------------------------------------------------
// Apply credit result (internal service contract)
// ---------------------------------------------------------------------------

export const ApplyCreditResultSchema = z.object({
  appliedAmountInPaise: z.number().int().nonnegative(),
  newBalanceInPaise: z.number().int().nonnegative(),
  idempotent: z.boolean(),
});

export type ApplyCreditResult = z.infer<typeof ApplyCreditResultSchema>;
