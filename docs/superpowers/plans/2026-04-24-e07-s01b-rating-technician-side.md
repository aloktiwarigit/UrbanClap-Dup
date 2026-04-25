# E07-S01b Rating Flow (Technician side) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the technician-app side of the mutual rating flow: consume the existing `RATING_PROMPT_TECHNICIAN` FCM (already fired by S01a's server-side trigger), let the technician submit a rating with 2 sub-scores against the existing `POST /v1/ratings` endpoint, and once both sides have submitted let `GET /v1/ratings/{bookingId}` reveal both ratings end-to-end for the first time.

**Architecture:** Mirror of S01a's customer-side architecture in the `technician-app` package. Sub-scores differ (`behaviour + communication` vs customer's `punctuality + skill + behaviour`). Server-side endpoints + FCM trigger + reveal logic already shipped in S01a — this story is purely the tech-app consumer + new `TechnicianFirebaseMessagingService` (the **first** FCM service in this app).

**Tech Stack:** Kotlin + Compose + Hilt + Retrofit + Moshi + JUnit 5 + MockK + Paparazzi

**Story file:** `docs/stories/E07-S01b-rating-technician-side.md`

**Reference (canonical patterns shipped in S01a):**
- `customer-app/.../data/rating/*` — repo, EventBus, Retrofit, DTOs, Hilt module
- `customer-app/.../domain/rating/*` — use cases, models
- `customer-app/.../ui/rating/*` — ViewModel, Screen, Routes, Paparazzi stub
- `customer-app/.../firebase/CustomerFirebaseMessagingService.kt` — FCM dispatch
- `customer-app/.../navigation/AppNavigation.kt` — `LaunchedEffect(eventBus)` + topic subscribe

**Patterns to read first:**
- `docs/patterns/paparazzi-cross-os-goldens.md`
- `docs/patterns/hilt-module-android-test-scope.md`
- `docs/patterns/kotlin-explicit-api-public-modifier.md`

**Prerequisite:** **E07-S01a merged to main.** This story has no api work; the endpoints + FCM trigger are already live.

---

## File Map

### New files (all under `technician-app/app/src/main/kotlin/com/homeservices/technician/...`)
| File | Responsibility |
|---|---|
| `domain/rating/model/Rating.kt` | `TechSubScores`, `CustomerSubScores`, `TechRating`, `CustomerRating`, `SideState`, `RatingSnapshot` |
| `domain/rating/SubmitTechRatingUseCase.kt` | Pass-through |
| `domain/rating/GetTechRatingUseCase.kt` | Pass-through |
| `data/rating/RatingRepository.kt` | `submitTechRating(...)`, `get(...)` returning `Flow<Result<T>>` |
| `data/rating/RatingRepositoryImpl.kt` | Wraps `RatingApiService` |
| `data/rating/RatingPromptEventBus.kt` | Mirrors customer's |
| `data/rating/remote/RatingApiService.kt` | Retrofit interface |
| `data/rating/remote/dto/RatingDtos.kt` | Moshi DTOs |
| `data/rating/di/RatingModule.kt` | Hilt — reuses `@AuthOkHttpClient` (or defines it if not yet present in tech-app) |
| `ui/rating/RatingScreen.kt` | Composable |
| `ui/rating/RatingViewModel.kt` | `HiltViewModel` |
| `ui/rating/RatingRoutes.kt` | Nav route helper |
| `firebase/TechnicianFirebaseMessagingService.kt` | **First FCM service in tech-app** |
| `app/src/test/.../domain/rating/SubmitTechRatingUseCaseTest.kt` | TDD |
| `app/src/test/.../domain/rating/GetTechRatingUseCaseTest.kt` | TDD |
| `app/src/test/.../ui/rating/RatingViewModelTest.kt` | TDD |
| `app/src/test/.../ui/rating/RatingScreenPaparazziTest.kt` | `@Ignore` |

### Modified files
| File | Change |
|---|---|
| `technician-app/gradle/libs.versions.toml` | Byte-for-byte copy of customer-app version (codemod, Task 1) |
| `technician-app/app/src/main/AndroidManifest.xml` | Register `<service .firebase.TechnicianFirebaseMessagingService>` with `MESSAGING_EVENT` filter |
| `technician-app/.../navigation/AppNavigation.kt` | Add `RatingPromptEventBus` parameter, topic-subscribe in Authenticated branch, `LaunchedEffect` to navigate, register route in `homeGraph` |
| `technician-app/.../MainActivity.kt` | Inject + thread `RatingPromptEventBus` |

---

## Task 1: libs.versions.toml sync

**Files:** `technician-app/gradle/libs.versions.toml`

Codemod — no tests. First task of every technician-app story per CLAUDE.md.

- [ ] **Step 1: Copy file byte-for-byte**

```bash
cp customer-app/gradle/libs.versions.toml technician-app/gradle/libs.versions.toml
```

- [ ] **Step 2: Verify Gradle resolves**

```bash
cd technician-app && ./gradlew help -q
```

- [ ] **Step 3: Commit (with story + plan files)**

```bash
git add technician-app/gradle/libs.versions.toml \
        docs/stories/E07-S01b-rating-technician-side.md \
        docs/superpowers/plans/2026-04-24-e07-s01b-rating-technician-side.md
git commit -m "chore(e07-s01b): sync technician-app libs.versions.toml + add S01b story+plan"
```

---

## Task 2: Domain models + use cases (TDD)

**Files:** `domain/rating/model/Rating.kt`, `SubmitTechRatingUseCase.kt`, `GetTechRatingUseCase.kt`, `data/rating/RatingRepository.kt`, plus 2 use-case tests.

> **Pattern reference:** S01a Task 5 Steps 1, 2, 5 with these substitutions:
> - Package: `com.homeservices.technician.*` instead of `com.homeservices.customer.*`
> - Sub-score type for "this side": `TechSubScores(behaviour, communication)` instead of `CustomerSubScores`
> - Repository method: `submitTechRating(bookingId, overall, TechSubScores, comment)` instead of `submitCustomerRating`

- [ ] **Step 1: Models**

Create `technician-app/app/src/main/kotlin/com/homeservices/technician/domain/rating/model/Rating.kt`:
```kotlin
package com.homeservices.technician.domain.rating.model

public data class TechSubScores(
    val behaviour: Int,
    val communication: Int,
)

public data class CustomerSubScores(
    val punctuality: Int,
    val skill: Int,
    val behaviour: Int,
)

public data class TechRating(
    val overall: Int,
    val subScores: TechSubScores,
    val comment: String?,
    val submittedAt: String,
)

public data class CustomerRating(
    val overall: Int,
    val subScores: CustomerSubScores,
    val comment: String?,
    val submittedAt: String,
)

public sealed class SideState {
    public object Pending : SideState()
    public data class Submitted(val rating: Any) : SideState() // TechRating or CustomerRating
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

- [ ] **Step 2: Repository interface**

Create `technician-app/app/src/main/kotlin/com/homeservices/technician/data/rating/RatingRepository.kt`:
```kotlin
package com.homeservices.technician.data.rating

import com.homeservices.technician.domain.rating.model.RatingSnapshot
import com.homeservices.technician.domain.rating.model.TechSubScores
import kotlinx.coroutines.flow.Flow

public interface RatingRepository {
    public fun submitTechRating(
        bookingId: String,
        overall: Int,
        subScores: TechSubScores,
        comment: String?,
    ): Flow<Result<Unit>>

    public fun get(bookingId: String): Flow<Result<RatingSnapshot>>
}
```

- [ ] **Step 3: Use cases**

Create `technician-app/app/src/main/kotlin/com/homeservices/technician/domain/rating/SubmitTechRatingUseCase.kt`:
```kotlin
package com.homeservices.technician.domain.rating

import com.homeservices.technician.data.rating.RatingRepository
import com.homeservices.technician.domain.rating.model.TechSubScores
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

public class SubmitTechRatingUseCase
    @Inject
    constructor(
        private val repo: RatingRepository,
    ) {
        public operator fun invoke(
            bookingId: String,
            overall: Int,
            subScores: TechSubScores,
            comment: String?,
        ): Flow<Result<Unit>> = repo.submitTechRating(bookingId, overall, subScores, comment)
    }
```

Create `technician-app/app/src/main/kotlin/com/homeservices/technician/domain/rating/GetTechRatingUseCase.kt`:
```kotlin
package com.homeservices.technician.domain.rating

import com.homeservices.technician.data.rating.RatingRepository
import com.homeservices.technician.domain.rating.model.RatingSnapshot
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

public class GetTechRatingUseCase
    @Inject
    constructor(
        private val repo: RatingRepository,
    ) {
        public operator fun invoke(bookingId: String): Flow<Result<RatingSnapshot>> = repo.get(bookingId)
    }
```

- [ ] **Step 4: Use-case tests (TDD)**

Create `technician-app/app/src/test/kotlin/com/homeservices/technician/domain/rating/SubmitTechRatingUseCaseTest.kt`:
```kotlin
package com.homeservices.technician.domain.rating

import com.homeservices.technician.data.rating.RatingRepository
import com.homeservices.technician.domain.rating.model.TechSubScores
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

public class SubmitTechRatingUseCaseTest {
    private val repo: RatingRepository = mockk()
    private val useCase = SubmitTechRatingUseCase(repo)

    @Test
    public fun `delegates to repository with correct parameters`(): Unit =
        runTest {
            val subScores = TechSubScores(behaviour = 5, communication = 4)
            coEvery {
                repo.submitTechRating("bk-1", 5, subScores, null)
            } returns flowOf(Result.success(Unit))

            val results = useCase.invoke("bk-1", 5, subScores, null).toList()

            assertThat(results).hasSize(1)
            assertThat(results.first().isSuccess).isTrue()
        }
}
```

Create `technician-app/app/src/test/kotlin/com/homeservices/technician/domain/rating/GetTechRatingUseCaseTest.kt`:
```kotlin
package com.homeservices.technician.domain.rating

import com.homeservices.technician.data.rating.RatingRepository
import com.homeservices.technician.domain.rating.model.RatingSnapshot
import com.homeservices.technician.domain.rating.model.SideState
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

public class GetTechRatingUseCaseTest {
    private val repo: RatingRepository = mockk()
    private val useCase = GetTechRatingUseCase(repo)

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

- [ ] **Step 5: Run tests + commit**

```bash
cd technician-app && ./gradlew testDebugUnitTest --tests '*rating*' ktlintCheck
git add technician-app/app/src/main/kotlin/com/homeservices/technician/domain/rating \
        technician-app/app/src/main/kotlin/com/homeservices/technician/data/rating/RatingRepository.kt \
        technician-app/app/src/test/kotlin/com/homeservices/technician/domain/rating
git commit -m "feat(technician-app): rating domain layer (E07-S01b, TDD)"
```

---

## Task 3: Data layer — repo + EventBus + Retrofit + DTOs + Hilt

**Files:** `data/rating/RatingRepositoryImpl.kt`, `RatingPromptEventBus.kt`, `remote/RatingApiService.kt`, `remote/dto/RatingDtos.kt`, `data/rating/di/RatingModule.kt`.

> **Pattern reference:** S01a Task 5 Steps 2 (EventBus), 3 (Retrofit + DTOs), 4 (Repository impl + Hilt module). Substitution rules:
> - Package: `com.homeservices.technician.*`
> - DTO `subScores` map keys: `behaviour` + `communication` (the customer-side keys still parse correctly via the map mapper)
> - `SubmitRatingRequestDto.side = "TECH_TO_CUSTOMER"`
> - **`@AuthOkHttpClient` qualifier**: check `technician-app/.../data/auth/di/` and `data/jobOffer/di/` for an existing definition. If present, import it. If not, define it in `RatingModule` (mirror customer's `BookingModule.kt:24-25`):
>   ```kotlin
>   @Qualifier @Retention(AnnotationRetention.BINARY)
>   public annotation class AuthOkHttpClient
>   ```
>   And include the `provideAuthOkHttpClient()` provider with the FirebaseAuth interceptor (mirror customer's `BookingModule.kt:36-70`).

- [ ] **Step 1: EventBus**

Create `technician-app/app/src/main/kotlin/com/homeservices/technician/data/rating/RatingPromptEventBus.kt`:
```kotlin
package com.homeservices.technician.data.rating

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

- [ ] **Step 2: Retrofit interface**

Create `technician-app/app/src/main/kotlin/com/homeservices/technician/data/rating/remote/RatingApiService.kt`:
```kotlin
package com.homeservices.technician.data.rating.remote

import com.homeservices.technician.data.rating.remote.dto.GetRatingResponseDto
import com.homeservices.technician.data.rating.remote.dto.SubmitRatingRequestDto
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

- [ ] **Step 3: DTOs**

Create `technician-app/app/src/main/kotlin/com/homeservices/technician/data/rating/remote/dto/RatingDtos.kt`:
```kotlin
package com.homeservices.technician.data.rating.remote.dto

import com.homeservices.technician.domain.rating.model.CustomerRating
import com.homeservices.technician.domain.rating.model.CustomerSubScores
import com.homeservices.technician.domain.rating.model.RatingSnapshot
import com.homeservices.technician.domain.rating.model.SideState
import com.homeservices.technician.domain.rating.model.TechRating
import com.homeservices.technician.domain.rating.model.TechSubScores
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

- [ ] **Step 4: Repository impl**

Create `technician-app/app/src/main/kotlin/com/homeservices/technician/data/rating/RatingRepositoryImpl.kt`:
```kotlin
package com.homeservices.technician.data.rating

import com.homeservices.technician.data.rating.remote.RatingApiService
import com.homeservices.technician.data.rating.remote.dto.SubmitRatingRequestDto
import com.homeservices.technician.domain.rating.model.RatingSnapshot
import com.homeservices.technician.domain.rating.model.TechSubScores
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject

internal class RatingRepositoryImpl
    @Inject
    constructor(
        private val api: RatingApiService,
    ) : RatingRepository {
        override fun submitTechRating(
            bookingId: String,
            overall: Int,
            subScores: TechSubScores,
            comment: String?,
        ): Flow<Result<Unit>> =
            flow {
                emit(
                    runCatching {
                        api.submit(
                            SubmitRatingRequestDto(
                                side = "TECH_TO_CUSTOMER",
                                bookingId = bookingId,
                                overall = overall,
                                subScores = mapOf(
                                    "behaviour" to subScores.behaviour,
                                    "communication" to subScores.communication,
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

- [ ] **Step 5: Hilt module**

Create `technician-app/app/src/main/kotlin/com/homeservices/technician/data/rating/di/RatingModule.kt`. **First check** `grep -rn "AuthOkHttpClient" technician-app/app/src/main/kotlin/`. If the qualifier already exists, import it. Otherwise (likely — the technician-app only has auth + jobOffer modules so far), include the qualifier + provider in this module:
```kotlin
package com.homeservices.technician.data.rating.di

import com.google.firebase.auth.FirebaseAuth
import com.homeservices.technician.BuildConfig
import com.homeservices.technician.data.rating.RatingRepository
import com.homeservices.technician.data.rating.RatingRepositoryImpl
import com.homeservices.technician.data.rating.remote.RatingApiService
import com.squareup.moshi.Moshi
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.tasks.await
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import javax.inject.Qualifier
import javax.inject.Singleton

@Qualifier
@Retention(AnnotationRetention.BINARY)
public annotation class AuthOkHttpClient

@Module
@InstallIn(SingletonComponent::class)
public abstract class RatingModule {
    @Binds
    internal abstract fun bindRatingRepository(impl: RatingRepositoryImpl): RatingRepository

    public companion object {
        @Provides
        @Singleton
        @AuthOkHttpClient
        public fun provideAuthOkHttpClient(): OkHttpClient =
            OkHttpClient
                .Builder()
                .addInterceptor { chain ->
                    val token = runBlocking {
                        FirebaseAuth.getInstance().currentUser?.getIdToken(false)?.await()?.token
                    }
                    val req =
                        if (token != null) {
                            chain.request().newBuilder()
                                .header("Authorization", "Bearer $token")
                                .build()
                        } else { chain.request() }
                    chain.proceed(req)
                }
                .addInterceptor(HttpLoggingInterceptor().apply {
                    level = if (BuildConfig.DEBUG) HttpLoggingInterceptor.Level.BODY
                            else HttpLoggingInterceptor.Level.NONE
                })
                .build()

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

> **If** the qualifier already exists elsewhere: remove the `@Qualifier ... AuthOkHttpClient` block and the `provideAuthOkHttpClient()` method, and import the existing `AuthOkHttpClient` symbol instead.
>
> **If** there is no Moshi-providing module in tech-app yet: add a `provideMoshi()` `@Provides` to this module — `Moshi.Builder().build()`.

- [ ] **Step 6: Build + commit**

```bash
cd technician-app && ./gradlew testDebugUnitTest ktlintCheck assembleDebug
git add technician-app/app/src/main/kotlin/com/homeservices/technician/data/rating
git commit -m "feat(technician-app): rating data layer (Repo + EventBus + Retrofit + Hilt) (E07-S01b)"
```

---

## Task 4: UI — ViewModel + Screen + Routes (TDD)

**Files:** `ui/rating/RatingViewModel.kt`, `RatingScreen.kt`, `RatingRoutes.kt`, `RatingViewModelTest.kt`, `RatingScreenPaparazziTest.kt`.

> **Pattern reference:** S01a Task 6 Steps 1–3 with these substitutions:
> - Package: `com.homeservices.technician.*`
> - Use cases: `SubmitTechRatingUseCase`, `GetTechRatingUseCase`
> - Sub-scores: 2 fields (`behaviour`, `communication`) instead of 3
> - State machine, `canSubmit` rule, `RatingUiState` sealed class are identical

- [ ] **Step 1: ViewModel test (RED)**

Create `technician-app/app/src/test/kotlin/com/homeservices/technician/ui/rating/RatingViewModelTest.kt`:
```kotlin
package com.homeservices.technician.ui.rating

import androidx.lifecycle.SavedStateHandle
import com.homeservices.technician.domain.rating.GetTechRatingUseCase
import com.homeservices.technician.domain.rating.SubmitTechRatingUseCase
import com.homeservices.technician.domain.rating.model.RatingSnapshot
import com.homeservices.technician.domain.rating.model.SideState
import com.homeservices.technician.domain.rating.model.TechSubScores
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
    private val submit: SubmitTechRatingUseCase = mockk()
    private val get: GetTechRatingUseCase = mockk()
    private val savedState = SavedStateHandle(mapOf("bookingId" to "bk-1"))

    @BeforeEach public fun setUp() { Dispatchers.setMain(UnconfinedTestDispatcher()) }
    @AfterEach public fun tearDown() { Dispatchers.resetMain() }

    @Test
    public fun `submit is disabled until overall and both sub-scores are non-zero`() =
        runTest {
            coEvery { get.invoke("bk-1") } returns flowOf(
                Result.success(
                    RatingSnapshot("bk-1", RatingSnapshot.Status.PENDING, null, SideState.Pending, SideState.Pending),
                ),
            )
            val vm = RatingViewModel(submit, get, savedState)
            assertThat(vm.canSubmit.value).isFalse()
            vm.setOverall(5); assertThat(vm.canSubmit.value).isFalse()
            vm.setBehaviour(5); assertThat(vm.canSubmit.value).isFalse()
            vm.setCommunication(5); assertThat(vm.canSubmit.value).isTrue()
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
                submit.invoke("bk-1", 5, TechSubScores(5, 5), null)
            } returns flowOf(Result.success(Unit))

            val vm = RatingViewModel(submit, get, savedState)
            vm.setOverall(5); vm.setBehaviour(5); vm.setCommunication(5)
            vm.submit()

            assertThat(vm.uiState.value).isInstanceOf(RatingUiState.AwaitingPartner::class.java)
        }
}
```

- [ ] **Step 2: ViewModel implementation**

Create `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/rating/RatingViewModel.kt`:
```kotlin
package com.homeservices.technician.ui.rating

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.technician.domain.rating.GetTechRatingUseCase
import com.homeservices.technician.domain.rating.SubmitTechRatingUseCase
import com.homeservices.technician.domain.rating.model.RatingSnapshot
import com.homeservices.technician.domain.rating.model.TechSubScores
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
        private val submitUseCase: SubmitTechRatingUseCase,
        private val getUseCase: GetTechRatingUseCase,
        savedStateHandle: SavedStateHandle,
    ) : ViewModel() {
        public val bookingId: String =
            savedStateHandle.get<String>("bookingId") ?: error("bookingId required")

        private val _uiState = MutableStateFlow<RatingUiState>(RatingUiState.Loading)
        public val uiState: StateFlow<RatingUiState> = _uiState.asStateFlow()

        private val _overall = MutableStateFlow(0); public val overall: StateFlow<Int> = _overall.asStateFlow()
        private val _behaviour = MutableStateFlow(0); public val behaviour: StateFlow<Int> = _behaviour.asStateFlow()
        private val _communication = MutableStateFlow(0); public val communication: StateFlow<Int> = _communication.asStateFlow()
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
        public fun setBehaviour(stars: Int) { _behaviour.value = stars; recompute() }
        public fun setCommunication(stars: Int) { _communication.value = stars; recompute() }
        public fun setComment(text: String) { _comment.value = text.take(500) }

        private fun recompute() {
            _canSubmit.value =
                overall.value in 1..5 && behaviour.value in 1..5 && communication.value in 1..5
        }

        public fun submit() {
            if (!_canSubmit.value) return
            _uiState.value = RatingUiState.Submitting
            viewModelScope.launch {
                submitUseCase.invoke(
                    bookingId = bookingId,
                    overall = overall.value,
                    subScores = TechSubScores(behaviour.value, communication.value),
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

Create `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/rating/RatingRoutes.kt`:
```kotlin
package com.homeservices.technician.ui.rating

public object RatingRoutes {
    public const val ROUTE: String = "rating/{bookingId}"
    public fun route(bookingId: String): String = "rating/$bookingId"
}
```

Create `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/rating/RatingScreen.kt`:
```kotlin
package com.homeservices.technician.ui.rating

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
    val behav by viewModel.behaviour.collectAsState()
    val comm by viewModel.communication.collectAsState()
    val comment by viewModel.comment.collectAsState()
    val canSubmit by viewModel.canSubmit.collectAsState()

    Column(modifier = modifier.fillMaxSize().padding(16.dp)) {
        when (state) {
            is RatingUiState.AwaitingPartner -> Text("Thanks! Awaiting your customer's rating.")
            is RatingUiState.Revealed -> Text("Both ratings revealed.")
            is RatingUiState.Error -> Text("Error: ${(state as RatingUiState.Error).message}")
            else -> {
                Text("How was your customer?")
                Spacer(Modifier.height(8.dp))
                StarRow(label = "Overall", value = overall, onChange = viewModel::setOverall)
                StarRow(label = "Behaviour", value = behav, onChange = viewModel::setBehaviour)
                StarRow(label = "Communication", value = comm, onChange = viewModel::setCommunication)
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

Create `technician-app/app/src/test/kotlin/com/homeservices/technician/ui/rating/RatingScreenPaparazziTest.kt`:
```kotlin
package com.homeservices.technician.ui.rating

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

- [ ] **Step 4: Run tests + ktlint + commit**

```bash
cd technician-app && ./gradlew testDebugUnitTest --tests '*rating*' ktlintCheck
git add technician-app/app/src/main/kotlin/com/homeservices/technician/ui/rating \
        technician-app/app/src/test/kotlin/com/homeservices/technician/ui/rating
git commit -m "feat(technician-app): RatingScreen + ViewModel + Routes (E07-S01b, TDD)"
```

---

## Task 5: First FCM service in tech-app + Manifest registration

**Files:** `firebase/TechnicianFirebaseMessagingService.kt` (NEW), `AndroidManifest.xml` (modify)

- [ ] **Step 1: Create FCM service**

Create `technician-app/app/src/main/kotlin/com/homeservices/technician/firebase/TechnicianFirebaseMessagingService.kt`:
```kotlin
package com.homeservices.technician.firebase

import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.homeservices.technician.data.rating.RatingPromptEventBus
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
public class TechnicianFirebaseMessagingService : FirebaseMessagingService() {
    @Inject public lateinit var ratingPromptEventBus: RatingPromptEventBus

    override fun onMessageReceived(message: RemoteMessage) {
        val data = message.data
        val bookingId = data["bookingId"] ?: return
        when (data["type"]) {
            "RATING_PROMPT_TECHNICIAN" -> ratingPromptEventBus.post(bookingId)
        }
    }

    override fun onNewToken(token: String): Unit = Unit
}
```

- [ ] **Step 2: Register in AndroidManifest.xml**

Open `technician-app/app/src/main/AndroidManifest.xml`. Inside `<application>...</application>`, add:
```xml
<service
    android:name=".firebase.TechnicianFirebaseMessagingService"
    android:exported="false">
    <intent-filter>
        <action android:name="com.google.firebase.MESSAGING_EVENT" />
    </intent-filter>
</service>
```

> The package prefix `.firebase.TechnicianFirebaseMessagingService` resolves against the manifest's `package=` attribute (typically the application id). If this is not the case in the existing manifest, use the full FQN `com.homeservices.technician.firebase.TechnicianFirebaseMessagingService`.

- [ ] **Step 3: Build + commit**

```bash
cd technician-app && ./gradlew assembleDebug
git add technician-app/app/src/main/kotlin/com/homeservices/technician/firebase/TechnicianFirebaseMessagingService.kt \
        technician-app/app/src/main/AndroidManifest.xml
git commit -m "feat(technician-app): TechnicianFirebaseMessagingService + Manifest registration (E07-S01b)"
```

---

## Task 6: Wire `AppNavigation.kt` + `MainActivity.kt`

**Files:** `navigation/AppNavigation.kt`, `MainActivity.kt`, plus `homeGraph` registration (locate via grep).

- [ ] **Step 1: Modify `AppNavigation.kt`**

Add `ratingPromptEventBus: RatingPromptEventBus` to the parameter list. In the `LaunchedEffect(authState)` Authenticated branch, **add the topic subscribe** (the technician-app currently has none):
```kotlin
import com.google.firebase.messaging.FirebaseMessaging
import com.homeservices.technician.data.rating.RatingPromptEventBus

@Composable
internal fun AppNavigation(
    sessionManager: SessionManager,
    activity: FragmentActivity,
    ratingPromptEventBus: RatingPromptEventBus,
    modifier: Modifier = Modifier,
): Unit {
    // ...existing val authState/jobOfferViewModel/jobOfferState...

    LaunchedEffect(authState) {
        val current = authState
        when (current) {
            is AuthState.Authenticated -> {
                navController.navigate("main") {
                    popUpTo("auth") { inclusive = true }
                    launchSingleTop = true
                }
                FirebaseMessaging.getInstance().subscribeToTopic("technician_${current.uid}")
            }
            is AuthState.Unauthenticated ->
                navController.navigate("auth") {
                    popUpTo("main") { inclusive = true }
                    launchSingleTop = true
                }
        }
    }

    // existing LaunchedEffect(jobOfferState) block remains

    LaunchedEffect(ratingPromptEventBus) {
        ratingPromptEventBus.events.collect { bookingId ->
            navController.navigate("rating/$bookingId") { launchSingleTop = true }
        }
    }

    // existing Box/NavHost/JobOfferScreen body
}
```

> **Verify** the property name on `AuthState.Authenticated` is `uid` — `grep -rn "AuthState.Authenticated" technician-app/app/src/main/kotlin/`. If different, substitute.

- [ ] **Step 2: Register `rating/{bookingId}` route in `homeGraph`**

```bash
grep -rn "fun NavGraphBuilder.homeGraph" technician-app/app/src/main/kotlin/
```
Open the file returned. Inside the `homeGraph` builder block, add:
```kotlin
import com.homeservices.technician.ui.rating.RatingRoutes
import com.homeservices.technician.ui.rating.RatingScreen
// ...
composable(RatingRoutes.ROUTE) { RatingScreen() }
```

- [ ] **Step 3: Modify `MainActivity.kt`**

```bash
grep -n "AppNavigation(" technician-app/app/src/main/kotlin/com/homeservices/technician/MainActivity.kt
```
Add the field and pass it through:
```kotlin
import com.homeservices.technician.data.rating.RatingPromptEventBus

@AndroidEntryPoint
public class MainActivity : ... {
    @Inject public lateinit var ratingPromptEventBus: RatingPromptEventBus

    // in setContent { ... AppNavigation(sessionManager, this, ratingPromptEventBus = ratingPromptEventBus) }
}
```

- [ ] **Step 4: Build + commit**

```bash
cd technician-app && ./gradlew testDebugUnitTest ktlintCheck assembleDebug
git add technician-app/app/src/main/kotlin/com/homeservices/technician/navigation/AppNavigation.kt \
        technician-app/app/src/main/kotlin/com/homeservices/technician/MainActivity.kt
# Include the homeGraph file path returned by the grep above
git commit -m "feat(technician-app): wire RatingPromptEventBus + topic subscribe + nav route (E07-S01b)"
```

---

## Task 7: Pre-Codex smoke gate + Paparazzi cleanup + Codex review

- [ ] **Step 1: Smoke gate**

```bash
bash tools/pre-codex-smoke.sh technician-app
```
Must exit 0; non-zero = stop and fix.

- [ ] **Step 2: Delete any local Paparazzi PNGs**

```bash
git rm -r technician-app/app/src/test/snapshots/images/ 2>/dev/null || true
```
Confirm `RatingScreenPaparazziTest` carries `@Ignore`.

- [ ] **Step 3: Codex review**

```bash
codex review --base main
```
Expected: `.codex-review-passed` written. P1s before push; P2s in PR description.

- [ ] **Step 4: Push + PR**

```bash
git push -u origin feature/E07-S01b-rating-technician-side
gh pr create --title "feat: E07-S01b rating technician side" \
  --body "Implements docs/stories/E07-S01b-rating-technician-side.md. Depends on E07-S01a merge. Codex P2 findings (if any): see review log."
```

- [ ] **Step 5: Post-merge — Paparazzi golden record**

Trigger `paparazzi-record.yml` workflow_dispatch for technician-app. Pull artifact, unzip, commit goldens, remove `@Ignore` in chore branch.

---

## Self-Review

1. **Spec coverage**:
   - AC-1 (FCM consume + nav) → Tasks 5+6
   - AC-2 (tech POST submit) → Tasks 3+4
   - AC-3 (mutual reveal end-to-end) → manual verification post-merge against deployed S01a
   - AC-4 (tech screen) → Task 4
   - AC-5/6 (auth + one-per-side) → already enforced server-side by S01a
   ✅ all covered.

2. **Placeholder scan**: every code step has a code block; no TODO/TBD; identifiers consistent (`submitTechRating`, `RatingPromptEventBus.post`, `RatingRoutes.route`, `TechSubScores(behaviour, communication)`).

3. **Type consistency**: `TechSubScores` (2 fields) vs S01a's `CustomerSubScores` (3 fields) intentional and correct; `RatingSnapshot.Status` enum identical across both apps.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-24-e07-s01b-rating-technician-side.md`. Same execution options as S01a:

**1. Subagent-Driven (recommended)** — fresh subagent per task; Sonnet workers, Opus review.

**2. Inline Execution** — same session via executing-plans.

**Which approach?** (Wait for S01a PR to merge before kicking off S01b execution.)
