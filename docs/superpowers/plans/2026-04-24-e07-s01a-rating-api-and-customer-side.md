# E07-S01a Rating Flow (API + Customer side) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the `ratings` API contract end-to-end (Cosmos schema, repo, `POST /v1/ratings`, `GET /v1/ratings/{bookingId}`, FCM change-feed trigger on CLOSED) plus the customer-app rating screen that consumes `RATING_PROMPT_CUSTOMER` and lets the customer rate the technician with mutual-reveal projection in the GET response.

**Architecture:** Single Cosmos `ratings` container — one document per booking (partition key `/bookingId`) holding both customer and technician fields. `POST /v1/ratings` writes the calling party's side and atomically flips `revealedAt` once both sides are present. `GET /v1/ratings/{bookingId}` projects each side as either `PENDING` or `SUBMITTED` based on whether mutual reveal has occurred AND the caller's role. A Cosmos change-feed trigger on `bookings` watches for `status === 'CLOSED'`, idempotency-checks via `ratings/{bookingId}` existence, and dispatches FCM data messages to both `customer_{uid}` and `technician_{uid}` topics. The customer-app extends its existing `CustomerFirebaseMessagingService` to dispatch `RATING_PROMPT_CUSTOMER` to a new `RatingPromptEventBus`, which `AppNavigation.kt` collects in a `LaunchedEffect` to navigate to a new `RatingScreen`.

**Tech Stack:** Azure Functions v4 (HTTP + cosmosDB triggers), Zod, Vitest with `vi.mock()`, Cosmos SDK; Kotlin + Compose + Hilt + Retrofit + Moshi + JUnit 5 + MockK + Paparazzi

**Story file:** `docs/stories/E07-S01a-rating-api-and-customer-side.md`

**Patterns to read first:**
- `api/src/functions/active-job.ts` — Bearer-token + booking-participation check
- `api/src/services/fcm.service.ts` — topic data-message pattern to mirror
- `customer-app/.../data/booking/PriceApprovalEventBus.kt` — EventBus pattern
- `customer-app/.../data/booking/di/BookingModule.kt` — Hilt + OkHttp + Retrofit wiring; `@AuthOkHttpClient` qualifier (reuse it)
- `customer-app/.../firebase/CustomerFirebaseMessagingService.kt` — FCM dispatch on `data["type"]`
- `customer-app/.../navigation/AppNavigation.kt` — `LaunchedEffect(eventBus)` + topic subscribe pattern
- `docs/patterns/paparazzi-cross-os-goldens.md`, `hilt-module-android-test-scope.md`, `kotlin-explicit-api-public-modifier.md`

**Dependency note:** The `PAID → CLOSED` transition is wired by **E06-S04** (not yet merged at plan time). Tasks 1–6 are fully unit-testable today; Task 4 end-to-end smoke against real Cosmos waits until E06-S04 lands.

---

## File Map

### New files
| File | Responsibility |
|---|---|
| `api/src/schemas/rating.ts` | Zod schemas: `RatingDocSchema`, `SubmitRatingRequestSchema` (discriminated union by `side`), `GetRatingResponseSchema`, `SidePayloadSchema` |
| `api/src/cosmos/rating-repository.ts` | `submitSide()`, `getByBookingId()`; partition key `/bookingId` |
| `api/src/functions/ratings.ts` | `POST /v1/ratings`, `GET /v1/ratings/{bookingId}` handlers |
| `api/src/functions/trigger-rating-prompt.ts` | Change-feed trigger on `bookings`; lease container `booking_rating_prompt_leases` |
| `api/tests/unit/rating-repository.test.ts` | TDD: first-side, second-side reveal, idempotency |
| `api/tests/unit/ratings.test.ts` | TDD: AC-2 through AC-6 (HTTP behavior) |
| `api/tests/unit/trigger-rating-prompt.test.ts` | TDD: idempotency + skip-non-CLOSED + missing technicianId + error isolation |
| `customer-app/.../data/rating/RatingPromptEventBus.kt` | Mirrors `PriceApprovalEventBus` |
| `customer-app/.../data/rating/RatingRepository.kt` (interface) | `submitCustomerRating(...)`, `get(...)` |
| `customer-app/.../data/rating/RatingRepositoryImpl.kt` | Internal class wrapping `RatingApiService` |
| `customer-app/.../data/rating/remote/RatingApiService.kt` | Retrofit interface — POST + GET |
| `customer-app/.../data/rating/remote/dto/RatingDtos.kt` | Moshi DTOs + `toDomain()` mappers |
| `customer-app/.../data/rating/di/RatingModule.kt` | Hilt `@Binds` + Retrofit `@Provides` reusing `@AuthOkHttpClient` |
| `customer-app/.../domain/rating/SubmitRatingUseCase.kt` | Pass-through |
| `customer-app/.../domain/rating/GetRatingUseCase.kt` | Pass-through |
| `customer-app/.../domain/rating/model/Rating.kt` | `CustomerSubScores`, `TechSubScores`, `CustomerRating`, `TechRating`, `SideState`, `RatingSnapshot` |
| `customer-app/.../ui/rating/RatingScreen.kt` | Composable |
| `customer-app/.../ui/rating/RatingViewModel.kt` | `HiltViewModel` |
| `customer-app/.../ui/rating/RatingRoutes.kt` | Nav route helper |
| `customer-app/app/src/test/.../domain/rating/SubmitRatingUseCaseTest.kt` | TDD |
| `customer-app/app/src/test/.../domain/rating/GetRatingUseCaseTest.kt` | TDD |
| `customer-app/app/src/test/.../ui/rating/RatingViewModelTest.kt` | TDD |
| `customer-app/app/src/test/.../ui/rating/RatingScreenPaparazziTest.kt` | `@Ignore` — recorded on CI |

### Modified files
| File | Change |
|---|---|
| `api/src/cosmos/client.ts` | Add `getRatingsContainer()` getter |
| `api/src/services/fcm.service.ts` | Add `sendRatingPromptCustomerPush()` + `sendRatingPromptTechnicianPush()` |
| `customer-app/.../firebase/CustomerFirebaseMessagingService.kt` | Add `RATING_PROMPT_CUSTOMER` branch → `RatingPromptEventBus.post(bookingId)` |
| `customer-app/.../navigation/AppNavigation.kt` | Accept `RatingPromptEventBus` parameter + add `LaunchedEffect`; register route |
| `customer-app/.../MainActivity.kt` | Inject + pass `RatingPromptEventBus` |

---

## Task 1: `ratings` schema + Cosmos client getter

**Files:** `api/src/schemas/rating.ts`, `api/src/cosmos/client.ts`

No tests — pure types + thin getter. TypeScript is the gate.

- [ ] **Step 1: Create `api/src/schemas/rating.ts`**

```typescript
import { z } from 'zod';

const Stars = z.number().int().min(1).max(5);

export const CustomerSubScoresSchema = z.object({
  punctuality: Stars,
  skill: Stars,
  behaviour: Stars,
});
export const TechSubScoresSchema = z.object({
  behaviour: Stars,
  communication: Stars,
});

export const SubmitRatingRequestSchema = z.discriminatedUnion('side', [
  z.object({
    side: z.literal('CUSTOMER_TO_TECH'),
    bookingId: z.string().min(1),
    overall: Stars,
    subScores: CustomerSubScoresSchema,
    comment: z.string().max(500).optional(),
  }),
  z.object({
    side: z.literal('TECH_TO_CUSTOMER'),
    bookingId: z.string().min(1),
    overall: Stars,
    subScores: TechSubScoresSchema,
    comment: z.string().max(500).optional(),
  }),
]);

export const RatingDocSchema = z.object({
  bookingId: z.string(),
  customerId: z.string(),
  technicianId: z.string(),
  customerOverall: Stars.optional(),
  customerSubScores: CustomerSubScoresSchema.optional(),
  customerComment: z.string().optional(),
  customerSubmittedAt: z.string().optional(),
  techOverall: Stars.optional(),
  techSubScores: TechSubScoresSchema.optional(),
  techComment: z.string().optional(),
  techSubmittedAt: z.string().optional(),
  revealedAt: z.string().optional(),
});

export const SidePayloadSchema = z.union([
  z.object({ status: z.literal('PENDING') }),
  z.object({
    status: z.literal('SUBMITTED'),
    overall: Stars,
    subScores: z.union([CustomerSubScoresSchema, TechSubScoresSchema]),
    comment: z.string().optional(),
    submittedAt: z.string(),
  }),
]);

export const GetRatingResponseSchema = z.object({
  bookingId: z.string(),
  status: z.enum(['PENDING', 'PARTIALLY_SUBMITTED', 'REVEALED']),
  revealedAt: z.string().optional(),
  customerSide: SidePayloadSchema,
  techSide: SidePayloadSchema,
});

export type SubmitRatingRequest = z.infer<typeof SubmitRatingRequestSchema>;
export type RatingDoc = z.infer<typeof RatingDocSchema>;
export type GetRatingResponse = z.infer<typeof GetRatingResponseSchema>;
```

- [ ] **Step 2: Add `getRatingsContainer()` to `api/src/cosmos/client.ts`**

Open the file and add an analogous getter next to existing `getBookingsContainer()`:
```typescript
export function getRatingsContainer() {
  return getCosmosClient().database(DB_NAME).container('ratings');
}
```

If the file uses a different container-cache pattern, follow it exactly. Container `ratings` partition key is `/bookingId`.

- [ ] **Step 3: Typecheck + commit (with story files + plans)**

```bash
cd api && pnpm typecheck
git add api/src/schemas/rating.ts api/src/cosmos/client.ts \
        docs/stories/E07-S01a-rating-api-and-customer-side.md \
        docs/stories/E07-S01b-rating-technician-side.md \
        docs/superpowers/plans/2026-04-24-e07-s01a-rating-api-and-customer-side.md \
        docs/superpowers/plans/2026-04-24-e07-s01b-rating-technician-side.md
git commit -m "feat(e07-s01a): ratings Zod schemas + Cosmos container getter (+ S01a/b stories+plans)"
```

---

## Task 2: `ratingRepository` (TDD)

**Files:** `api/tests/unit/rating-repository.test.ts`, `api/src/cosmos/rating-repository.ts`

- [ ] **Step 1: Write the failing tests**

Create `api/tests/unit/rating-repository.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockItem = { read: vi.fn(), replace: vi.fn() };
const mockContainer = {
  item: vi.fn(() => mockItem),
  items: { create: vi.fn() },
};
vi.mock('../../src/cosmos/client.js', () => ({
  getRatingsContainer: () => mockContainer,
}));

import { ratingRepo } from '../../src/cosmos/rating-repository.js';

const baseDoc = { bookingId: 'bk-1', customerId: 'cust-1', technicianId: 'tech-1' };

beforeEach(() => {
  vi.resetAllMocks();
  mockItem.read.mockResolvedValue({ resource: undefined });
  mockItem.replace.mockImplementation((doc: any) => Promise.resolve({ resource: doc }));
  mockContainer.items.create.mockImplementation((doc: any) => Promise.resolve({ resource: doc }));
});

describe('ratingRepo.submitSide', () => {
  it('creates a fresh doc with customer fields when no doc exists and side is CUSTOMER_TO_TECH', async () => {
    const result = await ratingRepo.submitSide({
      bookingId: 'bk-1', customerId: 'cust-1', technicianId: 'tech-1',
      side: 'CUSTOMER_TO_TECH',
      overall: 5, subScores: { punctuality: 5, skill: 5, behaviour: 5 }, comment: 'great',
    });
    expect(mockContainer.items.create).toHaveBeenCalled();
    expect(result?.customerOverall).toBe(5);
    expect(result?.customerSubmittedAt).toBeTruthy();
    expect(result?.revealedAt).toBeUndefined();
  });

  it('updates existing doc with tech fields and sets revealedAt when both sides present', async () => {
    mockItem.read.mockResolvedValue({
      resource: {
        ...baseDoc,
        customerOverall: 5, customerSubScores: { punctuality: 5, skill: 5, behaviour: 5 },
        customerSubmittedAt: '2026-04-24T12:00:00.000Z',
      },
    });
    const result = await ratingRepo.submitSide({
      bookingId: 'bk-1', customerId: 'cust-1', technicianId: 'tech-1',
      side: 'TECH_TO_CUSTOMER',
      overall: 4, subScores: { behaviour: 4, communication: 5 },
    });
    expect(result?.techOverall).toBe(4);
    expect(result?.revealedAt).toBeTruthy();
    expect(result?.customerOverall).toBe(5);
  });

  it('returns null on duplicate submission for the same side', async () => {
    mockItem.read.mockResolvedValue({
      resource: {
        ...baseDoc, customerOverall: 5,
        customerSubScores: { punctuality: 5, skill: 5, behaviour: 5 },
        customerSubmittedAt: '2026-04-24T12:00:00.000Z',
      },
    });
    const result = await ratingRepo.submitSide({
      bookingId: 'bk-1', customerId: 'cust-1', technicianId: 'tech-1',
      side: 'CUSTOMER_TO_TECH',
      overall: 1, subScores: { punctuality: 1, skill: 1, behaviour: 1 },
    });
    expect(result).toBeNull();
  });
});

describe('ratingRepo.getByBookingId', () => {
  it('returns null when doc does not exist', async () => {
    mockItem.read.mockResolvedValue({ resource: undefined });
    expect(await ratingRepo.getByBookingId('bk-missing')).toBeNull();
  });

  it('returns the doc when found', async () => {
    mockItem.read.mockResolvedValue({ resource: { ...baseDoc, customerOverall: 5 } });
    const doc = await ratingRepo.getByBookingId('bk-1');
    expect(doc?.customerOverall).toBe(5);
  });
});
```

- [ ] **Step 2: Run RED**

```bash
cd api && pnpm test tests/unit/rating-repository.test.ts
```

- [ ] **Step 3: Implement `api/src/cosmos/rating-repository.ts`**

```typescript
import { getRatingsContainer } from './client.js';
import type { RatingDoc } from '../schemas/rating.js';

interface SubmitInput {
  bookingId: string;
  customerId: string;
  technicianId: string;
  side: 'CUSTOMER_TO_TECH' | 'TECH_TO_CUSTOMER';
  overall: number;
  subScores: Record<string, number>;
  comment?: string;
}

function nowIso(): string { return new Date().toISOString(); }

export const ratingRepo = {
  async getByBookingId(bookingId: string): Promise<RatingDoc | null> {
    const { resource } = await getRatingsContainer()
      .item(bookingId, bookingId)
      .read<RatingDoc>();
    return resource ?? null;
  },

  async submitSide(input: SubmitInput): Promise<RatingDoc | null> {
    const existing = await this.getByBookingId(input.bookingId);
    const now = nowIso();

    if (!existing) {
      const fresh: RatingDoc = {
        bookingId: input.bookingId,
        customerId: input.customerId,
        technicianId: input.technicianId,
        ...(input.side === 'CUSTOMER_TO_TECH'
          ? {
              customerOverall: input.overall,
              customerSubScores: input.subScores as RatingDoc['customerSubScores'],
              customerComment: input.comment,
              customerSubmittedAt: now,
            }
          : {
              techOverall: input.overall,
              techSubScores: input.subScores as RatingDoc['techSubScores'],
              techComment: input.comment,
              techSubmittedAt: now,
            }),
      };
      const { resource } = await getRatingsContainer().items.create<RatingDoc>(fresh);
      return resource ?? fresh;
    }

    const alreadySubmitted =
      input.side === 'CUSTOMER_TO_TECH'
        ? existing.customerSubmittedAt !== undefined
        : existing.techSubmittedAt !== undefined;
    if (alreadySubmitted) return null;

    const updated: RatingDoc = {
      ...existing,
      ...(input.side === 'CUSTOMER_TO_TECH'
        ? {
            customerOverall: input.overall,
            customerSubScores: input.subScores as RatingDoc['customerSubScores'],
            customerComment: input.comment,
            customerSubmittedAt: now,
          }
        : {
            techOverall: input.overall,
            techSubScores: input.subScores as RatingDoc['techSubScores'],
            techComment: input.comment,
            techSubmittedAt: now,
          }),
    };
    if (updated.customerSubmittedAt && updated.techSubmittedAt && !updated.revealedAt) {
      updated.revealedAt = now;
    }
    const { resource } = await getRatingsContainer()
      .item(input.bookingId, input.bookingId)
      .replace<RatingDoc>(updated);
    return resource ?? updated;
  },
};
```

- [ ] **Step 4: Run GREEN + commit**

```bash
cd api && pnpm test tests/unit/rating-repository.test.ts
git add api/src/cosmos/rating-repository.ts api/tests/unit/rating-repository.test.ts
git commit -m "feat(e07-s01a): rating-repository with mutual reveal + idempotency (TDD)"
```

---

## Task 3: `POST /v1/ratings` + `GET /v1/ratings/{bookingId}` (TDD)

**Files:** `api/tests/unit/ratings.test.ts`, `api/src/functions/ratings.ts`

- [ ] **Step 1: Write the failing tests**

Create `api/tests/unit/ratings.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HttpRequest, InvocationContext } from '@azure/functions';

vi.mock('../../src/services/firebaseAdmin.js', () => ({
  verifyFirebaseIdToken: vi.fn(),
}));
vi.mock('../../src/cosmos/booking-repository.js', () => ({
  bookingRepo: { getById: vi.fn() },
}));
vi.mock('../../src/cosmos/rating-repository.js', () => ({
  ratingRepo: { submitSide: vi.fn(), getByBookingId: vi.fn() },
}));

import { submitRatingHandler, getRatingHandler } from '../../src/functions/ratings.js';
import { verifyFirebaseIdToken } from '../../src/services/firebaseAdmin.js';
import { bookingRepo } from '../../src/cosmos/booking-repository.js';
import { ratingRepo } from '../../src/cosmos/rating-repository.js';

const ctx = { log: vi.fn() } as unknown as InvocationContext;

function reqWith(opts: { body?: unknown; auth?: string; bookingId?: string }): HttpRequest {
  return {
    headers: { get: (h: string) => (h.toLowerCase() === 'authorization' ? opts.auth ?? '' : null) },
    json: async () => opts.body ?? {},
    params: { bookingId: opts.bookingId ?? '' },
  } as unknown as HttpRequest;
}

const closedBooking = {
  id: 'bk-1', customerId: 'cust-1', technicianId: 'tech-1', status: 'CLOSED',
  serviceId: 's', categoryId: 'c', slotDate: '2026-04-24', slotWindow: '09:00-11:00',
  addressText: 'x', addressLatLng: { lat: 0, lng: 0 }, paymentOrderId: 'o', paymentId: 'p',
  paymentSignature: 's', amount: 100, createdAt: '2026-04-24T09:00:00.000Z',
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(verifyFirebaseIdToken).mockResolvedValue({ uid: 'cust-1' } as any);
  vi.mocked(bookingRepo.getById).mockResolvedValue(closedBooking as any);
});

describe('POST /v1/ratings', () => {
  it('returns 401 when no Authorization header', async () => {
    const res = await submitRatingHandler(reqWith({ body: {} }), ctx);
    expect(res.status).toBe(401);
  });

  it('returns 400 on schema validation failure', async () => {
    const res = await submitRatingHandler(
      reqWith({ auth: 'Bearer t', body: { side: 'CUSTOMER_TO_TECH', bookingId: 'bk-1', overall: 7, subScores: { punctuality: 5, skill: 5, behaviour: 5 } } }),
      ctx,
    );
    expect(res.status).toBe(400);
  });

  it('returns 404 when booking does not exist', async () => {
    vi.mocked(bookingRepo.getById).mockResolvedValue(null);
    const res = await submitRatingHandler(
      reqWith({ auth: 'Bearer t', body: { side: 'CUSTOMER_TO_TECH', bookingId: 'bk-x', overall: 5, subScores: { punctuality: 5, skill: 5, behaviour: 5 } } }),
      ctx,
    );
    expect(res.status).toBe(404);
  });

  it('returns 403 when caller is neither customer nor technician on the booking', async () => {
    vi.mocked(verifyFirebaseIdToken).mockResolvedValue({ uid: 'someone-else' } as any);
    const res = await submitRatingHandler(
      reqWith({ auth: 'Bearer t', body: { side: 'CUSTOMER_TO_TECH', bookingId: 'bk-1', overall: 5, subScores: { punctuality: 5, skill: 5, behaviour: 5 } } }),
      ctx,
    );
    expect(res.status).toBe(403);
  });

  it('returns 403 when customer caller submits TECH_TO_CUSTOMER side', async () => {
    const res = await submitRatingHandler(
      reqWith({ auth: 'Bearer t', body: { side: 'TECH_TO_CUSTOMER', bookingId: 'bk-1', overall: 5, subScores: { behaviour: 5, communication: 5 } } }),
      ctx,
    );
    expect(res.status).toBe(403);
  });

  it('returns 409 when booking status is not CLOSED', async () => {
    vi.mocked(bookingRepo.getById).mockResolvedValue({ ...closedBooking, status: 'IN_PROGRESS' } as any);
    const res = await submitRatingHandler(
      reqWith({ auth: 'Bearer t', body: { side: 'CUSTOMER_TO_TECH', bookingId: 'bk-1', overall: 5, subScores: { punctuality: 5, skill: 5, behaviour: 5 } } }),
      ctx,
    );
    expect(res.status).toBe(409);
    expect((res.jsonBody as any).code).toBe('BOOKING_NOT_CLOSED');
  });

  it('returns 409 when repo reports duplicate submission', async () => {
    vi.mocked(ratingRepo.submitSide).mockResolvedValue(null);
    const res = await submitRatingHandler(
      reqWith({ auth: 'Bearer t', body: { side: 'CUSTOMER_TO_TECH', bookingId: 'bk-1', overall: 5, subScores: { punctuality: 5, skill: 5, behaviour: 5 } } }),
      ctx,
    );
    expect(res.status).toBe(409);
    expect((res.jsonBody as any).code).toBe('RATING_ALREADY_SUBMITTED');
  });

  it('returns 201 with persisted doc on success', async () => {
    vi.mocked(ratingRepo.submitSide).mockResolvedValue({
      bookingId: 'bk-1', customerId: 'cust-1', technicianId: 'tech-1',
      customerOverall: 5, customerSubScores: { punctuality: 5, skill: 5, behaviour: 5 },
      customerSubmittedAt: '2026-04-24T12:00:00.000Z',
    } as any);
    const res = await submitRatingHandler(
      reqWith({ auth: 'Bearer t', body: { side: 'CUSTOMER_TO_TECH', bookingId: 'bk-1', overall: 5, subScores: { punctuality: 5, skill: 5, behaviour: 5 } } }),
      ctx,
    );
    expect(res.status).toBe(201);
    expect((res.jsonBody as any).bookingId).toBe('bk-1');
  });
});

describe('GET /v1/ratings/{bookingId}', () => {
  it('returns 401 with no auth', async () => {
    const res = await getRatingHandler(reqWith({ bookingId: 'bk-1' }), ctx);
    expect(res.status).toBe(401);
  });

  it('returns 403 when caller is not a participant', async () => {
    vi.mocked(verifyFirebaseIdToken).mockResolvedValue({ uid: 'stranger' } as any);
    const res = await getRatingHandler(reqWith({ auth: 'Bearer t', bookingId: 'bk-1' }), ctx);
    expect(res.status).toBe(403);
  });

  it('hides tech side as PENDING when only customer has submitted', async () => {
    vi.mocked(ratingRepo.getByBookingId).mockResolvedValue({
      bookingId: 'bk-1', customerId: 'cust-1', technicianId: 'tech-1',
      customerOverall: 5, customerSubScores: { punctuality: 5, skill: 5, behaviour: 5 },
      customerSubmittedAt: '2026-04-24T12:00:00.000Z',
    } as any);
    const res = await getRatingHandler(reqWith({ auth: 'Bearer t', bookingId: 'bk-1' }), ctx);
    expect(res.status).toBe(200);
    const body = res.jsonBody as any;
    expect(body.status).toBe('PARTIALLY_SUBMITTED');
    expect(body.customerSide.status).toBe('SUBMITTED');
    expect(body.techSide).toEqual({ status: 'PENDING' });
  });

  it('returns both sides in full once revealedAt is set', async () => {
    vi.mocked(ratingRepo.getByBookingId).mockResolvedValue({
      bookingId: 'bk-1', customerId: 'cust-1', technicianId: 'tech-1',
      customerOverall: 5, customerSubScores: { punctuality: 5, skill: 5, behaviour: 5 },
      customerSubmittedAt: '2026-04-24T12:00:00.000Z',
      techOverall: 4, techSubScores: { behaviour: 4, communication: 5 },
      techSubmittedAt: '2026-04-24T12:30:00.000Z',
      revealedAt: '2026-04-24T12:30:00.000Z',
    } as any);
    const res = await getRatingHandler(reqWith({ auth: 'Bearer t', bookingId: 'bk-1' }), ctx);
    expect(res.status).toBe(200);
    const body = res.jsonBody as any;
    expect(body.status).toBe('REVEALED');
    expect(body.customerSide.overall).toBe(5);
    expect(body.techSide.overall).toBe(4);
  });

  it('returns PENDING when no rating doc exists', async () => {
    vi.mocked(ratingRepo.getByBookingId).mockResolvedValue(null);
    const res = await getRatingHandler(reqWith({ auth: 'Bearer t', bookingId: 'bk-1' }), ctx);
    expect(res.status).toBe(200);
    const body = res.jsonBody as any;
    expect(body.status).toBe('PENDING');
  });
});
```

- [ ] **Step 2: Run RED**

```bash
cd api && pnpm test tests/unit/ratings.test.ts
```

- [ ] **Step 3: Implement `api/src/functions/ratings.ts`**

```typescript
import { type HttpHandler, type InvocationContext, app } from '@azure/functions';
import { verifyFirebaseIdToken } from '../services/firebaseAdmin.js';
import { bookingRepo } from '../cosmos/booking-repository.js';
import { ratingRepo } from '../cosmos/rating-repository.js';
import { SubmitRatingRequestSchema, type GetRatingResponse } from '../schemas/rating.js';

async function uidFromAuth(authHeader: string): Promise<string | null> {
  if (!authHeader.startsWith('Bearer ')) return null;
  try {
    const decoded = await verifyFirebaseIdToken(authHeader.slice(7));
    return decoded.uid;
  } catch {
    return null;
  }
}

export const submitRatingHandler: HttpHandler = async (req, _ctx: InvocationContext) => {
  const uid = await uidFromAuth(req.headers.get('authorization') ?? '');
  if (!uid) return { status: 401, jsonBody: { code: 'UNAUTHORIZED' } };

  let body: unknown;
  try { body = await req.json(); } catch { return { status: 400, jsonBody: { code: 'PARSE_ERROR' } }; }
  const parsed = SubmitRatingRequestSchema.safeParse(body);
  if (!parsed.success) {
    return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', issues: parsed.error.issues } };
  }
  const data = parsed.data;

  const booking = await bookingRepo.getById(data.bookingId);
  if (!booking) return { status: 404, jsonBody: { code: 'BOOKING_NOT_FOUND' } };

  const isCustomer = booking.customerId === uid;
  const isTechnician = booking.technicianId === uid;
  if (!isCustomer && !isTechnician) return { status: 403, jsonBody: { code: 'FORBIDDEN' } };
  if (data.side === 'CUSTOMER_TO_TECH' && !isCustomer) return { status: 403, jsonBody: { code: 'FORBIDDEN' } };
  if (data.side === 'TECH_TO_CUSTOMER' && !isTechnician) return { status: 403, jsonBody: { code: 'FORBIDDEN' } };
  if (booking.status !== 'CLOSED') {
    return { status: 409, jsonBody: { code: 'BOOKING_NOT_CLOSED', status: booking.status } };
  }
  if (!booking.technicianId) return { status: 409, jsonBody: { code: 'NO_TECHNICIAN' } };

  const result = await ratingRepo.submitSide({
    bookingId: data.bookingId,
    customerId: booking.customerId,
    technicianId: booking.technicianId,
    side: data.side,
    overall: data.overall,
    subScores: data.subScores,
    comment: data.comment,
  });
  if (!result) return { status: 409, jsonBody: { code: 'RATING_ALREADY_SUBMITTED' } };
  return { status: 201, jsonBody: { bookingId: result.bookingId } };
};

function projectSide(
  overall: number | undefined,
  subScores: object | undefined,
  comment: string | undefined,
  submittedAt: string | undefined,
  reveal: boolean,
): { status: 'PENDING' } | {
  status: 'SUBMITTED'; overall: number; subScores: object; comment?: string; submittedAt: string;
} {
  if (!submittedAt || overall === undefined || !subScores) return { status: 'PENDING' };
  if (!reveal) return { status: 'PENDING' };
  return { status: 'SUBMITTED', overall, subScores, comment, submittedAt };
}

export const getRatingHandler: HttpHandler = async (req, _ctx: InvocationContext) => {
  const uid = await uidFromAuth(req.headers.get('authorization') ?? '');
  if (!uid) return { status: 401, jsonBody: { code: 'UNAUTHORIZED' } };

  const bookingId = (req as unknown as { params: { bookingId: string } }).params.bookingId;
  const booking = await bookingRepo.getById(bookingId);
  if (!booking) return { status: 404, jsonBody: { code: 'BOOKING_NOT_FOUND' } };
  const isCustomer = booking.customerId === uid;
  const isTechnician = booking.technicianId === uid;
  if (!isCustomer && !isTechnician) return { status: 403, jsonBody: { code: 'FORBIDDEN' } };

  const doc = await ratingRepo.getByBookingId(bookingId);
  if (!doc) {
    const empty: GetRatingResponse = {
      bookingId, status: 'PENDING',
      customerSide: { status: 'PENDING' }, techSide: { status: 'PENDING' },
    };
    return { status: 200, jsonBody: empty };
  }

  const customerHas = doc.customerSubmittedAt !== undefined;
  const techHas = doc.techSubmittedAt !== undefined;
  const revealed = customerHas && techHas;
  const status: GetRatingResponse['status'] = revealed
    ? 'REVEALED'
    : (customerHas || techHas ? 'PARTIALLY_SUBMITTED' : 'PENDING');

  const customerVisible = revealed || (isCustomer && customerHas);
  const techVisible = revealed || (isTechnician && techHas);

  const response: GetRatingResponse = {
    bookingId, status,
    revealedAt: doc.revealedAt,
    customerSide: projectSide(
      doc.customerOverall, doc.customerSubScores, doc.customerComment,
      doc.customerSubmittedAt, customerVisible,
    ),
    techSide: projectSide(
      doc.techOverall, doc.techSubScores, doc.techComment,
      doc.techSubmittedAt, techVisible,
    ),
  };
  return { status: 200, jsonBody: response };
};

app.http('submitRating', { route: 'v1/ratings', methods: ['POST'], handler: submitRatingHandler });
app.http('getRating', { route: 'v1/ratings/{bookingId}', methods: ['GET'], handler: getRatingHandler });
```

- [ ] **Step 4: Run GREEN + commit**

```bash
cd api && pnpm test tests/unit/ratings.test.ts
git add api/src/functions/ratings.ts api/tests/unit/ratings.test.ts
git commit -m "feat(e07-s01a): POST /v1/ratings + GET /v1/ratings/{bookingId} with mutual reveal (TDD)"
```

---

## Task 4: FCM rating-prompt change-feed trigger (TDD)

**Files:** `api/src/services/fcm.service.ts` (modify), `api/tests/unit/trigger-rating-prompt.test.ts`, `api/src/functions/trigger-rating-prompt.ts`

> The trigger fires on `status === 'CLOSED'`. Until E06-S04 is merged no document reaches CLOSED in real Cosmos — local unit tests are the only validation.

- [ ] **Step 1: Extend `fcm.service.ts`**

Replace the file with:
```typescript
import { getFirebaseAdmin } from './firebaseAdmin.js';

export async function sendPriceApprovalPush(customerId: string, bookingId: string): Promise<void> {
  await getFirebaseAdmin().messaging().send({
    topic: `customer_${customerId}`,
    data: { type: 'ADDON_APPROVAL_REQUESTED', bookingId },
  });
}

export async function sendRatingPromptCustomerPush(customerId: string, bookingId: string): Promise<void> {
  await getFirebaseAdmin().messaging().send({
    topic: `customer_${customerId}`,
    data: { type: 'RATING_PROMPT_CUSTOMER', bookingId },
  });
}

export async function sendRatingPromptTechnicianPush(technicianId: string, bookingId: string): Promise<void> {
  await getFirebaseAdmin().messaging().send({
    topic: `technician_${technicianId}`,
    data: { type: 'RATING_PROMPT_TECHNICIAN', bookingId },
  });
}
```

- [ ] **Step 2: Write failing trigger tests**

Create `api/tests/unit/trigger-rating-prompt.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { InvocationContext } from '@azure/functions';

vi.mock('../../src/services/fcm.service.js');
vi.mock('../../src/cosmos/rating-repository.js', () => ({
  ratingRepo: { getByBookingId: vi.fn() },
}));

import { dispatchRatingPrompt } from '../../src/functions/trigger-rating-prompt.js';
import { sendRatingPromptCustomerPush, sendRatingPromptTechnicianPush }
  from '../../src/services/fcm.service.js';
import { ratingRepo } from '../../src/cosmos/rating-repository.js';

const ctx = { log: vi.fn() } as unknown as InvocationContext;

const closed = {
  id: 'bk-1', customerId: 'cust-1', technicianId: 'tech-1', status: 'CLOSED',
  serviceId: 's', categoryId: 'c', slotDate: '2026-04-24', slotWindow: '09:00-11:00',
  addressText: 'x', addressLatLng: { lat: 0, lng: 0 }, paymentOrderId: 'o', paymentId: 'p',
  paymentSignature: 's', amount: 100, createdAt: '2026-04-24T09:00:00.000Z',
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(ratingRepo.getByBookingId).mockResolvedValue(null);
  vi.mocked(sendRatingPromptCustomerPush).mockResolvedValue(undefined);
  vi.mocked(sendRatingPromptTechnicianPush).mockResolvedValue(undefined);
});

describe('dispatchRatingPrompt', () => {
  it('skips when status is not CLOSED', async () => {
    await dispatchRatingPrompt({ ...closed, status: 'PAID' }, ctx);
    expect(sendRatingPromptCustomerPush).not.toHaveBeenCalled();
  });

  it('skips silently when technicianId is missing', async () => {
    await dispatchRatingPrompt({ ...closed, technicianId: undefined }, ctx);
    expect(sendRatingPromptCustomerPush).not.toHaveBeenCalled();
  });

  it('skips on idempotency hit (rating doc already exists)', async () => {
    vi.mocked(ratingRepo.getByBookingId).mockResolvedValue({ bookingId: 'bk-1' } as any);
    await dispatchRatingPrompt(closed, ctx);
    expect(sendRatingPromptCustomerPush).not.toHaveBeenCalled();
    expect(sendRatingPromptTechnicianPush).not.toHaveBeenCalled();
  });

  it('sends FCM to both sides on first CLOSED fire', async () => {
    await dispatchRatingPrompt(closed, ctx);
    expect(sendRatingPromptCustomerPush).toHaveBeenCalledWith('cust-1', 'bk-1');
    expect(sendRatingPromptTechnicianPush).toHaveBeenCalledWith('tech-1', 'bk-1');
  });

  it('isolates errors — one push failure does not abort the other', async () => {
    vi.mocked(sendRatingPromptCustomerPush).mockRejectedValue(new Error('FCM down'));
    await expect(dispatchRatingPrompt(closed, ctx)).resolves.toBeUndefined();
    expect(sendRatingPromptTechnicianPush).toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Run RED**

```bash
cd api && pnpm test tests/unit/trigger-rating-prompt.test.ts
```

- [ ] **Step 4: Implement `api/src/functions/trigger-rating-prompt.ts`**

```typescript
import '../bootstrap.js';
import { app } from '@azure/functions';
import type { InvocationContext } from '@azure/functions';
import * as Sentry from '@sentry/node';
import { BookingDocSchema } from '../schemas/booking.js';
import { ratingRepo } from '../cosmos/rating-repository.js';
import {
  sendRatingPromptCustomerPush,
  sendRatingPromptTechnicianPush,
} from '../services/fcm.service.js';

const DB_NAME = process.env['COSMOS_DATABASE'] ?? 'homeservices';

export async function dispatchRatingPrompt(
  bookingRaw: unknown,
  ctx: InvocationContext,
): Promise<void> {
  const parsed = BookingDocSchema.safeParse(bookingRaw);
  if (!parsed.success || parsed.data.status !== 'CLOSED') return;
  const booking = parsed.data;
  if (!booking.technicianId) { ctx.log(`no technicianId on ${booking.id}`); return; }

  if (await ratingRepo.getByBookingId(booking.id)) {
    ctx.log(`rating doc exists for ${booking.id} — skipping prompt`);
    return;
  }

  const results = await Promise.allSettled([
    sendRatingPromptCustomerPush(booking.customerId, booking.id),
    sendRatingPromptTechnicianPush(booking.technicianId, booking.id),
  ]);
  for (const r of results) {
    if (r.status === 'rejected') {
      Sentry.captureException(r.reason);
      ctx.log(`rating-prompt push failed for ${booking.id}: ${String(r.reason)}`);
    }
  }
}

app.cosmosDB('triggerRatingPrompt', {
  connectionStringSetting: 'COSMOS_CONNECTION_STRING',
  databaseName: DB_NAME,
  containerName: 'bookings',
  leaseContainerName: 'booking_rating_prompt_leases',
  createLeaseContainerIfNotExists: true,
  startFromBeginning: false,
  handler: async (docs: unknown[], context: InvocationContext): Promise<void> => {
    for (const doc of docs) await dispatchRatingPrompt(doc, context);
  },
});
```

- [ ] **Step 5: Run GREEN + full api suite + commit**

```bash
cd api && pnpm test tests/unit/trigger-rating-prompt.test.ts
cd api && pnpm test:coverage && pnpm typecheck && pnpm lint
git add api/src/services/fcm.service.ts api/src/functions/trigger-rating-prompt.ts \
        api/tests/unit/trigger-rating-prompt.test.ts
git commit -m "feat(e07-s01a): FCM rating-prompt change-feed trigger on CLOSED (TDD)"
```

---

## Task 5: customer-app domain + data layer (TDD)

**Files:** `customer-app/.../domain/rating/model/Rating.kt`, `SubmitRatingUseCase.kt`, `GetRatingUseCase.kt`, `data/rating/RatingRepository.kt`, `RatingRepositoryImpl.kt`, `RatingPromptEventBus.kt`, `remote/RatingApiService.kt`, `remote/dto/RatingDtos.kt`, `data/rating/di/RatingModule.kt`, plus tests.

- [ ] **Step 1: Domain models**

Create `customer-app/app/src/main/kotlin/com/homeservices/customer/domain/rating/model/Rating.kt`:
```kotlin
package com.homeservices.customer.domain.rating.model

public data class CustomerSubScores(
    val punctuality: Int,
    val skill: Int,
    val behaviour: Int,
)

public data class TechSubScores(
    val behaviour: Int,
    val communication: Int,
)

public data class CustomerRating(
    val overall: Int,
    val subScores: CustomerSubScores,
    val comment: String?,
    val submittedAt: String,
)

public data class TechRating(
    val overall: Int,
    val subScores: TechSubScores,
    val comment: String?,
    val submittedAt: String,
)

public sealed class SideState {
    public object Pending : SideState()
    public data class Submitted(val rating: Any) : SideState() // CustomerRating or TechRating
}

public data class RatingSnapshot(
    val bookingId: String,
    val status: Status,
    val revealedAt: String?,
    val customerSide: SideState,
    val techSide: SideState,
) {
    public enum class Status { PENDING, PARTIALLY_SUBMITTED, REVEALED }
}
```

- [ ] **Step 2: Repository interface + EventBus**

Create `customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/RatingRepository.kt`:
```kotlin
package com.homeservices.customer.data.rating

import com.homeservices.customer.domain.rating.model.CustomerSubScores
import com.homeservices.customer.domain.rating.model.RatingSnapshot
import kotlinx.coroutines.flow.Flow

public interface RatingRepository {
    public fun submitCustomerRating(
        bookingId: String,
        overall: Int,
        subScores: CustomerSubScores,
        comment: String?,
    ): Flow<Result<Unit>>

    public fun get(bookingId: String): Flow<Result<RatingSnapshot>>
}
```

Create `customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/RatingPromptEventBus.kt`:
```kotlin
package com.homeservices.customer.data.rating

import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class RatingPromptEventBus
    @Inject
    constructor() {
        private val _events = MutableSharedFlow<String>(extraBufferCapacity = 1)
        public val events: SharedFlow<String> = _events.asSharedFlow()

        public fun post(bookingId: String) {
            _events.tryEmit(bookingId)
        }
    }
```

- [ ] **Step 3: Retrofit + DTOs**

Create `customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/remote/RatingApiService.kt`:
```kotlin
package com.homeservices.customer.data.rating.remote

import com.homeservices.customer.data.rating.remote.dto.GetRatingResponseDto
import com.homeservices.customer.data.rating.remote.dto.SubmitRatingRequestDto
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

public interface RatingApiService {
    @POST("v1/ratings")
    public suspend fun submit(
        @Body body: SubmitRatingRequestDto,
    )

    @GET("v1/ratings/{bookingId}")
    public suspend fun get(
        @Path("bookingId") bookingId: String,
    ): GetRatingResponseDto
}
```

Create `customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/remote/dto/RatingDtos.kt`:
```kotlin
package com.homeservices.customer.data.rating.remote.dto

import com.homeservices.customer.domain.rating.model.CustomerRating
import com.homeservices.customer.domain.rating.model.CustomerSubScores
import com.homeservices.customer.domain.rating.model.RatingSnapshot
import com.homeservices.customer.domain.rating.model.SideState
import com.homeservices.customer.domain.rating.model.TechRating
import com.homeservices.customer.domain.rating.model.TechSubScores
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
public data class SubmitRatingRequestDto(
    val side: String,
    val bookingId: String,
    val overall: Int,
    val subScores: Map<String, Int>,
    val comment: String?,
)

@JsonClass(generateAdapter = true)
public data class SidePayloadDto(
    val status: String,
    val overall: Int? = null,
    val subScores: Map<String, Int>? = null,
    val comment: String? = null,
    val submittedAt: String? = null,
)

@JsonClass(generateAdapter = true)
public data class GetRatingResponseDto(
    val bookingId: String,
    val status: String,
    val revealedAt: String? = null,
    val customerSide: SidePayloadDto,
    val techSide: SidePayloadDto,
) {
    public fun toDomain(): RatingSnapshot =
        RatingSnapshot(
            bookingId = bookingId,
            status = RatingSnapshot.Status.valueOf(status),
            revealedAt = revealedAt,
            customerSide = customerSide.toCustomerSide(),
            techSide = techSide.toTechSide(),
        )
}

private fun SidePayloadDto.toCustomerSide(): SideState =
    if (status == "SUBMITTED" && overall != null && subScores != null && submittedAt != null) {
        SideState.Submitted(
            CustomerRating(
                overall = overall,
                subScores = CustomerSubScores(
                    punctuality = subScores["punctuality"] ?: 0,
                    skill = subScores["skill"] ?: 0,
                    behaviour = subScores["behaviour"] ?: 0,
                ),
                comment = comment,
                submittedAt = submittedAt,
            ),
        )
    } else {
        SideState.Pending
    }

private fun SidePayloadDto.toTechSide(): SideState =
    if (status == "SUBMITTED" && overall != null && subScores != null && submittedAt != null) {
        SideState.Submitted(
            TechRating(
                overall = overall,
                subScores = TechSubScores(
                    behaviour = subScores["behaviour"] ?: 0,
                    communication = subScores["communication"] ?: 0,
                ),
                comment = comment,
                submittedAt = submittedAt,
            ),
        )
    } else {
        SideState.Pending
    }
```

- [ ] **Step 4: Repository impl + Hilt module**

Create `customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/RatingRepositoryImpl.kt`:
```kotlin
package com.homeservices.customer.data.rating

import com.homeservices.customer.data.rating.remote.RatingApiService
import com.homeservices.customer.data.rating.remote.dto.SubmitRatingRequestDto
import com.homeservices.customer.domain.rating.model.CustomerSubScores
import com.homeservices.customer.domain.rating.model.RatingSnapshot
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject

internal class RatingRepositoryImpl
    @Inject
    constructor(
        private val api: RatingApiService,
    ) : RatingRepository {
        override fun submitCustomerRating(
            bookingId: String,
            overall: Int,
            subScores: CustomerSubScores,
            comment: String?,
        ): Flow<Result<Unit>> =
            flow {
                emit(
                    runCatching {
                        api.submit(
                            SubmitRatingRequestDto(
                                side = "CUSTOMER_TO_TECH",
                                bookingId = bookingId,
                                overall = overall,
                                subScores = mapOf(
                                    "punctuality" to subScores.punctuality,
                                    "skill" to subScores.skill,
                                    "behaviour" to subScores.behaviour,
                                ),
                                comment = comment,
                            ),
                        )
                    },
                )
            }

        override fun get(bookingId: String): Flow<Result<RatingSnapshot>> =
            flow { emit(runCatching { api.get(bookingId).toDomain() }) }
    }
```

Create `customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/di/RatingModule.kt`:
```kotlin
package com.homeservices.customer.data.rating.di

import com.homeservices.customer.BuildConfig
import com.homeservices.customer.data.booking.di.AuthOkHttpClient
import com.homeservices.customer.data.rating.RatingRepository
import com.homeservices.customer.data.rating.RatingRepositoryImpl
import com.homeservices.customer.data.rating.remote.RatingApiService
import com.squareup.moshi.Moshi
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
public abstract class RatingModule {
    @Binds
    internal abstract fun bindRatingRepository(impl: RatingRepositoryImpl): RatingRepository

    public companion object {
        @Provides
        @Singleton
        public fun provideRatingApiService(
            @AuthOkHttpClient client: OkHttpClient,
            moshi: Moshi,
        ): RatingApiService =
            Retrofit
                .Builder()
                .baseUrl(BuildConfig.API_BASE_URL + "/")
                .addConverterFactory(MoshiConverterFactory.create(moshi))
                .client(client)
                .build()
                .create(RatingApiService::class.java)
    }
}
```

- [ ] **Step 5: Use cases + tests (TDD)**

Create `customer-app/app/src/main/kotlin/com/homeservices/customer/domain/rating/SubmitRatingUseCase.kt`:
```kotlin
package com.homeservices.customer.domain.rating

import com.homeservices.customer.data.rating.RatingRepository
import com.homeservices.customer.domain.rating.model.CustomerSubScores
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

public class SubmitRatingUseCase
    @Inject
    constructor(
        private val repo: RatingRepository,
    ) {
        public operator fun invoke(
            bookingId: String,
            overall: Int,
            subScores: CustomerSubScores,
            comment: String?,
        ): Flow<Result<Unit>> = repo.submitCustomerRating(bookingId, overall, subScores, comment)
    }
```

Create `customer-app/app/src/main/kotlin/com/homeservices/customer/domain/rating/GetRatingUseCase.kt`:
```kotlin
package com.homeservices.customer.domain.rating

import com.homeservices.customer.data.rating.RatingRepository
import com.homeservices.customer.domain.rating.model.RatingSnapshot
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

public class GetRatingUseCase
    @Inject
    constructor(
        private val repo: RatingRepository,
    ) {
        public operator fun invoke(bookingId: String): Flow<Result<RatingSnapshot>> = repo.get(bookingId)
    }
```

Create `customer-app/app/src/test/kotlin/com/homeservices/customer/domain/rating/SubmitRatingUseCaseTest.kt`:
```kotlin
package com.homeservices.customer.domain.rating

import com.homeservices.customer.data.rating.RatingRepository
import com.homeservices.customer.domain.rating.model.CustomerSubScores
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

public class SubmitRatingUseCaseTest {
    private val repo: RatingRepository = mockk()
    private val useCase = SubmitRatingUseCase(repo)

    @Test
    public fun `delegates to repository with correct parameters`(): Unit =
        runTest {
            val subScores = CustomerSubScores(punctuality = 5, skill = 4, behaviour = 5)
            coEvery {
                repo.submitCustomerRating("bk-1", 5, subScores, "great")
            } returns flowOf(Result.success(Unit))

            val results = useCase.invoke("bk-1", 5, subScores, "great").toList()

            assertThat(results).hasSize(1)
            assertThat(results.first().isSuccess).isTrue()
        }
}
```

Create `customer-app/app/src/test/kotlin/com/homeservices/customer/domain/rating/GetRatingUseCaseTest.kt`:
```kotlin
package com.homeservices.customer.domain.rating

import com.homeservices.customer.data.rating.RatingRepository
import com.homeservices.customer.domain.rating.model.RatingSnapshot
import com.homeservices.customer.domain.rating.model.SideState
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

public class GetRatingUseCaseTest {
    private val repo: RatingRepository = mockk()
    private val useCase = GetRatingUseCase(repo)

    @Test
    public fun `delegates to repository`(): Unit =
        runTest {
            val snapshot = RatingSnapshot(
                bookingId = "bk-1",
                status = RatingSnapshot.Status.PENDING,
                revealedAt = null,
                customerSide = SideState.Pending,
                techSide = SideState.Pending,
            )
            coEvery { repo.get("bk-1") } returns flowOf(Result.success(snapshot))

            val results = useCase.invoke("bk-1").toList()

            assertThat(results.first().getOrThrow().bookingId).isEqualTo("bk-1")
        }
}
```

- [ ] **Step 6: Run tests + commit**

```bash
cd customer-app && ./gradlew testDebugUnitTest --tests '*rating*' ktlintCheck
git add customer-app/app/src/main/kotlin/com/homeservices/customer/domain/rating \
        customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating \
        customer-app/app/src/test/kotlin/com/homeservices/customer/domain/rating
git commit -m "feat(customer-app): rating domain + data layer (E07-S01a, TDD)"
```

---

## Task 6: customer-app UI + nav + FCM dispatch (TDD)

**Files:** `RatingViewModel.kt`, `RatingScreen.kt`, `RatingRoutes.kt`, `RatingViewModelTest.kt`, `RatingScreenPaparazziTest.kt`, modifications to `CustomerFirebaseMessagingService.kt`, `AppNavigation.kt`, `MainActivity.kt`, route registration in main graph.

- [ ] **Step 1: ViewModel test (RED)**

Create `customer-app/app/src/test/kotlin/com/homeservices/customer/ui/rating/RatingViewModelTest.kt`:
```kotlin
package com.homeservices.customer.ui.rating

import androidx.lifecycle.SavedStateHandle
import com.homeservices.customer.domain.rating.GetRatingUseCase
import com.homeservices.customer.domain.rating.SubmitRatingUseCase
import com.homeservices.customer.domain.rating.model.CustomerSubScores
import com.homeservices.customer.domain.rating.model.RatingSnapshot
import com.homeservices.customer.domain.rating.model.SideState
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

@OptIn(ExperimentalCoroutinesApi::class)
public class RatingViewModelTest {
    private val submit: SubmitRatingUseCase = mockk()
    private val get: GetRatingUseCase = mockk()
    private val savedState = SavedStateHandle(mapOf("bookingId" to "bk-1"))

    @BeforeEach public fun setUp() { Dispatchers.setMain(UnconfinedTestDispatcher()) }
    @AfterEach public fun tearDown() { Dispatchers.resetMain() }

    @Test
    public fun `submit is disabled until overall and all sub-scores are non-zero`() =
        runTest {
            coEvery { get.invoke("bk-1") } returns flowOf(
                Result.success(
                    RatingSnapshot("bk-1", RatingSnapshot.Status.PENDING, null, SideState.Pending, SideState.Pending),
                ),
            )
            val vm = RatingViewModel(submit, get, savedState)
            assertThat(vm.canSubmit.value).isFalse()
            vm.setOverall(5); assertThat(vm.canSubmit.value).isFalse()
            vm.setPunctuality(5); vm.setSkill(5); assertThat(vm.canSubmit.value).isFalse()
            vm.setBehaviour(5); assertThat(vm.canSubmit.value).isTrue()
        }

    @Test
    public fun `successful submit transitions to AwaitingPartner state`() =
        runTest {
            coEvery { get.invoke("bk-1") } returns flowOf(
                Result.success(
                    RatingSnapshot("bk-1", RatingSnapshot.Status.PENDING, null, SideState.Pending, SideState.Pending),
                ),
            )
            coEvery {
                submit.invoke("bk-1", 5, CustomerSubScores(5, 5, 5), null)
            } returns flowOf(Result.success(Unit))

            val vm = RatingViewModel(submit, get, savedState)
            vm.setOverall(5); vm.setPunctuality(5); vm.setSkill(5); vm.setBehaviour(5)
            vm.submit()

            assertThat(vm.uiState.value).isInstanceOf(RatingUiState.AwaitingPartner::class.java)
        }
}
```

- [ ] **Step 2: ViewModel implementation**

Create `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating/RatingViewModel.kt`:
```kotlin
package com.homeservices.customer.ui.rating

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.customer.domain.rating.GetRatingUseCase
import com.homeservices.customer.domain.rating.SubmitRatingUseCase
import com.homeservices.customer.domain.rating.model.CustomerSubScores
import com.homeservices.customer.domain.rating.model.RatingSnapshot
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

public sealed class RatingUiState {
    public object Loading : RatingUiState()
    public data class Editing(val snapshot: RatingSnapshot?) : RatingUiState()
    public object Submitting : RatingUiState()
    public data class AwaitingPartner(val snapshot: RatingSnapshot?) : RatingUiState()
    public data class Revealed(val snapshot: RatingSnapshot) : RatingUiState()
    public data class Error(val message: String) : RatingUiState()
}

@HiltViewModel
public class RatingViewModel
    @Inject
    constructor(
        private val submitUseCase: SubmitRatingUseCase,
        private val getUseCase: GetRatingUseCase,
        savedStateHandle: SavedStateHandle,
    ) : ViewModel() {
        public val bookingId: String =
            savedStateHandle.get<String>("bookingId") ?: error("bookingId required")

        private val _uiState = MutableStateFlow<RatingUiState>(RatingUiState.Loading)
        public val uiState: StateFlow<RatingUiState> = _uiState.asStateFlow()

        private val _overall = MutableStateFlow(0); public val overall: StateFlow<Int> = _overall.asStateFlow()
        private val _punctuality = MutableStateFlow(0); public val punctuality: StateFlow<Int> = _punctuality.asStateFlow()
        private val _skill = MutableStateFlow(0); public val skill: StateFlow<Int> = _skill.asStateFlow()
        private val _behaviour = MutableStateFlow(0); public val behaviour: StateFlow<Int> = _behaviour.asStateFlow()
        private val _comment = MutableStateFlow(""); public val comment: StateFlow<String> = _comment.asStateFlow()
        private val _canSubmit = MutableStateFlow(false); public val canSubmit: StateFlow<Boolean> = _canSubmit.asStateFlow()

        init {
            viewModelScope.launch {
                getUseCase.invoke(bookingId).collect { result ->
                    result.onSuccess { snap ->
                        _uiState.value =
                            if (snap.status == RatingSnapshot.Status.REVEALED) RatingUiState.Revealed(snap)
                            else RatingUiState.Editing(snap)
                    }.onFailure { _uiState.value = RatingUiState.Error(it.message ?: "load failed") }
                }
            }
        }

        public fun setOverall(stars: Int) { _overall.value = stars; recompute() }
        public fun setPunctuality(stars: Int) { _punctuality.value = stars; recompute() }
        public fun setSkill(stars: Int) { _skill.value = stars; recompute() }
        public fun setBehaviour(stars: Int) { _behaviour.value = stars; recompute() }
        public fun setComment(text: String) { _comment.value = text.take(500) }

        private fun recompute() {
            _canSubmit.value =
                overall.value in 1..5 && punctuality.value in 1..5 &&
                skill.value in 1..5 && behaviour.value in 1..5
        }

        public fun submit() {
            if (!_canSubmit.value) return
            _uiState.value = RatingUiState.Submitting
            viewModelScope.launch {
                submitUseCase.invoke(
                    bookingId = bookingId,
                    overall = overall.value,
                    subScores = CustomerSubScores(punctuality.value, skill.value, behaviour.value),
                    comment = comment.value.ifBlank { null },
                ).collect { result ->
                    result.onSuccess { _uiState.value = RatingUiState.AwaitingPartner(null) }
                          .onFailure { _uiState.value = RatingUiState.Error(it.message ?: "submit failed") }
                }
            }
        }
    }
```

- [ ] **Step 3: Compose Screen + Routes + Paparazzi stub**

Create `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating/RatingRoutes.kt`:
```kotlin
package com.homeservices.customer.ui.rating

public object RatingRoutes {
    public const val ROUTE: String = "rating/{bookingId}"
    public fun route(bookingId: String): String = "rating/$bookingId"
}
```

Create `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating/RatingScreen.kt`:
```kotlin
package com.homeservices.customer.ui.rating

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel

@Composable
public fun RatingScreen(
    modifier: Modifier = Modifier,
    viewModel: RatingViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsState()
    val overall by viewModel.overall.collectAsState()
    val punct by viewModel.punctuality.collectAsState()
    val skill by viewModel.skill.collectAsState()
    val behav by viewModel.behaviour.collectAsState()
    val comment by viewModel.comment.collectAsState()
    val canSubmit by viewModel.canSubmit.collectAsState()

    Column(modifier = modifier.fillMaxSize().padding(16.dp)) {
        when (state) {
            is RatingUiState.AwaitingPartner -> Text("Thanks! Awaiting your technician's rating.")
            is RatingUiState.Revealed -> Text("Both ratings revealed.")
            is RatingUiState.Error -> Text("Error: ${(state as RatingUiState.Error).message}")
            else -> {
                Text("How was your service?")
                Spacer(Modifier.height(8.dp))
                StarRow(label = "Overall", value = overall, onChange = viewModel::setOverall)
                StarRow(label = "Punctuality", value = punct, onChange = viewModel::setPunctuality)
                StarRow(label = "Skill", value = skill, onChange = viewModel::setSkill)
                StarRow(label = "Behaviour", value = behav, onChange = viewModel::setBehaviour)
                OutlinedTextField(
                    value = comment,
                    onValueChange = viewModel::setComment,
                    label = { Text("Comment (optional, ≤500 chars)") },
                    modifier = Modifier.padding(vertical = 8.dp),
                )
                Button(onClick = viewModel::submit, enabled = canSubmit) { Text("Submit") }
            }
        }
    }
}

@Composable
private fun StarRow(label: String, value: Int, onChange: (Int) -> Unit) {
    Row(modifier = Modifier.padding(vertical = 4.dp)) {
        Text("$label: ", modifier = Modifier.padding(end = 8.dp))
        for (i in 1..5) {
            Text(
                text = if (i <= value) "★" else "☆",
                modifier = Modifier
                    .padding(horizontal = 2.dp)
                    .clickable(onClickLabel = "rate") { onChange(i) },
            )
        }
    }
}
```

Create `customer-app/app/src/test/kotlin/com/homeservices/customer/ui/rating/RatingScreenPaparazziTest.kt`:
```kotlin
package com.homeservices.customer.ui.rating

import app.cash.paparazzi.Paparazzi
import org.junit.Ignore
import org.junit.Rule
import org.junit.Test

@Ignore("Goldens recorded on CI Linux only — see docs/patterns/paparazzi-cross-os-goldens.md")
public class RatingScreenPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi = Paparazzi()

    @Test
    public fun ratingScreenInitial() {
        // paparazzi.snapshot { RatingScreen() }  // recorded on CI workflow_dispatch
    }
}
```

- [ ] **Step 4: Hook FCM dispatch**

Replace `customer-app/app/src/main/kotlin/com/homeservices/customer/firebase/CustomerFirebaseMessagingService.kt`:
```kotlin
package com.homeservices.customer.firebase

import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.homeservices.customer.data.booking.PriceApprovalEventBus
import com.homeservices.customer.data.rating.RatingPromptEventBus
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
public class CustomerFirebaseMessagingService : FirebaseMessagingService() {
    @Inject public lateinit var priceApprovalEventBus: PriceApprovalEventBus
    @Inject public lateinit var ratingPromptEventBus: RatingPromptEventBus

    override fun onMessageReceived(message: RemoteMessage) {
        val data = message.data
        val bookingId = data["bookingId"] ?: return
        when (data["type"]) {
            "ADDON_APPROVAL_REQUESTED" -> priceApprovalEventBus.post(bookingId)
            "RATING_PROMPT_CUSTOMER" -> ratingPromptEventBus.post(bookingId)
        }
    }

    override fun onNewToken(token: String): Unit = Unit
}
```

- [ ] **Step 5: Wire `AppNavigation.kt` + `MainActivity.kt`**

Modify `customer-app/.../navigation/AppNavigation.kt` — add parameter and a sibling `LaunchedEffect` next to the existing `priceApprovalEventBus` block:
```kotlin
import com.homeservices.customer.data.rating.RatingPromptEventBus
import com.homeservices.customer.ui.rating.RatingRoutes

@Composable
internal fun AppNavigation(
    sessionManager: SessionManager,
    activity: FragmentActivity,
    priceApprovalEventBus: PriceApprovalEventBus,
    ratingPromptEventBus: RatingPromptEventBus,
    modifier: Modifier = Modifier,
) {
    // ...existing body unchanged...

    LaunchedEffect(ratingPromptEventBus) {
        ratingPromptEventBus.events.collect { bookingId ->
            navController.navigate(RatingRoutes.route(bookingId)) { launchSingleTop = true }
        }
    }

    // ...NavHost unchanged; mainGraph registration below...
}
```

Locate `mainGraph` (run `grep -rn "fun NavGraphBuilder.mainGraph" customer-app/app/src/main/kotlin/`) and add inside its block:
```kotlin
composable(RatingRoutes.ROUTE) { RatingScreen() }
```

In `MainActivity.kt`, add the field + thread it through:
```kotlin
@Inject public lateinit var ratingPromptEventBus: RatingPromptEventBus
// ... in setContent { AppNavigation(..., priceApprovalEventBus = ..., ratingPromptEventBus = ratingPromptEventBus) }
```

- [ ] **Step 6: Run tests + ktlint + assemble + commit**

```bash
cd customer-app && ./gradlew testDebugUnitTest ktlintCheck assembleDebug
git add customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating \
        customer-app/app/src/test/kotlin/com/homeservices/customer/ui/rating \
        customer-app/app/src/main/kotlin/com/homeservices/customer/firebase/CustomerFirebaseMessagingService.kt \
        customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/AppNavigation.kt \
        customer-app/app/src/main/kotlin/com/homeservices/customer/MainActivity.kt
git commit -m "feat(customer-app): RatingScreen + ViewModel + nav + FCM dispatch (E07-S01a, TDD)"
```

> If `mainGraph` lives in a separate file (e.g. `MainGraph.kt`), include that path in the `git add` list as well.

---

## Task 7: Pre-Codex smoke gates + Paparazzi cleanup + Codex review

- [ ] **Step 1: Smoke gates**

```bash
bash tools/pre-codex-smoke-api.sh
bash tools/pre-codex-smoke.sh customer-app
```
Each must exit 0; any non-zero = stop and fix before proceeding.

- [ ] **Step 2: Delete any local Paparazzi PNGs**

```bash
git rm -r customer-app/app/src/test/snapshots/images/ 2>/dev/null || true
```
Confirm `RatingScreenPaparazziTest` still carries `@Ignore`.

- [ ] **Step 3: Codex review**

```bash
codex review --base main
```
Expected: `.codex-review-passed` written. Address P1s before push; note P2s in PR description.

- [ ] **Step 4: Push + PR**

```bash
git push -u origin feature/E07-S01a-rating-api-and-customer-side
gh pr create --title "feat: E07-S01a rating API + customer side" \
  --body "Implements docs/stories/E07-S01a-rating-api-and-customer-side.md. Codex P2 findings (if any): see review log."
```

- [ ] **Step 5: Post-merge — Paparazzi golden record**

After PR merges, trigger `paparazzi-record.yml` workflow_dispatch for customer-app. Pull artifact, unzip into `customer-app/app/src/test/snapshots/`, commit goldens, remove `@Ignore` in a follow-up `chore(paparazzi)` commit on a fresh branch.

---

## Self-Review

1. **Spec coverage**:
   - AC-1 (FCM both pushes on CLOSED) → Task 4
   - AC-2 (customer rating POST) → Task 3
   - AC-3 (auth/participation 401/403) → Task 3 (uidFromAuth + role gate)
   - AC-4 (one-per-side 409) → Task 2 (returns null) + Task 3 (409 mapping)
   - AC-5 (CLOSED-only 409) → Task 3 (status check)
   - AC-6 (mutual reveal in GET) → Task 2 (`revealedAt` set) + Task 3 (`projectSide` reveal logic)
   - AC-7 (customer screen) → Tasks 5+6
   - AC-8 (C-19 placeholder) → not required as code
   ✅ all covered.

2. **Placeholder scan**: every code step has a code block; no TODO/TBD; consistent identifiers (`submitCustomerRating`, `getByBookingId`, `RatingPromptEventBus.post`, `RatingRoutes.route`).

3. **Type consistency**: `RatingDoc.customerSubScores` (punctuality/skill/behaviour) consistent across schema/repo/handler; `SidePayloadSchema.status` enum (`PENDING`/`SUBMITTED`) distinct from `GetRatingResponse.status` (`PENDING`/`PARTIALLY_SUBMITTED`/`REVEALED`).

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-24-e07-s01a-rating-api-and-customer-side.md`. Two execution options:

**1. Subagent-Driven (recommended)** — fresh subagent per task, review between tasks, Sonnet workers + Opus review.

**2. Inline Execution** — same session via executing-plans, batch with checkpoints.

**Which approach?** (Defer until both S01a + S01b plans are written and committed.)
