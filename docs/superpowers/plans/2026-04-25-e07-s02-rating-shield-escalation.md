# E07-S02 Rating Shield Escalation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a customer submits ≤2★, intercept before the API call, offer escalation to the owner; if accepted, create a RATING_SHIELD complaint, fire an owner FCM alert, show a 2-hour countdown, then post the rating regardless.

**Architecture:** API adds a customer-auth `POST /v1/ratings/{bookingId}/escalate` endpoint that writes a RATING_SHIELD complaint doc and fires FCM fire-and-forget. Android side adds `RatingShieldState` to the ViewModel, intercepts `submit()` for low ratings, and adds a bottom-sheet + countdown chip to `RatingScreen`. No new navigation routes.

**Tech Stack:** Node 22 + TypeScript + Zod + Azure Functions + Cosmos DB + Firebase Messaging (API); Kotlin + Compose + Retrofit + Moshi + Hilt + Coroutines (Android)

---

## File Map

**API — modified**
- `api/src/schemas/complaint.ts` — add `ComplaintTypeEnum`, optional shield fields, `EscalateRatingBodySchema`, `EscalateRatingResponseSchema`
- `api/src/services/fcm.service.ts` — add `sendOwnerRatingShieldAlert()`
- `api/src/cosmos/complaints-repository.ts` — add `findRatingShieldEscalation()`

**API — created**
- `api/src/functions/rating-escalate.ts` — `POST /v1/ratings/{bookingId}/escalate` handler
- `api/tests/functions/rating-escalate.test.ts` — Vitest tests for escalate handler

**Android — modified**
- `customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/remote/RatingApiService.kt` — add `escalate()` Retrofit method
- `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating/RatingViewModel.kt` — add `RatingShieldState`, shield intercept, escalate/skip/postAnyway/countdown
- `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating/RatingScreen.kt` — add `ShieldBottomSheet`, `CountdownChip`
- `customer-app/app/src/test/kotlin/com/homeservices/customer/ui/rating/RatingViewModelTest.kt` — add `escalate` mock to existing constructor calls

**Android — created**
- `customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/remote/dto/EscalateRatingDtos.kt` — request/response DTOs
- `customer-app/app/src/main/kotlin/com/homeservices/customer/domain/rating/EscalateRatingUseCase.kt` — use case + result type
- `customer-app/app/src/test/kotlin/com/homeservices/customer/domain/rating/EscalateRatingUseCaseTest.kt` — use case tests
- `customer-app/app/src/test/kotlin/com/homeservices/customer/ui/rating/RatingViewModelShieldTest.kt` — shield-specific ViewModel tests

---

## Task 1: Extend complaint schema + FCM helper (API)

**Files:**
- Modify: `api/src/schemas/complaint.ts`
- Modify: `api/src/services/fcm.service.ts`

- [ ] **Step 1: Add RATING_SHIELD type and shield fields to complaint.ts**

Replace the line `export const ComplaintStatusEnum = z.enum([...]);` block and the `ComplaintDocSchema` and add new schemas. The full modified section (lines 1–95 replacement):

```typescript
// After extendZodWithOpenApi(z); add:

export const ComplaintStatusEnum = z.enum(['NEW', 'INVESTIGATING', 'RESOLVED']);

export const ComplaintTypeEnum = z.enum(['RATING_SHIELD', 'STANDARD']);

export const ComplaintResolutionCategoryEnum = z.enum([
  'TECHNICIAN_MISCONDUCT',
  'SERVICE_QUALITY',
  'BILLING_DISPUTE',
  'LATE_ARRIVAL',
  'NO_SHOW',
  'OTHER',
]);

export const InternalNoteSchema = z.object({
  adminId: z.string(),
  note: z.string(),
  createdAt: z.string(),
}).openapi('InternalNote');

export const ComplaintDocSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  customerId: z.string(),
  technicianId: z.string(),
  description: z.string(),
  type: ComplaintTypeEnum.default('STANDARD'),
  draftOverall: z.number().int().min(1).max(5).optional(),
  draftComment: z.string().max(500).optional(),
  expiresAt: z.string().optional(),
  status: ComplaintStatusEnum,
  assigneeAdminId: z.string().optional(),
  resolutionCategory: ComplaintResolutionCategoryEnum.optional(),
  internalNotes: z.array(InternalNoteSchema).default([]),
  slaDeadlineAt: z.string(),
  escalated: z.boolean().default(false),
  resolvedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Keep existing CreateComplaintBodySchema and PatchComplaintBodySchema unchanged.

// Add after PatchComplaintBodySchema:
export const EscalateRatingBodySchema = z.object({
  draftOverall: z.number().int().min(1).max(2),
  draftComment: z.string().max(500).optional(),
}).openapi('EscalateRatingBody');

export const EscalateRatingResponseSchema = z.object({
  complaintId: z.string(),
  expiresAt: z.string(),
}).openapi('EscalateRatingResponse');

// Add to type exports at bottom:
export type ComplaintType = z.infer<typeof ComplaintTypeEnum>;
export type EscalateRatingBody = z.infer<typeof EscalateRatingBodySchema>;
export type EscalateRatingResponse = z.infer<typeof EscalateRatingResponseSchema>;
```

- [ ] **Step 2: Add sendOwnerRatingShieldAlert to fcm.service.ts**

Append to `api/src/services/fcm.service.ts`:

```typescript
export async function sendOwnerRatingShieldAlert(payload: {
  bookingId: string;
  technicianId: string;
  draftOverall: number;
}): Promise<void> {
  await getFirebaseAdmin().messaging().send({
    topic: 'owner_alerts',
    data: {
      type: 'OWNER_RATING_SHIELD_ALERT',
      bookingId: payload.bookingId,
      technicianId: payload.technicianId,
      draftOverall: String(payload.draftOverall),
    },
  });
}
```

- [ ] **Step 3: Add findRatingShieldEscalation to complaints-repository.ts**

Append to `api/src/cosmos/complaints-repository.ts`:

```typescript
export async function findRatingShieldEscalation(
  bookingId: string,
  customerId: string,
): Promise<ComplaintDoc | null> {
  const query: SqlQuerySpec = {
    query: `SELECT TOP 1 * FROM c WHERE c.orderId = @bookingId AND c.customerId = @customerId AND c.type = @type`,
    parameters: [
      { name: '@bookingId', value: bookingId },
      { name: '@customerId', value: customerId },
      { name: '@type', value: 'RATING_SHIELD' },
    ],
  };
  const { resources } = await getCosmosClient()
    .database(DB_NAME)
    .container(CONTAINER)
    .items.query<Record<string, unknown>>(query)
    .fetchAll();
  if (resources.length === 0) return null;
  return ComplaintDocSchema.parse(resources[0]);
}
```

- [ ] **Step 4: Commit**

```bash
git add api/src/schemas/complaint.ts api/src/services/fcm.service.ts api/src/cosmos/complaints-repository.ts
git commit -m "feat(e07-s02): extend complaint schema + FCM helper + findRatingShieldEscalation"
```

---

## Task 2: Escalate handler — test first, then implement (API TDD)

**Files:**
- Create: `api/tests/functions/rating-escalate.test.ts`
- Create: `api/src/functions/rating-escalate.ts`

- [ ] **Step 1: Write the failing tests**

Create `api/tests/functions/rating-escalate.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HttpRequest, InvocationContext } from '@azure/functions';

vi.mock('../../src/cosmos/booking-repository.js', () => ({
  bookingRepo: { getById: vi.fn() },
}));
vi.mock('../../src/cosmos/complaints-repository.js', () => ({
  createComplaint: vi.fn(),
  findRatingShieldEscalation: vi.fn(),
}));
vi.mock('../../src/services/fcm.service.js', () => ({
  sendOwnerRatingShieldAlert: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../../src/services/firebaseAdmin.js', () => ({
  verifyFirebaseIdToken: vi.fn().mockResolvedValue({ uid: 'customer_1' }),
}));

import { bookingRepo } from '../../src/cosmos/booking-repository.js';
import { createComplaint, findRatingShieldEscalation } from '../../src/cosmos/complaints-repository.js';
import { escalateRatingHandler } from '../../src/functions/rating-escalate.js';

const closedBooking = { id: 'bk-1', customerId: 'customer_1', technicianId: 'tech_1', status: 'CLOSED' };
const mockCustomer = { customerId: 'customer_1' };
const mockCtx = { error: vi.fn() } as unknown as InvocationContext;

function makeReq(body: unknown = {}, bookingId = 'bk-1'): HttpRequest {
  return {
    params: { bookingId },
    query: { get: () => null, has: () => false },
    headers: { get: () => null },
    json: () => Promise.resolve(body),
  } as unknown as HttpRequest;
}

describe('escalateRatingHandler', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 404 when booking not found', async () => {
    (bookingRepo.getById as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await escalateRatingHandler(makeReq({ draftOverall: 2 }), mockCtx, mockCustomer);
    expect(res.status).toBe(404);
    expect(res.jsonBody).toMatchObject({ code: 'BOOKING_NOT_FOUND' });
  });

  it('returns 403 when caller is not the booking customer', async () => {
    (bookingRepo.getById as ReturnType<typeof vi.fn>).mockResolvedValue({ ...closedBooking, customerId: 'other' });
    const res = await escalateRatingHandler(makeReq({ draftOverall: 2 }), mockCtx, mockCustomer);
    expect(res.status).toBe(403);
    expect(res.jsonBody).toMatchObject({ code: 'FORBIDDEN' });
  });

  it('returns 409 BOOKING_NOT_CLOSED when booking status is not CLOSED', async () => {
    (bookingRepo.getById as ReturnType<typeof vi.fn>).mockResolvedValue({ ...closedBooking, status: 'PAID' });
    (findRatingShieldEscalation as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await escalateRatingHandler(makeReq({ draftOverall: 2 }), mockCtx, mockCustomer);
    expect(res.status).toBe(409);
    expect(res.jsonBody).toMatchObject({ code: 'BOOKING_NOT_CLOSED' });
  });

  it('returns 409 SHIELD_ALREADY_ESCALATED on duplicate escalation', async () => {
    (bookingRepo.getById as ReturnType<typeof vi.fn>).mockResolvedValue(closedBooking);
    (findRatingShieldEscalation as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'existing' });
    const res = await escalateRatingHandler(makeReq({ draftOverall: 2 }), mockCtx, mockCustomer);
    expect(res.status).toBe(409);
    expect(res.jsonBody).toMatchObject({ code: 'SHIELD_ALREADY_ESCALATED' });
  });

  it('returns 400 VALIDATION_ERROR when draftOverall > 2', async () => {
    (bookingRepo.getById as ReturnType<typeof vi.fn>).mockResolvedValue(closedBooking);
    (findRatingShieldEscalation as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await escalateRatingHandler(makeReq({ draftOverall: 3 }), mockCtx, mockCustomer);
    expect(res.status).toBe(400);
    expect(res.jsonBody).toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('returns 201 with complaintId and expiresAt ~2h from now on success', async () => {
    (bookingRepo.getById as ReturnType<typeof vi.fn>).mockResolvedValue(closedBooking);
    (findRatingShieldEscalation as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (createComplaint as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    const before = Date.now();
    const res = await escalateRatingHandler(makeReq({ draftOverall: 2 }), mockCtx, mockCustomer);
    const after = Date.now();
    expect(res.status).toBe(201);
    const body = res.jsonBody as Record<string, unknown>;
    expect(typeof body['complaintId']).toBe('string');
    const expiresAtMs = new Date(body['expiresAt'] as string).getTime();
    const twoHoursMs = 2 * 60 * 60 * 1000;
    expect(expiresAtMs - before).toBeGreaterThanOrEqual(twoHoursMs - 1000);
    expect(expiresAtMs - after).toBeLessThanOrEqual(twoHoursMs + 1000);
  });

  it('calls createComplaint with RATING_SHIELD type and draftOverall on success', async () => {
    (bookingRepo.getById as ReturnType<typeof vi.fn>).mockResolvedValue(closedBooking);
    (findRatingShieldEscalation as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (createComplaint as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    await escalateRatingHandler(makeReq({ draftOverall: 1, draftComment: 'bad work' }), mockCtx, mockCustomer);
    expect(createComplaint).toHaveBeenCalledWith(expect.objectContaining({
      type: 'RATING_SHIELD',
      draftOverall: 1,
      draftComment: 'bad work',
      status: 'NEW',
      customerId: 'customer_1',
    }));
  });
});
```

- [ ] **Step 2: Run tests — verify they fail with import errors**

```bash
cd api && pnpm test tests/functions/rating-escalate.test.ts
```
Expected: fail (module not found for `rating-escalate.ts`)

- [ ] **Step 3: Implement the handler**

Create `api/src/functions/rating-escalate.ts`:

```typescript
import { app } from '@azure/functions';
import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { requireCustomer } from '../middleware/requireCustomer.js';
import type { CustomerContext } from '../types/customer.js';
import { EscalateRatingBodySchema } from '../schemas/complaint.js';
import type { ComplaintDoc } from '../schemas/complaint.js';
import { bookingRepo } from '../cosmos/booking-repository.js';
import { createComplaint, findRatingShieldEscalation } from '../cosmos/complaints-repository.js';
import { sendOwnerRatingShieldAlert } from '../services/fcm.service.js';
import { randomUUID } from 'crypto';

export async function escalateRatingHandler(
  req: HttpRequest,
  ctx: InvocationContext,
  customer: CustomerContext,
): Promise<HttpResponseInit> {
  const bookingId = (req as unknown as { params: { bookingId: string } }).params.bookingId;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { status: 400, jsonBody: { code: 'INVALID_JSON' } };
  }
  const parsed = EscalateRatingBodySchema.safeParse(body);
  if (!parsed.success) {
    return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', issues: parsed.error.issues } };
  }

  const booking = await bookingRepo.getById(bookingId);
  if (!booking) return { status: 404, jsonBody: { code: 'BOOKING_NOT_FOUND' } };
  if (booking.customerId !== customer.customerId) return { status: 403, jsonBody: { code: 'FORBIDDEN' } };
  if (booking.status !== 'CLOSED') return { status: 409, jsonBody: { code: 'BOOKING_NOT_CLOSED' } };

  const existing = await findRatingShieldEscalation(bookingId, customer.customerId);
  if (existing) return { status: 409, jsonBody: { code: 'SHIELD_ALREADY_ESCALATED' } };

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  const doc: ComplaintDoc = {
    id: randomUUID(),
    orderId: bookingId,
    customerId: customer.customerId,
    technicianId: booking.technicianId ?? '',
    description: `Rating Shield — booking ${bookingId} — draft: ${parsed.data.draftOverall}★`,
    type: 'RATING_SHIELD',
    draftOverall: parsed.data.draftOverall,
    ...(parsed.data.draftComment !== undefined ? { draftComment: parsed.data.draftComment } : {}),
    status: 'NEW',
    internalNotes: [],
    slaDeadlineAt: expiresAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    escalated: false,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  try {
    await createComplaint(doc);
  } catch (err: unknown) {
    if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: number }).code === 404) {
      return { status: 503, jsonBody: { code: 'CONTAINER_NOT_PROVISIONED' } };
    }
    throw err;
  }

  sendOwnerRatingShieldAlert({
    bookingId,
    technicianId: booking.technicianId ?? '',
    draftOverall: parsed.data.draftOverall,
  }).catch((err: unknown) => ctx.error('FCM OWNER_RATING_SHIELD_ALERT failed', err));

  return { status: 201, jsonBody: { complaintId: doc.id, expiresAt: expiresAt.toISOString() } };
}

app.http('escalateRating', {
  methods: ['POST'],
  route: 'v1/ratings/{bookingId}/escalate',
  authLevel: 'anonymous',
  handler: requireCustomer(escalateRatingHandler),
});
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
cd api && pnpm test tests/functions/rating-escalate.test.ts
```
Expected: 7 tests pass

- [ ] **Step 5: Full API typecheck + lint**

```bash
cd api && pnpm typecheck && pnpm lint
```
Expected: 0 errors, 0 warnings

- [ ] **Step 6: Commit**

```bash
git add api/src/functions/rating-escalate.ts api/tests/functions/rating-escalate.test.ts
git commit -m "feat(e07-s02): add POST /v1/ratings/{bookingId}/escalate handler + tests"
```

---

## Task 3: Android DTOs + Retrofit interface

**Files:**
- Create: `customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/remote/dto/EscalateRatingDtos.kt`
- Modify: `customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/remote/RatingApiService.kt`

- [ ] **Step 1: Create EscalateRatingDtos.kt**

```kotlin
package com.homeservices.customer.data.rating.remote.dto

import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
public data class EscalateRatingRequestDto(
    val draftOverall: Int,
    val draftComment: String?,
)

@JsonClass(generateAdapter = true)
public data class EscalateRatingResponseDto(
    val complaintId: String,
    val expiresAt: String,
)
```

- [ ] **Step 2: Add escalate() to RatingApiService**

```kotlin
package com.homeservices.customer.data.rating.remote

import com.homeservices.customer.data.rating.remote.dto.EscalateRatingRequestDto
import com.homeservices.customer.data.rating.remote.dto.EscalateRatingResponseDto
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

    @POST("v1/ratings/{bookingId}/escalate")
    public suspend fun escalate(
        @Path("bookingId") bookingId: String,
        @Body body: EscalateRatingRequestDto,
    ): EscalateRatingResponseDto
}
```

- [ ] **Step 3: Compile check**

```bash
cd customer-app && ./gradlew :app:compileDebugKotlin
```
Expected: BUILD SUCCESSFUL

- [ ] **Step 4: Commit**

```bash
git add customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/remote/dto/EscalateRatingDtos.kt \
        customer-app/app/src/main/kotlin/com/homeservices/customer/data/rating/remote/RatingApiService.kt
git commit -m "feat(e07-s02): add EscalateRatingDtos + escalate() Retrofit method"
```

---

## Task 4: EscalateRatingUseCase — test first, then implement (Android TDD)

**Files:**
- Create: `customer-app/app/src/test/kotlin/com/homeservices/customer/domain/rating/EscalateRatingUseCaseTest.kt`
- Create: `customer-app/app/src/main/kotlin/com/homeservices/customer/domain/rating/EscalateRatingUseCase.kt`

- [ ] **Step 1: Write failing tests**

Create `EscalateRatingUseCaseTest.kt`:

```kotlin
package com.homeservices.customer.domain.rating

import com.homeservices.customer.data.rating.remote.RatingApiService
import com.homeservices.customer.data.rating.remote.dto.EscalateRatingRequestDto
import com.homeservices.customer.data.rating.remote.dto.EscalateRatingResponseDto
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import java.time.Instant

public class EscalateRatingUseCaseTest {
    private val apiService: RatingApiService = mockk()
    private val useCase = EscalateRatingUseCase(apiService)

    @Test
    public fun `returns EscalateRatingResult with parsed epoch millis on success`(): Unit =
        runTest {
            val isoExpiry = "2026-04-25T14:00:00.000Z"
            coEvery {
                apiService.escalate("bk-1", EscalateRatingRequestDto(2, null))
            } returns EscalateRatingResponseDto("complaint-abc", isoExpiry)

            val result = useCase.invoke("bk-1", 2, null)

            assertThat(result.isSuccess).isTrue()
            assertThat(result.getOrNull()?.complaintId).isEqualTo("complaint-abc")
            assertThat(result.getOrNull()?.expiresAtMs)
                .isEqualTo(Instant.parse(isoExpiry).toEpochMilli())
        }

    @Test
    public fun `passes draftComment when provided`(): Unit =
        runTest {
            coEvery {
                apiService.escalate("bk-1", EscalateRatingRequestDto(1, "rude technician"))
            } returns EscalateRatingResponseDto("complaint-xyz", "2026-04-25T14:00:00.000Z")

            val result = useCase.invoke("bk-1", 1, "rude technician")

            assertThat(result.isSuccess).isTrue()
        }

    @Test
    public fun `wraps network error in failure Result`(): Unit =
        runTest {
            coEvery { apiService.escalate(any(), any()) } throws RuntimeException("timeout")

            val result = useCase.invoke("bk-1", 2, null)

            assertThat(result.isFailure).isTrue()
            assertThat(result.exceptionOrNull()?.message).contains("timeout")
        }
}
```

- [ ] **Step 2: Run — verify compile failure (class not found)**

```bash
cd customer-app && ./gradlew :app:testDebugUnitTest --tests "*.EscalateRatingUseCaseTest" 2>&1 | tail -5
```
Expected: FAILED — unresolved reference `EscalateRatingUseCase`

- [ ] **Step 3: Implement EscalateRatingUseCase**

Create `EscalateRatingUseCase.kt`:

```kotlin
package com.homeservices.customer.domain.rating

import com.homeservices.customer.data.rating.remote.RatingApiService
import com.homeservices.customer.data.rating.remote.dto.EscalateRatingRequestDto
import java.time.Instant
import javax.inject.Inject

public data class EscalateRatingResult(
    val complaintId: String,
    val expiresAtMs: Long,
)

public class EscalateRatingUseCase
    @Inject
    constructor(
        private val apiService: RatingApiService,
    ) {
        public suspend fun invoke(
            bookingId: String,
            draftOverall: Int,
            draftComment: String? = null,
        ): Result<EscalateRatingResult> =
            runCatching {
                val dto = apiService.escalate(bookingId, EscalateRatingRequestDto(draftOverall, draftComment))
                EscalateRatingResult(
                    complaintId = dto.complaintId,
                    expiresAtMs = Instant.parse(dto.expiresAt).toEpochMilli(),
                )
            }
    }
```

- [ ] **Step 4: Run — verify tests pass**

```bash
cd customer-app && ./gradlew :app:testDebugUnitTest --tests "*.EscalateRatingUseCaseTest"
```
Expected: 3 tests pass

- [ ] **Step 5: Commit**

```bash
git add customer-app/app/src/main/kotlin/com/homeservices/customer/domain/rating/EscalateRatingUseCase.kt \
        customer-app/app/src/test/kotlin/com/homeservices/customer/domain/rating/EscalateRatingUseCaseTest.kt
git commit -m "feat(e07-s02): add EscalateRatingUseCase + tests"
```

---

## Task 5: ViewModel shield logic — test first, then implement

**Files:**
- Create: `customer-app/app/src/test/kotlin/com/homeservices/customer/ui/rating/RatingViewModelShieldTest.kt`
- Modify: `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating/RatingViewModel.kt`
- Modify: `customer-app/app/src/test/kotlin/com/homeservices/customer/ui/rating/RatingViewModelTest.kt`

- [ ] **Step 1: Write failing shield tests**

Create `RatingViewModelShieldTest.kt`:

```kotlin
package com.homeservices.customer.ui.rating

import androidx.lifecycle.SavedStateHandle
import com.homeservices.customer.domain.rating.EscalateRatingResult
import com.homeservices.customer.domain.rating.EscalateRatingUseCase
import com.homeservices.customer.domain.rating.GetRatingUseCase
import com.homeservices.customer.domain.rating.SubmitRatingUseCase
import com.homeservices.customer.domain.rating.model.CustomerSubScores
import com.homeservices.customer.domain.rating.model.RatingSnapshot
import com.homeservices.customer.domain.rating.model.SideState
import io.mockk.coEvery
import io.mockk.coVerify
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
public class RatingViewModelShieldTest {
    private val submit: SubmitRatingUseCase = mockk()
    private val get: GetRatingUseCase = mockk()
    private val escalate: EscalateRatingUseCase = mockk()
    private val savedState = SavedStateHandle(mapOf("bookingId" to "bk-1"))

    @BeforeEach
    public fun setUp() {
        Dispatchers.setMain(UnconfinedTestDispatcher())
        coEvery { get.invoke("bk-1") } returns flowOf(
            Result.success(RatingSnapshot("bk-1", RatingSnapshot.Status.PENDING, null, SideState.Pending, SideState.Pending))
        )
    }

    @AfterEach
    public fun tearDown() { Dispatchers.resetMain() }

    private fun vm() = RatingViewModel(submit, get, escalate, savedState)

    @Test
    public fun `submit with overall le 2 sets ShowDialog without calling API`(): Unit = runTest {
        val v = vm()
        v.setOverall(2); v.setPunctuality(5); v.setSkill(5); v.setBehaviour(5)
        v.submit()
        assertThat(v.shieldState.value).isEqualTo(RatingShieldState.ShowDialog)
        coVerify(exactly = 0) { submit.invoke(any(), any(), any(), any()) }
    }

    @Test
    public fun `submit with overall ge 3 calls API directly without showing dialog`(): Unit = runTest {
        coEvery { submit.invoke("bk-1", 3, CustomerSubScores(5, 5, 5), null) } returns
            flowOf(Result.success(Unit))
        val v = vm()
        v.setOverall(3); v.setPunctuality(5); v.setSkill(5); v.setBehaviour(5)
        v.submit()
        assertThat(v.shieldState.value).isEqualTo(RatingShieldState.Idle)
        coVerify(exactly = 1) { submit.invoke("bk-1", 3, CustomerSubScores(5, 5, 5), null) }
    }

    @Test
    public fun `onSkipShield resets to Idle and calls submit API`(): Unit = runTest {
        coEvery { submit.invoke("bk-1", 1, CustomerSubScores(5, 5, 5), null) } returns
            flowOf(Result.success(Unit))
        val v = vm()
        v.setOverall(1); v.setPunctuality(5); v.setSkill(5); v.setBehaviour(5)
        v.submit()  // triggers ShowDialog
        v.onSkipShield()
        assertThat(v.shieldState.value).isEqualTo(RatingShieldState.Idle)
        coVerify(exactly = 1) { submit.invoke("bk-1", 1, CustomerSubScores(5, 5, 5), null) }
    }

    @Test
    public fun `onEscalate calls use case and sets Escalated on success`(): Unit = runTest {
        val expiresAtMs = System.currentTimeMillis() + 2 * 60 * 60 * 1000
        coEvery { escalate.invoke("bk-1", 2, null) } returns
            Result.success(EscalateRatingResult("c-1", expiresAtMs))
        val v = vm()
        v.setOverall(2); v.setPunctuality(5); v.setSkill(5); v.setBehaviour(5)
        v.submit()
        v.onEscalate()
        assertThat(v.shieldState.value).isInstanceOf(RatingShieldState.Escalated::class.java)
        assertThat((v.shieldState.value as RatingShieldState.Escalated).expiresAtMs).isEqualTo(expiresAtMs)
    }

    @Test
    public fun `onEscalate failure resets to Idle and sets Error uiState`(): Unit = runTest {
        coEvery { escalate.invoke("bk-1", 2, null) } returns Result.failure(RuntimeException("network"))
        val v = vm()
        v.setOverall(2); v.setPunctuality(5); v.setSkill(5); v.setBehaviour(5)
        v.submit()
        v.onEscalate()
        assertThat(v.shieldState.value).isEqualTo(RatingShieldState.Idle)
        assertThat(v.uiState.value).isInstanceOf(RatingUiState.Error::class.java)
    }

    @Test
    public fun `second submit after Escalated state posts API without reshowing dialog`(): Unit = runTest {
        val expiresAtMs = System.currentTimeMillis() + 2 * 60 * 60 * 1000
        coEvery { escalate.invoke("bk-1", 2, null) } returns
            Result.success(EscalateRatingResult("c-1", expiresAtMs))
        coEvery { submit.invoke("bk-1", 2, CustomerSubScores(5, 5, 5), null) } returns
            flowOf(Result.success(Unit))
        val v = vm()
        v.setOverall(2); v.setPunctuality(5); v.setSkill(5); v.setBehaviour(5)
        v.submit()     // → ShowDialog
        v.onEscalate() // → Escalated
        v.submit()     // → should call API directly, not show dialog again
        assertThat(v.uiState.value).isInstanceOf(RatingUiState.AwaitingPartner::class.java)
    }
}
```

- [ ] **Step 2: Run — verify compile failure (shieldState not found)**

```bash
cd customer-app && ./gradlew :app:testDebugUnitTest --tests "*.RatingViewModelShieldTest" 2>&1 | tail -5
```
Expected: FAILED — unresolved reference

- [ ] **Step 3: Extend RatingViewModel**

Replace the full contents of `RatingViewModel.kt`:

```kotlin
package com.homeservices.customer.ui.rating

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.customer.domain.rating.EscalateRatingUseCase
import com.homeservices.customer.domain.rating.GetRatingUseCase
import com.homeservices.customer.domain.rating.SubmitRatingUseCase
import com.homeservices.customer.domain.rating.model.CustomerSubScores
import com.homeservices.customer.domain.rating.model.RatingSnapshot
import com.homeservices.customer.domain.rating.model.SideState
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

public sealed class RatingShieldState {
    public object Idle : RatingShieldState()
    public object ShowDialog : RatingShieldState()
    public data class Escalated(val expiresAtMs: Long) : RatingShieldState()
}

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
        private val escalateUseCase: EscalateRatingUseCase,
        savedStateHandle: SavedStateHandle,
    ) : ViewModel() {
        public val bookingId: String =
            savedStateHandle.get<String>("bookingId") ?: error("bookingId required")

        private val _uiState = MutableStateFlow<RatingUiState>(RatingUiState.Loading)
        public val uiState: StateFlow<RatingUiState> = _uiState.asStateFlow()

        private val _shieldState = MutableStateFlow<RatingShieldState>(RatingShieldState.Idle)
        public val shieldState: StateFlow<RatingShieldState> = _shieldState.asStateFlow()

        private val _overall = MutableStateFlow(0)
        public val overall: StateFlow<Int> = _overall.asStateFlow()

        private val _punctuality = MutableStateFlow(0)
        public val punctuality: StateFlow<Int> = _punctuality.asStateFlow()

        private val _skill = MutableStateFlow(0)
        public val skill: StateFlow<Int> = _skill.asStateFlow()

        private val _behaviour = MutableStateFlow(0)
        public val behaviour: StateFlow<Int> = _behaviour.asStateFlow()

        private val _comment = MutableStateFlow("")
        public val comment: StateFlow<String> = _comment.asStateFlow()

        private val _canSubmit = MutableStateFlow(false)
        public val canSubmit: StateFlow<Boolean> = _canSubmit.asStateFlow()

        init {
            viewModelScope.launch {
                getUseCase.invoke(bookingId).collect { result ->
                    result
                        .onSuccess { snap ->
                            _uiState.value = when {
                                snap.status == RatingSnapshot.Status.REVEALED -> RatingUiState.Revealed(snap)
                                snap.customerSide is SideState.Submitted -> RatingUiState.AwaitingPartner(snap)
                                else -> RatingUiState.Editing(snap)
                            }
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
            _canSubmit.value = overall.value in 1..5 &&
                punctuality.value in 1..5 &&
                skill.value in 1..5 &&
                behaviour.value in 1..5
        }

        public fun submit() {
            if (!_canSubmit.value) return
            if (overall.value <= 2 && _shieldState.value == RatingShieldState.Idle) {
                _shieldState.value = RatingShieldState.ShowDialog
                return
            }
            doSubmit()
        }

        public fun onSkipShield() {
            _shieldState.value = RatingShieldState.Idle
            doSubmit()
        }

        public fun onPostAnyway() {
            _shieldState.value = RatingShieldState.Idle
            doSubmit()
        }

        public fun onEscalate() {
            viewModelScope.launch {
                val result = escalateUseCase.invoke(
                    bookingId = bookingId,
                    draftOverall = overall.value,
                    draftComment = comment.value.ifBlank { null },
                )
                result
                    .onSuccess { r ->
                        _shieldState.value = RatingShieldState.Escalated(r.expiresAtMs)
                        startCountdown(r.expiresAtMs)
                    }
                    .onFailure {
                        _shieldState.value = RatingShieldState.Idle
                        _uiState.value = RatingUiState.Error(it.message ?: "escalation failed")
                    }
            }
        }

        private fun startCountdown(expiresAtMs: Long) {
            viewModelScope.launch {
                while (System.currentTimeMillis() < expiresAtMs) {
                    delay(60_000L)
                }
                onPostAnyway()
            }
        }

        private fun doSubmit() {
            _uiState.value = RatingUiState.Submitting
            viewModelScope.launch {
                submitUseCase.invoke(
                    bookingId = bookingId,
                    overall = overall.value,
                    subScores = CustomerSubScores(punctuality.value, skill.value, behaviour.value),
                    comment = comment.value.ifBlank { null },
                ).collect { result ->
                    result
                        .onSuccess { _uiState.value = RatingUiState.AwaitingPartner(null) }
                        .onFailure { _uiState.value = RatingUiState.Error(it.message ?: "submit failed") }
                }
            }
        }
    }
```

- [ ] **Step 4: Fix existing RatingViewModelTest — add escalate mock to constructor**

In `RatingViewModelTest.kt`, add the field and update every `RatingViewModel(...)` constructor call:

```kotlin
// Add field alongside submit and get:
private val escalate: EscalateRatingUseCase = mockk()

// Update every constructor call from:
//   RatingViewModel(submit, get, savedState)
// to:
//   RatingViewModel(submit, get, escalate, savedState)
```

There are 7 constructor calls in that file — apply to all of them.

- [ ] **Step 5: Run all ViewModel tests**

```bash
cd customer-app && ./gradlew :app:testDebugUnitTest \
  --tests "*.RatingViewModelTest" \
  --tests "*.RatingViewModelShieldTest"
```
Expected: all tests pass (existing 7 + new 6 = 13 total)

- [ ] **Step 6: Commit**

```bash
git add customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating/RatingViewModel.kt \
        customer-app/app/src/test/kotlin/com/homeservices/customer/ui/rating/RatingViewModelShieldTest.kt \
        customer-app/app/src/test/kotlin/com/homeservices/customer/ui/rating/RatingViewModelTest.kt
git commit -m "feat(e07-s02): RatingShieldState + ViewModel shield intercept + tests"
```

---

## Task 6: RatingScreen — ShieldBottomSheet + CountdownChip

**Files:**
- Modify: `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating/RatingScreen.kt`

- [ ] **Step 1: Replace RatingScreen.kt with shield-aware version**

```kotlin
package com.homeservices.customer.ui.rating

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.SuggestionChip
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import kotlinx.coroutines.delay

@OptIn(ExperimentalMaterial3Api::class)
@Composable
public fun RatingScreen(
    modifier: Modifier = Modifier,
    viewModel: RatingViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsState()
    val shieldState by viewModel.shieldState.collectAsState()
    val overall by viewModel.overall.collectAsState()
    val punct by viewModel.punctuality.collectAsState()
    val skill by viewModel.skill.collectAsState()
    val behav by viewModel.behaviour.collectAsState()
    val comment by viewModel.comment.collectAsState()
    val canSubmit by viewModel.canSubmit.collectAsState()

    if (shieldState == RatingShieldState.ShowDialog) {
        ShieldBottomSheet(
            onEscalate = viewModel::onEscalate,
            onSkip = viewModel::onSkipShield,
        )
    }

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
                if (shieldState is RatingShieldState.Escalated) {
                    CountdownChip(
                        expiresAtMs = (shieldState as RatingShieldState.Escalated).expiresAtMs,
                        onPostAnyway = viewModel::onPostAnyway,
                    )
                } else {
                    Button(onClick = viewModel::submit, enabled = canSubmit) { Text("Submit") }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ShieldBottomSheet(
    onEscalate: () -> Unit,
    onSkip: () -> Unit,
) {
    val sheetState = rememberModalBottomSheetState(skipPartialExpansion = true)
    ModalBottomSheet(
        onDismissRequest = onSkip,
        sheetState = sheetState,
    ) {
        Column(modifier = Modifier.padding(horizontal = 24.dp, vertical = 16.dp)) {
            Text(
                text = "क्या आप मालिक को पहले बताना चाहते हैं?",
                style = MaterialTheme.typography.titleMedium,
            )
            Spacer(Modifier.height(16.dp))
            Button(onClick = onEscalate, modifier = Modifier.fillMaxWidth()) {
                Text("हाँ")
            }
            Spacer(Modifier.height(8.dp))
            OutlinedButton(onClick = onSkip, modifier = Modifier.fillMaxWidth()) {
                Text("नहीं, सीधे post करें")
            }
            Spacer(Modifier.height(16.dp))
        }
    }
}

@Composable
private fun CountdownChip(
    expiresAtMs: Long,
    onPostAnyway: () -> Unit,
) {
    var remainingMs by remember { mutableLongStateOf(expiresAtMs - System.currentTimeMillis()) }
    LaunchedEffect(expiresAtMs) {
        while (remainingMs > 0) {
            delay(60_000L)
            remainingMs = expiresAtMs - System.currentTimeMillis()
        }
    }
    val hours = (remainingMs / 3_600_000).coerceAtLeast(0)
    val minutes = ((remainingMs % 3_600_000) / 60_000).coerceAtLeast(0)
    Row(
        modifier = Modifier.padding(vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        SuggestionChip(
            onClick = {},
            label = { Text("मालिक को ${hours}:${minutes.toString().padStart(2, '0')} बचे हैं") },
        )
        Spacer(Modifier.width(8.dp))
        TextButton(onClick = onPostAnyway) { Text("Post anyway") }
    }
}

@Composable
private fun StarRow(
    label: String,
    value: Int,
    onChange: (Int) -> Unit,
) {
    Row(modifier = Modifier.padding(vertical = 4.dp)) {
        Text("$label: ", modifier = Modifier.padding(end = 8.dp))
        for (i in 1..5) {
            Text(
                text = if (i <= value) "★" else "☆",
                modifier = Modifier.padding(horizontal = 2.dp)
                    .clickable(onClickLabel = "rate") { onChange(i) },
            )
        }
    }
}
```

- [ ] **Step 2: Build check**

```bash
cd customer-app && ./gradlew :app:compileDebugKotlin
```
Expected: BUILD SUCCESSFUL (0 errors)

- [ ] **Step 3: Run all rating unit tests**

```bash
cd customer-app && ./gradlew :app:testDebugUnitTest --tests "com.homeservices.customer.*rating*"
```
Expected: all pass

- [ ] **Step 4: Commit**

```bash
git add customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating/RatingScreen.kt
git commit -m "feat(e07-s02): add ShieldBottomSheet + CountdownChip to RatingScreen"
```

---

## Task 7: Smoke gates + Codex review

- [ ] **Step 1: Run API smoke gate**

```bash
bash tools/pre-codex-smoke-api.sh
```
Expected: exit 0 — typecheck + lint + test coverage ≥80%

- [ ] **Step 2: Run customer-app smoke gate**

```bash
bash tools/pre-codex-smoke.sh customer-app
```
Expected: exit 0 — ktlint + lint + testDebugUnitTest + assembleDebug

- [ ] **Step 3: Run Codex review**

```bash
codex review --base main
```
Expected: `.codex-review-passed` marker written at repo root

- [ ] **Step 4: Open PR**

```bash
git push -u origin feature/e07-s02-rating-shield
gh pr create --title "feat(e07-s02): Rating Shield — low-rating escalation to owner" \
  --body "Intercepts ≤2★ customer submit, offers owner escalation, auto-creates RATING_SHIELD complaint, fires FCM, shows 2h countdown. Posts rating regardless after window or on 'Post anyway'."
```

---

## Self-Review

**Spec coverage check:**
- AC-1 ✓ shield intercept in `submit()` — Task 5
- AC-2 ✓ "नहीं" path → `onSkipShield()` → `doSubmit()` — Task 5
- AC-3 ✓ "हाँ" path → `onEscalate()` → API call → Escalated state + countdown — Tasks 4+5
- AC-4 ✓ "Post anyway" → `onPostAnyway()` — Task 5; complaint NOT deleted (handler never deletes) — Task 2
- AC-5 ✓ countdown chip with live timer in `CountdownChip` — Task 6; auto-post on expiry via `startCountdown()` — Task 5
- AC-6 ✓ second low-rating attempt after `Escalated` skips shield (`Idle` check) — Task 5 test 6; API returns 409 on duplicate — Task 2
- AC-7 ✓ all 4 error codes (401 handled by `requireCustomer` wrapper, 403/404/409 in handler) — Task 2
- AC-8 ✓ `overall.value <= 2` condition means ≥3★ is unaffected — Task 5

**Placeholder scan:** No TBDs, no "similar to task N", all code blocks complete.

**Type consistency:**
- `RatingShieldState.Idle/ShowDialog/Escalated` — used consistently in ViewModel + Screen + tests
- `EscalateRatingResult(complaintId, expiresAtMs)` — defined in UseCase, consumed in ViewModel
- `EscalateRatingRequestDto/ResponseDto` — defined in Task 3, used in UseCase (Task 4) and Retrofit interface (Task 3)
- `escalateRatingHandler` — defined and exported in Task 2, imported in test
- `findRatingShieldEscalation` — defined in Task 1, imported in handler (Task 2) and mocked in test

**Note on `requireCustomer` auth code:** The middleware returns `401` with code `UNAUTHENTICATED`/`TOKEN_INVALID` — these are tested implicitly via the wrapper but not explicitly in the escalate test (same pattern as `adminCreateComplaintHandler` tests which also skip re-testing the middleware). Acceptable.
