# E06-S04 Razorpay Route Split-Payment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a booking transitions to `COMPLETED`, automatically split payment via Razorpay Route — owner commission (22%/25% ladder) + technician net payout — with idempotency, audit logging, and daily reconciliation.

**Architecture:** Cosmos change-feed trigger on `bookings` fires `settleBooking()` on each COMPLETED document; commission is calculated from `technician.completedJobCount`; wallet_ledger entry (id=bookingId for natural idempotency) tracks PENDING→PAID lifecycle; daily timer cron retries stale PENDING entries and alerts owner via FCM on failures.

**Tech Stack:** Azure Functions v4 (cosmosDB + timer triggers), Razorpay Route SDK, Cosmos DB, FCM, Vitest unit tests with vi.mock()

**Story file:** `docs/stories/E06-S04-razorpay-route-split-payment.md`

**Patterns to read before starting:**
- `docs/patterns/firebase-errorcode-mapping.md` — Razorpay error handling (never use message string; errors surface as thrown exceptions from Razorpay SDK, not structured error codes — catch and stringify)
- `api/src/cosmos/booking-repository.ts` — Cosmos read/replace pattern to follow
- `api/src/functions/admin/finance/approve-payouts.ts` — existing Route transfer pattern

---

## File Map

### New files
| File | Responsibility |
|---|---|
| `api/src/schemas/wallet-ledger.ts` | `WalletLedgerEntry` Zod schema + `WalletLedgerCreateInput` type |
| `api/src/services/commission.service.ts` | Pure `calculateCommission(completedJobCount, amountPaise)` function |
| `api/src/cosmos/wallet-ledger-repository.ts` | Per-booking settlement CRUD (separate from batch-payout finance-repository) |
| `api/src/functions/trigger-booking-completed.ts` | Cosmos change-feed trigger; exports `settleBooking` for testing |
| `api/src/functions/trigger-reconcile-payouts.ts` | Daily timer trigger; exports `reconcilePayouts` for testing |
| `api/tests/unit/commission.service.test.ts` | TDD: commission ladder + rounding |
| `api/tests/unit/trigger-booking-completed.test.ts` | TDD: idempotency + failure isolation + audit order |
| `api/tests/unit/trigger-reconcile-payouts.test.ts` | TDD: retry logic + FCM alert |

### Modified files
| File | Change |
|---|---|
| `api/src/schemas/audit-log.ts` | Add `'system'` to role enum (system-generated Route transfer entries) |
| `api/src/types/admin.ts` | Add `'system'` to `AdminRole`; add 6 new `AuditAction` literals |
| `api/src/schemas/technician.ts` | Add `completedJobCount?: z.number().int().nonneg()` field |
| `api/src/cosmos/client.ts` | Add `getWalletLedgerContainer()` helper |
| `api/src/cosmos/technician-repository.ts` | Add `getTechnicianForSettlement()`, `incrementCompletedJobCount()` |
| `api/src/services/fcm.service.ts` | Add `sendTechEarningsUpdate()`, `sendOwnerRouteAlert()` |
| `api/local.settings.example.json` | Add `COSMOS_CONNECTION_STRING` env var for change-feed trigger |

---

## Task 1: Schema + type extensions

**Files:**
- Modify: `api/src/schemas/audit-log.ts`
- Modify: `api/src/types/admin.ts`
- Modify: `api/src/schemas/technician.ts`
- Modify: `api/src/cosmos/client.ts`
- Modify: `api/local.settings.example.json`
- Create: `api/src/schemas/wallet-ledger.ts`

These are pure type/schema additions — no test needed (TypeScript compilation is the gate).

- [ ] **Step 1: Add 'system' to audit-log role enum**

In `api/src/schemas/audit-log.ts`, change line 6:
```typescript
  role: z.enum(['super-admin', 'ops-manager', 'finance', 'support-agent', 'system']),
```

- [ ] **Step 2: Add 'system' to AdminRole and new AuditAction literals**

Replace `api/src/types/admin.ts` content:
```typescript
export type AdminRole = 'super-admin' | 'ops-manager' | 'finance' | 'support-agent' | 'system';

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'TOTP_SETUP'
  | 'ORDER_OVERRIDE'
  | 'TECH_DEACTIVATE'
  | 'REFUND_APPROVE'
  | 'PAYOUT_APPROVE'
  | 'COMPLAINT_RESOLVE'
  | 'CATALOGUE_EDIT'
  | 'ADMIN_USER_CHANGE'
  | 'SSC_LEVY_TRANSFER'
  | 'ROUTE_TRANSFER_ATTEMPT'
  | 'ROUTE_TRANSFER_SUCCESS'
  | 'ROUTE_TRANSFER_FAILED'
  | 'RECON_RETRY_ATTEMPT'
  | 'RECON_RETRY_SUCCESS'
  | 'RECON_RETRY_FAILED'
  | 'RECON_MISMATCH_ALERT';

export interface AdminContext {
  adminId: string;
  role: AdminRole;
  sessionId: string;
}
```

- [ ] **Step 3: Add completedJobCount to TechnicianProfile**

In `api/src/schemas/technician.ts`, add one field to `TechnicianProfileSchema` after `updatedAt`:
```typescript
  completedJobCount: z.number().int().nonnegative().default(0),
```

- [ ] **Step 4: Add getWalletLedgerContainer to client.ts**

After `getSscLeviesContainer`, add:
```typescript
export function getWalletLedgerContainer(): Container {
  return getCosmosClient().database(DB_NAME).container('wallet_ledger');
}
```

- [ ] **Step 5: Create api/src/schemas/wallet-ledger.ts**

```typescript
import { z } from 'zod';

export const WalletLedgerPayoutStatusSchema = z.enum(['PENDING', 'PAID', 'FAILED']);
export type WalletLedgerPayoutStatus = z.infer<typeof WalletLedgerPayoutStatusSchema>;

export const WalletLedgerEntrySchema = z.object({
  id: z.string(),
  bookingId: z.string(),
  technicianId: z.string(),
  partitionKey: z.string(),
  bookingAmount: z.number().int().positive(),
  completedJobCountAtSettlement: z.number().int().nonnegative(),
  commissionBps: z.number().int().positive(),
  commissionAmount: z.number().int().nonnegative(),
  techAmount: z.number().int().positive(),
  payoutStatus: WalletLedgerPayoutStatusSchema,
  razorpayTransferId: z.string().optional(),
  failureReason: z.string().optional(),
  createdAt: z.string(),
  settledAt: z.string().optional(),
});

export type WalletLedgerEntry = z.infer<typeof WalletLedgerEntrySchema>;

export type WalletLedgerCreateInput = {
  bookingId: string;
  technicianId: string;
  bookingAmount: number;
  completedJobCountAtSettlement: number;
  commissionBps: number;
  commissionAmount: number;
  techAmount: number;
};
```

- [ ] **Step 6: Add COSMOS_CONNECTION_STRING to local.settings.example.json**

Open `api/local.settings.example.json` and add:
```json
"COSMOS_CONNECTION_STRING": "AccountEndpoint=<COSMOS_ENDPOINT>;AccountKey=<COSMOS_KEY>;"
```
(The change-feed trigger binding requires a connection string, not separate endpoint+key.)

- [ ] **Step 7: Run typecheck to verify no TS errors**

```bash
cd api && pnpm typecheck
```
Expected: exits 0.

- [ ] **Step 8: Commit**

```bash
git add api/src/schemas/audit-log.ts api/src/types/admin.ts api/src/schemas/technician.ts \
        api/src/cosmos/client.ts api/src/schemas/wallet-ledger.ts \
        api/local.settings.example.json docs/stories/E06-S04-razorpay-route-split-payment.md
git commit -m "feat(e06-s04): schema extensions — wallet_ledger, system audit role, completedJobCount"
```

---

## Task 2: Commission calculator (TDD)

**Files:**
- Create: `api/tests/unit/commission.service.test.ts`
- Create: `api/src/services/commission.service.ts`

- [ ] **Step 1: Write the failing tests**

Create `api/tests/unit/commission.service.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { calculateCommission } from '../../src/services/commission.service.js';

describe('calculateCommission', () => {
  it('applies 22% (2200 bps) when completedJobCount is 0', () => {
    const result = calculateCommission(0, 10000);
    expect(result).toEqual({ commissionBps: 2200, commissionAmount: 2200, techAmount: 7800 });
  });

  it('applies 22% (2200 bps) when completedJobCount is 49', () => {
    const result = calculateCommission(49, 10000);
    expect(result).toEqual({ commissionBps: 2200, commissionAmount: 2200, techAmount: 7800 });
  });

  it('applies 25% (2500 bps) when completedJobCount is exactly 50', () => {
    const result = calculateCommission(50, 10000);
    expect(result).toEqual({ commissionBps: 2500, commissionAmount: 2500, techAmount: 7500 });
  });

  it('applies 25% (2500 bps) when completedJobCount is above 50', () => {
    const result = calculateCommission(99, 50000);
    expect(result).toEqual({ commissionBps: 2500, commissionAmount: 12500, techAmount: 37500 });
  });

  it('rounds commission to nearest integer paise', () => {
    // 9999 * 0.22 = 2199.78 → rounds to 2200; techAmount = 7799
    const result = calculateCommission(0, 9999);
    expect(result.commissionAmount).toBe(2200);
    expect(result.techAmount).toBe(7799);
    expect(result.commissionAmount + result.techAmount).toBe(9999);
  });

  it('techAmount + commissionAmount always equals bookingAmount', () => {
    for (const amount of [1, 100, 9999, 50000, 99999, 500000]) {
      const r22 = calculateCommission(0, amount);
      expect(r22.commissionAmount + r22.techAmount).toBe(amount);
      const r25 = calculateCommission(50, amount);
      expect(r25.commissionAmount + r25.techAmount).toBe(amount);
    }
  });
});
```

- [ ] **Step 2: Run to confirm RED**

```bash
cd api && pnpm test tests/unit/commission.service.test.ts
```
Expected: FAIL — "Cannot find module '../../src/services/commission.service.js'"

- [ ] **Step 3: Implement the commission calculator**

Create `api/src/services/commission.service.ts`:
```typescript
export interface CommissionResult {
  commissionBps: number;
  commissionAmount: number;
  techAmount: number;
}

export function calculateCommission(
  completedJobCount: number,
  bookingAmountPaise: number,
): CommissionResult {
  const commissionBps = completedJobCount >= 50 ? 2500 : 2200;
  const commissionAmount = Math.round((bookingAmountPaise * commissionBps) / 10000);
  const techAmount = bookingAmountPaise - commissionAmount;
  return { commissionBps, commissionAmount, techAmount };
}
```

- [ ] **Step 4: Run to confirm GREEN**

```bash
cd api && pnpm test tests/unit/commission.service.test.ts
```
Expected: PASS — 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add api/src/services/commission.service.ts api/tests/unit/commission.service.test.ts
git commit -m "feat(e06-s04): commission calculator — 22%/25% ladder at 50-job milestone (TDD)"
```

---

## Task 3: Wallet ledger repository + technician settlement helpers + FCM extensions

**Files:**
- Create: `api/src/cosmos/wallet-ledger-repository.ts`
- Modify: `api/src/cosmos/technician-repository.ts`
- Modify: `api/src/services/fcm.service.ts`

No TDD for repository/infra files (consistent with existing project pattern — these are integration-tested via mocks in the function tests).

- [ ] **Step 1: Create wallet-ledger-repository.ts**

Create `api/src/cosmos/wallet-ledger-repository.ts`:
```typescript
import { getWalletLedgerContainer } from './client.js';
import type { WalletLedgerEntry, WalletLedgerCreateInput } from '../schemas/wallet-ledger.js';

export const walletLedgerRepo = {
  async getByBookingId(bookingId: string, technicianId: string): Promise<WalletLedgerEntry | null> {
    const { resource } = await getWalletLedgerContainer()
      .item(bookingId, technicianId)
      .read<WalletLedgerEntry>();
    return resource ?? null;
  },

  async createPendingEntry(input: WalletLedgerCreateInput): Promise<boolean> {
    try {
      await getWalletLedgerContainer().items.create<WalletLedgerEntry>({
        id: input.bookingId,
        bookingId: input.bookingId,
        technicianId: input.technicianId,
        partitionKey: input.technicianId,
        bookingAmount: input.bookingAmount,
        completedJobCountAtSettlement: input.completedJobCountAtSettlement,
        commissionBps: input.commissionBps,
        commissionAmount: input.commissionAmount,
        techAmount: input.techAmount,
        payoutStatus: 'PENDING',
        createdAt: new Date().toISOString(),
      });
      return true;
    } catch (err: unknown) {
      // 409 Conflict = concurrent invocation already created this entry
      if ((err as { code?: number }).code === 409) return false;
      throw err;
    }
  },

  async markPaid(bookingId: string, technicianId: string, razorpayTransferId: string): Promise<void> {
    const { resource } = await getWalletLedgerContainer()
      .item(bookingId, technicianId)
      .read<WalletLedgerEntry>();
    if (!resource) throw new Error(`wallet_ledger entry not found: ${bookingId}`);
    await getWalletLedgerContainer()
      .item(bookingId, technicianId)
      .replace<WalletLedgerEntry>({
        ...resource,
        payoutStatus: 'PAID',
        razorpayTransferId,
        settledAt: new Date().toISOString(),
      });
  },

  async markFailed(bookingId: string, technicianId: string, failureReason: string): Promise<void> {
    const { resource } = await getWalletLedgerContainer()
      .item(bookingId, technicianId)
      .read<WalletLedgerEntry>();
    if (!resource) throw new Error(`wallet_ledger entry not found: ${bookingId}`);
    await getWalletLedgerContainer()
      .item(bookingId, technicianId)
      .replace<WalletLedgerEntry>({
        ...resource,
        payoutStatus: 'FAILED',
        failureReason,
      });
  },

  async getPendingEntriesOlderThan(cutoffIso: string): Promise<WalletLedgerEntry[]> {
    const { resources } = await getWalletLedgerContainer()
      .items.query<WalletLedgerEntry>({
        query: `SELECT * FROM c WHERE c.payoutStatus = 'PENDING' AND c.createdAt < @cutoff`,
        parameters: [{ name: '@cutoff', value: cutoffIso }],
      })
      .fetchAll();
    return resources;
  },

  async getFailedEntries(): Promise<WalletLedgerEntry[]> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { resources } = await getWalletLedgerContainer()
      .items.query<WalletLedgerEntry>({
        query: `SELECT * FROM c WHERE c.payoutStatus = 'FAILED' AND c.createdAt > @cutoff`,
        parameters: [{ name: '@cutoff', value: thirtyDaysAgo }],
      })
      .fetchAll();
    return resources;
  },
};
```

- [ ] **Step 2: Add settlement helpers to technician-repository.ts**

Add the following two exports at the end of `api/src/cosmos/technician-repository.ts`:
```typescript
// ── Settlement helpers (E06-S04) ──────────────────────────────────────────────

export interface TechnicianSettlementInfo {
  id: string;
  completedJobCount: number;
  razorpayLinkedAccountId?: string;
}

export async function getTechnicianForSettlement(
  technicianId: string,
): Promise<TechnicianSettlementInfo | null> {
  const client = getCosmosClient();
  const { resource } = await client
    .database(DB_NAME)
    .container(CONTAINER)
    .item(technicianId, technicianId)
    .read<TechnicianSettlementInfo>();
  return resource ?? null;
}

export async function incrementCompletedJobCount(technicianId: string): Promise<void> {
  const container = getCosmosClient().database(DB_NAME).container(CONTAINER);
  const { resource } = await container
    .item(technicianId, technicianId)
    .read<{ id: string; completedJobCount?: number } & Record<string, unknown>>();
  if (!resource) return;
  await container.item(technicianId, technicianId).replace({
    ...resource,
    completedJobCount: (resource.completedJobCount ?? 0) + 1,
  });
}
```

You also need to add the missing `DB_NAME` import at the top of `technician-repository.ts` if not already present. Check: it currently imports from `'./client.js'` as `{ getCosmosClient, DB_NAME }` — that's already there.

- [ ] **Step 3: Add FCM functions to fcm.service.ts**

Append to `api/src/services/fcm.service.ts`:
```typescript
export async function sendTechEarningsUpdate(
  technicianId: string,
  payload: { bookingId: string; techAmount: number },
): Promise<void> {
  await getFirebaseAdmin().messaging().send({
    topic: `technician_${technicianId}`,
    data: {
      type: 'EARNINGS_UPDATE',
      bookingId: payload.bookingId,
      techAmount: String(payload.techAmount),
    },
  });
}

export async function sendOwnerRouteAlert(payload: {
  stalePending: number;
  failed: number;
}): Promise<void> {
  await getFirebaseAdmin().messaging().send({
    topic: 'owner_ops_alerts',
    data: {
      type: 'ROUTE_TRANSFER_MISMATCH',
      stalePending: String(payload.stalePending),
      failed: String(payload.failed),
    },
  });
}
```

- [ ] **Step 4: Run typecheck**

```bash
cd api && pnpm typecheck
```
Expected: exits 0.

- [ ] **Step 5: Commit**

```bash
git add api/src/cosmos/wallet-ledger-repository.ts \
        api/src/cosmos/technician-repository.ts \
        api/src/services/fcm.service.ts
git commit -m "feat(e06-s04): wallet-ledger repo, tech settlement helpers, FCM earnings/alert"
```

---

## Task 4: Route transfer change-feed trigger (TDD)

**Files:**
- Create: `api/tests/unit/trigger-booking-completed.test.ts`
- Create: `api/src/functions/trigger-booking-completed.ts`

- [ ] **Step 1: Write the failing tests**

Create `api/tests/unit/trigger-booking-completed.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { InvocationContext } from '@azure/functions';

vi.mock('../../src/cosmos/wallet-ledger-repository.js');
vi.mock('../../src/cosmos/technician-repository.js');
vi.mock('../../src/cosmos/audit-log-repository.js');
vi.mock('../../src/services/fcm.service.js');
vi.mock('../../src/services/razorpayRoute.service.js');

import { settleBooking } from '../../src/functions/trigger-booking-completed.js';
import { walletLedgerRepo } from '../../src/cosmos/wallet-ledger-repository.js';
import * as techRepo from '../../src/cosmos/technician-repository.js';
import * as auditRepo from '../../src/cosmos/audit-log-repository.js';
import * as fcmService from '../../src/services/fcm.service.js';
import { RazorpayRouteService } from '../../src/services/razorpayRoute.service.js';

const mockCtx = { log: vi.fn() } as unknown as InvocationContext;

const completedBooking = {
  id: 'booking-abc',
  customerId: 'customer-1',
  serviceId: 'svc-1',
  categoryId: 'cat-1',
  slotDate: '2026-04-24',
  slotWindow: '09:00-11:00',
  addressText: '123 Main St',
  addressLatLng: { lat: 12.9, lng: 77.6 },
  status: 'COMPLETED',
  paymentOrderId: 'order-1',
  paymentId: 'pay-1',
  paymentSignature: 'sig-1',
  amount: 50000,
  technicianId: 'tech-1',
  createdAt: '2026-04-24T09:00:00.000Z',
};

const mockTransfer = vi.fn();

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(walletLedgerRepo.getByBookingId).mockResolvedValue(null);
  vi.mocked(walletLedgerRepo.createPendingEntry).mockResolvedValue(true);
  vi.mocked(walletLedgerRepo.markPaid).mockResolvedValue(undefined);
  vi.mocked(walletLedgerRepo.markFailed).mockResolvedValue(undefined);
  vi.mocked(techRepo.getTechnicianForSettlement).mockResolvedValue({
    id: 'tech-1',
    completedJobCount: 5,
    razorpayLinkedAccountId: 'acc-rp-1',
  });
  vi.mocked(techRepo.incrementCompletedJobCount).mockResolvedValue(undefined);
  vi.mocked(auditRepo.appendAuditEntry).mockResolvedValue(undefined);
  vi.mocked(fcmService.sendTechEarningsUpdate).mockResolvedValue(undefined);
  mockTransfer.mockResolvedValue({ transferId: 'trf-xyz' });
  vi.mocked(RazorpayRouteService).mockImplementation(() => ({
    transfer: mockTransfer,
  }) as unknown as RazorpayRouteService);
});

describe('settleBooking', () => {
  it('skips documents that are not COMPLETED status', async () => {
    await settleBooking({ ...completedBooking, status: 'IN_PROGRESS' }, mockCtx);
    expect(walletLedgerRepo.createPendingEntry).not.toHaveBeenCalled();
    expect(mockTransfer).not.toHaveBeenCalled();
  });

  it('skips malformed documents silently', async () => {
    await settleBooking({ invalid: true }, mockCtx);
    expect(walletLedgerRepo.createPendingEntry).not.toHaveBeenCalled();
  });

  it('skips COMPLETED booking with no technicianId', async () => {
    const noTech = { ...completedBooking, technicianId: undefined };
    await settleBooking(noTech, mockCtx);
    expect(walletLedgerRepo.createPendingEntry).not.toHaveBeenCalled();
  });

  describe('idempotency', () => {
    it('double-fire: second call does NOT create entry or call Razorpay when entry is PAID', async () => {
      vi.mocked(walletLedgerRepo.getByBookingId).mockResolvedValue({
        id: 'booking-abc',
        bookingId: 'booking-abc',
        technicianId: 'tech-1',
        partitionKey: 'tech-1',
        bookingAmount: 50000,
        completedJobCountAtSettlement: 5,
        commissionBps: 2200,
        commissionAmount: 11000,
        techAmount: 39000,
        payoutStatus: 'PAID',
        razorpayTransferId: 'trf-existing',
        createdAt: '2026-04-24T10:00:00.000Z',
        settledAt: '2026-04-24T10:00:01.000Z',
      });

      await settleBooking(completedBooking, mockCtx);

      expect(walletLedgerRepo.createPendingEntry).not.toHaveBeenCalled();
      expect(mockTransfer).not.toHaveBeenCalled();
    });

    it('concurrent fire: returns early when createPendingEntry returns false (409 Conflict)', async () => {
      vi.mocked(walletLedgerRepo.createPendingEntry).mockResolvedValue(false);

      await settleBooking(completedBooking, mockCtx);

      expect(mockTransfer).not.toHaveBeenCalled();
    });

    it('uses bookingId as Razorpay idempotency key', async () => {
      await settleBooking(completedBooking, mockCtx);

      expect(mockTransfer).toHaveBeenCalledWith(
        expect.objectContaining({ idempotencyKey: 'booking-abc' }),
      );
    });
  });

  describe('commission', () => {
    it('uses finalAmount over amount when both present', async () => {
      await settleBooking({ ...completedBooking, finalAmount: 60000, amount: 50000 }, mockCtx);

      expect(walletLedgerRepo.createPendingEntry).toHaveBeenCalledWith(
        expect.objectContaining({ bookingAmount: 60000 }),
      );
    });

    it('applies 22% commission for completedJobCount < 50', async () => {
      vi.mocked(techRepo.getTechnicianForSettlement).mockResolvedValue({
        id: 'tech-1', completedJobCount: 49, razorpayLinkedAccountId: 'acc-rp-1',
      });

      await settleBooking(completedBooking, mockCtx); // amount = 50000 paise

      expect(walletLedgerRepo.createPendingEntry).toHaveBeenCalledWith(
        expect.objectContaining({ commissionBps: 2200, commissionAmount: 11000, techAmount: 39000 }),
      );
    });

    it('applies 25% commission for completedJobCount >= 50', async () => {
      vi.mocked(techRepo.getTechnicianForSettlement).mockResolvedValue({
        id: 'tech-1', completedJobCount: 50, razorpayLinkedAccountId: 'acc-rp-1',
      });

      await settleBooking(completedBooking, mockCtx);

      expect(walletLedgerRepo.createPendingEntry).toHaveBeenCalledWith(
        expect.objectContaining({ commissionBps: 2500, commissionAmount: 12500, techAmount: 37500 }),
      );
    });
  });

  describe('audit logging', () => {
    it('writes ROUTE_TRANSFER_ATTEMPT audit entry before Razorpay call', async () => {
      const callOrder: string[] = [];
      vi.mocked(auditRepo.appendAuditEntry).mockImplementation(async (entry) => {
        callOrder.push(`audit:${entry.action}`);
      });
      mockTransfer.mockImplementation(async () => {
        callOrder.push('razorpay:transfer');
        return { transferId: 'trf-xyz' };
      });

      await settleBooking(completedBooking, mockCtx);

      expect(callOrder[0]).toBe('audit:ROUTE_TRANSFER_ATTEMPT');
      const razorpayIdx = callOrder.indexOf('razorpay:transfer');
      const attemptIdx = callOrder.indexOf('audit:ROUTE_TRANSFER_ATTEMPT');
      expect(attemptIdx).toBeLessThan(razorpayIdx);
    });

    it('writes ROUTE_TRANSFER_SUCCESS audit entry on success', async () => {
      await settleBooking(completedBooking, mockCtx);

      const successCall = vi.mocked(auditRepo.appendAuditEntry).mock.calls.find(
        ([entry]) => entry.action === 'ROUTE_TRANSFER_SUCCESS',
      );
      expect(successCall).toBeDefined();
    });

    it('writes ROUTE_TRANSFER_FAILED audit entry on Razorpay error', async () => {
      mockTransfer.mockRejectedValue(new Error('Razorpay timeout'));

      await settleBooking(completedBooking, mockCtx);

      const failCall = vi.mocked(auditRepo.appendAuditEntry).mock.calls.find(
        ([entry]) => entry.action === 'ROUTE_TRANSFER_FAILED',
      );
      expect(failCall).toBeDefined();
    });
  });

  describe('failure isolation', () => {
    it('marks wallet_ledger FAILED on Razorpay error — does NOT touch booking status', async () => {
      mockTransfer.mockRejectedValue(new Error('network error'));

      await settleBooking(completedBooking, mockCtx);

      expect(walletLedgerRepo.markFailed).toHaveBeenCalledWith('booking-abc', 'tech-1', 'network error');
      expect(walletLedgerRepo.markPaid).not.toHaveBeenCalled();
    });

    it('marks FAILED with "no Razorpay linked account" when tech has no account', async () => {
      vi.mocked(techRepo.getTechnicianForSettlement).mockResolvedValue({
        id: 'tech-1', completedJobCount: 5, razorpayLinkedAccountId: undefined,
      });

      await settleBooking(completedBooking, mockCtx);

      expect(walletLedgerRepo.markFailed).toHaveBeenCalledWith(
        'booking-abc', 'tech-1', 'no Razorpay linked account',
      );
      expect(mockTransfer).not.toHaveBeenCalled();
    });

    it('increments completedJobCount only on success', async () => {
      await settleBooking(completedBooking, mockCtx);
      expect(techRepo.incrementCompletedJobCount).toHaveBeenCalledWith('tech-1');
    });

    it('does NOT increment completedJobCount on Razorpay failure', async () => {
      mockTransfer.mockRejectedValue(new Error('fail'));
      await settleBooking(completedBooking, mockCtx);
      expect(techRepo.incrementCompletedJobCount).not.toHaveBeenCalled();
    });

    it('sends FCM earnings update to tech only on success', async () => {
      await settleBooking(completedBooking, mockCtx);
      expect(fcmService.sendTechEarningsUpdate).toHaveBeenCalledWith('tech-1', {
        bookingId: 'booking-abc',
        techAmount: 39000,
      });
    });
  });
});
```

- [ ] **Step 2: Run to confirm RED**

```bash
cd api && pnpm test tests/unit/trigger-booking-completed.test.ts
```
Expected: FAIL — "Cannot find module '../../src/functions/trigger-booking-completed.js'"

- [ ] **Step 3: Implement trigger-booking-completed.ts**

Create `api/src/functions/trigger-booking-completed.ts`:
```typescript
import '../bootstrap.js';
import { app } from '@azure/functions';
import type { InvocationContext } from '@azure/functions';
import * as Sentry from '@sentry/node';
import { randomUUID } from 'node:crypto';
import { BookingDocSchema } from '../schemas/booking.js';
import { walletLedgerRepo } from '../cosmos/wallet-ledger-repository.js';
import { getTechnicianForSettlement, incrementCompletedJobCount } from '../cosmos/technician-repository.js';
import { appendAuditEntry } from '../cosmos/audit-log-repository.js';
import { calculateCommission } from '../services/commission.service.js';
import { RazorpayRouteService } from '../services/razorpayRoute.service.js';
import { sendTechEarningsUpdate } from '../services/fcm.service.js';

const DB_NAME = process.env['COSMOS_DATABASE'] ?? 'homeservices';

function systemAuditEntry(action: string, resourceId: string, payload: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  return appendAuditEntry({
    id: randomUUID(),
    adminId: 'system',
    role: 'system',
    action,
    resourceType: 'booking',
    resourceId,
    payload,
    timestamp,
    partitionKey: timestamp.slice(0, 7),
  });
}

export async function settleBooking(bookingRaw: unknown, ctx: InvocationContext): Promise<void> {
  const parsed = BookingDocSchema.safeParse(bookingRaw);
  if (!parsed.success || parsed.data.status !== 'COMPLETED') return;

  const booking = parsed.data;
  const { id: bookingId, technicianId } = booking;

  if (!technicianId) {
    ctx.log(`settleBooking: COMPLETED booking ${bookingId} has no technicianId — skipping`);
    return;
  }

  const existing = await walletLedgerRepo.getByBookingId(bookingId, technicianId);
  if (existing) {
    ctx.log(`settleBooking: entry already exists for ${bookingId} (status=${existing.payoutStatus}) — skipping`);
    return;
  }

  const bookingAmount = booking.finalAmount ?? booking.amount;

  await systemAuditEntry('ROUTE_TRANSFER_ATTEMPT', bookingId, { technicianId, bookingAmount });

  const tech = await getTechnicianForSettlement(technicianId);
  const completedJobCount = tech?.completedJobCount ?? 0;
  const { commissionBps, commissionAmount, techAmount } = calculateCommission(
    completedJobCount,
    bookingAmount,
  );

  const created = await walletLedgerRepo.createPendingEntry({
    bookingId,
    technicianId,
    bookingAmount,
    completedJobCountAtSettlement: completedJobCount,
    commissionBps,
    commissionAmount,
    techAmount,
  });
  if (!created) {
    ctx.log(`settleBooking: concurrent invocation already created entry for ${bookingId} — skipping`);
    return;
  }

  if (!tech?.razorpayLinkedAccountId) {
    await walletLedgerRepo.markFailed(bookingId, technicianId, 'no Razorpay linked account');
    await systemAuditEntry('ROUTE_TRANSFER_FAILED', bookingId, { reason: 'no Razorpay linked account' });
    return;
  }

  const razorpay = new RazorpayRouteService();
  try {
    const { transferId } = await razorpay.transfer({
      accountId: tech.razorpayLinkedAccountId,
      amount: techAmount,
      notes: { bookingId, technicianId },
      idempotencyKey: bookingId,
    });
    await walletLedgerRepo.markPaid(bookingId, technicianId, transferId);
    await incrementCompletedJobCount(technicianId);
    await sendTechEarningsUpdate(technicianId, { bookingId, techAmount });
    await systemAuditEntry('ROUTE_TRANSFER_SUCCESS', bookingId, { transferId, techAmount });
  } catch (err: unknown) {
    const reason = err instanceof Error ? err.message : String(err);
    await walletLedgerRepo.markFailed(bookingId, technicianId, reason);
    Sentry.captureException(err);
    await systemAuditEntry('ROUTE_TRANSFER_FAILED', bookingId, { reason });
  }
}

app.cosmosDB('triggerBookingCompleted', {
  connectionStringSetting: 'COSMOS_CONNECTION_STRING',
  databaseName: DB_NAME,
  containerName: 'bookings',
  leaseContainerName: 'booking_completed_leases',
  createLeaseContainerIfNotExists: true,
  startFromBeginning: false,
  handler: async (documents: unknown[], context: InvocationContext): Promise<void> => {
    for (const doc of documents) {
      try {
        await settleBooking(doc, context);
      } catch (err: unknown) {
        Sentry.captureException(err);
        context.log(
          `settleBooking ERROR: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  },
});
```

- [ ] **Step 4: Run to confirm GREEN**

```bash
cd api && pnpm test tests/unit/trigger-booking-completed.test.ts
```
Expected: PASS — all tests pass.

- [ ] **Step 5: Run full test suite to check no regressions**

```bash
cd api && pnpm test:coverage
```
Expected: all existing tests still pass; coverage thresholds met.

- [ ] **Step 6: Commit**

```bash
git add api/tests/unit/trigger-booking-completed.test.ts \
        api/src/functions/trigger-booking-completed.ts
git commit -m "feat(e06-s04): booking-completed change-feed trigger — Route transfer + idempotency + audit (TDD)"
```

---

## Task 5: Daily reconciliation cron (TDD)

**Files:**
- Create: `api/tests/unit/trigger-reconcile-payouts.test.ts`
- Create: `api/src/functions/trigger-reconcile-payouts.ts`

- [ ] **Step 1: Write the failing tests**

Create `api/tests/unit/trigger-reconcile-payouts.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { InvocationContext } from '@azure/functions';

vi.mock('../../src/cosmos/wallet-ledger-repository.js');
vi.mock('../../src/cosmos/technician-repository.js');
vi.mock('../../src/cosmos/audit-log-repository.js');
vi.mock('../../src/services/fcm.service.js');
vi.mock('../../src/services/razorpayRoute.service.js');

import { reconcilePayouts } from '../../src/functions/trigger-reconcile-payouts.js';
import { walletLedgerRepo } from '../../src/cosmos/wallet-ledger-repository.js';
import * as techRepo from '../../src/cosmos/technician-repository.js';
import * as auditRepo from '../../src/cosmos/audit-log-repository.js';
import * as fcmService from '../../src/services/fcm.service.js';
import { RazorpayRouteService } from '../../src/services/razorpayRoute.service.js';

const mockCtx = { log: vi.fn() } as unknown as InvocationContext;

const mockTransfer = vi.fn();

const stalePendingEntry = {
  id: 'booking-stale',
  bookingId: 'booking-stale',
  technicianId: 'tech-2',
  partitionKey: 'tech-2',
  bookingAmount: 50000,
  completedJobCountAtSettlement: 10,
  commissionBps: 2200,
  commissionAmount: 11000,
  techAmount: 39000,
  payoutStatus: 'PENDING' as const,
  createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
};

const failedEntry = {
  ...stalePendingEntry,
  id: 'booking-fail',
  bookingId: 'booking-fail',
  payoutStatus: 'FAILED' as const,
  failureReason: 'Razorpay timeout',
  createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(walletLedgerRepo.getPendingEntriesOlderThan).mockResolvedValue([]);
  vi.mocked(walletLedgerRepo.getFailedEntries).mockResolvedValue([]);
  vi.mocked(walletLedgerRepo.markPaid).mockResolvedValue(undefined);
  vi.mocked(walletLedgerRepo.markFailed).mockResolvedValue(undefined);
  vi.mocked(techRepo.getTechnicianForSettlement).mockResolvedValue({
    id: 'tech-2', completedJobCount: 10, razorpayLinkedAccountId: 'acc-rp-2',
  });
  vi.mocked(techRepo.incrementCompletedJobCount).mockResolvedValue(undefined);
  vi.mocked(auditRepo.appendAuditEntry).mockResolvedValue(undefined);
  vi.mocked(fcmService.sendTechEarningsUpdate).mockResolvedValue(undefined);
  vi.mocked(fcmService.sendOwnerRouteAlert).mockResolvedValue(undefined);
  mockTransfer.mockResolvedValue({ transferId: 'trf-retry-1' });
  vi.mocked(RazorpayRouteService).mockImplementation(() => ({
    transfer: mockTransfer,
  }) as unknown as RazorpayRouteService);
});

describe('reconcilePayouts', () => {
  it('does nothing and sends no alert when no stale pending or failed entries', async () => {
    await reconcilePayouts(mockCtx);
    expect(mockTransfer).not.toHaveBeenCalled();
    expect(fcmService.sendOwnerRouteAlert).not.toHaveBeenCalled();
  });

  describe('stale PENDING retry', () => {
    it('retries stale PENDING entry with same idempotency key (Razorpay deduplication)', async () => {
      vi.mocked(walletLedgerRepo.getPendingEntriesOlderThan).mockResolvedValue([stalePendingEntry]);

      await reconcilePayouts(mockCtx);

      expect(mockTransfer).toHaveBeenCalledWith(
        expect.objectContaining({ idempotencyKey: 'booking-stale' }),
      );
    });

    it('uses stored techAmount from wallet_ledger entry for retry amount', async () => {
      vi.mocked(walletLedgerRepo.getPendingEntriesOlderThan).mockResolvedValue([stalePendingEntry]);

      await reconcilePayouts(mockCtx);

      expect(mockTransfer).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 39000 }),
      );
    });

    it('marks entry PAID and increments job count on successful retry', async () => {
      vi.mocked(walletLedgerRepo.getPendingEntriesOlderThan).mockResolvedValue([stalePendingEntry]);

      await reconcilePayouts(mockCtx);

      expect(walletLedgerRepo.markPaid).toHaveBeenCalledWith('booking-stale', 'tech-2', 'trf-retry-1');
      expect(techRepo.incrementCompletedJobCount).toHaveBeenCalledWith('tech-2');
    });

    it('marks entry FAILED and sends owner alert on retry failure', async () => {
      vi.mocked(walletLedgerRepo.getPendingEntriesOlderThan).mockResolvedValue([stalePendingEntry]);
      mockTransfer.mockRejectedValue(new Error('retry failed'));

      await reconcilePayouts(mockCtx);

      expect(walletLedgerRepo.markFailed).toHaveBeenCalledWith(
        'booking-stale', 'tech-2', 'retry failed',
      );
      expect(fcmService.sendOwnerRouteAlert).toHaveBeenCalledWith(
        expect.objectContaining({ stalePending: 1 }),
      );
    });
  });

  describe('failed entries alert', () => {
    it('sends owner FCM alert when there are FAILED entries', async () => {
      vi.mocked(walletLedgerRepo.getFailedEntries).mockResolvedValue([failedEntry]);

      await reconcilePayouts(mockCtx);

      expect(fcmService.sendOwnerRouteAlert).toHaveBeenCalledWith(
        expect.objectContaining({ failed: 1 }),
      );
    });

    it('combines retry-failed count and pre-existing failed count in alert', async () => {
      vi.mocked(walletLedgerRepo.getPendingEntriesOlderThan).mockResolvedValue([stalePendingEntry]);
      vi.mocked(walletLedgerRepo.getFailedEntries).mockResolvedValue([failedEntry]);
      mockTransfer.mockRejectedValue(new Error('still failing'));

      await reconcilePayouts(mockCtx);

      expect(fcmService.sendOwnerRouteAlert).toHaveBeenCalledWith({ stalePending: 1, failed: 1 });
    });

    it('writes RECON_MISMATCH_ALERT audit entry when alerting', async () => {
      vi.mocked(walletLedgerRepo.getFailedEntries).mockResolvedValue([failedEntry]);

      await reconcilePayouts(mockCtx);

      const alertCall = vi.mocked(auditRepo.appendAuditEntry).mock.calls.find(
        ([entry]) => entry.action === 'RECON_MISMATCH_ALERT',
      );
      expect(alertCall).toBeDefined();
    });
  });

  describe('audit entries', () => {
    it('writes RECON_RETRY_ATTEMPT before transfer call', async () => {
      vi.mocked(walletLedgerRepo.getPendingEntriesOlderThan).mockResolvedValue([stalePendingEntry]);
      const callOrder: string[] = [];
      vi.mocked(auditRepo.appendAuditEntry).mockImplementation(async (e) => { callOrder.push(`audit:${e.action}`); });
      mockTransfer.mockImplementation(async () => { callOrder.push('razorpay'); return { transferId: 't1' }; });

      await reconcilePayouts(mockCtx);

      expect(callOrder[0]).toBe('audit:RECON_RETRY_ATTEMPT');
      expect(callOrder.indexOf('razorpay')).toBeGreaterThan(callOrder.indexOf('audit:RECON_RETRY_ATTEMPT'));
    });
  });
});
```

- [ ] **Step 2: Run to confirm RED**

```bash
cd api && pnpm test tests/unit/trigger-reconcile-payouts.test.ts
```
Expected: FAIL — "Cannot find module '../../src/functions/trigger-reconcile-payouts.js'"

- [ ] **Step 3: Implement trigger-reconcile-payouts.ts**

Create `api/src/functions/trigger-reconcile-payouts.ts`:
```typescript
import '../bootstrap.js';
import { app } from '@azure/functions';
import type { Timer, InvocationContext } from '@azure/functions';
import * as Sentry from '@sentry/node';
import { randomUUID } from 'node:crypto';
import { walletLedgerRepo } from '../cosmos/wallet-ledger-repository.js';
import { getTechnicianForSettlement, incrementCompletedJobCount } from '../cosmos/technician-repository.js';
import { appendAuditEntry } from '../cosmos/audit-log-repository.js';
import { RazorpayRouteService } from '../services/razorpayRoute.service.js';
import { sendTechEarningsUpdate, sendOwnerRouteAlert } from '../services/fcm.service.js';

function systemAuditEntry(action: string, payload: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  return appendAuditEntry({
    id: randomUUID(),
    adminId: 'system',
    role: 'system',
    action,
    resourceType: 'wallet_ledger',
    resourceId: 'reconciliation',
    payload,
    timestamp,
    partitionKey: timestamp.slice(0, 7),
  });
}

export async function reconcilePayouts(ctx: InvocationContext): Promise<void> {
  const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

  const [pendingStale, failedEntries] = await Promise.all([
    walletLedgerRepo.getPendingEntriesOlderThan(cutoff),
    walletLedgerRepo.getFailedEntries(),
  ]);

  ctx.log(
    `reconcilePayouts: ${pendingStale.length} stale-pending, ${failedEntries.length} failed entries`,
  );

  const razorpay = new RazorpayRouteService();
  let retryFailed = 0;

  for (const entry of pendingStale) {
    await systemAuditEntry('RECON_RETRY_ATTEMPT', { bookingId: entry.bookingId });
    try {
      const tech = await getTechnicianForSettlement(entry.technicianId);
      if (!tech?.razorpayLinkedAccountId) {
        throw new Error('no Razorpay linked account');
      }
      const { transferId } = await razorpay.transfer({
        accountId: tech.razorpayLinkedAccountId,
        amount: entry.techAmount,
        notes: { bookingId: entry.bookingId, technicianId: entry.technicianId },
        idempotencyKey: entry.bookingId,
      });
      await walletLedgerRepo.markPaid(entry.bookingId, entry.technicianId, transferId);
      await incrementCompletedJobCount(entry.technicianId);
      await sendTechEarningsUpdate(entry.technicianId, {
        bookingId: entry.bookingId,
        techAmount: entry.techAmount,
      });
      await systemAuditEntry('RECON_RETRY_SUCCESS', { bookingId: entry.bookingId, transferId });
    } catch (err: unknown) {
      const reason = err instanceof Error ? err.message : String(err);
      await walletLedgerRepo.markFailed(entry.bookingId, entry.technicianId, reason);
      Sentry.captureException(err);
      await systemAuditEntry('RECON_RETRY_FAILED', { bookingId: entry.bookingId, reason });
      retryFailed += 1;
    }
  }

  const totalMismatches = retryFailed + failedEntries.length;
  if (totalMismatches > 0) {
    await sendOwnerRouteAlert({ stalePending: retryFailed, failed: failedEntries.length });
    await systemAuditEntry('RECON_MISMATCH_ALERT', {
      stalePending: retryFailed,
      failed: failedEntries.length,
    });
  }
}

app.timer('triggerReconcilePayouts', {
  // 2 AM IST = 8:30 PM UTC previous day
  schedule: '0 30 20 * * *',
  handler: async (_timer: Timer, ctx: InvocationContext): Promise<void> => {
    try {
      await reconcilePayouts(ctx);
    } catch (err: unknown) {
      Sentry.captureException(err);
      ctx.log(`reconcilePayouts ERROR: ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    }
  },
});
```

- [ ] **Step 4: Run to confirm GREEN**

```bash
cd api && pnpm test tests/unit/trigger-reconcile-payouts.test.ts
```
Expected: PASS — all tests pass.

- [ ] **Step 5: Run full test suite with coverage**

```bash
cd api && pnpm test:coverage
```
Expected: all tests pass; coverage ≥ 80% on all metrics.

- [ ] **Step 6: Commit**

```bash
git add api/tests/unit/trigger-reconcile-payouts.test.ts \
        api/src/functions/trigger-reconcile-payouts.ts
git commit -m "feat(e06-s04): daily reconciliation cron — retry stale PENDING + FCM owner alert (TDD)"
```

---

## Task 6: Pre-Codex smoke gate + review

- [ ] **Step 1: Run pre-Codex smoke gate**

```bash
bash tools/pre-codex-smoke-api.sh
```
Expected: exits 0. If non-zero: fix the failing check before proceeding.

Common failures and fixes:
- TypeScript error → `pnpm typecheck` to see the specific error; fix it
- Lint warning → `pnpm lint` to see; fix with `pnpm lint --fix` or manually
- Test failure → `pnpm test` to see; fix the failing test
- Coverage below threshold → add test cases until coverage is met

- [ ] **Step 2: Codex review (authoritative)**

```bash
codex review --base main
```
Expected: `.codex-review-passed` marker written.
If Codex raises a P1: fix it before proceeding. P2 findings: document in PR description.

- [ ] **Step 3: Security review (parallel with Codex)**

Run `/security-review` (payment + audit story — both required per CLAUDE.md).

- [ ] **Step 4: Push and open PR**

```bash
git push origin feature/E06-S04-razorpay-route-split-payment
```
Then open PR to `main`. Add to PR description:
- Summary of the 3 work streams (WS-A/B/C)
- List of Codex P2 findings (if any) and disposition
- Security review result
- CI green badge

---

## Self-Review Checklist

### Spec coverage
| Requirement | Task that covers it |
|---|---|
| wallet_ledger Cosmos schema | Task 1 (schema), Task 3 (repository) |
| Commission 22% below 50 jobs | Task 2 (TDD) |
| Commission 25% at/above 50 jobs | Task 2 (TDD) |
| Change-feed trigger on COMPLETED | Task 4 |
| Idempotency (booking ID = transfer reference) | Task 4 (idempotency tests) |
| Audit log before Razorpay call | Task 4 (audit order test) |
| Route failure = FAILED, booking stays COMPLETED | Task 4 (failure isolation tests) |
| Daily reconciliation cron | Task 5 |
| Stale PENDING retry with same idempotency key | Task 5 (retry tests) |
| Mismatch FCM alert to owner | Task 5 (alert tests) |
| RECON_MISMATCH_ALERT audit entry | Task 5 |
| Tech FCM earnings update on success | Task 4 (sendTechEarningsUpdate test) |
| completedJobCount incremented after settlement | Task 4 (incrementCompletedJobCount test) |
| /security-review (payment story) | Task 6 |

### Security invariants confirmed
- [ ] `ROUTE_TRANSFER_ATTEMPT` audit written before `razorpay.transfer()` call (tested in Task 4)
- [ ] `idempotencyKey: bookingId` passed to Route transfer (tested in Task 4)
- [ ] Razorpay failure → wallet_ledger FAILED; booking status untouched (tested in Task 4)
- [ ] No card data, only `transferId` reference stored

### Type consistency check
- `WalletLedgerCreateInput.bookingId` → used as `id` in Cosmos doc (Task 3 repo)
- `WalletLedgerEntry.partitionKey` matches `technicianId` (Task 3 repo)
- `'system'` in `AuditLogEntry.role` (Task 1) matches usage in trigger functions (Tasks 4, 5)
- `calculateCommission` returns `{ commissionBps, commissionAmount, techAmount }` (Task 2) — same property names consumed in Task 3/4
- `getTechnicianForSettlement` returns `TechnicianSettlementInfo` with `completedJobCount` and `razorpayLinkedAccountId` — both consumed in Task 4
