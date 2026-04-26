# E07-S04: No-Show Detector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Detect tech no-shows 30 min after slot start, auto-credit ₹500 to the customer, re-dispatch with expanded radius, and push an FCM notification — all idempotent and best-effort.

**Architecture:** Azure Functions timer trigger (every 5 min) queries ASSIGNED bookings whose slot start is >30 min ago, writes a `customer_credits` Cosmos doc as the atomic idempotency gate (409 = skip), then runs booking status update → redispatch → FCM as independent best-effort steps. Dispatcher is extended with a `redispatch(bookingId, radiusKm)` method that bypasses the PAID-status guard; slot start is derived at runtime from `booking.slotDate + booking.slotWindow` parsed in IST (+05:30).

**Tech Stack:** Node 22, TypeScript strict, Vitest, Azure Functions v4 (`@azure/functions`), `@azure/cosmos`, `firebase-admin/messaging`, `@sentry/node`

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| MODIFY | `api/src/schemas/booking.ts` | Add `NO_SHOW_REDISPATCH` to status enum |
| CREATE | `api/src/schemas/customer-credit.ts` | `CustomerCreditDoc` Zod schema + type |
| MODIFY | `api/src/cosmos/client.ts` | Add `getCustomerCreditsContainer()` |
| CREATE | `api/src/cosmos/customer-credit-repository.ts` | `createCreditIfAbsent` (idempotent write) |
| MODIFY | `api/src/cosmos/booking-repository.ts` | Add `getAssignedBookingsBefore(slotDateCutoff)` |
| MODIFY | `api/src/services/dispatcher.service.ts` | Extract `dispatchBookingToTechs()`, add `redispatch()` |
| MODIFY | `api/src/services/fcm.service.ts` | Add `sendNoShowCreditPush()` |
| CREATE | `api/src/functions/trigger-no-show-detector.ts` | Timer-triggered no-show detector |
| CREATE | `api/tests/unit/cosmos/customer-credit-repository.test.ts` | Tests for idempotent credit write |
| CREATE | `api/tests/unit/cosmos/booking-repository.test.ts` | Tests for `getAssignedBookingsBefore` |
| MODIFY | `api/tests/unit/dispatcher.service.test.ts` | Tests for `redispatch()` |
| CREATE | `api/tests/unit/trigger-no-show-detector.test.ts` | Timer function test matrix (8 scenarios) |

---

## Task 1: Schema additions + Cosmos container accessor (no tests)

**Files:**
- Modify: `api/src/schemas/booking.ts`
- Create: `api/src/schemas/customer-credit.ts`
- Modify: `api/src/cosmos/client.ts`

- [ ] **Step 1.1: Add `NO_SHOW_REDISPATCH` to booking status enum**

In `api/src/schemas/booking.ts`, update the `BOOKING_STATUSES` array (line 4–8):

```typescript
const BOOKING_STATUSES = [
  'PENDING_PAYMENT', 'SEARCHING', 'ASSIGNED', 'EN_ROUTE',
  'REACHED', 'IN_PROGRESS', 'AWAITING_PRICE_APPROVAL', 'COMPLETED', 'PAID', 'CLOSED',
  'UNFULFILLED', 'CUSTOMER_CANCELLED', 'NO_SHOW_REDISPATCH',
] as const;
```

No other changes to this file.

- [ ] **Step 1.2: Create `api/src/schemas/customer-credit.ts`**

```typescript
import { z } from 'zod';

export const CustomerCreditDocSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  bookingId: z.string(),
  amount: z.number().int().positive(),
  reason: z.literal('NO_SHOW'),
  createdAt: z.string(),
});

export type CustomerCreditDoc = z.infer<typeof CustomerCreditDocSchema>;
```

- [ ] **Step 1.3: Add `getCustomerCreditsContainer()` to `api/src/cosmos/client.ts`**

After the closing brace of `getRatingsContainer()` (line 50–52), add:

```typescript
export function getCustomerCreditsContainer(): Container {
  return getCosmosClient().database(DB_NAME).container('customer_credits');
}
```

- [ ] **Step 1.4: Verify typecheck passes**

```bash
cd api && pnpm typecheck
```

Expected: 0 errors.

- [ ] **Step 1.5: Commit**

```bash
cd api && git add src/schemas/booking.ts src/schemas/customer-credit.ts src/cosmos/client.ts
git commit -m "feat(e07-s04): schema NO_SHOW_REDISPATCH + customer_credits container"
```

---

## Task 2: Customer credit repository with idempotent write (TDD)

**Files:**
- Create: `api/tests/unit/cosmos/customer-credit-repository.test.ts`
- Create: `api/src/cosmos/customer-credit-repository.ts`

- [ ] **Step 2.1: Write the failing test**

Create `api/tests/unit/cosmos/customer-credit-repository.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/cosmos/client.js', () => ({
  getCustomerCreditsContainer: vi.fn(),
}));

import { customerCreditRepo } from '../../../src/cosmos/customer-credit-repository.js';
import { getCustomerCreditsContainer } from '../../../src/cosmos/client.js';
import type { CustomerCreditDoc } from '../../../src/schemas/customer-credit.js';

const mockCreate = vi.fn();

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getCustomerCreditsContainer).mockReturnValue({
    items: { create: mockCreate },
  } as any);
});

const sampleDoc: CustomerCreditDoc = {
  id: 'bk-1',
  customerId: 'cust-1',
  bookingId: 'bk-1',
  amount: 50_000,
  reason: 'NO_SHOW',
  createdAt: '2026-04-25T04:30:00.000Z',
};

describe('customerCreditRepo.createCreditIfAbsent', () => {
  it('creates document and returns true when no prior entry', async () => {
    mockCreate.mockResolvedValue({});
    const result = await customerCreditRepo.createCreditIfAbsent(sampleDoc);
    expect(result).toBe(true);
    expect(mockCreate).toHaveBeenCalledWith(sampleDoc);
  });

  it('returns false (without throwing) on 409 Conflict', async () => {
    mockCreate.mockRejectedValue({ code: 409 });
    const result = await customerCreditRepo.createCreditIfAbsent(sampleDoc);
    expect(result).toBe(false);
  });

  it('rethrows non-409 errors', async () => {
    mockCreate.mockRejectedValue(new Error('cosmos timeout'));
    await expect(customerCreditRepo.createCreditIfAbsent(sampleDoc))
      .rejects.toThrow('cosmos timeout');
  });
});
```

- [ ] **Step 2.2: Run to verify it fails**

```bash
cd api && pnpm test tests/unit/cosmos/customer-credit-repository.test.ts
```

Expected: FAIL — "Cannot find module ... customer-credit-repository.js"

- [ ] **Step 2.3: Implement `api/src/cosmos/customer-credit-repository.ts`**

```typescript
import { getCustomerCreditsContainer } from './client.js';
import type { CustomerCreditDoc } from '../schemas/customer-credit.js';

export const customerCreditRepo = {
  async createCreditIfAbsent(doc: CustomerCreditDoc): Promise<boolean> {
    try {
      await getCustomerCreditsContainer().items.create(doc);
      return true;
    } catch (err: unknown) {
      if ((err as { code?: number }).code === 409) return false;
      throw err;
    }
  },
};
```

- [ ] **Step 2.4: Run tests to verify pass**

```bash
cd api && pnpm test tests/unit/cosmos/customer-credit-repository.test.ts
```

Expected: 3 tests PASS.

- [ ] **Step 2.5: Commit**

```bash
cd api && git add src/cosmos/customer-credit-repository.ts tests/unit/cosmos/customer-credit-repository.test.ts
git commit -m "feat(e07-s04): customer credit repository with idempotent write"
```

---

## Task 3: Booking repo — ASSIGNED query (TDD)

**Files:**
- Create: `api/tests/unit/cosmos/booking-repository.test.ts`
- Modify: `api/src/cosmos/booking-repository.ts`

- [ ] **Step 3.1: Write the failing test**

Create `api/tests/unit/cosmos/booking-repository.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/cosmos/client.js', () => ({
  getBookingsContainer: vi.fn(),
}));

import { bookingRepo } from '../../../src/cosmos/booking-repository.js';
import { getBookingsContainer } from '../../../src/cosmos/client.js';
import type { BookingDoc } from '../../../src/schemas/booking.js';

const mockQueryFetchAll = vi.fn();

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getBookingsContainer).mockReturnValue({
    items: {
      query: vi.fn().mockReturnValue({ fetchAll: mockQueryFetchAll }),
    },
  } as any);
});

const BASE: BookingDoc = {
  id: 'bk-1',
  customerId: 'cust-1',
  serviceId: 'svc-1',
  categoryId: 'cat-1',
  slotDate: '2026-04-25',
  slotWindow: '10:00-12:00',
  addressText: '100 MG Road',
  addressLatLng: { lat: 12.97, lng: 77.59 },
  status: 'ASSIGNED',
  paymentOrderId: 'order-1',
  paymentId: 'pay-1',
  paymentSignature: 'sig-1',
  amount: 59900,
  createdAt: '2026-04-25T04:00:00.000Z',
};

describe('bookingRepo.getAssignedBookingsBefore', () => {
  it('queries with ASSIGNED status filter and slotDate cutoff', async () => {
    mockQueryFetchAll.mockResolvedValue({ resources: [BASE] });

    const result = await bookingRepo.getAssignedBookingsBefore('2026-04-25');

    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('bk-1');

    const queryCalls = vi.mocked(getBookingsContainer().items.query).mock.calls;
    const querySpec = queryCalls[0]![0] as any;
    expect(querySpec.query).toContain("c.status = 'ASSIGNED'");
    expect(querySpec.query).toContain('c.slotDate <= @slotDate');
    expect(querySpec.parameters).toContainEqual({ name: '@slotDate', value: '2026-04-25' });
  });

  it('returns empty array when no ASSIGNED bookings found', async () => {
    mockQueryFetchAll.mockResolvedValue({ resources: [] });
    const result = await bookingRepo.getAssignedBookingsBefore('2026-04-25');
    expect(result).toEqual([]);
  });
});
```

- [ ] **Step 3.2: Run to verify it fails**

```bash
cd api && pnpm test tests/unit/cosmos/booking-repository.test.ts
```

Expected: FAIL — "bookingRepo.getAssignedBookingsBefore is not a function"

- [ ] **Step 3.3: Add `getAssignedBookingsBefore` to `api/src/cosmos/booking-repository.ts`**

In `bookingRepo` object, add after `getStaleSearching` (after line 68):

```typescript
  async getAssignedBookingsBefore(slotDateCutoff: string): Promise<BookingDoc[]> {
    const { resources } = await getBookingsContainer()
      .items.query<BookingDoc>({
        query: "SELECT * FROM c WHERE c.status = 'ASSIGNED' AND c.slotDate <= @slotDate",
        parameters: [{ name: '@slotDate', value: slotDateCutoff }],
      })
      .fetchAll();
    return resources;
  },
```

- [ ] **Step 3.4: Run tests to verify pass**

```bash
cd api && pnpm test tests/unit/cosmos/booking-repository.test.ts
```

Expected: 2 tests PASS.

- [ ] **Step 3.5: Commit**

```bash
cd api && git add src/cosmos/booking-repository.ts tests/unit/cosmos/booking-repository.test.ts
git commit -m "feat(e07-s04): booking repo getAssignedBookingsBefore query"
```

---

## Task 4: Dispatcher `redispatch()` extension (TDD)

**Files:**
- Modify: `api/tests/unit/dispatcher.service.test.ts`
- Modify: `api/src/services/dispatcher.service.ts`

- [ ] **Step 4.1: Append `redispatch` tests to the existing test file**

At the end of `api/tests/unit/dispatcher.service.test.ts` (after the last `});` closing the `triggerDispatch` describe block), add:

```typescript
// ── dispatcherService.redispatch ──────────────────────────────────────────────

describe('dispatcherService.redispatch', () => {
  let dispatchContainer: ReturnType<typeof makeDispatchContainer>;
  let messaging: ReturnType<typeof makeMessaging>;

  beforeEach(() => {
    vi.clearAllMocks();
    dispatchContainer = makeDispatchContainer();
    messaging = makeMessaging();
    vi.mocked(getDispatchAttemptsContainer).mockReturnValue(dispatchContainer as any);
    vi.mocked(getMessaging).mockReturnValue(messaging as any);
    vi.mocked(updateBookingFields).mockResolvedValue(null);
  });

  it('dispatches when booking is in NO_SHOW_REDISPATCH status (bypasses PAID guard)', async () => {
    const noShowBooking = { ...BASE_BOOKING, status: 'NO_SHOW_REDISPATCH' as const };
    vi.mocked(bookingRepo.getById).mockResolvedValue(noShowBooking);
    vi.mocked(getTechniciansWithinRadius).mockResolvedValue([makeTech('t1', 0.05)]);

    await dispatcherService.redispatch('bk-1', 15);

    expect(getTechniciansWithinRadius).toHaveBeenCalledWith(
      noShowBooking.addressLatLng.lat,
      noShowBooking.addressLatLng.lng,
      15,
      noShowBooking.serviceId,
    );
    expect(dispatchContainer.items.create).toHaveBeenCalledOnce();
  });

  it('does nothing when booking not found', async () => {
    vi.mocked(bookingRepo.getById).mockResolvedValue(null);
    await dispatcherService.redispatch('missing', 15);
    expect(getTechniciansWithinRadius).not.toHaveBeenCalled();
  });

  it('marks booking UNFULFILLED when no techs found in expanded radius', async () => {
    vi.mocked(bookingRepo.getById).mockResolvedValue({
      ...BASE_BOOKING,
      status: 'NO_SHOW_REDISPATCH' as const,
    });
    vi.mocked(getTechniciansWithinRadius).mockResolvedValue([]);

    await dispatcherService.redispatch('bk-1', 15);

    expect(updateBookingFields).toHaveBeenCalledWith('bk-1', { status: 'UNFULFILLED' });
  });

  it('uses the radiusKm parameter passed in, not the default 10km', async () => {
    vi.mocked(bookingRepo.getById).mockResolvedValue({
      ...BASE_BOOKING,
      status: 'NO_SHOW_REDISPATCH' as const,
    });
    vi.mocked(getTechniciansWithinRadius).mockResolvedValue([makeTech('t1', 0.05)]);

    await dispatcherService.redispatch('bk-1', 15);

    expect(getTechniciansWithinRadius).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      15,
      expect.any(String),
    );
  });
});
```

- [ ] **Step 4.2: Run to verify new tests fail**

```bash
cd api && pnpm test tests/unit/dispatcher.service.test.ts
```

Expected: existing tests PASS, new `redispatch` describe block FAIL — "dispatcherService.redispatch is not a function"

- [ ] **Step 4.3: Refactor `api/src/services/dispatcher.service.ts`**

Replace the entire file with the refactored version that extracts `dispatchBookingToTechs` and adds `redispatch`. The public API of `triggerDispatch` is unchanged — all existing tests must still pass.

```typescript
import { randomUUID } from 'node:crypto';
import { getMessaging } from 'firebase-admin/messaging';
import { bookingRepo, updateBookingFields } from '../cosmos/booking-repository.js';
import { getTechniciansWithinRadius } from '../cosmos/technician-repository.js';
import { haversine } from '../cosmos/geo.js';
import { getDispatchAttemptsContainer } from '../cosmos/client.js';
import type { TechnicianProfile } from '../schemas/technician.js';
import type { DispatchAttemptDoc } from '../schemas/dispatch-attempt.js';
import type { BookingDoc } from '../schemas/booking.js';

const DISPATCH_RADIUS_KM = 10;
const OFFER_WINDOW_MS = 30_000;
const TOP_N = 3;

export function rankTechnicians(
  techs: TechnicianProfile[],
  bookingLat: number,
  bookingLng: number,
): TechnicianProfile[] {
  // GeoJSON coordinates: [longitude, latitude]
  return techs
    .map((t) => ({
      tech: t,
      distanceKm: haversine(bookingLat, bookingLng, t.location.coordinates[1], t.location.coordinates[0]),
    }))
    .sort((a, b) => {
      if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;
      // Operator policy (Ayodhya pilot): secondary sort is rating only — decline history must never be used
      return (b.tech.rating ?? 0) - (a.tech.rating ?? 0);
    })
    .map((x) => x.tech);
}

async function dispatchBookingToTechs(
  bookingId: string,
  booking: BookingDoc,
  radiusKm: number,
): Promise<void> {
  const { lat, lng } = booking.addressLatLng;
  // Cosmos uses a bounding-box (square) query; filter to the actual circle radius
  const candidates = (await getTechniciansWithinRadius(lat, lng, radiusKm, booking.serviceId))
    .filter((t) => haversine(lat, lng, t.location.coordinates[1], t.location.coordinates[0]) <= radiusKm);

  if (candidates.length === 0) {
    console.log(`DISPATCH_NO_TECHS bookingId=${bookingId}`);
    await updateBookingFields(bookingId, { status: 'UNFULFILLED' });
    return;
  }

  const ranked = rankTechnicians(candidates, lat, lng).slice(0, TOP_N);
  const sentAt = new Date();
  const expiresAt = new Date(sentAt.getTime() + OFFER_WINDOW_MS);

  const attempt: DispatchAttemptDoc = {
    id: randomUUID(),
    bookingId,
    technicianIds: ranked.map((t) => t.id),
    sentAt: sentAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    status: 'PENDING',
  };

  await getDispatchAttemptsContainer().items.create(attempt);
  // Transition to SEARCHING so the stale-booking reconciler can find stuck dispatches
  await updateBookingFields(bookingId, { status: 'SEARCHING' });

  const messaging = getMessaging();
  await Promise.allSettled(
    ranked.map(async (tech) => {
      if (!tech.fcmToken) return;
      await messaging.send({
        token: tech.fcmToken,
        data: {
          type: 'JOB_OFFER',
          bookingId,
          serviceId: booking.serviceId,
          addressText: booking.addressText,
          slotDate: booking.slotDate,
          slotWindow: booking.slotWindow,
          amount: String(booking.amount),
          distanceKm: String(
            haversine(lat, lng, tech.location.coordinates[1], tech.location.coordinates[0]),
          ),
          expiresAt: expiresAt.toISOString(),
          dispatchAttemptId: attempt.id,
        },
      });
    }),
  );

  console.log(`DISPATCH_SENT bookingId=${bookingId} technicianIds=${ranked.map((t) => t.id).join(',')}`);
}

export const dispatcherService = {
  async triggerDispatch(bookingId: string): Promise<void> {
    const booking = await bookingRepo.getById(bookingId);
    if (!booking || booking.status !== 'PAID') {
      console.log(`DISPATCH_SKIP bookingId=${bookingId} status=${booking?.status ?? 'NOT_FOUND'}`);
      return;
    }
    await dispatchBookingToTechs(bookingId, booking, DISPATCH_RADIUS_KM);
  },

  async redispatch(bookingId: string, radiusKm: number): Promise<void> {
    const booking = await bookingRepo.getById(bookingId);
    if (!booking) return;
    await dispatchBookingToTechs(bookingId, booking, radiusKm);
  },
};
```

- [ ] **Step 4.4: Run all dispatcher tests**

```bash
cd api && pnpm test tests/unit/dispatcher.service.test.ts
```

Expected: ALL tests PASS (existing `rankTechnicians` + `triggerDispatch` tests + new `redispatch` tests).

- [ ] **Step 4.5: Commit**

```bash
cd api && git add src/services/dispatcher.service.ts tests/unit/dispatcher.service.test.ts
git commit -m "feat(e07-s04): dispatcher redispatch with radius override"
```

---

## Task 5: FCM `sendNoShowCreditPush` addition (no separate test)

**Files:**
- Modify: `api/src/services/fcm.service.ts`

- [ ] **Step 5.1: Add `sendNoShowCreditPush` to `api/src/services/fcm.service.ts`**

Append after the last export function in the file:

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

- [ ] **Step 5.2: Typecheck**

```bash
cd api && pnpm typecheck
```

Expected: 0 errors.

- [ ] **Step 5.3: Commit**

```bash
cd api && git add src/services/fcm.service.ts
git commit -m "feat(e07-s04): FCM sendNoShowCreditPush"
```

---

## Task 6: No-show detector timer function (TDD)

**Files:**
- Create: `api/tests/unit/trigger-no-show-detector.test.ts`
- Create: `api/src/functions/trigger-no-show-detector.ts`

- [ ] **Step 6.1: Write the failing test**

Create `api/tests/unit/trigger-no-show-detector.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { InvocationContext } from '@azure/functions';

vi.mock('../../src/cosmos/booking-repository.js', () => ({
  bookingRepo: { getAssignedBookingsBefore: vi.fn() },
  updateBookingFields: vi.fn(),
}));
vi.mock('../../src/cosmos/customer-credit-repository.js', () => ({
  customerCreditRepo: { createCreditIfAbsent: vi.fn() },
}));
vi.mock('../../src/services/dispatcher.service.js', () => ({
  dispatcherService: { redispatch: vi.fn() },
}));
vi.mock('../../src/services/fcm.service.js');
vi.mock('@sentry/node', () => ({ captureException: vi.fn() }));

import { detectNoShows } from '../../src/functions/trigger-no-show-detector.js';
import { bookingRepo, updateBookingFields } from '../../src/cosmos/booking-repository.js';
import { customerCreditRepo } from '../../src/cosmos/customer-credit-repository.js';
import { dispatcherService } from '../../src/services/dispatcher.service.js';
import * as fcmService from '../../src/services/fcm.service.js';
import * as Sentry from '@sentry/node';
import type { BookingDoc } from '../../src/schemas/booking.js';

const mockCtx = { log: vi.fn() } as unknown as InvocationContext;

// Builds a booking doc where slotDate+slotWindow produce a slot start that is
// `minutesAgo` minutes before now in UTC.
function makeAssignedBooking(id: string, minutesAgo: number): BookingDoc {
  const slotStartUtc = new Date(Date.now() - minutesAgo * 60 * 1000);
  // Reverse-engineer the IST date+window from the desired UTC slot start.
  // IST = UTC + 5h30m → slot start IST = slotStartUtc + 330 min
  const slotStartIST = new Date(slotStartUtc.getTime() + 330 * 60 * 1000);
  const slotDate = slotStartIST.toISOString().slice(0, 10); // 'YYYY-MM-DD'
  const hh = String(slotStartIST.getUTCHours()).padStart(2, '0');
  const mm = String(slotStartIST.getUTCMinutes()).padStart(2, '0');
  const endHh = String((slotStartIST.getUTCHours() + 2) % 24).padStart(2, '0');
  const slotWindow = `${hh}:${mm}-${endHh}:${mm}`;

  return {
    id,
    customerId: `cust-${id}`,
    serviceId: 'svc-1',
    categoryId: 'cat-1',
    slotDate,
    slotWindow,
    addressText: '100 MG Road',
    addressLatLng: { lat: 12.97, lng: 77.59 },
    status: 'ASSIGNED',
    paymentOrderId: `order-${id}`,
    paymentId: `pay-${id}`,
    paymentSignature: `sig-${id}`,
    amount: 59900,
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(bookingRepo.getAssignedBookingsBefore).mockResolvedValue([]);
  vi.mocked(customerCreditRepo.createCreditIfAbsent).mockResolvedValue(true);
  vi.mocked(updateBookingFields).mockResolvedValue(null);
  vi.mocked(dispatcherService.redispatch).mockResolvedValue(undefined);
  vi.mocked(fcmService.sendNoShowCreditPush).mockResolvedValue(undefined);
});

describe('detectNoShows', () => {
  it('does nothing when no ASSIGNED bookings returned', async () => {
    vi.mocked(bookingRepo.getAssignedBookingsBefore).mockResolvedValue([]);
    await detectNoShows(mockCtx);
    expect(customerCreditRepo.createCreditIfAbsent).not.toHaveBeenCalled();
  });

  it('skips booking whose slot start is only 15 minutes ago (not yet 30 min)', async () => {
    vi.mocked(bookingRepo.getAssignedBookingsBefore)
      .mockResolvedValue([makeAssignedBooking('bk-early', 15)]);

    await detectNoShows(mockCtx);

    expect(customerCreditRepo.createCreditIfAbsent).not.toHaveBeenCalled();
    expect(dispatcherService.redispatch).not.toHaveBeenCalled();
  });

  it('processes booking 45 minutes past slot start: writes credit, updates status, redispatches, sends FCM', async () => {
    const booking = makeAssignedBooking('bk-due', 45);
    vi.mocked(bookingRepo.getAssignedBookingsBefore).mockResolvedValue([booking]);

    await detectNoShows(mockCtx);

    expect(customerCreditRepo.createCreditIfAbsent).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'bk-due',
        customerId: booking.customerId,
        bookingId: 'bk-due',
        amount: 50_000,
        reason: 'NO_SHOW',
      }),
    );
    expect(updateBookingFields).toHaveBeenCalledWith('bk-due', { status: 'NO_SHOW_REDISPATCH' });
    expect(dispatcherService.redispatch).toHaveBeenCalledWith('bk-due', 15);
    expect(fcmService.sendNoShowCreditPush).toHaveBeenCalledWith(booking.customerId, 'bk-due', 50_000);
  });

  it('skips all subsequent steps when createCreditIfAbsent returns false (idempotency)', async () => {
    vi.mocked(bookingRepo.getAssignedBookingsBefore)
      .mockResolvedValue([makeAssignedBooking('bk-dup', 45)]);
    vi.mocked(customerCreditRepo.createCreditIfAbsent).mockResolvedValue(false);

    await detectNoShows(mockCtx);

    expect(updateBookingFields).not.toHaveBeenCalled();
    expect(dispatcherService.redispatch).not.toHaveBeenCalled();
    expect(fcmService.sendNoShowCreditPush).not.toHaveBeenCalled();
  });

  it('captures Sentry + continues when updateBookingFields throws', async () => {
    vi.mocked(bookingRepo.getAssignedBookingsBefore)
      .mockResolvedValue([makeAssignedBooking('bk-err', 45)]);
    vi.mocked(updateBookingFields).mockRejectedValue(new Error('cosmos 503'));

    await detectNoShows(mockCtx);

    expect(Sentry.captureException).toHaveBeenCalledWith(expect.any(Error));
    // FCM and redispatch still attempted despite status-update failure
    expect(dispatcherService.redispatch).toHaveBeenCalled();
    expect(fcmService.sendNoShowCreditPush).toHaveBeenCalled();
  });

  it('captures Sentry + continues to FCM when redispatch throws', async () => {
    vi.mocked(bookingRepo.getAssignedBookingsBefore)
      .mockResolvedValue([makeAssignedBooking('bk-rdp-err', 45)]);
    vi.mocked(dispatcherService.redispatch).mockRejectedValue(new Error('no techs'));

    await detectNoShows(mockCtx);

    expect(Sentry.captureException).toHaveBeenCalledWith(expect.any(Error));
    expect(fcmService.sendNoShowCreditPush).toHaveBeenCalled();
  });

  it('captures Sentry without rethrowing when sendNoShowCreditPush throws', async () => {
    vi.mocked(bookingRepo.getAssignedBookingsBefore)
      .mockResolvedValue([makeAssignedBooking('bk-fcm-err', 45)]);
    vi.mocked(fcmService.sendNoShowCreditPush).mockRejectedValue(new Error('FCM 503'));

    await expect(detectNoShows(mockCtx)).resolves.not.toThrow();
    expect(Sentry.captureException).toHaveBeenCalledWith(expect.any(Error));
  });

  it('processes only the due booking when given one due + one not-yet-due', async () => {
    const due = makeAssignedBooking('bk-due', 45);
    const notDue = makeAssignedBooking('bk-notdue', 15);
    vi.mocked(bookingRepo.getAssignedBookingsBefore).mockResolvedValue([due, notDue]);

    await detectNoShows(mockCtx);

    expect(customerCreditRepo.createCreditIfAbsent).toHaveBeenCalledTimes(1);
    expect(customerCreditRepo.createCreditIfAbsent).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'bk-due' }),
    );
    expect(customerCreditRepo.createCreditIfAbsent).not.toHaveBeenCalledWith(
      expect.objectContaining({ id: 'bk-notdue' }),
    );
  });
});
```

- [ ] **Step 6.2: Run to verify it fails**

```bash
cd api && pnpm test tests/unit/trigger-no-show-detector.test.ts
```

Expected: FAIL — "Cannot find module ... trigger-no-show-detector.js"

- [ ] **Step 6.3: Implement `api/src/functions/trigger-no-show-detector.ts`**

```typescript
import '../bootstrap.js';
import { app } from '@azure/functions';
import type { Timer, InvocationContext } from '@azure/functions';
import * as Sentry from '@sentry/node';
import { bookingRepo, updateBookingFields } from '../cosmos/booking-repository.js';
import { customerCreditRepo } from '../cosmos/customer-credit-repository.js';
import { dispatcherService } from '../services/dispatcher.service.js';
import { sendNoShowCreditPush } from '../services/fcm.service.js';

const NO_SHOW_CREDIT_PAISE = 50_000;
const NO_SHOW_REDISPATCH_RADIUS_KM = 15;
const NO_SHOW_WINDOW_MS = 30 * 60 * 1_000;

function slotStartUtcMs(slotDate: string, slotWindow: string): number {
  const startTime = slotWindow.split('-')[0]; // '10:00' from '10:00-12:00'
  return new Date(`${slotDate}T${startTime}:00+05:30`).getTime();
}

export async function detectNoShows(ctx: InvocationContext): Promise<void> {
  // 'en-CA' locale gives YYYY-MM-DD format — identical to slotDate schema
  const todayIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const now = Date.now();

  const assignedBookings = await bookingRepo.getAssignedBookingsBefore(todayIST);
  ctx.log(`detectNoShows: ${assignedBookings.length} ASSIGNED bookings on/before ${todayIST}`);

  for (const booking of assignedBookings) {
    const slotStart = slotStartUtcMs(booking.slotDate, booking.slotWindow);
    if (now < slotStart + NO_SHOW_WINDOW_MS) continue;

    const created = await customerCreditRepo.createCreditIfAbsent({
      id: booking.id,
      customerId: booking.customerId,
      bookingId: booking.id,
      amount: NO_SHOW_CREDIT_PAISE,
      reason: 'NO_SHOW',
      createdAt: new Date().toISOString(),
    });

    if (!created) {
      ctx.log(`detectNoShows: already processed bookingId=${booking.id} — skip`);
      continue;
    }

    ctx.log(`detectNoShows: processing no-show bookingId=${booking.id}`);

    try {
      await updateBookingFields(booking.id, { status: 'NO_SHOW_REDISPATCH' });
    } catch (err: unknown) {
      Sentry.captureException(err);
      ctx.log(`detectNoShows: status update failed ${booking.id}: ${err instanceof Error ? err.message : String(err)}`);
    }

    try {
      await dispatcherService.redispatch(booking.id, NO_SHOW_REDISPATCH_RADIUS_KM);
    } catch (err: unknown) {
      Sentry.captureException(err);
      ctx.log(`detectNoShows: redispatch failed ${booking.id}: ${err instanceof Error ? err.message : String(err)}`);
    }

    try {
      await sendNoShowCreditPush(booking.customerId, booking.id, NO_SHOW_CREDIT_PAISE);
    } catch (err: unknown) {
      Sentry.captureException(err);
      ctx.log(`detectNoShows: FCM failed ${booking.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

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

- [ ] **Step 6.4: Run all tests to verify pass**

```bash
cd api && pnpm test tests/unit/trigger-no-show-detector.test.ts
```

Expected: ALL 8 tests PASS.

- [ ] **Step 6.5: Run the full test suite to check for regressions**

```bash
cd api && pnpm test:coverage
```

Expected: all existing tests still PASS; coverage ≥80%.

- [ ] **Step 6.6: Commit**

```bash
cd api && git add src/functions/trigger-no-show-detector.ts tests/unit/trigger-no-show-detector.test.ts
git commit -m "feat(e07-s04): no-show detector timer function with TDD"
```

---

## Task 7: Pre-Codex smoke gate + Codex review (WS-E)

**Files:** none (verification only)

- [ ] **Step 7.1: Run the pre-Codex smoke gate**

```bash
bash tools/pre-codex-smoke-api.sh
```

Expected: exit 0. If non-zero, fix all reported errors before proceeding.

- [ ] **Step 7.2: Run Codex review**

```bash
codex review --base main
```

Expected: `.codex-review-passed` marker written. Address any P1/P2 findings before pushing.

- [ ] **Step 7.3: Push branch and open PR**

```bash
git push -u origin HEAD
```

Open PR against `main`. CI (`ship.yml`) must go green (typecheck + lint + tests ≥80% + Semgrep + Codex marker check).

---

## Self-Review

**Spec coverage check:**

| AC | Covered by task |
|---|---|
| AC-1: idempotency via 409 | Task 2 + Task 6 (skip-on-false branch) |
| AC-2: credit doc with correct fields | Task 2 schema + Task 6 test asserts fields |
| AC-3: booking → NO_SHOW_REDISPATCH | Task 1 (enum) + Task 6 |
| AC-4: redispatch radius=15 | Task 4 + Task 6 asserts `redispatch('bk-due', 15)` |
| AC-5: FCM with correct data shape | Task 5 + Task 6 asserts `sendNoShowCreditPush(customerId, bookingId, 50000)` |
| AC-6: timer schedule `0 */5 * * * *` | Task 6 implementation — inspect line in trigger file |

**Placeholder scan:** No TBD, no TODO, no "similar to above" — all steps have actual code.

**Type consistency check:**
- `CustomerCreditDoc` defined in Task 1, used in Tasks 2 and 6 — consistent
- `createCreditIfAbsent(doc: CustomerCreditDoc): Promise<boolean>` — consistent across Tasks 2 and 6
- `getAssignedBookingsBefore(slotDateCutoff: string): Promise<BookingDoc[]>` — defined Task 3, called Task 6 (via `bookingRepo.getAssignedBookingsBefore`)
- `redispatch(bookingId: string, radiusKm: number): Promise<void>` — defined Task 4, called Task 6 with `(booking.id, 15)` — ✓
- `sendNoShowCreditPush(customerId, bookingId, creditAmount)` — defined Task 5, called Task 6 with `(booking.customerId, booking.id, 50_000)` — ✓
- All `NO_SHOW_REDISPATCH` status references compile because Task 1 adds it to the enum — ✓
