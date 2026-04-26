# Story E07-S04: Tech no-show detection + auto-credit + re-dispatch

Status: ready-for-dev

> **Epic:** E07 — Ratings, Complaints & Safety (`docs/stories/README.md` §E07)
> **Sprint:** S4 (wk 7–8) · **Estimated:** ≤ 1 dev-day · **Priority:** P1
> **Sub-projects:** `api/` only — no Android or admin-web changes
> **Ceremony tier:** Feature (new Cosmos container + new Azure Function timer + dispatcher extension — substantive but bounded; Codex + CI; no /security-review)
> **Prerequisite:** E05-S02 (dispatcher live) + E06-S04 (wallet_ledger pattern established)

---

## Story

As a **customer whose technician never arrived for the booked slot**,
I want the platform to automatically detect the no-show after 30 minutes, credit ₹500 to my account, and find me a new technician — without any action on my part,
so that **I am compensated fairly and not stuck waiting for a tech who won't come**.

---

## Acceptance Criteria

### AC-1 · No-show detection fires exactly once per booking
- **Given** a booking is in `ASSIGNED` status (tech accepted but hasn't transitioned to `REACHED`)
- **When** 30 minutes have elapsed since the slot start time (derived from `booking.slotDate` + start of `booking.slotWindow` in IST)
- **Then** the no-show detector processes that booking exactly once
- **And** subsequent timer invocations skip already-processed bookings (idempotency via 409 Conflict on `customer_credits` insert with `id = bookingId`)

### AC-2 · ₹500 credit written to `customer_credits` container
- **When** a no-show is detected for `bookingId`
- **Then** a document is created in the `customer_credits` Cosmos container:
  ```
  { id: bookingId, customerId, bookingId, amount: 50000, reason: "NO_SHOW", createdAt }
  ```
  (amount in paise: 50000 = ₹500)
- **And** if the document already exists (409), the booking is left unchanged — no double credit

### AC-3 · Booking status transitions to `NO_SHOW_REDISPATCH`
- **When** the credit is written successfully
- **Then** `booking.status` is updated from `ASSIGNED` → `NO_SHOW_REDISPATCH`
- **And** this transition is idempotent — if the booking is already `NO_SHOW_REDISPATCH`, skip

### AC-4 · Re-dispatch with expanded radius
- **When** the booking transitions to `NO_SHOW_REDISPATCH`
- **Then** the dispatcher is called with `radiusKm = 15` (= original `DISPATCH_RADIUS_KM * 1.5`)
- **And** the dispatcher creates a new `DispatchAttemptDoc` and FCMs the top-3 techs in the expanded radius
- **And** the booking status transitions to `SEARCHING` (owned by the dispatcher, same as normal dispatch)

### AC-5 · FCM notification to customer
- **When** the credit is written and re-dispatch is triggered
- **Then** an FCM data message is sent to `customer_{customerId}` topic:
  ```json
  {
    "type": "NO_SHOW_CREDIT_ISSUED",
    "bookingId": "<bookingId>",
    "creditAmount": "50000",
    "bodyText": "तकनीशियन नहीं आए — ₹500 credit आपके account में जोड़ा गया। नया तकनीशियन ढूंढ रहे हैं।"
  }
  ```
- FCM failure must be caught and captured by Sentry — it must NOT roll back the credit or block re-dispatch

### AC-6 · Timer schedule
- The function runs every 5 minutes: cron `0 */5 * * * *`
- Must handle the case where no bookings need processing (zero iterations — no error)

---

## Tasks / Subtasks

> TDD: test file committed before implementation file per CLAUDE.md.

- [ ] **T1 — Schema + Cosmos client (api/, no tests)**
  - [ ] Add `'NO_SHOW_REDISPATCH'` to `BOOKING_STATUSES` array in `api/src/schemas/booking.ts`
  - [ ] Create `api/src/schemas/customer-credit.ts` — `CustomerCreditDocSchema` + `CustomerCreditDoc` type
  - [ ] Add `getCustomerCreditsContainer()` to `api/src/cosmos/client.ts`

- [ ] **T2 — `customerCreditRepo` (api/, TDD)**
  - [ ] Create `api/src/cosmos/customer-credit-repository.ts`
  - [ ] `createCreditIfAbsent(doc): Promise<boolean>` — returns `false` (already exists) on 409, throws on other errors
  - [ ] Test file: `api/tests/unit/cosmos/customer-credit-repository.test.ts`

- [ ] **T3 — Booking repo: ASSIGNED query (api/, TDD)**
  - [ ] Add `getAssignedBookingsBefore(slotDateCutoff: string): Promise<BookingDoc[]>` to `api/src/cosmos/booking-repository.ts`
  - [ ] Queries: `SELECT * FROM c WHERE c.status = 'ASSIGNED' AND c.slotDate <= @slotDate`
  - [ ] Test file: `api/tests/unit/cosmos/booking-repository.test.ts` (extend existing if present, or new file)

- [ ] **T4 — Dispatcher re-dispatch variant (api/, TDD)**
  - [ ] In `api/src/services/dispatcher.service.ts`, export `redispatch(bookingId: string, radiusKm: number): Promise<void>`
  - [ ] Reuses internal dispatch logic but accepts a radius override and skips the PAID status guard (caller has already transitioned booking to `NO_SHOW_REDISPATCH`)
  - [ ] Refactor: extract `dispatchBookingToTechs(bookingId, radiusKm, booking)` helper called by both `triggerDispatch` and `redispatch`
  - [ ] Test: `api/tests/unit/dispatcher.service.test.ts` — extend with `redispatch` cases

- [ ] **T5 — FCM: `sendNoShowCreditPush` (api/, no separate test)**
  - [ ] Add `sendNoShowCreditPush(customerId: string, bookingId: string, creditAmount: number): Promise<void>` to `api/src/services/fcm.service.ts`
  - [ ] Topic: `` `customer_${customerId}` ``, data: `{ type: 'NO_SHOW_CREDIT_ISSUED', bookingId, creditAmount: String(creditAmount), bodyText: '...' }`
  - [ ] Covered by integration in T6 test

- [ ] **T6 — `trigger-no-show-detector` Azure Function (api/, TDD)**
  - [ ] Create `api/src/functions/trigger-no-show-detector.ts`
  - [ ] Export `detectNoShows(ctx: InvocationContext): Promise<void>` (testable standalone)
  - [ ] Register `app.timer('triggerNoShowDetector', { schedule: '0 */5 * * * *', handler })`
  - [ ] Test file: `api/tests/unit/trigger-no-show-detector.test.ts` (see Dev Notes for test matrix)

- [ ] **T7 — Pre-Codex smoke gate + Codex review**
  - [ ] `bash tools/pre-codex-smoke-api.sh` — must exit 0
  - [ ] `codex review --base main` → `.codex-review-passed`

---

## Dev Notes

### CRITICAL: No `slotStartTime` field on BookingDoc

The booking schema does NOT have a `slotStartTime` field. The slot start must be derived from two existing fields:
- `slotDate: '2026-04-25'` (YYYY-MM-DD)
- `slotWindow: '10:00-12:00'` (HH:MM-HH:MM)

Parse slot start in IST (India does not observe DST — always +05:30):
```typescript
function slotStartUtcMs(slotDate: string, slotWindow: string): number {
  const startTime = slotWindow.split('-')[0]; // '10:00'
  // Append IST offset so JS Date parses correctly
  return new Date(`${slotDate}T${startTime}:00+05:30`).getTime();
}
```

The no-show cutoff: `slotStartUtcMs(booking.slotDate, booking.slotWindow) + 30 * 60 * 1000 < Date.now()`

**Query strategy:** Cosmos cannot compute this derivation server-side. Query all `ASSIGNED` bookings where `slotDate <= today` (using today's IST date, e.g. `new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })`), then filter in code using the helper above. At pilot scale (≤5k bookings/mo) this cross-partition scan is acceptable — revisit only if ASSIGNED backlog exceeds hundreds of docs.

### `NO_SHOW_REDISPATCH` status must be added to enum

`api/src/schemas/booking.ts:4` — `BOOKING_STATUSES` const array does NOT include `NO_SHOW_REDISPATCH`. Add it. Do NOT change the `confirmPayment` or `markPaid` methods — they have hardcoded status checks that are correct as-is.

### Dispatcher re-dispatch: bypass the PAID guard

`dispatcherService.triggerDispatch` (line 34–38) returns early if `booking.status !== 'PAID'`. For re-dispatch, the booking is already `NO_SHOW_REDISPATCH`. The cleanest approach:

```typescript
// Extract inner logic — status-agnostic
async function dispatchBookingToTechs(
  bookingId: string,
  booking: BookingDoc,
  radiusKm: number,
): Promise<void> {
  // existing body of triggerDispatch, starting from const { lat, lng } = ...
}

export const dispatcherService = {
  async triggerDispatch(bookingId: string): Promise<void> {
    const booking = await bookingRepo.getById(bookingId);
    if (!booking || booking.status !== 'PAID') { ... return; }
    await dispatchBookingToTechs(bookingId, booking, DISPATCH_RADIUS_KM);
  },

  async redispatch(bookingId: string, radiusKm: number): Promise<void> {
    const booking = await bookingRepo.getById(bookingId);
    if (!booking) return; // booking deleted — shouldn't happen
    await dispatchBookingToTechs(bookingId, booking, radiusKm);
  },
};
```

The `DISPATCH_RADIUS_KM = 10` constant stays unchanged. The no-show detector passes `DISPATCH_RADIUS_KM * 1.5 = 15` explicitly. Do NOT import the constant from dispatcher in trigger-no-show-detector.ts — hardcode `15` or define `NO_SHOW_REDISPATCH_RADIUS_KM = 15` locally in the trigger file to avoid tight coupling.

### `customer_credits` container schema

```typescript
export const CustomerCreditDocSchema = z.object({
  id: z.string(),           // = bookingId for idempotency
  customerId: z.string(),   // partition key
  bookingId: z.string(),
  amount: z.number().int().positive(), // paise: 50000 = ₹500
  reason: z.literal('NO_SHOW'),
  createdAt: z.string(),
});
```

Partition key: `/customerId` — allows future "get all credits for customer" queries.
Container accessor: `getCustomerCreditsContainer()` in `api/src/cosmos/client.ts` — identical pattern to `getWalletLedgerContainer()` (line 43–45).

### Idempotency: 409 Conflict on duplicate insert

Reuse the `wallet-ledger-repository.ts` pattern (line 28–31):
```typescript
async createCreditIfAbsent(doc: CustomerCreditDoc): Promise<boolean> {
  try {
    await getCustomerCreditsContainer().items.create(doc);
    return true;
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 409) return false;
    throw err;
  }
}
```
If `createCreditIfAbsent` returns `false`, the no-show was already processed — skip the rest. This is the sole idempotency gate. Do NOT use `_etag` here — 409 on `id` uniqueness is simpler and sufficient.

### No-show detector: execution order matters

For each booking in the ASSIGNED-before-cutoff set:
1. `createCreditIfAbsent` → if false, skip (already processed)
2. `updateBookingFields(bookingId, { status: 'NO_SHOW_REDISPATCH' })` — best-effort; if it fails, Sentry capture + continue
3. `dispatcherService.redispatch(bookingId, 15)` — best-effort; if it fails, Sentry capture + continue
4. `sendNoShowCreditPush(customerId, bookingId, 50000)` — best-effort; if it fails, Sentry capture + continue (FCM failure must NOT undo credit)

The credit write (step 1) is the atomic gate. Steps 2–4 are best-effort. This matches the `reconcilePayouts` pattern in `trigger-reconcile-payouts.ts`.

### FCM pattern

Matches `sendPriceApprovalPush` in `api/src/services/fcm.service.ts:3`:
```typescript
export async function sendNoShowCreditPush(
  customerId: string,
  bookingId: string,
  creditAmount: number,
): Promise<void> {
  await getFirebaseAdmin().messaging().send({
    topic: `customer_${customerId}`,
    data: {
      type: 'NO_SHOW_CREDIT_ISSUED',
      bookingId,
      creditAmount: String(creditAmount),
      bodyText: 'तकनीशियन नहीं आए — ₹500 credit आपके account में जोड़ा गया। नया तकनीशियन ढूंढ रहे हैं।',
    },
  });
}
```

The `bodyText` field is for client display — Android app parses it from the data payload. No notification object needed (the app handles foreground rendering).

### Timer function boilerplate

Follow `trigger-reconcile-payouts.ts` exactly:
```typescript
import '../bootstrap.js';
import { app } from '@azure/functions';
import type { Timer, InvocationContext } from '@azure/functions';
import * as Sentry from '@sentry/node';

export async function detectNoShows(ctx: InvocationContext): Promise<void> { ... }

app.timer('triggerNoShowDetector', {
  schedule: '0 */5 * * * *',
  handler: async (_timer: Timer, ctx: InvocationContext): Promise<void> => {
    try {
      await detectNoShows(ctx);
    } catch (err: unknown) {
      Sentry.captureException(err);
      ctx.log(`detectNoShows ERROR: ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    }
  },
});
```

### Test matrix for T6 (`trigger-no-show-detector.test.ts`)

Mock: `booking-repository`, `customer-credit-repository`, `fcm.service`, `dispatcher.service`, `@sentry/node`

| Scenario | Expected |
|---|---|
| No ASSIGNED bookings | No credit, no FCM, no dispatch |
| ASSIGNED booking, slot 15 min ago | Not yet due — skip |
| ASSIGNED booking, slot 45 min ago | Credit written, status → NO_SHOW_REDISPATCH, redispatch(id, 15), FCM sent |
| `createCreditIfAbsent` returns false (409) | Skip all subsequent steps for that booking |
| `updateBookingFields` throws | Sentry.captureException, continue to next booking |
| `redispatch` throws | Sentry.captureException, FCM still sent |
| `sendNoShowCreditPush` throws | Sentry.captureException, no rethrow |
| Two bookings, one due + one not | Processes only the due one |

### `slotWindow.split('-')` edge case

`'10:00-12:00'.split('-')` → `['10:00', '12:00']` ✓  
The split character `-` does not appear inside the time components (`HH:MM`), only between them. This is safe.

### Booking query scope

`getAssignedBookingsBefore(slotDateCutoff)` should receive today's IST date as the cutoff:
```typescript
const todayIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
// 'en-CA' locale gives YYYY-MM-DD format — identical to slotDate schema
```
This avoids booking records from future slots being returned. The in-code time filter (30-min check) handles edge cases for today's not-yet-due slots.

---

## Definition of Done

- [ ] `cd api && pnpm typecheck && pnpm lint && pnpm test:coverage` green (≥80%)
- [ ] All 8 scenarios in T6 test matrix covered by assertions
- [ ] AC-1 through AC-6 verified via test assertions
- [ ] Pre-Codex smoke gate exits 0
- [ ] `.codex-review-passed` marker present
- [ ] PR opened; CI green on `main`

---

## Dev Agent Record

### Agent Model Used
_To be filled by dev agent_

### Completion Notes
_To be filled by dev agent_

### File List

**NEW files:**
- `api/src/schemas/customer-credit.ts`
- `api/src/cosmos/customer-credit-repository.ts`
- `api/src/functions/trigger-no-show-detector.ts`
- `api/tests/unit/cosmos/customer-credit-repository.test.ts`
- `api/tests/unit/trigger-no-show-detector.test.ts`

**UPDATED files:**
- `api/src/schemas/booking.ts` — add `'NO_SHOW_REDISPATCH'` to `BOOKING_STATUSES`
- `api/src/cosmos/client.ts` — add `getCustomerCreditsContainer()`
- `api/src/cosmos/booking-repository.ts` — add `getAssignedBookingsBefore()`
- `api/src/services/dispatcher.service.ts` — extract `dispatchBookingToTechs()`, add `redispatch()`
- `api/src/services/fcm.service.ts` — add `sendNoShowCreditPush()`
