# E20-S08 Account Deletion — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Play-Store-mandatory account deletion to the HomeHeroo Technician app: in-app deletion UI, API active-job gate, and a public web form for uninstalled users.

**Architecture:** The API's erasure pipeline (schema, cron, cascade) is fully built from PR #257 — this story adds only the active-job pre-check to the submit handler and the entire Android UI path. The app uses a new `ErasureApiService` (Retrofit) → `ErasureRepositoryImpl` → `SubmitErasureRequestUseCase` → `DeleteAccountViewModel` chain. After the user confirms deletion the app signs them out; erasure runs server-side 7 days later via cron.

**Tech Stack:** Kotlin + Compose, Hilt DI, Retrofit, JUnit 5 + MockK + Paparazzi; TypeScript + Vitest (API); values/strings.xml EN + HI.

---

## Parallel execution note

Tasks 1–2 (API), 3–7 (app data/domain), 10 (strings), and 11 (web form) are all **independent** and can be dispatched to parallel subagents. Tasks 8–9 (ViewModel + screens) depend on Task 7 types. Task 12 (navigation wiring) depends on Tasks 8–9. Task 13 (smoke gate) runs last.

---

## Task 1: API — `hasActiveBookingForTechnician` (TDD)

**Files:**
- Modify: `api/src/cosmos/booking-repository.ts`
- Create: `api/src/cosmos/booking-repository.test.ts`

- [ ] **Step 1: Write the failing test**

Create `api/src/cosmos/booking-repository.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the Cosmos client before importing the module under test.
vi.mock('./client.js', () => ({
  getBookingsContainer: vi.fn(),
}));

import { getBookingsContainer } from './client.js';
import { bookingRepo } from './booking-repository.js';

function makeContainer(resources: unknown[]) {
  return {
    items: {
      query: vi.fn().mockReturnValue({
        fetchNext: vi.fn().mockResolvedValue({ resources }),
      }),
    },
  };
}

describe('bookingRepo.hasActiveBookingForTechnician', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns true when an active booking exists', async () => {
    vi.mocked(getBookingsContainer).mockReturnValue(
      makeContainer([{ id: 'bk-1', status: 'IN_PROGRESS' }]) as never,
    );

    const result = await bookingRepo.hasActiveBookingForTechnician('tech-123');

    expect(result).toBe(true);
  });

  it('returns false when no active bookings exist', async () => {
    vi.mocked(getBookingsContainer).mockReturnValue(
      makeContainer([]) as never,
    );

    const result = await bookingRepo.hasActiveBookingForTechnician('tech-123');

    expect(result).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd api && npx vitest run src/cosmos/booking-repository.test.ts
```

Expected: FAIL — `bookingRepo.hasActiveBookingForTechnician is not a function`

- [ ] **Step 3: Add method to `api/src/cosmos/booking-repository.ts`**

Add this method to the `bookingRepo` object (after `getByTechnicianId`):

```typescript
  async hasActiveBookingForTechnician(technicianId: string): Promise<boolean> {
    const { resources } = await getBookingsContainer()
      .items.query<{ id: string }>({
        query: `SELECT TOP 1 c.id FROM c
                WHERE c.technicianId = @technicianId
                  AND c.status IN ('ASSIGNED', 'EN_ROUTE', 'REACHED', 'IN_PROGRESS', 'AWAITING_PRICE_APPROVAL')`,
        parameters: [{ name: '@technicianId', value: technicianId }],
      })
      .fetchNext();
    return resources.length > 0;
  },
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd api && npx vitest run src/cosmos/booking-repository.test.ts
```

Expected: 2 tests PASS

- [ ] **Step 5: Commit**

```bash
git add api/src/cosmos/booking-repository.ts api/src/cosmos/booking-repository.test.ts
git commit -m "feat(api): add hasActiveBookingForTechnician to booking-repository (E20-S08)"
```

---

## Task 2: API — active-job gate in erasure submit handler (TDD)

**Files:**
- Create: `api/src/functions/users-erasure-request.test.ts`
- Modify: `api/src/functions/users-erasure-request.ts`

- [ ] **Step 1: Write the failing tests**

Create `api/src/functions/users-erasure-request.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HttpRequest, InvocationContext } from '@azure/functions';

vi.mock('../bootstrap.js', () => ({}));
vi.mock('../services/firebaseAdmin.js', () => ({
  verifyFirebaseIdToken: vi.fn(),
}));
vi.mock('../services/userRole.service.js', () => ({
  inferUserRole: vi.fn(),
}));
vi.mock('../cosmos/booking-repository.js', () => ({
  bookingRepo: { hasActiveBookingForTechnician: vi.fn() },
}));
vi.mock('../cosmos/erasure-request-repository.js', () => ({
  createErasureRequest: vi.fn(),
  DuplicatePendingError: class DuplicatePendingError extends Error {
    constructor() { super('ERASURE_REQUEST_PENDING'); }
  },
  getActiveErasureRequestForUser: vi.fn(),
  replaceErasureRequest: vi.fn(),
}));
vi.mock('../services/auditLog.service.js', () => ({
  auditLog: vi.fn(),
}));

import { verifyFirebaseIdToken } from '../services/firebaseAdmin.js';
import { inferUserRole } from '../services/userRole.service.js';
import { bookingRepo } from '../cosmos/booking-repository.js';
import { createErasureRequest } from '../cosmos/erasure-request-repository.js';
import { submitErasureRequestHandler } from './users-erasure-request.js';

function makeRequest(body: unknown, token = 'valid-token'): HttpRequest {
  return {
    headers: { get: (k: string) => (k === 'authorization' ? `Bearer ${token}` : null) },
    json: async () => body,
  } as unknown as HttpRequest;
}

const ctx = {} as InvocationContext;

describe('submitErasureRequestHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verifyFirebaseIdToken).mockResolvedValue({ uid: 'user-1' } as never);
    vi.mocked(inferUserRole).mockResolvedValue('TECHNICIAN');
    vi.mocked(bookingRepo.hasActiveBookingForTechnician).mockResolvedValue(false);
    vi.mocked(createErasureRequest).mockResolvedValue(undefined);
  });

  it('returns 201 when no active job and valid phrase', async () => {
    const req = makeRequest({ confirmationPhrase: 'DELETE MY ACCOUNT' });

    const res = await submitErasureRequestHandler(req, ctx);

    expect(res.status).toBe(201);
    expect((res.jsonBody as { status: string }).status).toBe('PENDING');
  });

  it('returns 409 ACTIVE_JOB_EXISTS when technician has an active booking', async () => {
    vi.mocked(bookingRepo.hasActiveBookingForTechnician).mockResolvedValue(true);
    const req = makeRequest({ confirmationPhrase: 'DELETE MY ACCOUNT' });

    const res = await submitErasureRequestHandler(req, ctx);

    expect(res.status).toBe(409);
    expect((res.jsonBody as { code: string }).code).toBe('ACTIVE_JOB_EXISTS');
    expect(createErasureRequest).not.toHaveBeenCalled();
  });

  it('returns 400 when confirmation phrase is wrong', async () => {
    const req = makeRequest({ confirmationPhrase: 'delete account' });

    const res = await submitErasureRequestHandler(req, ctx);

    expect(res.status).toBe(400);
    expect((res.jsonBody as { code: string }).code).toBe('VALIDATION_ERROR');
  });

  it('returns 401 when no auth header', async () => {
    const req = makeRequest({ confirmationPhrase: 'DELETE MY ACCOUNT' }, '');

    const res = await submitErasureRequestHandler(req, ctx);

    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd api && npx vitest run src/functions/users-erasure-request.test.ts
```

Expected: FAIL — `ACTIVE_JOB_EXISTS` test passes unexpectedly because the gate doesn't exist yet.

- [ ] **Step 3: Add active-job gate to `api/src/functions/users-erasure-request.ts`**

Add this import at the top of the file (with the other repo imports):

```typescript
import { bookingRepo } from '../cosmos/booking-repository.js';
```

Then in `submitErasureRequestHandler`, after the `inferUserRole` call and before body parsing, add:

```typescript
  // Gate: refuse deletion if an active booking exists for this technician.
  if (role === 'TECHNICIAN') {
    const hasActive = await bookingRepo.hasActiveBookingForTechnician(uid);
    if (hasActive) {
      return { status: 409, jsonBody: { code: 'ACTIVE_JOB_EXISTS' } };
    }
  }
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd api && npx vitest run src/functions/users-erasure-request.test.ts
```

Expected: 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add api/src/functions/users-erasure-request.ts api/src/functions/users-erasure-request.test.ts
git commit -m "feat(api): active-job gate for erasure-request submit handler (E20-S08)"
```

---

## Task 3: String resources (EN + HI)

**Files:**
- Modify: `technician-app/app/src/main/res/values/strings.xml`
- Modify: `technician-app/app/src/main/res/values-hi/strings.xml`

- [ ] **Step 1: Add English strings**

Open `technician-app/app/src/main/res/values/strings.xml`. After the `<!-- Language settings -->` block (around line 67), add:

```xml
    <!-- Account deletion (E20-S08) -->
    <string name="settings_delete_account_title">Delete my account</string>
    <string name="settings_delete_account_subtitle">Permanently remove your profile and data</string>
    <string name="delete_account_title">Delete account</string>
    <string name="delete_account_warning">This is permanent and cannot be undone</string>
    <string name="delete_account_what_gets_deleted">What gets deleted</string>
    <string name="delete_account_item_profile">Your profile and phone number</string>
    <string name="delete_account_item_kyc">KYC documents (Aadhaar, PAN)</string>
    <string name="delete_account_item_earnings">Earnings history and payout records</string>
    <string name="delete_account_item_photos">Job photos and work history</string>
    <string name="delete_account_item_ratings">Ratings received from customers</string>
    <string name="delete_account_footnote">Data deleted within 7 days of confirmation</string>
    <string name="delete_account_confirm_button">Yes, delete my account</string>
    <string name="delete_account_cancel_button">Cancel</string>
    <string name="delete_account_active_job_title">Job in progress</string>
    <string name="delete_account_active_job_error">Complete or cancel your current job before deleting your account</string>
    <string name="delete_account_active_job_ok">OK</string>
    <string name="delete_account_duplicate_pending">A deletion request is already pending for your account</string>
    <string name="delete_account_generic_error">Something went wrong. Please try again.</string>
    <string name="account_deleted_title">Deletion request submitted</string>
    <string name="account_deleted_body">Your account is scheduled for deletion on %1$s.</string>
    <string name="account_deleted_revocation_hint">Changed your mind? Email support@homeheroo.in with subject \'Cancel account deletion\' and your phone number before %1$s.</string>
    <string name="account_deleted_web_form_label">Lost access to the app? Request deletion here</string>
    <string name="account_deleted_done">Done</string>
    <string name="deletion_request_url">https://aloktiwarigit.github.io/homeheroo-privacy/deletion-request/</string>
```

- [ ] **Step 2: Add Hindi strings**

Open `technician-app/app/src/main/res/values-hi/strings.xml`. Add the same keys with Hindi values:

```xml
    <!-- Account deletion (E20-S08) -->
    <string name="settings_delete_account_title">अकाउंट हटाएं</string>
    <string name="settings_delete_account_subtitle">आपकी प्रोफ़ाइल और डेटा स्थायी रूप से हटाएं</string>
    <string name="delete_account_title">अकाउंट हटाएं</string>
    <string name="delete_account_warning">यह स्थायी है और पूर्ववत नहीं होगा</string>
    <string name="delete_account_what_gets_deleted">क्या हटाया जाएगा</string>
    <string name="delete_account_item_profile">आपकी प्रोफ़ाइल और फ़ोन नंबर</string>
    <string name="delete_account_item_kyc">KYC दस्तावेज़ (आधार, पैन)</string>
    <string name="delete_account_item_earnings">कमाई इतिहास और भुगतान रिकॉर्ड</string>
    <string name="delete_account_item_photos">जॉब फ़ोटो और कार्य इतिहास</string>
    <string name="delete_account_item_ratings">ग्राहकों की रेटिंग</string>
    <string name="delete_account_footnote">पुष्टि के 7 दिनों के भीतर डेटा हटाया जाएगा</string>
    <string name="delete_account_confirm_button">हाँ, मेरा अकाउंट हटाएं</string>
    <string name="delete_account_cancel_button">रद्द करें</string>
    <string name="delete_account_active_job_title">जॉब जारी है</string>
    <string name="delete_account_active_job_error">अकाउंट हटाने से पहले अपनी मौजूदा जॉब पूरी करें या रद्द करें</string>
    <string name="delete_account_active_job_ok">ठीक है</string>
    <string name="delete_account_duplicate_pending">आपके अकाउंट के लिए पहले से एक हटाने का अनुरोध लंबित है</string>
    <string name="delete_account_generic_error">कुछ गड़बड़ी हुई। कृपया पुनः प्रयास करें।</string>
    <string name="account_deleted_title">हटाने का अनुरोध सबमिट हुआ</string>
    <string name="account_deleted_body">आपका अकाउंट %1$s को हटाया जाएगा।</string>
    <string name="account_deleted_revocation_hint">मन बदला? %1$s से पहले support@homeheroo.in पर \'Cancel account deletion\' subject से अपना फ़ोन नंबर लिखकर ईमेल करें।</string>
    <string name="account_deleted_web_form_label">ऐप तक पहुंच खो गई? यहाँ हटाने का अनुरोध करें</string>
    <string name="account_deleted_done">हो गया</string>
    <string name="deletion_request_url">https://aloktiwarigit.github.io/homeheroo-privacy/deletion-request/</string>
```

- [ ] **Step 3: Commit**

```bash
git add technician-app/app/src/main/res/values/strings.xml technician-app/app/src/main/res/values-hi/strings.xml
git commit -m "feat(technician-app): add account-deletion string resources EN + HI (E20-S08)"
```

---

## Task 4: ErasureApiService — Retrofit interface

**Files:**
- Create: `technician-app/app/src/main/kotlin/com/homeservices/technician/data/erasure/remote/ErasureApiService.kt`

- [ ] **Step 1: Create the file**

```kotlin
package com.homeservices.technician.data.erasure.remote

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.POST

public interface ErasureApiService {
    @POST("v1/users/me/erasure-request")
    public suspend fun submitErasureRequest(
        @Body body: ErasureSubmitRequestBody,
    ): Response<ErasureSubmitResponseBody>

    @DELETE("v1/users/me/erasure-request")
    public suspend fun revokeErasureRequest(): Response<Unit>
}

public data class ErasureSubmitRequestBody(
    val confirmationPhrase: String,
    val reason: String? = null,
)

public data class ErasureSubmitResponseBody(
    val erasureId: String,
    val scheduledDeletionAt: String,
    val status: String,
)
```

- [ ] **Step 2: Commit**

```bash
git add technician-app/app/src/main/kotlin/com/homeservices/technician/data/erasure/remote/ErasureApiService.kt
git commit -m "feat(technician-app): add ErasureApiService Retrofit interface (E20-S08)"
```

---

## Task 5: ErasureRepository interface + ErasureRepositoryImpl

**Files:**
- Create: `technician-app/app/src/main/kotlin/com/homeservices/technician/domain/erasure/ErasureRepository.kt`
- Create: `technician-app/app/src/main/kotlin/com/homeservices/technician/data/erasure/ErasureRepositoryImpl.kt`

- [ ] **Step 1: Create the domain interface**

```kotlin
package com.homeservices.technician.domain.erasure

public sealed class ErasureSubmitResult {
    public data class Success(val scheduledDeletionAt: String) : ErasureSubmitResult()
    public object ActiveJobExists : ErasureSubmitResult()
    public object DuplicatePending : ErasureSubmitResult()
    public data class UnknownError(val message: String) : ErasureSubmitResult()
}

public interface ErasureRepository {
    public suspend fun submitRequest(reason: String? = null): ErasureSubmitResult
    public suspend fun revokeRequest(): Result<Unit>
}
```

- [ ] **Step 2: Create the data implementation**

`technician-app/app/src/main/kotlin/com/homeservices/technician/data/erasure/ErasureRepositoryImpl.kt`:

```kotlin
package com.homeservices.technician.data.erasure

import com.homeservices.technician.data.erasure.remote.ErasureApiService
import com.homeservices.technician.data.erasure.remote.ErasureSubmitRequestBody
import com.homeservices.technician.domain.erasure.ErasureRepository
import com.homeservices.technician.domain.erasure.ErasureSubmitResult
import javax.inject.Inject

private const val CONFIRMATION_PHRASE = "DELETE MY ACCOUNT"
private const val HTTP_CONFLICT = 409

public class ErasureRepositoryImpl
    @Inject
    constructor(
        private val api: ErasureApiService,
    ) : ErasureRepository {
        public override suspend fun submitRequest(reason: String?): ErasureSubmitResult =
            runCatching {
                val response = api.submitErasureRequest(
                    ErasureSubmitRequestBody(confirmationPhrase = CONFIRMATION_PHRASE, reason = reason),
                )
                when {
                    response.isSuccessful -> {
                        val body = checkNotNull(response.body()) { "Null body on 2xx" }
                        ErasureSubmitResult.Success(body.scheduledDeletionAt)
                    }
                    response.code() == HTTP_CONFLICT -> {
                        val raw = response.errorBody()?.string() ?: ""
                        if (raw.contains("ACTIVE_JOB_EXISTS")) {
                            ErasureSubmitResult.ActiveJobExists
                        } else {
                            ErasureSubmitResult.DuplicatePending
                        }
                    }
                    else -> ErasureSubmitResult.UnknownError("HTTP ${response.code()}")
                }
            }.getOrElse { e -> ErasureSubmitResult.UnknownError(e.message ?: "Unknown") }

        public override suspend fun revokeRequest(): Result<Unit> =
            runCatching {
                val response = api.revokeErasureRequest()
                if (!response.isSuccessful) {
                    throw RuntimeException("Revoke failed: HTTP ${response.code()}")
                }
            }
    }
```

- [ ] **Step 3: Commit**

```bash
git add technician-app/app/src/main/kotlin/com/homeservices/technician/domain/erasure/ErasureRepository.kt technician-app/app/src/main/kotlin/com/homeservices/technician/data/erasure/ErasureRepositoryImpl.kt
git commit -m "feat(technician-app): ErasureRepository interface + impl (E20-S08)"
```

---

## Task 6: ErasureModule — Hilt wiring

**Files:**
- Create: `technician-app/app/src/main/kotlin/com/homeservices/technician/data/erasure/di/ErasureModule.kt`

- [ ] **Step 1: Create the Hilt module**

```kotlin
package com.homeservices.technician.data.erasure.di

import com.homeservices.technician.data.erasure.ErasureRepositoryImpl
import com.homeservices.technician.data.erasure.remote.ErasureApiService
import com.homeservices.technician.domain.erasure.ErasureRepository
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
public abstract class ErasureModule {
    @Binds
    internal abstract fun bindErasureRepository(impl: ErasureRepositoryImpl): ErasureRepository

    public companion object {
        @Provides
        @Singleton
        public fun provideErasureApiService(retrofit: Retrofit): ErasureApiService =
            retrofit.create(ErasureApiService::class.java)
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add technician-app/app/src/main/kotlin/com/homeservices/technician/data/erasure/di/ErasureModule.kt
git commit -m "feat(technician-app): ErasureModule Hilt wiring (E20-S08)"
```

---

## Task 7: SubmitErasureRequestUseCase (TDD)

**Files:**
- Create: `technician-app/app/src/test/kotlin/com/homeservices/technician/domain/erasure/SubmitErasureRequestUseCaseTest.kt`
- Create: `technician-app/app/src/main/kotlin/com/homeservices/technician/domain/erasure/SubmitErasureRequestUseCase.kt`

- [ ] **Step 1: Write the failing tests**

```kotlin
package com.homeservices.technician.domain.erasure

import com.homeservices.technician.domain.activeJob.ActiveJobRepository
import com.homeservices.technician.domain.activeJob.model.ActiveJob
import com.homeservices.technician.domain.activeJob.model.ActiveJobStatus
import com.homeservices.technician.domain.activeJob.model.LatLng
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

class SubmitErasureRequestUseCaseTest {
    private val erasureRepository: ErasureRepository = mockk()
    private val activeJobRepository: ActiveJobRepository = mockk()
    private lateinit var useCase: SubmitErasureRequestUseCase

    private fun activeJob() = ActiveJob(
        bookingId = "bk-1",
        customerId = "c-1",
        serviceId = "svc-1",
        serviceName = "AC Repair",
        addressText = "12 Main St",
        addressLatLng = LatLng(12.0, 77.0),
        status = ActiveJobStatus.IN_PROGRESS,
        slotDate = "2026-05-22",
        slotWindow = "10:00-12:00",
    )

    @BeforeEach
    fun setUp() {
        useCase = SubmitErasureRequestUseCase(erasureRepository, activeJobRepository)
    }

    @Test
    fun `returns ActiveJobExists without network call when activeJobState is non-null`() = runTest {
        every { activeJobRepository.activeJobState } returns MutableStateFlow(activeJob())

        val result = useCase()

        assertThat(result).isEqualTo(ErasureSubmitResult.ActiveJobExists)
        coVerify(exactly = 0) { erasureRepository.submitRequest(any()) }
    }

    @Test
    fun `calls repository when activeJobState is null and returns Success`() = runTest {
        every { activeJobRepository.activeJobState } returns MutableStateFlow(null)
        coEvery { erasureRepository.submitRequest(null) } returns
            ErasureSubmitResult.Success("2026-05-29T02:00:00.000Z")

        val result = useCase()

        assertThat(result).isEqualTo(ErasureSubmitResult.Success("2026-05-29T02:00:00.000Z"))
    }

    @Test
    fun `propagates ActiveJobExists from server when activeJobState is null`() = runTest {
        every { activeJobRepository.activeJobState } returns MutableStateFlow(null)
        coEvery { erasureRepository.submitRequest(null) } returns ErasureSubmitResult.ActiveJobExists

        val result = useCase()

        assertThat(result).isEqualTo(ErasureSubmitResult.ActiveJobExists)
    }

    @Test
    fun `propagates UnknownError from repository`() = runTest {
        every { activeJobRepository.activeJobState } returns MutableStateFlow(null)
        coEvery { erasureRepository.submitRequest(null) } returns
            ErasureSubmitResult.UnknownError("HTTP 500")

        val result = useCase()

        assertThat(result).isEqualTo(ErasureSubmitResult.UnknownError("HTTP 500"))
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd technician-app && ./gradlew testDebugUnitTest --tests "com.homeservices.technician.domain.erasure.SubmitErasureRequestUseCaseTest" 2>&1 | tail -20
```

Expected: FAIL — `SubmitErasureRequestUseCase` does not exist.

- [ ] **Step 3: Create the use case**

```kotlin
package com.homeservices.technician.domain.erasure

import com.homeservices.technician.domain.activeJob.ActiveJobRepository
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class SubmitErasureRequestUseCase
    @Inject
    constructor(
        private val erasureRepository: ErasureRepository,
        private val activeJobRepository: ActiveJobRepository,
    ) {
        public suspend operator fun invoke(reason: String? = null): ErasureSubmitResult {
            // Fast-path: activeJobState is non-null only while observing an active job.
            // The server gate (§2) is authoritative for cases the client can't see.
            if (activeJobRepository.activeJobState.value != null) {
                return ErasureSubmitResult.ActiveJobExists
            }
            return erasureRepository.submitRequest(reason)
        }
    }
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd technician-app && ./gradlew testDebugUnitTest --tests "com.homeservices.technician.domain.erasure.SubmitErasureRequestUseCaseTest" 2>&1 | tail -10
```

Expected: 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add technician-app/app/src/main/kotlin/com/homeservices/technician/domain/erasure/SubmitErasureRequestUseCase.kt technician-app/app/src/test/kotlin/com/homeservices/technician/domain/erasure/SubmitErasureRequestUseCaseTest.kt
git commit -m "feat(technician-app): SubmitErasureRequestUseCase with active-job client gate (E20-S08)"
```

---

## Task 8: DeleteAccountViewModel (TDD)

**Files:**
- Create: `technician-app/app/src/test/kotlin/com/homeservices/technician/ui/deleteaccount/DeleteAccountViewModelTest.kt`
- Create: `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/deleteaccount/DeleteAccountViewModel.kt`

- [ ] **Step 1: Write the failing tests**

```kotlin
package com.homeservices.technician.ui.deleteaccount

import com.homeservices.technician.domain.erasure.ErasureSubmitResult
import com.homeservices.technician.domain.erasure.SubmitErasureRequestUseCase
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

@OptIn(ExperimentalCoroutinesApi::class)
class DeleteAccountViewModelTest {
    private val dispatcher = StandardTestDispatcher()
    private val submitUseCase: SubmitErasureRequestUseCase = mockk()

    @BeforeEach fun setUp() { Dispatchers.setMain(dispatcher) }
    @AfterEach fun tearDown() { Dispatchers.resetMain() }

    private fun vm() = DeleteAccountViewModel(submitUseCase)

    @Test fun `initial state is Idle`() = runTest {
        val vm = vm()
        assertThat(vm.uiState.value).isEqualTo(DeleteAccountUiState.Idle)
    }

    @Test fun `onConfirmDelete transitions through Submitting to Done on success`() = runTest {
        val scheduled = "2026-05-29T02:00:00.000Z"
        coEvery { submitUseCase() } returns ErasureSubmitResult.Success(scheduled)
        val vm = vm()

        vm.onConfirmDelete()
        assertThat(vm.uiState.value).isEqualTo(DeleteAccountUiState.Submitting)

        advanceUntilIdle()
        assertThat(vm.uiState.value).isEqualTo(DeleteAccountUiState.Done(scheduled))
    }

    @Test fun `onConfirmDelete sets ActiveJobBlocked when use case returns ActiveJobExists`() = runTest {
        coEvery { submitUseCase() } returns ErasureSubmitResult.ActiveJobExists
        val vm = vm()

        vm.onConfirmDelete()
        advanceUntilIdle()

        assertThat(vm.uiState.value).isEqualTo(DeleteAccountUiState.ActiveJobBlocked)
    }

    @Test fun `onConfirmDelete sets Error on DuplicatePending`() = runTest {
        coEvery { submitUseCase() } returns ErasureSubmitResult.DuplicatePending
        val vm = vm()

        vm.onConfirmDelete()
        advanceUntilIdle()

        assertThat(vm.uiState.value).isInstanceOf(DeleteAccountUiState.Error::class.java)
    }

    @Test fun `onConfirmDelete sets Error on UnknownError`() = runTest {
        coEvery { submitUseCase() } returns ErasureSubmitResult.UnknownError("HTTP 500")
        val vm = vm()

        vm.onConfirmDelete()
        advanceUntilIdle()

        assertThat(vm.uiState.value).isInstanceOf(DeleteAccountUiState.Error::class.java)
    }

    @Test fun `onDismissError resets to Idle`() = runTest {
        coEvery { submitUseCase() } returns ErasureSubmitResult.UnknownError("oops")
        val vm = vm()
        vm.onConfirmDelete()
        advanceUntilIdle()

        vm.onDismissError()

        assertThat(vm.uiState.value).isEqualTo(DeleteAccountUiState.Idle)
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd technician-app && ./gradlew testDebugUnitTest --tests "com.homeservices.technician.ui.deleteaccount.DeleteAccountViewModelTest" 2>&1 | tail -20
```

Expected: FAIL — `DeleteAccountViewModel` and `DeleteAccountUiState` do not exist.

- [ ] **Step 3: Create the ViewModel**

```kotlin
package com.homeservices.technician.ui.deleteaccount

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.technician.domain.erasure.ErasureSubmitResult
import com.homeservices.technician.domain.erasure.SubmitErasureRequestUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

public sealed class DeleteAccountUiState {
    public object Idle : DeleteAccountUiState()
    public object ActiveJobBlocked : DeleteAccountUiState()
    public object Submitting : DeleteAccountUiState()
    public data class Error(val messageRes: Int) : DeleteAccountUiState()
    public data class Done(val scheduledDeletionAt: String) : DeleteAccountUiState()
}

@HiltViewModel
public class DeleteAccountViewModel
    @Inject
    constructor(
        private val submitErasureRequest: SubmitErasureRequestUseCase,
    ) : ViewModel() {
        private val _uiState = MutableStateFlow<DeleteAccountUiState>(DeleteAccountUiState.Idle)
        public val uiState: StateFlow<DeleteAccountUiState> = _uiState.asStateFlow()

        public fun onConfirmDelete() {
            _uiState.value = DeleteAccountUiState.Submitting
            viewModelScope.launch {
                _uiState.value = when (val result = submitErasureRequest()) {
                    is ErasureSubmitResult.Success -> DeleteAccountUiState.Done(result.scheduledDeletionAt)
                    is ErasureSubmitResult.ActiveJobExists -> DeleteAccountUiState.ActiveJobBlocked
                    is ErasureSubmitResult.DuplicatePending ->
                        DeleteAccountUiState.Error(R.string.delete_account_duplicate_pending)
                    is ErasureSubmitResult.UnknownError ->
                        DeleteAccountUiState.Error(R.string.delete_account_generic_error)
                }
            }
        }

        public fun onDismissError() {
            _uiState.value = DeleteAccountUiState.Idle
        }
    }
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd technician-app && ./gradlew testDebugUnitTest --tests "com.homeservices.technician.ui.deleteaccount.DeleteAccountViewModelTest" 2>&1 | tail -10
```

Expected: 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add technician-app/app/src/main/kotlin/com/homeservices/technician/ui/deleteaccount/DeleteAccountViewModel.kt technician-app/app/src/test/kotlin/com/homeservices/technician/ui/deleteaccount/DeleteAccountViewModelTest.kt
git commit -m "feat(technician-app): DeleteAccountViewModel + UiState (E20-S08)"
```

---

## Task 9: DeleteAccountScreen + AccountDeletedScreen + Paparazzi stubs

**Files:**
- Create: `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/deleteaccount/DeleteAccountScreen.kt`
- Create: `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/deleteaccount/AccountDeletedScreen.kt`
- Create: `technician-app/app/src/test/kotlin/com/homeservices/technician/ui/deleteaccount/DeleteAccountScreenPaparazziTest.kt`
- Create: `technician-app/app/src/test/kotlin/com/homeservices/technician/ui/deleteaccount/AccountDeletedScreenPaparazziTest.kt`

- [ ] **Step 1: Create DeleteAccountScreen.kt**

```kotlin
package com.homeservices.technician.ui.deleteaccount

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.homeservices.technician.R

@OptIn(ExperimentalMaterial3Api::class)
@Composable
public fun DeleteAccountScreen(
    onBack: () -> Unit,
    onDeleted: (scheduledAt: String) -> Unit,
    viewModel: DeleteAccountViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(uiState) {
        if (uiState is DeleteAccountUiState.Done) {
            onDeleted((uiState as DeleteAccountUiState.Done).scheduledDeletionAt)
        }
    }

    val errorRes = (uiState as? DeleteAccountUiState.Error)?.messageRes
    if (errorRes != null) {
        val message = stringResource(errorRes)
        LaunchedEffect(errorRes) {
            snackbarHostState.showSnackbar(message)
            viewModel.onDismissError()
        }
    }

    if (uiState == DeleteAccountUiState.ActiveJobBlocked) {
        AlertDialog(
            onDismissRequest = onBack,
            title = { Text(stringResource(R.string.delete_account_active_job_title)) },
            text = { Text(stringResource(R.string.delete_account_active_job_error)) },
            confirmButton = {
                TextButton(onClick = onBack) {
                    Text(stringResource(R.string.delete_account_active_job_ok))
                }
            },
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.delete_account_title)) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = stringResource(R.string.action_back))
                    }
                },
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) },
    ) { padding ->
        DeleteAccountScreenContent(
            uiState = uiState,
            onConfirm = viewModel::onConfirmDelete,
            onCancel = onBack,
            modifier = Modifier.padding(padding),
        )
    }
}

@Composable
internal fun DeleteAccountScreenContent(
    uiState: DeleteAccountUiState,
    onConfirm: () -> Unit,
    onCancel: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val isSubmitting = uiState == DeleteAccountUiState.Submitting

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp),
    ) {
        Spacer(Modifier.height(16.dp))
        Card(
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.errorContainer,
            ),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text(
                text = stringResource(R.string.delete_account_warning),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onErrorContainer,
                modifier = Modifier.padding(16.dp),
            )
        }
        Spacer(Modifier.height(24.dp))
        Text(
            text = stringResource(R.string.delete_account_what_gets_deleted),
            style = MaterialTheme.typography.titleMedium,
        )
        Spacer(Modifier.height(12.dp))
        val items = listOf(
            R.string.delete_account_item_profile,
            R.string.delete_account_item_kyc,
            R.string.delete_account_item_earnings,
            R.string.delete_account_item_photos,
            R.string.delete_account_item_ratings,
        )
        items.forEach { res ->
            Row(
                verticalAlignment = Alignment.Top,
                modifier = Modifier.padding(vertical = 4.dp),
            ) {
                Icon(
                    Icons.Default.Close,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.error,
                    modifier = Modifier.padding(end = 8.dp, top = 2.dp),
                )
                Text(
                    text = stringResource(res),
                    style = MaterialTheme.typography.bodyMedium,
                )
            }
        }
        Spacer(Modifier.height(12.dp))
        Text(
            text = stringResource(R.string.delete_account_footnote),
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Spacer(Modifier.height(32.dp))
        Button(
            onClick = onConfirm,
            enabled = !isSubmitting,
            colors = ButtonDefaults.buttonColors(
                containerColor = MaterialTheme.colorScheme.error,
            ),
            modifier = Modifier.fillMaxWidth(),
        ) {
            if (isSubmitting) {
                CircularProgressIndicator(
                    modifier = Modifier.height(20.dp),
                    strokeWidth = 2.dp,
                    color = MaterialTheme.colorScheme.onError,
                )
            } else {
                Text(stringResource(R.string.delete_account_confirm_button))
            }
        }
        Spacer(Modifier.height(8.dp))
        TextButton(
            onClick = onCancel,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text(stringResource(R.string.delete_account_cancel_button))
        }
        Spacer(Modifier.height(24.dp))
    }
}
```

- [ ] **Step 2: Create AccountDeletedScreen.kt**

`clearSession()` is a suspend function, so the screen manages its own coroutine scope and lets
`AppNavigation`'s `AuthState.Unauthenticated` observer handle the navigation to auth automatically —
no explicit nav callback needed from `HomeGraph`.

```kotlin
package com.homeservices.technician.ui.deleteaccount

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DeleteForever
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.homeservices.technician.R
import com.homeservices.technician.data.auth.SessionManager
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle

@Composable
public fun AccountDeletedScreen(
    scheduledAt: String,
    sessionManager: SessionManager,
) {
    val scope = rememberCoroutineScope()
    val formattedDate = rememberFormattedDate(scheduledAt)

    AccountDeletedScreenContent(
        formattedDate = formattedDate,
        deletionRequestUrl = stringResource(R.string.deletion_request_url),
        // clearSession() triggers AuthState.Unauthenticated; AppNavigation observer
        // navigates to "auth" and pops the back stack — no explicit navigation needed here.
        onDone = { scope.launch { sessionManager.clearSession() } },
    )
}

@Composable
internal fun AccountDeletedScreenContent(
    formattedDate: String,
    deletionRequestUrl: String,
    onDone: () -> Unit,
) {
    val context = LocalContext.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Icon(
            imageVector = Icons.Default.DeleteForever,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.error,
            modifier = Modifier.size(64.dp),
        )
        Spacer(Modifier.height(24.dp))
        Text(
            text = stringResource(R.string.account_deleted_title),
            style = MaterialTheme.typography.headlineSmall,
            textAlign = TextAlign.Center,
        )
        Spacer(Modifier.height(12.dp))
        Text(
            text = stringResource(R.string.account_deleted_body, formattedDate),
            style = MaterialTheme.typography.bodyLarge,
            textAlign = TextAlign.Center,
        )
        Spacer(Modifier.height(16.dp))
        Card(
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surfaceVariant,
            ),
        ) {
            Text(
                text = stringResource(R.string.account_deleted_revocation_hint, formattedDate),
                style = MaterialTheme.typography.bodyMedium,
                modifier = Modifier.padding(16.dp),
                textAlign = TextAlign.Center,
            )
        }
        Spacer(Modifier.height(16.dp))
        TextButton(
            onClick = {
                context.startActivity(
                    Intent(Intent.ACTION_VIEW, Uri.parse(deletionRequestUrl))
                )
            },
        ) {
            Text(stringResource(R.string.account_deleted_web_form_label))
        }
        Spacer(Modifier.height(32.dp))
        Button(onClick = onDone) {
            Text(stringResource(R.string.account_deleted_done))
        }
    }
}

@Composable
private fun rememberFormattedDate(isoTimestamp: String): String =
    try {
        val instant = Instant.parse(isoTimestamp)
        val formatter = DateTimeFormatter
            .ofLocalizedDate(FormatStyle.LONG)
            .withZone(ZoneId.systemDefault())
        formatter.format(instant)
    } catch (_: Exception) {
        isoTimestamp
    }
```

- [ ] **Step 3: Create Paparazzi stub for DeleteAccountScreen**

```kotlin
package com.homeservices.technician.ui.deleteaccount

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Rule
import org.junit.Test

public class DeleteAccountScreenPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi =
        Paparazzi(
            deviceConfig = DeviceConfig.PIXEL_5,
            theme = "android:Theme.Material3.DayNight.NoActionBar",
        )

    @Test
    public fun deleteAccountScreen_idle(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                DeleteAccountScreenContent(
                    uiState = DeleteAccountUiState.Idle,
                    onConfirm = {},
                    onCancel = {},
                )
            }
        }
    }

    @Test
    public fun deleteAccountScreen_submitting(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                DeleteAccountScreenContent(
                    uiState = DeleteAccountUiState.Submitting,
                    onConfirm = {},
                    onCancel = {},
                )
            }
        }
    }
}
```

- [ ] **Step 4: Create Paparazzi stub for AccountDeletedScreen**

```kotlin
package com.homeservices.technician.ui.deleteaccount

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Rule
import org.junit.Test

public class AccountDeletedScreenPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi =
        Paparazzi(
            deviceConfig = DeviceConfig.PIXEL_5,
            theme = "android:Theme.Material3.DayNight.NoActionBar",
        )

    @Test
    public fun accountDeletedScreen(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                AccountDeletedScreenContent(
                    formattedDate = "29 May 2026",
                    deletionRequestUrl = "https://example.com/deletion-request/",
                    onDone = {},
                )
            }
        }
    }
}
```

- [ ] **Step 5: Commit**

```bash
git add technician-app/app/src/main/kotlin/com/homeservices/technician/ui/deleteaccount/ technician-app/app/src/test/kotlin/com/homeservices/technician/ui/deleteaccount/
git commit -m "feat(technician-app): DeleteAccountScreen + AccountDeletedScreen + Paparazzi stubs (E20-S08)"
```

---

## Task 10: Navigation wiring — HomeGraph + AppNavigation + ProfileScreen SettingCard

**Files:**
- Modify: `technician-app/app/src/main/kotlin/com/homeservices/technician/navigation/HomeGraph.kt`
- Modify: `technician-app/app/src/main/kotlin/com/homeservices/technician/navigation/AppNavigation.kt`
- Modify: `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/home/TechnicianHomeScreen.kt`

- [ ] **Step 1: Add routes to HomeGraph.kt**

Add the import at the top of `HomeGraph.kt`:

```kotlin
import com.homeservices.technician.data.auth.SessionManager
import com.homeservices.technician.ui.deleteaccount.AccountDeletedScreen
import com.homeservices.technician.ui.deleteaccount.DeleteAccountScreen
```

Change the `homeGraph` function signature to accept `sessionManager` and `onDeleteAccount`:

```kotlin
internal fun NavGraphBuilder.homeGraph(
    navController: NavController,
    authState: AuthState,
    sessionManager: SessionManager,
    onSignOut: () -> Unit,
) {
```

Inside the `navigation { }` block, add these two composables after the existing `language_settings` composable:

```kotlin
        composable("delete_account") {
            DeleteAccountScreen(
                onBack = { navController.popBackStack() },
                onDeleted = { scheduledAt ->
                    navController.navigate("account_deleted/${Uri.encode(scheduledAt)}") {
                        popUpTo(HOME_DASHBOARD_ROUTE) { inclusive = false }
                        launchSingleTop = true
                    }
                },
            )
        }
        composable(
            route = "account_deleted/{scheduledAt}",
            arguments = listOf(navArgument("scheduledAt") { type = NavType.StringType }),
        ) { backStackEntry ->
            val scheduledAt = Uri.decode(
                backStackEntry.arguments?.getString("scheduledAt") ?: "",
            )
            // No onDone nav callback — clearSession() triggers AuthState.Unauthenticated
            // and AppNavigation.LaunchedEffect(authState) navigates to "auth" automatically.
            AccountDeletedScreen(
                scheduledAt = scheduledAt,
                sessionManager = sessionManager,
            )
        }
```

In `HomeDashboardRoute`, add `onDeleteAccount` to `TechnicianHomeScreen`:

```kotlin
        onDeleteAccount = { navController.navigate("delete_account") },
```

(Add this alongside the existing `onLanguageSettings`, `onSignOut`, etc.)

- [ ] **Step 2: Update AppNavigation.kt to pass sessionManager**

In `AppNavigation.kt`, the `homeGraph` call currently passes `onSignOut`. Thread through `sessionManager`:

```kotlin
            homeGraph(
                navController = navController,
                authState = authState,
                sessionManager = sessionManager,
                onSignOut = { scope.launch { sessionManager.clearSession() } },
            )
```

`sessionManager` is already in scope in `AppNavigation` — it is a parameter of the composable.

- [ ] **Step 2b: Verify `SettingCard` supports `iconTint`**

Find the `SettingCard` private composable definition in `TechnicianHomeScreen.kt` (search for `private fun SettingCard`). If it does NOT have an `iconTint` parameter, add one with a default:

```kotlin
private fun SettingCard(
    icon: ImageVector,
    title: String,
    subtitle: String,
    onClick: () -> Unit,
    iconTint: Color = MaterialTheme.colorScheme.onSurface,  // ← add this
) {
    // find the Icon(...) call inside and change its `tint` to use iconTint
    Icon(imageVector = icon, contentDescription = null, tint = iconTint)
}
```

If `iconTint` already exists, skip this step.

- [ ] **Step 3: Add `onDeleteAccount` to TechnicianHomeScreen**

In `TechnicianHomeScreen.kt`, add `onDeleteAccount: () -> Unit` parameter to both the outer `TechnicianHomeScreen` composable and the inner `ProfileScreen` private composable.

Find the `ProfileScreen` composable (around line 929). Add the parameter:

```kotlin
private fun ProfileScreen(
    authState: AuthState,
    onViewRatings: () -> Unit,
    onPayoutSettings: () -> Unit,
    onLanguageSettings: () -> Unit,
    onEditServices: () -> Unit,
    onSignOut: () -> Unit,
    onDeleteAccount: () -> Unit,   // ← add this
) {
```

Inside `ProfileScreen`, after the sign-out `SettingCard` item, add:

```kotlin
            item {
                Spacer(Modifier.height(16.dp))
                HorizontalDivider()
                Spacer(Modifier.height(8.dp))
                SettingCard(
                    icon = Icons.Default.DeleteForever,
                    title = stringResource(R.string.settings_delete_account_title),
                    subtitle = stringResource(R.string.settings_delete_account_subtitle),
                    iconTint = MaterialTheme.colorScheme.error,
                    onClick = onDeleteAccount,
                )
            }
```

Thread `onDeleteAccount` through the outer `TechnicianHomeScreen` to `ProfileScreen`:

```kotlin
@Composable
internal fun TechnicianHomeScreen(
    // ... existing params ...
    onDeleteAccount: () -> Unit,
    // ...
)
```

And in the `TechTab.Profile` branch:

```kotlin
                TechTab.Profile ->
                    ProfileScreen(
                        authState = authState,
                        onViewRatings = onViewRatings,
                        onPayoutSettings = onPayoutSettings,
                        onLanguageSettings = onLanguageSettings,
                        onEditServices = onEditServices,
                        onSignOut = onSignOut,
                        onDeleteAccount = onDeleteAccount,  // ← add this
                    )
```

Also add `Icons.Default.DeleteForever` to the existing import if not already present. Check the existing import block for `Icons.Default.*` and add `DeleteForever` to the list.

- [ ] **Step 4: Build to verify no compile errors**

```bash
cd technician-app && ./gradlew assembleDebug 2>&1 | grep -E "error:|BUILD" | tail -20
```

Expected: `BUILD SUCCESSFUL`

- [ ] **Step 5: Commit**

```bash
git add technician-app/app/src/main/kotlin/com/homeservices/technician/navigation/ technician-app/app/src/main/kotlin/com/homeservices/technician/ui/home/TechnicianHomeScreen.kt
git commit -m "feat(technician-app): wire delete-account routes into HomeGraph and ProfileScreen (E20-S08)"
```

---

## Task 11: Web form — homeheroo-privacy repo

**Files (in `aloktiwarigit/homeheroo-privacy` repo — NOT this repo):**
- Create: `docs/legal/deletion-request.md`

- [ ] **Step 1: Clone or navigate to the homeheroo-privacy repo**

```bash
# If not already cloned locally:
git clone https://github.com/aloktiwarigit/homeheroo-privacy.git
cd homeheroo-privacy
```

- [ ] **Step 2: Create `docs/legal/deletion-request.md`**

```markdown
# Delete Your HomeHeroo Technician Account

This page explains how to request deletion of your HomeHeroo Technician account and all associated data.

## In-App Deletion (Recommended)

If you have access to the HomeHeroo Technician app:

1. Open the app and go to the **Profile** tab
2. Scroll to the bottom and tap **Delete my account**
3. Review the list of data that will be deleted
4. Tap **Yes, delete my account** to confirm

Your account and data will be permanently deleted within **7 days** of your confirmation.

## Email Deletion Request (For Users Without App Access)

If you no longer have access to the app, send an email to:

**Email:** aloktiwari49@gmail.com  
**Subject:** `Delete my HomeHeroo Technician account`  
**Body:** Please include your registered phone number.

We will process your request within **30 days** and send a confirmation to your registered contact.

## What Gets Deleted

When your account is deleted, the following data is permanently removed or anonymized:

- Your profile and phone number
- KYC documents (Aadhaar, PAN)
- Earnings history and payout records
- Job photos and work history
- Ratings received from customers

Some records may be retained in anonymized form for legal and fraud-prevention purposes as required by applicable law.

## Questions

For any questions about your data, contact us at aloktiwari49@gmail.com.

*Last updated: May 2026*
```

- [ ] **Step 3: Commit and push to homeheroo-privacy**

```bash
git add docs/legal/deletion-request.md
git commit -m "docs: add account deletion request page for technician app (E20-S08)"
git push origin main
```

Expected: GitHub Pages `publish.yml` workflow deploys to `https://aloktiwarigit.github.io/homeheroo-privacy/deletion-request/` within ~2 minutes.

- [ ] **Step 4: Verify the page is live**

Open `https://aloktiwarigit.github.io/homeheroo-privacy/deletion-request/` in a browser and confirm the content renders.

---

## Task 12: Pre-Codex smoke gate

Run both smoke gates before invoking Codex review. Both must exit 0.

- [ ] **Step 1: Run API smoke gate**

```bash
cd api && bash ../tools/pre-codex-smoke-api.sh
```

Expected: All steps pass, exit 0.

- [ ] **Step 2: Run technician-app smoke gate**

```bash
bash tools/pre-codex-smoke.sh technician-app
```

Expected: All 6 steps pass (assembleDebug → ktlintCheck → detekt → lintDebug → testDebugUnitTest → koverVerify), exit 0.

If any step fails, fix the issue before proceeding to Codex review.

- [ ] **Step 3: Invoke Codex review**

```bash
codex review --base main
```

If Codex raises issues, fix in Claude and re-run Codex **once**. After passing, the `.codex-review-passed` marker is written. Then push and open a PR.

- [ ] **Step 4: Push and open PR**

```bash
git push origin fix/s001-pan-plaintext-migration-fallback
gh pr create --title "feat(E20-S08): account deletion — Play Store Lane7-C2 (last CRIT)" --body "$(cat <<'EOF'
## Summary
- Adds in-app account deletion to HomeHeroo Technician app (Play Store mandatory since May 2024)
- API: active-job gate prevents deletion while a booking is in flight
- App: Settings → Delete my account → PII inventory → confirm → terminal screen → sign out
- Web form: https://aloktiwarigit.github.io/homeheroo-privacy/deletion-request/ for uninstalled users
- Erasure pipeline (cron, cascade, schema) pre-built in PR #257; this story adds the UI and the job gate

## Test plan
- [ ] `bash tools/pre-codex-smoke-api.sh` exits 0
- [ ] `bash tools/pre-codex-smoke.sh technician-app` exits 0
- [ ] `codex review --base main` passes (`.codex-review-passed` written)
- [ ] Profile tab → Delete my account entry visible (error-tinted, below sign-out)
- [ ] Tapping while active job shows AlertDialog "Complete your current job first"
- [ ] PII list displays all 5 items in EN and HI
- [ ] Confirm → terminal screen shows scheduled deletion date and revocation hint
- [ ] Done → signs out to auth screen
- [ ] Play Console → Data Safety → deletion URLs filled in after merge

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Post-merge checklist

- [ ] Trigger `paparazzi-record.yml` workflow_dispatch (`gradle_root=technician-app`) to record goldens
- [ ] Play Console → App content → Data Safety → "Does your app allow users to request deletion?" → Yes → add in-app flow description + `https://aloktiwarigit.github.io/homeheroo-privacy/deletion-request/`
- [ ] Verify `https://aloktiwarigit.github.io/homeheroo-privacy/deletion-request/` is live
- [ ] Brief pilot coordinator on email-based deletion path for uninstalled users
