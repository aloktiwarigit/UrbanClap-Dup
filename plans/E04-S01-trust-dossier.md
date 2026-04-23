# E04-S01 Trust Dossier Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a public technician profile API endpoint and a shared TrustDossierCard Compose component (compact + expanded) for customer-app, plus a read-only TrustDossierPanel for admin-web OrderSlideOver.

**Architecture:** New `TechnicianDossierSchema` (separate from operational `TechnicianProfileSchema`); GET endpoint added to `api/src/functions/technicians.ts` reading from Cosmos `technicians` container, stripping PII. Android: clean-arch layers — domain model → Retrofit data layer → stateless `TrustDossierCard(uiState, compact)` composable. Hilt module reuses existing unqualified `Moshi` + `OkHttpClient` singletons from `CatalogueModule`. Admin-web: plain-fetch `'use client'` component alongside `OrderSlideOver`.

**Tech Stack:** Kotlin + Compose + Retrofit/OkHttp/Moshi + Hilt + Paparazzi; Next.js 15 TypeScript; Zod + Azure Functions

---

## Pattern invariants applied throughout

- **Retrofit not Ktor** — codebase uses Retrofit + OkHttp + Moshi despite CLAUDE.md mentioning Ktor.
- **Explicit API mode** — every `public` class/fun/val needs explicit `public` modifier; test classes and `@Test` methods too.
- **Hilt test scope** — JVM unit tests use manual `mockk()` construction; NO `@HiltAndroidTest`.
- **Paparazzi** — new tests `@Ignored`; delete goldens before push; trigger `paparazzi-record.yml` workflow on CI after push.

---

## File Inventory

**Created:**
- `api/src/schemas/technician-dossier.ts`
- `customer-app/.../domain/technician/model/TechnicianReview.kt`
- `customer-app/.../domain/technician/model/TechnicianProfile.kt`
- `customer-app/.../domain/technician/TechnicianProfileRepository.kt`
- `customer-app/.../domain/technician/GetTechnicianProfileUseCase.kt`
- `customer-app/.../data/technician/remote/dto/TechnicianProfileDto.kt`
- `customer-app/.../data/technician/remote/TechnicianProfileApiService.kt`
- `customer-app/.../data/technician/TechnicianProfileRepositoryImpl.kt`
- `customer-app/.../data/technician/di/TechnicianProfileModule.kt`
- `customer-app/.../ui/shared/TrustDossierUiState.kt`
- `customer-app/.../ui/shared/TrustDossierViewModel.kt`
- `customer-app/.../ui/shared/TrustDossierCard.kt`
- `admin-web/src/types/technician-dossier.ts`
- `admin-web/src/components/technicians/TrustDossierPanel.tsx`

**Modified:**
- `api/src/functions/technicians.ts`
- `customer-app/.../ui/catalogue/ServiceDetailScreen.kt`
- `customer-app/.../ui/booking/BookingConfirmedScreen.kt`
- `customer-app/app/src/main/res/values/strings.xml`
- `admin-web/src/components/orders/OrderSlideOver.tsx`

**Test files created:**
- `customer-app/.../domain/technician/GetTechnicianProfileUseCaseTest.kt`
- `customer-app/.../data/technician/TechnicianProfileRepositoryImplTest.kt`
- `customer-app/.../ui/shared/TrustDossierViewModelTest.kt`
- `customer-app/.../ui/shared/TrustDossierCardPaparazziTest.kt`

Base src path: `customer-app/app/src/main/kotlin/com/homeservices/customer/`
Base test path: `customer-app/app/src/test/kotlin/com/homeservices/customer/`

---

## WS-A: API Schema + Endpoint

### Task 1: Create `api/src/schemas/technician-dossier.ts`

**Files:**
- Create: `api/src/schemas/technician-dossier.ts`

- [ ] **Step 1: Create the file**

```typescript
import { z } from 'zod';

export const TechnicianReviewSchema = z.object({
  rating: z.number().min(1).max(5),
  text: z.string(),
  date: z.string().datetime(),
});

export const TechnicianDossierSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  photoUrl: z.string().url().optional(),
  verifiedAadhaar: z.boolean().default(false),
  verifiedPoliceCheck: z.boolean().default(false),
  trainingInstitution: z.string().optional(),
  certifications: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
  yearsInService: z.number().int().min(0).default(0),
  totalJobsCompleted: z.number().int().min(0).default(0),
  lastReviews: z.array(TechnicianReviewSchema).max(3).default([]),
});

export type TechnicianReview = z.infer<typeof TechnicianReviewSchema>;
export type TechnicianDossier = z.infer<typeof TechnicianDossierSchema>;
```

- [ ] **Step 2: Commit**

```bash
git add api/src/schemas/technician-dossier.ts
git commit -m "feat(api): TechnicianDossierSchema for public trust profile"
```

---

### Task 2: Add `GET /v1/technicians/:id/profile` to `api/src/functions/technicians.ts`

**Files:**
- Modify: `api/src/functions/technicians.ts`

The existing file has only the `PATCH fcm-token` handler. Add imports and a new GET handler at the end.

- [ ] **Step 1: Add import for TechnicianDossierSchema at top of `technicians.ts`**

After the existing imports add:
```typescript
import { TechnicianDossierSchema } from '../schemas/technician-dossier.js';
import '../bootstrap.js';
```

- [ ] **Step 2: Append the GET handler and registration after the existing `app.http('patchTechnicianFcmToken', ...)` block**

```typescript
export const getTechnicianProfileHandler: HttpHandler = async (req, _ctx: InvocationContext) => {
  const id = req.params['id'];
  if (!id) return { status: 400, jsonBody: { code: 'MISSING_ID' } };

  const container = getCosmosClient().database(DB_NAME).container('technicians');
  const { resource } = await container.item(id, id).read<Record<string, unknown>>();
  if (!resource) return { status: 404, jsonBody: { code: 'NOT_FOUND' } };

  const parsed = TechnicianDossierSchema.safeParse({ id, ...resource });
  if (!parsed.success) return { status: 404, jsonBody: { code: 'NOT_FOUND' } };

  return {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' },
    jsonBody: parsed.data,
  };
};

app.http('getTechnicianProfile', {
  route: 'v1/technicians/{id}/profile',
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: getTechnicianProfileHandler,
});
```

- [ ] **Step 3: Typecheck the API project**

```bash
cd api && pnpm typecheck 2>&1 | tail -20
```
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add api/src/functions/technicians.ts
git commit -m "feat(api): GET /v1/technicians/:id/profile — public trust dossier endpoint"
```

---

## WS-B: Android Domain Layer (TDD)

### Task 3: Write failing test — `GetTechnicianProfileUseCaseTest.kt`

**Files:**
- Create: `domain/technician/GetTechnicianProfileUseCaseTest.kt` (test path)

- [ ] **Step 1: Write the failing test**

```kotlin
package com.homeservices.customer.domain.technician

import com.google.common.truth.Truth.assertThat
import com.homeservices.customer.domain.technician.model.TechnicianProfile
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import org.junit.Test

public class GetTechnicianProfileUseCaseTest {
    private val repo: TechnicianProfileRepository = mockk()
    private val sut = GetTechnicianProfileUseCase(repo)

    @Test
    public fun `invoke delegates to repository and returns profile`(): Unit =
        runTest {
            val profile = sampleProfile()
            every { repo.getProfile("tech-1") } returns flowOf(Result.success(profile))
            val result = sut("tech-1").first()
            assertThat(result.getOrThrow()).isEqualTo(profile)
            verify(exactly = 1) { repo.getProfile("tech-1") }
        }

    @Test
    public fun `invoke propagates repository failure`(): Unit =
        runTest {
            val error = RuntimeException("network")
            every { repo.getProfile("tech-1") } returns flowOf(Result.failure(error))
            val result = sut("tech-1").first()
            assertThat(result.isFailure).isTrue()
            assertThat(result.exceptionOrNull()).isEqualTo(error)
        }

    private fun sampleProfile() = TechnicianProfile(
        id = "tech-1",
        displayName = "Ramesh Kumar",
        photoUrl = null,
        verifiedAadhaar = true,
        verifiedPoliceCheck = true,
        trainingInstitution = "HomeSkills Academy",
        certifications = listOf("Plumbing L2"),
        languages = listOf("Hindi", "English"),
        yearsInService = 5,
        totalJobsCompleted = 312,
        lastReviews = emptyList(),
    )
}
```

- [ ] **Step 2: Run — confirm it fails (unresolved references)**

```bash
cd customer-app && ./gradlew testDebugUnitTest --tests "*.GetTechnicianProfileUseCaseTest" -q 2>&1 | tail -10
```
Expected: FAILED — unresolved references to `TechnicianProfile`, `TechnicianProfileRepository`, `GetTechnicianProfileUseCase`

- [ ] **Step 3: Commit the red test**

```bash
git add customer-app/app/src/test/kotlin/com/homeservices/customer/domain/technician/
git commit -m "test(customer-app): failing GetTechnicianProfileUseCaseTest (TDD red)"
```

---

### Task 4: Create domain model, repository interface, use case

**Files:**
- Create: `domain/technician/model/TechnicianReview.kt`
- Create: `domain/technician/model/TechnicianProfile.kt`
- Create: `domain/technician/TechnicianProfileRepository.kt`
- Create: `domain/technician/GetTechnicianProfileUseCase.kt`

- [ ] **Step 1: Create `TechnicianReview.kt`**

```kotlin
package com.homeservices.customer.domain.technician.model

public data class TechnicianReview(
    val rating: Float,
    val text: String,
    val date: String,
)
```

- [ ] **Step 2: Create `TechnicianProfile.kt`**

```kotlin
package com.homeservices.customer.domain.technician.model

public data class TechnicianProfile(
    val id: String,
    val displayName: String,
    val photoUrl: String?,
    val verifiedAadhaar: Boolean,
    val verifiedPoliceCheck: Boolean,
    val trainingInstitution: String?,
    val certifications: List<String>,
    val languages: List<String>,
    val yearsInService: Int,
    val totalJobsCompleted: Int,
    val lastReviews: List<TechnicianReview>,
)
```

- [ ] **Step 3: Create `TechnicianProfileRepository.kt`**

```kotlin
package com.homeservices.customer.domain.technician

import com.homeservices.customer.domain.technician.model.TechnicianProfile
import kotlinx.coroutines.flow.Flow

public interface TechnicianProfileRepository {
    public fun getProfile(technicianId: String): Flow<Result<TechnicianProfile>>
}
```

- [ ] **Step 4: Create `GetTechnicianProfileUseCase.kt`**

```kotlin
package com.homeservices.customer.domain.technician

import com.homeservices.customer.domain.technician.model.TechnicianProfile
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

public class GetTechnicianProfileUseCase @Inject constructor(
    private val repository: TechnicianProfileRepository,
) {
    public operator fun invoke(technicianId: String): Flow<Result<TechnicianProfile>> =
        repository.getProfile(technicianId)
}
```

- [ ] **Step 5: Run test — confirm green**

```bash
cd customer-app && ./gradlew testDebugUnitTest --tests "*.GetTechnicianProfileUseCaseTest" -q 2>&1 | tail -10
```
Expected: BUILD SUCCESSFUL — 2 tests passed

- [ ] **Step 6: Commit**

```bash
git add customer-app/app/src/main/kotlin/com/homeservices/customer/domain/technician/
git commit -m "feat(customer-app): TechnicianProfile domain model + repository interface + use case"
```

---

## WS-C: Android Data Layer (TDD — run parallel with WS-D)

### Task 5: Write failing test — `TechnicianProfileRepositoryImplTest.kt`

**Files:**
- Create: `data/technician/TechnicianProfileRepositoryImplTest.kt` (test path)

- [ ] **Step 1: Write the failing test**

```kotlin
package com.homeservices.customer.data.technician

import com.google.common.truth.Truth.assertThat
import com.homeservices.customer.data.technician.remote.TechnicianProfileApiService
import com.homeservices.customer.data.technician.remote.dto.TechnicianProfileDto
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import org.junit.Test
import java.io.IOException

public class TechnicianProfileRepositoryImplTest {
    private val api: TechnicianProfileApiService = mockk()
    private val sut = TechnicianProfileRepositoryImpl(api)

    @Test
    public fun `getProfile maps DTO to domain model on success`(): Unit =
        runTest {
            coEvery { api.getProfile("tech-1") } returns sampleDto()
            val result = sut.getProfile("tech-1").first()
            assertThat(result.isSuccess).isTrue()
            val profile = result.getOrThrow()
            assertThat(profile.id).isEqualTo("tech-1")
            assertThat(profile.displayName).isEqualTo("Ramesh Kumar")
            assertThat(profile.verifiedAadhaar).isTrue()
            assertThat(profile.certifications).containsExactly("Plumbing L2")
        }

    @Test
    public fun `getProfile emits failure on network exception`(): Unit =
        runTest {
            coEvery { api.getProfile("tech-1") } throws IOException("timeout")
            val result = sut.getProfile("tech-1").first()
            assertThat(result.isFailure).isTrue()
        }

    private fun sampleDto() = TechnicianProfileDto(
        id = "tech-1",
        displayName = "Ramesh Kumar",
        photoUrl = null,
        verifiedAadhaar = true,
        verifiedPoliceCheck = false,
        trainingInstitution = null,
        certifications = listOf("Plumbing L2"),
        languages = listOf("Hindi"),
        yearsInService = 3,
        totalJobsCompleted = 100,
        lastReviews = emptyList(),
    )
}
```

- [ ] **Step 2: Run — confirm it fails**

```bash
cd customer-app && ./gradlew testDebugUnitTest --tests "*.TechnicianProfileRepositoryImplTest" -q 2>&1 | tail -10
```
Expected: FAILED — unresolved references

- [ ] **Step 3: Commit the red test**

```bash
git add customer-app/app/src/test/kotlin/com/homeservices/customer/data/technician/
git commit -m "test(customer-app): failing TechnicianProfileRepositoryImplTest (TDD red)"
```

---

### Task 6: Create data layer — DTO, ApiService, RepositoryImpl, Hilt Module

**Files:**
- Create: `data/technician/remote/dto/TechnicianProfileDto.kt`
- Create: `data/technician/remote/TechnicianProfileApiService.kt`
- Create: `data/technician/TechnicianProfileRepositoryImpl.kt`
- Create: `data/technician/di/TechnicianProfileModule.kt`

- [ ] **Step 1: Create `TechnicianProfileDto.kt`**

```kotlin
package com.homeservices.customer.data.technician.remote.dto

import com.homeservices.customer.domain.technician.model.TechnicianProfile
import com.homeservices.customer.domain.technician.model.TechnicianReview
import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
public data class TechnicianReviewDto(
    @Json(name = "rating") val rating: Float,
    @Json(name = "text") val text: String,
    @Json(name = "date") val date: String,
)

@JsonClass(generateAdapter = true)
public data class TechnicianProfileDto(
    @Json(name = "id") val id: String,
    @Json(name = "displayName") val displayName: String,
    @Json(name = "photoUrl") val photoUrl: String?,
    @Json(name = "verifiedAadhaar") val verifiedAadhaar: Boolean,
    @Json(name = "verifiedPoliceCheck") val verifiedPoliceCheck: Boolean,
    @Json(name = "trainingInstitution") val trainingInstitution: String?,
    @Json(name = "certifications") val certifications: List<String>,
    @Json(name = "languages") val languages: List<String>,
    @Json(name = "yearsInService") val yearsInService: Int,
    @Json(name = "totalJobsCompleted") val totalJobsCompleted: Int,
    @Json(name = "lastReviews") val lastReviews: List<TechnicianReviewDto>,
)

public fun TechnicianProfileDto.toDomain(): TechnicianProfile = TechnicianProfile(
    id = id,
    displayName = displayName,
    photoUrl = photoUrl,
    verifiedAadhaar = verifiedAadhaar,
    verifiedPoliceCheck = verifiedPoliceCheck,
    trainingInstitution = trainingInstitution,
    certifications = certifications,
    languages = languages,
    yearsInService = yearsInService,
    totalJobsCompleted = totalJobsCompleted,
    lastReviews = lastReviews.map { TechnicianReview(it.rating, it.text, it.date) },
)
```

- [ ] **Step 2: Create `TechnicianProfileApiService.kt`**

```kotlin
package com.homeservices.customer.data.technician.remote

import com.homeservices.customer.data.technician.remote.dto.TechnicianProfileDto
import retrofit2.http.GET
import retrofit2.http.Path

public interface TechnicianProfileApiService {
    @GET("v1/technicians/{id}/profile")
    public suspend fun getProfile(
        @Path("id") id: String,
    ): TechnicianProfileDto
}
```

- [ ] **Step 3: Create `TechnicianProfileRepositoryImpl.kt`**

```kotlin
package com.homeservices.customer.data.technician

import com.homeservices.customer.data.technician.remote.TechnicianProfileApiService
import com.homeservices.customer.data.technician.remote.dto.toDomain
import com.homeservices.customer.domain.technician.TechnicianProfileRepository
import com.homeservices.customer.domain.technician.model.TechnicianProfile
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject

internal class TechnicianProfileRepositoryImpl @Inject constructor(
    private val api: TechnicianProfileApiService,
) : TechnicianProfileRepository {
    override fun getProfile(technicianId: String): Flow<Result<TechnicianProfile>> =
        flow {
            emit(runCatching { api.getProfile(technicianId).toDomain() })
        }
}
```

- [ ] **Step 4: Create `TechnicianProfileModule.kt`**

Reuses `Moshi` and `OkHttpClient` `@Singleton` bindings provided by `CatalogueModule` — do NOT re-declare them.

```kotlin
package com.homeservices.customer.data.technician.di

import com.homeservices.customer.BuildConfig
import com.homeservices.customer.data.technician.TechnicianProfileRepositoryImpl
import com.homeservices.customer.data.technician.remote.TechnicianProfileApiService
import com.homeservices.customer.domain.technician.TechnicianProfileRepository
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
public abstract class TechnicianProfileModule {
    @Binds
    internal abstract fun bindTechnicianProfileRepository(
        impl: TechnicianProfileRepositoryImpl,
    ): TechnicianProfileRepository

    public companion object {
        @Provides
        @Singleton
        public fun provideTechnicianProfileApiService(
            moshi: Moshi,
            client: OkHttpClient,
        ): TechnicianProfileApiService =
            Retrofit
                .Builder()
                .baseUrl(BuildConfig.API_BASE_URL + "/")
                .addConverterFactory(MoshiConverterFactory.create(moshi))
                .client(client)
                .build()
                .create(TechnicianProfileApiService::class.java)
    }
}
```

- [ ] **Step 5: Run repository test — confirm green**

```bash
cd customer-app && ./gradlew testDebugUnitTest --tests "*.TechnicianProfileRepositoryImplTest" -q 2>&1 | tail -10
```
Expected: BUILD SUCCESSFUL — 2 tests passed

- [ ] **Step 6: Verify Hilt wiring compiles**

```bash
cd customer-app && ./gradlew assembleDebug -q 2>&1 | tail -20
```
Expected: BUILD SUCCESSFUL

- [ ] **Step 7: Commit**

```bash
git add customer-app/app/src/main/kotlin/com/homeservices/customer/data/technician/
git commit -m "feat(customer-app): TechnicianProfile data layer — DTO, Retrofit service, Hilt module"
```

---

## WS-D: UI + Admin-web (run parallel with WS-C)

### Task 7: String resources

**Files:**
- Modify: `customer-app/app/src/main/res/values/strings.xml`

- [ ] **Step 1: Append trust dossier strings inside `<resources>`**

After the existing `<string name="trust_dossier_stub">` entry add:

```xml
    <string name="trust_dossier_badge_aadhaar">Aadhaar Verified</string>
    <string name="trust_dossier_badge_police">Background Checked</string>
    <string name="trust_dossier_promise">All our technicians are Aadhaar-verified and background-checked.</string>
    <string name="trust_dossier_assigning">Your technician will be assigned shortly.</string>
    <string name="trust_dossier_jobs">%d jobs</string>
    <string name="trust_dossier_years">%d yr exp</string>
    <string name="trust_dossier_certifications_label">Certifications</string>
    <string name="trust_dossier_languages_label">Languages</string>
    <string name="trust_dossier_reviews_label">Recent Reviews</string>
    <string name="trust_dossier_loading">Loading technician profile…</string>
    <string name="trust_dossier_error">Could not load technician profile.</string>
    <string name="trust_dossier_trained_by">Trained by %s</string>
```

- [ ] **Step 2: Commit**

```bash
git add customer-app/app/src/main/res/values/strings.xml
git commit -m "feat(customer-app): trust dossier string resources"
```

---

### Task 8: Write failing tests — ViewModel + Paparazzi

**Files:**
- Create: `ui/shared/TrustDossierViewModelTest.kt` (test path)
- Create: `ui/shared/TrustDossierCardPaparazziTest.kt` (test path)

- [ ] **Step 1: Create `TrustDossierViewModelTest.kt`**

```kotlin
package com.homeservices.customer.ui.shared

import com.google.common.truth.Truth.assertThat
import com.homeservices.customer.domain.technician.GetTechnicianProfileUseCase
import com.homeservices.customer.domain.technician.model.TechnicianProfile
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.runTest
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
public class TrustDossierViewModelTest {
    private val useCase: GetTechnicianProfileUseCase = mockk()
    private val vm = TrustDossierViewModel(useCase)

    @Test
    public fun `initial state is Unavailable`(): Unit =
        runTest {
            assertThat(vm.uiState.value).isEqualTo(TrustDossierUiState.Unavailable)
        }

    @Test
    public fun `loadProfile emits Loaded on success`(): Unit =
        runTest(UnconfinedTestDispatcher()) {
            val profile = sampleProfile()
            every { useCase("tech-1") } returns flowOf(Result.success(profile))
            vm.loadProfile("tech-1")
            assertThat(vm.uiState.value).isEqualTo(TrustDossierUiState.Loaded(profile))
        }

    @Test
    public fun `loadProfile emits Error on failure`(): Unit =
        runTest(UnconfinedTestDispatcher()) {
            every { useCase("tech-1") } returns flowOf(Result.failure(RuntimeException("fail")))
            vm.loadProfile("tech-1")
            assertThat(vm.uiState.value).isInstanceOf(TrustDossierUiState.Error::class.java)
        }

    private fun sampleProfile() = TechnicianProfile(
        id = "tech-1",
        displayName = "Ramesh Kumar",
        photoUrl = null,
        verifiedAadhaar = true,
        verifiedPoliceCheck = true,
        trainingInstitution = "HomeSkills Academy",
        certifications = listOf("Plumbing L2"),
        languages = listOf("Hindi", "English"),
        yearsInService = 5,
        totalJobsCompleted = 312,
        lastReviews = emptyList(),
    )
}
```

- [ ] **Step 2: Create `TrustDossierCardPaparazziTest.kt`**

```kotlin
package com.homeservices.customer.ui.shared

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.customer.domain.technician.model.TechnicianProfile
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Ignore
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4

@RunWith(JUnit4::class)
public class TrustDossierCardPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi = Paparazzi(
        deviceConfig = DeviceConfig.PIXEL_5,
        theme = "android:Theme.Material3.DayNight.NoActionBar",
    )

    @Ignore("Record goldens on CI only — see docs/patterns/paparazzi-cross-os-goldens.md")
    @Test
    public fun compact_unavailable(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                TrustDossierCard(uiState = TrustDossierUiState.Unavailable, compact = true)
            }
        }
    }

    @Ignore("Record goldens on CI only — see docs/patterns/paparazzi-cross-os-goldens.md")
    @Test
    public fun expanded_unavailable(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                TrustDossierCard(uiState = TrustDossierUiState.Unavailable, compact = false)
            }
        }
    }

    @Ignore("Record goldens on CI only — see docs/patterns/paparazzi-cross-os-goldens.md")
    @Test
    public fun compact_loaded(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                TrustDossierCard(uiState = TrustDossierUiState.Loaded(sampleProfile()), compact = true)
            }
        }
    }

    @Ignore("Record goldens on CI only — see docs/patterns/paparazzi-cross-os-goldens.md")
    @Test
    public fun expanded_loaded(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                TrustDossierCard(uiState = TrustDossierUiState.Loaded(sampleProfile()), compact = false)
            }
        }
    }

    private fun sampleProfile() = TechnicianProfile(
        id = "tech-1",
        displayName = "Ramesh Kumar",
        photoUrl = null,
        verifiedAadhaar = true,
        verifiedPoliceCheck = true,
        trainingInstitution = "HomeSkills Academy",
        certifications = listOf("Plumbing L2", "Electrical Safety"),
        languages = listOf("Hindi", "English"),
        yearsInService = 5,
        totalJobsCompleted = 312,
        lastReviews = emptyList(),
    )
}
```

- [ ] **Step 3: Run ViewModel test — confirm it fails (unresolved)**

```bash
cd customer-app && ./gradlew testDebugUnitTest --tests "*.TrustDossierViewModelTest" -q 2>&1 | tail -10
```
Expected: FAILED — unresolved references to `TrustDossierViewModel`, `TrustDossierUiState`

- [ ] **Step 4: Commit red tests**

```bash
git add customer-app/app/src/test/kotlin/com/homeservices/customer/ui/shared/
git commit -m "test(customer-app): failing TrustDossierViewModelTest + Paparazzi stubs (TDD red)"
```

---

### Task 9: Create TrustDossierUiState, TrustDossierViewModel, TrustDossierCard

**Files:**
- Create: `ui/shared/TrustDossierUiState.kt`
- Create: `ui/shared/TrustDossierViewModel.kt`
- Create: `ui/shared/TrustDossierCard.kt`

- [ ] **Step 1: Create `TrustDossierUiState.kt`**

```kotlin
package com.homeservices.customer.ui.shared

import com.homeservices.customer.domain.technician.model.TechnicianProfile

public sealed class TrustDossierUiState {
    public object Loading : TrustDossierUiState()
    public data class Loaded(val profile: TechnicianProfile) : TrustDossierUiState()
    public data class Error(val message: String) : TrustDossierUiState()
    public object Unavailable : TrustDossierUiState()
}
```

- [ ] **Step 2: Create `TrustDossierViewModel.kt`**

```kotlin
package com.homeservices.customer.ui.shared

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.customer.domain.technician.GetTechnicianProfileUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
internal class TrustDossierViewModel @Inject constructor(
    private val getProfile: GetTechnicianProfileUseCase,
) : ViewModel() {
    private val _uiState = MutableStateFlow<TrustDossierUiState>(TrustDossierUiState.Unavailable)
    public val uiState: StateFlow<TrustDossierUiState> = _uiState.asStateFlow()

    public fun loadProfile(technicianId: String) {
        viewModelScope.launch {
            _uiState.value = TrustDossierUiState.Loading
            getProfile(technicianId).collect { result ->
                _uiState.value = result.fold(
                    onSuccess = { TrustDossierUiState.Loaded(it) },
                    onFailure = { TrustDossierUiState.Error(it.message ?: "Unknown error") },
                )
            }
        }
    }
}
```

- [ ] **Step 3: Create `TrustDossierCard.kt`**

```kotlin
package com.homeservices.customer.ui.shared

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.homeservices.customer.R
import com.homeservices.customer.domain.technician.model.TechnicianProfile

@Composable
public fun TrustDossierCard(
    uiState: TrustDossierUiState,
    compact: Boolean,
    modifier: Modifier = Modifier,
) {
    Card(modifier = modifier.fillMaxWidth()) {
        when (uiState) {
            is TrustDossierUiState.Loading -> LoadingContent()
            is TrustDossierUiState.Error -> ErrorContent()
            is TrustDossierUiState.Unavailable -> UnavailableContent(compact)
            is TrustDossierUiState.Loaded ->
                if (compact) CompactContent(uiState.profile) else ExpandedContent(uiState.profile)
        }
    }
}

@Composable
private fun LoadingContent() {
    Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
        CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
        Spacer(Modifier.width(8.dp))
        Text(stringResource(R.string.trust_dossier_loading), style = MaterialTheme.typography.bodyMedium)
    }
}

@Composable
private fun ErrorContent() {
    Text(
        text = stringResource(R.string.trust_dossier_error),
        style = MaterialTheme.typography.bodySmall,
        color = MaterialTheme.colorScheme.error,
        modifier = Modifier.padding(12.dp),
    )
}

@Composable
private fun UnavailableContent(compact: Boolean) {
    Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
        Icon(
            imageVector = Icons.Default.Lock,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.primary,
            modifier = Modifier.size(20.dp),
        )
        Spacer(Modifier.width(8.dp))
        Column {
            Text(
                text = if (compact) stringResource(R.string.trust_dossier_stub)
                       else stringResource(R.string.trust_dossier_assigning),
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Medium,
            )
            if (!compact) {
                Text(
                    text = stringResource(R.string.trust_dossier_promise),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
}

@Composable
private fun CompactContent(profile: TechnicianProfile) {
    Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
        AsyncImage(
            model = profile.photoUrl,
            contentDescription = profile.displayName,
            contentScale = ContentScale.Crop,
            modifier = Modifier.size(40.dp).clip(CircleShape),
        )
        Spacer(Modifier.width(10.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(profile.displayName, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                if (profile.verifiedAadhaar) BadgeChip(stringResource(R.string.trust_dossier_badge_aadhaar))
                if (profile.verifiedPoliceCheck) BadgeChip(stringResource(R.string.trust_dossier_badge_police))
            }
        }
    }
}

@Composable
private fun ExpandedContent(profile: TechnicianProfile) {
    Column(modifier = Modifier.padding(12.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            AsyncImage(
                model = profile.photoUrl,
                contentDescription = profile.displayName,
                contentScale = ContentScale.Crop,
                modifier = Modifier.size(64.dp).clip(CircleShape),
            )
            Spacer(Modifier.width(12.dp))
            Column {
                Text(profile.displayName, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                Text(
                    text = "${stringResource(R.string.trust_dossier_jobs, profile.totalJobsCompleted)} · ${stringResource(R.string.trust_dossier_years, profile.yearsInService)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
        Spacer(Modifier.height(10.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            if (profile.verifiedAadhaar) BadgeChip(stringResource(R.string.trust_dossier_badge_aadhaar))
            if (profile.verifiedPoliceCheck) BadgeChip(stringResource(R.string.trust_dossier_badge_police))
            profile.trainingInstitution?.let { BadgeChip(stringResource(R.string.trust_dossier_trained_by, it)) }
        }
        if (profile.certifications.isNotEmpty()) {
            Spacer(Modifier.height(8.dp))
            Text(stringResource(R.string.trust_dossier_certifications_label), style = MaterialTheme.typography.labelSmall)
            profile.certifications.forEach { Text("• $it", style = MaterialTheme.typography.bodySmall) }
        }
        if (profile.languages.isNotEmpty()) {
            Spacer(Modifier.height(6.dp))
            Text(stringResource(R.string.trust_dossier_languages_label), style = MaterialTheme.typography.labelSmall)
            Text(profile.languages.joinToString(", "), style = MaterialTheme.typography.bodySmall)
        }
        if (profile.lastReviews.isNotEmpty()) {
            Spacer(Modifier.height(8.dp))
            Text(stringResource(R.string.trust_dossier_reviews_label), style = MaterialTheme.typography.labelSmall)
            profile.lastReviews.forEach { review ->
                Column(modifier = Modifier.padding(vertical = 4.dp)) {
                    Text("★".repeat(review.rating.toInt()), style = MaterialTheme.typography.bodySmall)
                    Text(review.text, style = MaterialTheme.typography.bodySmall)
                    Text(
                        review.date.take(10),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }
    }
}

@Composable
private fun BadgeChip(label: String) {
    Text(text = "✓ $label", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
}
```

- [ ] **Step 4: Run ViewModel test — confirm green**

```bash
cd customer-app && ./gradlew testDebugUnitTest --tests "*.TrustDossierViewModelTest" -q 2>&1 | tail -10
```
Expected: BUILD SUCCESSFUL — 3 tests passed

- [ ] **Step 5: Confirm assembleDebug succeeds**

```bash
cd customer-app && ./gradlew assembleDebug -q 2>&1 | tail -20
```
Expected: BUILD SUCCESSFUL

- [ ] **Step 6: Commit**

```bash
git add customer-app/app/src/main/kotlin/com/homeservices/customer/ui/shared/
git commit -m "feat(customer-app): TrustDossierCard + ViewModel + UiState (compact + expanded)"
```

---

### Task 10: Wire compact TrustDossierCard into ServiceDetailScreen

**Files:**
- Modify: `ui/catalogue/ServiceDetailScreen.kt`

The `ServiceDetailBody` composable has a stub `Card` block (around line 164) showing a Lock icon and `trust_dossier_stub` text. Replace it entirely.

- [ ] **Step 1: Add imports to `ServiceDetailScreen.kt`**

Add after existing imports:
```kotlin
import com.homeservices.customer.ui.shared.TrustDossierCard
import com.homeservices.customer.ui.shared.TrustDossierUiState
```

Remove the now-unused import:
```kotlin
import androidx.compose.material.icons.filled.Lock
```

- [ ] **Step 2: Replace the stub Card block in `ServiceDetailBody`**

Find and replace the entire `Card(modifier = Modifier.fillMaxWidth()) { Row(...) { Icon(Lock ...) Text(trust_dossier_stub ...) } }` block with:

```kotlin
            TrustDossierCard(
                uiState = TrustDossierUiState.Unavailable,
                compact = true,
                modifier = Modifier.fillMaxWidth(),
            )
```

- [ ] **Step 3: Confirm assembleDebug and existing tests pass**

```bash
cd customer-app && ./gradlew assembleDebug testDebugUnitTest -q 2>&1 | tail -20
```
Expected: BUILD SUCCESSFUL

- [ ] **Step 4: Commit**

```bash
git add customer-app/app/src/main/kotlin/com/homeservices/customer/ui/catalogue/ServiceDetailScreen.kt
git commit -m "feat(customer-app): replace trust dossier stub with TrustDossierCard on ServiceDetailScreen"
```

---

### Task 11: Wire expanded TrustDossierCard into BookingConfirmedScreen

**Files:**
- Modify: `ui/booking/BookingConfirmedScreen.kt`
- Modify: `ui/booking/BookingConfirmedScreenPaparazziTest.kt` (mark stale goldens)

- [ ] **Step 1: Add imports to `BookingConfirmedScreen.kt`**

```kotlin
import com.homeservices.customer.ui.shared.TrustDossierCard
import com.homeservices.customer.ui.shared.TrustDossierUiState
```

- [ ] **Step 2: Insert TrustDossierCard before the Button in `BookingConfirmedScreen`**

In the Column body, between `Spacer(Modifier.height(40.dp))` and `Button(onClick = onBackToHome, ...)`, replace that spacer with:

```kotlin
        TrustDossierCard(
            uiState = TrustDossierUiState.Unavailable,
            compact = false,
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(24.dp))
```

- [ ] **Step 3: Mark stale Paparazzi goldens in `BookingConfirmedScreenPaparazziTest.kt`**

Both tests need `@Ignore` because the screen layout changed and existing goldens are stale:

```kotlin
import org.junit.Ignore

    @Ignore("Layout changed — delete golden, re-record on CI after E04-S01 push")
    @Test
    public fun bookingConfirmed_lightTheme() { ... }

    @Ignore("Layout changed — delete golden, re-record on CI after E04-S01 push")
    @Test
    public fun bookingConfirmed_darkTheme() { ... }
```

- [ ] **Step 4: Delete any local goldens for BookingConfirmedScreen**

```bash
git rm -r customer-app/src/test/snapshots/images/ 2>/dev/null || true
git status
```

- [ ] **Step 5: Confirm assembleDebug succeeds**

```bash
cd customer-app && ./gradlew assembleDebug -q 2>&1 | tail -20
```
Expected: BUILD SUCCESSFUL

- [ ] **Step 6: Commit**

```bash
git add customer-app/app/src/main/kotlin/com/homeservices/customer/ui/booking/BookingConfirmedScreen.kt
git add customer-app/app/src/test/kotlin/com/homeservices/customer/ui/booking/BookingConfirmedScreenPaparazziTest.kt
git commit -m "feat(customer-app): expanded TrustDossierCard on BookingConfirmedScreen; mark stale Paparazzi test"
```

---

### Task 12: Admin-web types + TrustDossierPanel

**Files:**
- Create: `admin-web/src/types/technician-dossier.ts`
- Create: `admin-web/src/components/technicians/TrustDossierPanel.tsx`

- [ ] **Step 1: Create `admin-web/src/types/technician-dossier.ts`**

```typescript
export interface TechnicianReview {
  rating: number;
  text: string;
  date: string;
}

export interface TechnicianDossier {
  id: string;
  displayName: string;
  photoUrl?: string;
  verifiedAadhaar: boolean;
  verifiedPoliceCheck: boolean;
  trainingInstitution?: string;
  certifications: string[];
  languages: string[];
  yearsInService: number;
  totalJobsCompleted: number;
  lastReviews: TechnicianReview[];
}
```

- [ ] **Step 2: Create `admin-web/src/components/technicians/TrustDossierPanel.tsx`**

```tsx
'use client';
import { useEffect, useState } from 'react';
import type { TechnicianDossier } from '@/types/technician-dossier';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

interface TrustDossierPanelProps {
  technicianId: string | undefined;
}

export function TrustDossierPanel({ technicianId }: TrustDossierPanelProps) {
  const [open, setOpen] = useState(false);
  const [dossier, setDossier] = useState<TechnicianDossier | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!technicianId || !open) return;
    setLoading(true);
    setError(null);
    fetch(`${BASE}/api/v1/technicians/${technicianId}/profile`)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json() as Promise<TechnicianDossier>;
      })
      .then(setDossier)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [technicianId, open]);

  if (!technicianId) return null;

  return (
    <section>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-xs text-gray-500 font-medium mt-1 hover:text-gray-700"
        aria-expanded={open}
      >
        <span>{open ? '▾' : '▸'}</span>
        <span>Trust Profile</span>
      </button>
      {open && (
        <div className="mt-2 rounded border border-gray-100 bg-gray-50 p-3 text-xs space-y-1">
          {loading && <p className="text-gray-400">Loading…</p>}
          {error && <p className="text-red-500">Could not load: {error}</p>}
          {dossier && (
            <>
              <p className="font-semibold">{dossier.displayName}</p>
              <p className="text-gray-500">
                {dossier.totalJobsCompleted} jobs · {dossier.yearsInService} yr exp
              </p>
              <div className="flex gap-2 flex-wrap">
                {dossier.verifiedAadhaar && <Badge label="✓ Aadhaar" />}
                {dossier.verifiedPoliceCheck && <Badge label="✓ Background Check" />}
                {dossier.trainingInstitution && (
                  <Badge label={`✓ Trained: ${dossier.trainingInstitution}`} />
                )}
              </div>
              {dossier.certifications.length > 0 && (
                <p>Certifications: {dossier.certifications.join(', ')}</p>
              )}
              {dossier.languages.length > 0 && (
                <p>Languages: {dossier.languages.join(', ')}</p>
              )}
              {dossier.lastReviews.length > 0 && (
                <div>
                  <p className="font-medium mt-1">Recent Reviews</p>
                  {dossier.lastReviews.map((r, i) => (
                    <div key={i} className="mt-1">
                      <span>{'★'.repeat(Math.round(r.rating))}</span>
                      <span className="text-gray-700 ml-1">{r.text}</span>
                      <span className="text-gray-400 ml-1">{r.date.slice(0, 10)}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="rounded bg-green-50 text-green-700 px-1.5 py-0.5 text-xs font-medium">
      {label}
    </span>
  );
}
```

- [ ] **Step 3: Typecheck admin-web**

```bash
cd admin-web && pnpm typecheck 2>&1 | tail -20
```
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add admin-web/src/types/technician-dossier.ts admin-web/src/components/technicians/
git commit -m "feat(admin-web): TechnicianDossier types + TrustDossierPanel collapsible component"
```

---

### Task 13: Wire TrustDossierPanel into OrderSlideOver

**Files:**
- Modify: `admin-web/src/components/orders/OrderSlideOver.tsx`

- [ ] **Step 1: Add import at top of `OrderSlideOver.tsx`**

```tsx
import { TrustDossierPanel } from '@/components/technicians/TrustDossierPanel';
```

- [ ] **Step 2: Replace the Technician section (line ~35) to append TrustDossierPanel**

Find:
```tsx
          <section><h3 className="text-xs text-gray-500 font-medium mb-1">Technician</h3><p>{currentOrder.technicianName ?? '—'}</p><p className="text-gray-500 font-mono text-xs">{currentOrder.technicianId ?? '—'}</p></section>
```

Replace with:
```tsx
          <section>
            <h3 className="text-xs text-gray-500 font-medium mb-1">Technician</h3>
            <p>{currentOrder.technicianName ?? '—'}</p>
            <p className="text-gray-500 font-mono text-xs">{currentOrder.technicianId ?? '—'}</p>
            <TrustDossierPanel technicianId={currentOrder.technicianId} />
          </section>
```

- [ ] **Step 3: Typecheck**

```bash
cd admin-web && pnpm typecheck 2>&1 | tail -20
```
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add admin-web/src/components/orders/OrderSlideOver.tsx
git commit -m "feat(admin-web): wire TrustDossierPanel into OrderSlideOver technician section"
```

---

## WS-E: Smoke Gate + Review

### Task 14: ktlintFormat + smoke gates

- [ ] **Step 1: Run ktlintFormat**

```bash
cd customer-app && ./gradlew ktlintFormat -q 2>&1 | tail -10
```
Expected: BUILD SUCCESSFUL (auto-fixes applied)

- [ ] **Step 2: Stage any ktlint-fixed files and commit if needed**

```bash
git add customer-app/app/src/main/kotlin/ customer-app/app/src/test/kotlin/
git diff --cached --stat
git commit -m "style(customer-app): ktlintFormat pass for E04-S01" 2>/dev/null || echo "Nothing to commit"
```

- [ ] **Step 3: Run customer-app smoke gate**

```bash
bash tools/pre-codex-smoke.sh customer-app
```
Expected: `=== Smoke gate PASSED ===`

- [ ] **Step 4: Run admin-web smoke gate**

```bash
bash tools/pre-codex-smoke-web.sh
```
Expected: `=== Web smoke gate PASSED ===`

---

### Task 15: Pre-push cleanup + Codex review + PR

- [ ] **Step 1: Delete any local Paparazzi PNGs (never commit Windows goldens)**

```bash
git rm -r customer-app/src/test/snapshots/images/ 2>/dev/null || true
git status
```

- [ ] **Step 2: Run full unit test suite — confirm all green**

```bash
cd customer-app && ./gradlew testDebugUnitTest -q 2>&1 | tail -20
```
Expected: BUILD SUCCESSFUL (Paparazzi tests are @Ignored; all others pass)

- [ ] **Step 3: Run Codex review**

```bash
codex review --base main
```
Address any P1/P2 findings. Confirm resolved before proceeding.

- [ ] **Step 4: Create `.codex-review-passed` marker**

```bash
touch .codex-review-passed
git add .codex-review-passed
git commit -m "chore: Codex review passed for E04-S01"
```

- [ ] **Step 5: Push**

```bash
git push -u origin feature/E04-S01-trust-dossier
```

- [ ] **Step 6: Open PR**

```bash
gh pr create \
  --title "feat(E04-S01): Trust Dossier — technician profile card for customer-app + admin-web" \
  --body "$(cat <<'EOF'
## Summary
- New public API endpoint `GET /v1/technicians/:id/profile` with `TechnicianDossierSchema` (Zod, strips PII)
- Android clean-arch layers: `TechnicianProfile` domain model → Retrofit data layer → `TrustDossierCard` composable (compact + expanded variants)
- Compact card replaces stub on `ServiceDetailScreen`; expanded card added to `BookingConfirmedScreen`
- Admin-web: collapsible `TrustDossierPanel` wired into `OrderSlideOver` technician section

## Test plan
- [ ] All customer-app unit tests green (`testDebugUnitTest`)
- [ ] admin-web typecheck + lint pass
- [ ] Trigger `paparazzi-record.yml` workflow on CI for `feature/E04-S01-trust-dossier` branch; pull golden commit
- [ ] CI green before merge

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 7: Trigger Paparazzi record workflow**

On GitHub → Actions → `paparazzi-record.yml` → Run workflow → select branch `feature/E04-S01-trust-dossier`. Pull the golden commit after it completes.

---

## Self-Review

### Spec coverage

| Requirement | Task |
|---|---|
| `TechnicianDossierSchema` with all PRD fields | Task 1 |
| `GET /v1/technicians/:id/profile` — public, no PII | Task 2 |
| `TechnicianProfile` domain model + `TechnicianReview` | Task 4 |
| `TechnicianProfileRepository` interface | Task 4 |
| `GetTechnicianProfileUseCase` | Task 4 |
| TDD test for use case (red → green) | Tasks 3 → 4 |
| Retrofit `TechnicianProfileApiService` | Task 6 |
| `TechnicianProfileDto` with `toDomain()` | Task 6 |
| `TechnicianProfileRepositoryImpl` | Task 6 |
| Hilt module reusing CatalogueModule's Moshi+OkHttp | Task 6 |
| TDD test for repository (red → green) | Tasks 5 → 6 |
| `TrustDossierUiState` sealed class | Task 9 |
| `TrustDossierViewModel.loadProfile()` | Task 9 |
| ViewModel unit test | Task 8 |
| `TrustDossierCard` compact variant | Task 9 |
| `TrustDossierCard` expanded variant | Task 9 |
| Paparazzi tests — all `@Ignored` | Task 8 |
| Wire compact card into ServiceDetailScreen | Task 10 |
| Wire expanded card into BookingConfirmedScreen | Task 11 |
| Stale BookingConfirmedScreen Paparazzi test marked @Ignored | Task 11 |
| `admin-web/src/types/technician-dossier.ts` | Task 12 |
| `TrustDossierPanel` (collapsible, lazy-fetch) | Task 12 |
| Wire into `OrderSlideOver` | Task 13 |
| ktlint pass | Task 14 |
| Customer-app + admin-web smoke gates | Task 14 |
| Codex review | Task 15 |
| Delete PNGs before push | Task 15 |
| CI Paparazzi record workflow dispatch | Task 15 |

### Placeholder scan

No TBD, TODO, or "implement later" content anywhere in this plan.

### Type consistency

- `TechnicianReview` (domain) ← `TechnicianReviewDto.toDomain()` mapping in Task 6 — field names match (`rating: Float`, `text: String`, `date: String`).
- `TrustDossierUiState.Loaded(profile: TechnicianProfile)` used in ViewModel test (Task 8) matches `TrustDossierUiState` sealed class created in Task 9.
- `TrustDossierCard(uiState, compact)` signature in Paparazzi test (Task 8) matches Task 9 implementation.
- `TechnicianProfileModule` injects `Moshi` and `OkHttpClient` without qualifiers — these match the unqualified `@Singleton` bindings in `CatalogueModule`.
- `BadgeChip` is `private` in `TrustDossierCard.kt` — not referenced from outside.
- `TrustDossierViewModel` is `internal` — consistent with other ViewModels in the project.
- `GetTechnicianProfileUseCase` is `public` — consistent with other use cases (`GetServiceDetailUseCase`).
