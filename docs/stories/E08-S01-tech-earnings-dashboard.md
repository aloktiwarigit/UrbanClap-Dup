# Story E08-S01: Tech Earnings Dashboard

**Status:** ready-for-dev

> **Epic:** E08 — Technician Experience (Earnings, Appeals) (`docs/stories/README.md` §E08)
> **Sprint:** S4 (wk 7–8) · **Estimated:** ≤ 1 dev-day · **Priority:** P1
> **Sub-projects:** `api/` + `technician-app/` — no customer-app changes
> **Ceremony tier:** Feature (new API endpoint + new use-case + new Earnings screen on existing nav skeleton; bounded scope; Codex + CI; no `/security-review` unless branch contains auth changes)
> **Prerequisite:** E06-S04 (wallet_ledger live) + E07-S01b (FCM topic subscription live)

---

## Story

As a **technician who completes bookings through the Home Heroo app**,
I want to see my earnings broken down by today / this week / this month / lifetime with a goal progress bar and a 7-day sparkline,
so that **I can track my income at a glance and stay motivated toward my monthly target**.

---

## Acceptance Criteria

### AC-1 · Earnings screen loads all four period totals
- **Given** the technician is authenticated
- **When** `EarningsScreen` opens (home_dashboard route)
- **Then** four cards are shown: Today / This Week / This Month / Lifetime
- **And** each card displays `₹<amount>` in rupees (techAmount / 100, 2-decimal format)
- **And** job count is shown beneath each amount

### AC-2 · Goal progress bar
- **When** the Earnings screen loads
- **Then** a horizontal progress bar is shown labelled "Monthly Goal"
- **And** the bar reflects `(month.techAmount / 3_500_000)` clamped to `[0f, 1f]` (₹35,000/month target in paise)
- **And** the label reads e.g. `₹12,500 / ₹35,000` (rupee amounts)

### AC-3 · 7-day sparkline
- **When** the Earnings screen loads
- **Then** a horizontal sparkline of the last 7 calendar days is visible
- **And** each bar height is proportional to daily `techAmount` (zero = flat baseline bar)
- **And** dates are labelled below each bar (e.g. "Mon", "Tue" …)

### AC-4 · Real-time refresh on FCM EARNINGS_UPDATE
- **When** a booking completes and `trigger-booking-completed.ts` fires `sendTechEarningsUpdate`
- **Then** `HomeservicesFcmService` receives the `EARNINGS_UPDATE` message and emits to `EarningsUpdateEventBus`
- **And** `EarningsViewModel` re-fetches all period totals
- **And** the screen updates without a manual pull-to-refresh

### AC-5 · GET /v1/technicians/me/earnings
- **Given** a valid Bearer token from a technician
- **When** `GET /v1/technicians/me/earnings` is called
- **Then** the response is `200 OK` with body:
  ```json
  {
    "today": { "techAmount": 0, "count": 0 },
    "week":  { "techAmount": 120000, "count": 1 },
    "month": { "techAmount": 360000, "count": 3 },
    "lifetime": { "techAmount": 960000, "count": 8 },
    "lastSevenDays": [
      { "date": "2026-04-20", "techAmount": 0 },
      ...
    ]
  }
  ```
- `techAmount` values are in **paise** (integer)
- Only entries with `payoutStatus IN ('PENDING', 'PAID')` are counted (FAILED excluded)
- **When** no Bearer token → `401 UNAUTHENTICATED`

### AC-6 · Loading and error states
- **When** the API call is in-flight → loading skeleton is shown (cards shimmer)
- **When** the API call fails → error state with "पुनः प्रयास करें" retry button

### AC-7 · libs.versions.toml sync (first task invariant)
- `technician-app/gradle/libs.versions.toml` is identical to `customer-app/gradle/libs.versions.toml` before any other code change

---

## Tasks / Subtasks

> TDD: test file committed before implementation file per CLAUDE.md.

### WS-A — libs.versions.toml sync + API schema + repository method

- [ ] **T1 — libs.versions.toml sync (FIRST, blocks everything)**
  - [ ] Copy `customer-app/gradle/libs.versions.toml` → `technician-app/gradle/libs.versions.toml`
  - Prevents CI drift; must be the very first file committed

- [ ] **T2 — Add EarningsPeriod + EarningsResponse schemas (api/)**
  - [ ] Add to `api/src/schemas/wallet-ledger.ts`:
    ```ts
    export const EarningsPeriodSchema = z.object({
      techAmount: z.number().int().nonnegative(),
      count: z.number().int().nonnegative(),
    });
    export type EarningsPeriod = z.infer<typeof EarningsPeriodSchema>;

    export const DailyEarningsSchema = z.object({
      date: z.string(),       // "yyyy-mm-dd"
      techAmount: z.number().int().nonnegative(),
    });
    export type DailyEarnings = z.infer<typeof DailyEarningsSchema>;

    export const EarningsResponseSchema = z.object({
      today: EarningsPeriodSchema,
      week: EarningsPeriodSchema,
      month: EarningsPeriodSchema,
      lifetime: EarningsPeriodSchema,
      lastSevenDays: z.array(DailyEarningsSchema),
    });
    export type EarningsResponse = z.infer<typeof EarningsResponseSchema>;
    ```

- [ ] **T3 — Add getAllByTechnicianId to wallet-ledger-repository.ts**
  - [ ] Append to `api/src/cosmos/wallet-ledger-repository.ts`:
    ```ts
    async getAllByTechnicianId(technicianId: string): Promise<WalletLedgerEntry[]> {
      const { resources } = await getWalletLedgerContainer()
        .items.query<WalletLedgerEntry>(
          {
            query: `SELECT * FROM c WHERE c.payoutStatus IN ('PENDING', 'PAID')`,
          },
          { partitionKey: technicianId },  // single-partition scan — efficient
        )
        .fetchAll();
      return resources;
    },
    ```
  - **IMPORTANT:** Use `partitionKey` option, NOT a WHERE filter on `technicianId` in the query — the container partition IS `technicianId`, so `{ partitionKey: technicianId }` scans only that partition (no cross-partition RU cost)
  - **IMPORTANT:** Filter `payoutStatus IN ('PENDING', 'PAID')` in the query, not in memory — FAILED entries must be excluded

### WS-B — API function (TDD)

- [ ] **T4 — Test file first**
  - [ ] Create `api/tests/unit/earnings.test.ts` — all tests before implementation:
    ```ts
    vi.mock('../../src/services/firebaseAdmin.js', () => ({
      verifyFirebaseIdToken: vi.fn(),
    }));
    vi.mock('../../src/cosmos/wallet-ledger-repository.js', () => ({
      walletLedgerRepo: { getAllByTechnicianId: vi.fn() },
    }));
    vi.mock('@sentry/node', () => ({ captureException: vi.fn() }));

    import { getEarningsHandler } from '../../src/functions/earnings.js';
    ```
    Tests to cover:
    - `401` — missing/invalid Bearer token
    - `200` — tech with no entries → all zeros, `lastSevenDays` has 7 entries with amount 0
    - `200` — tech with mixed-period entries → correct aggregation for today / week / month / lifetime
    - `200` — FAILED entries are excluded from totals
    - `200` — `lastSevenDays` length is always exactly 7, ordered oldest-to-newest

- [ ] **T5 — Earnings API function**
  - [ ] Create `api/src/functions/earnings.ts`:
    ```ts
    import { app } from '@azure/functions';
    import '../bootstrap.js';
    import { verifyTechnicianToken } from '../middleware/verifyTechnicianToken.js';
    import { walletLedgerRepo } from '../cosmos/wallet-ledger-repository.js';
    import type { EarningsResponse, EarningsPeriod } from '../schemas/wallet-ledger.js';

    export const getEarningsHandler = async (req, ctx) => {
      let uid: string;
      try {
        const decoded = await verifyTechnicianToken(req);
        uid = decoded.uid;
      } catch {
        return { status: 401, jsonBody: { code: 'UNAUTHENTICATED' } };
      }

      const entries = await walletLedgerRepo.getAllByTechnicianId(uid);

      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);
      const weekStart = new Date(now); weekStart.setDate(now.getDate() - 6); // last 7 days including today
      const monthStr = todayStr.slice(0, 7);  // "yyyy-mm"

      // Period aggregation (in-memory — single partition, small dataset per tech)
      function aggregate(filter: (e: WalletLedgerEntry) => boolean): EarningsPeriod {
        const subset = entries.filter(filter);
        return {
          techAmount: subset.reduce((s, e) => s + e.techAmount, 0),
          count: subset.length,
        };
      }

      // lastSevenDays: always 7 entries, oldest first
      const dayMap = new Map<string, number>();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        dayMap.set(d.toISOString().slice(0, 10), 0);
      }
      for (const e of entries) {
        const day = e.createdAt.slice(0, 10);
        if (dayMap.has(day)) dayMap.set(day, (dayMap.get(day) ?? 0) + e.techAmount);
      }
      const lastSevenDays = [...dayMap.entries()].map(([date, techAmount]) => ({ date, techAmount }));

      const response: EarningsResponse = {
        today: aggregate(e => e.createdAt.slice(0, 10) === todayStr),
        week:  aggregate(e => new Date(e.createdAt) >= weekStart),
        month: aggregate(e => e.createdAt.startsWith(monthStr)),
        lifetime: aggregate(_ => true),
        lastSevenDays,
      };

      return { status: 200, jsonBody: response };
    };

    app.http('getEarnings', {
      route: 'v1/technicians/me/earnings',
      methods: ['GET'],
      handler: getEarningsHandler,
    });
    ```
  - The aggregation is intentionally in-memory: a technician completing ≤5,000 jobs/yr generates a max of ~200 entries; no pagination needed at pilot scale
  - `week` definition: last 7 days **inclusive** of today (not calendar week Mon–Sun) — simpler and more intuitive for "this week's earnings"
  - `month` definition: entries where `createdAt` starts with `"yyyy-mm"` of today's date

### WS-C — Domain + data layer (technician-app/, TDD)

- [ ] **T6 — EarningsUpdateEventBus**
  - [ ] Create `technician-app/app/src/main/kotlin/com/homeservices/technician/data/earnings/EarningsUpdateEventBus.kt`
    ```kotlin
    package com.homeservices.technician.data.earnings

    import kotlinx.coroutines.flow.MutableSharedFlow
    import kotlinx.coroutines.flow.SharedFlow
    import kotlinx.coroutines.flow.asSharedFlow
    import javax.inject.Inject
    import javax.inject.Singleton

    @Singleton
    public class EarningsUpdateEventBus @Inject constructor() {
        private val _events: MutableSharedFlow<Unit> =
            MutableSharedFlow(replay = 0, extraBufferCapacity = 1)
        public val events: SharedFlow<Unit> = _events.asSharedFlow()

        public fun notify(): Unit {
            _events.tryEmit(Unit)
        }
    }
    ```

- [ ] **T7 — Extend HomeservicesFcmService.kt (MODIFY)**
  - [ ] In `HomeservicesFcmService.kt`:
    - Add `@Inject public lateinit var earningsUpdateEventBus: EarningsUpdateEventBus`
    - Add `"EARNINGS_UPDATE"` branch to `when (data["type"])`:
      ```kotlin
      "EARNINGS_UPDATE" -> {
          earningsUpdateEventBus.notify()
      }
      ```
  - **PRESERVE:** `JOB_OFFER` and `RATING_PROMPT_TECHNICIAN` branches must remain unchanged
  - **DO NOT** add any other field injection beyond `earningsUpdateEventBus`

- [ ] **T8 — Domain model**
  - [ ] Create `technician-app/app/src/main/kotlin/com/homeservices/technician/domain/earnings/model/EarningsSummary.kt`
    ```kotlin
    package com.homeservices.technician.domain.earnings.model

    public data class EarningsPeriod(
        val techAmountPaise: Long,
        val count: Int,
    ) {
        public val rupees: Double get() = techAmountPaise / 100.0
    }

    public data class DailyEarnings(
        val date: String,
        val techAmountPaise: Long,
    )

    public data class EarningsSummary(
        val today: EarningsPeriod,
        val week: EarningsPeriod,
        val month: EarningsPeriod,
        val lifetime: EarningsPeriod,
        val lastSevenDays: List<DailyEarnings>,
    )
    ```

- [ ] **T9 — DTOs**
  - [ ] Create `technician-app/app/src/main/kotlin/com/homeservices/technician/data/earnings/remote/dto/EarningsDtos.kt`
    ```kotlin
    package com.homeservices.technician.data.earnings.remote.dto

    import com.squareup.moshi.JsonClass

    @JsonClass(generateAdapter = true)
    public data class EarningsPeriodDto(
        val techAmount: Long,
        val count: Int,
    )

    @JsonClass(generateAdapter = true)
    public data class DailyEarningsDto(
        val date: String,
        val techAmount: Long,
    )

    @JsonClass(generateAdapter = true)
    public data class EarningsResponseDto(
        val today: EarningsPeriodDto,
        val week: EarningsPeriodDto,
        val month: EarningsPeriodDto,
        val lifetime: EarningsPeriodDto,
        val lastSevenDays: List<DailyEarningsDto>,
    )
    ```

- [ ] **T10 — EarningsApiService**
  - [ ] Create `technician-app/app/src/main/kotlin/com/homeservices/technician/data/earnings/remote/EarningsApiService.kt`
    ```kotlin
    package com.homeservices.technician.data.earnings.remote

    import com.homeservices.technician.data.earnings.remote.dto.EarningsResponseDto
    import retrofit2.http.GET

    public interface EarningsApiService {
        @GET("v1/technicians/me/earnings")
        public suspend fun getEarnings(): EarningsResponseDto
    }
    ```

- [ ] **T11 — EarningsRepository interface + impl (TDD)**
  - [ ] Create `technician-app/app/src/main/kotlin/com/homeservices/technician/domain/earnings/EarningsRepository.kt`
    ```kotlin
    package com.homeservices.technician.domain.earnings

    import com.homeservices.technician.domain.earnings.model.EarningsSummary

    public interface EarningsRepository {
        public suspend fun getEarnings(): Result<EarningsSummary>
    }
    ```
  - [ ] Write test FIRST: `technician-app/app/src/test/kotlin/com/homeservices/technician/data/earnings/EarningsRepositoryImplTest.kt`
    - Use manual MockK construction (no Hilt)
    - Test: success path → maps DTOs to domain model correctly
    - Test: API throws → returns `Result.failure`
  - [ ] Create `technician-app/app/src/main/kotlin/com/homeservices/technician/data/earnings/EarningsRepositoryImpl.kt`
    ```kotlin
    public class EarningsRepositoryImpl @Inject constructor(
        private val apiService: EarningsApiService,
    ) : EarningsRepository {
        public override suspend fun getEarnings(): Result<EarningsSummary> = runCatching {
            val dto = apiService.getEarnings()
            EarningsSummary(
                today = EarningsPeriod(dto.today.techAmount, dto.today.count),
                week  = EarningsPeriod(dto.week.techAmount, dto.week.count),
                month = EarningsPeriod(dto.month.techAmount, dto.month.count),
                lifetime = EarningsPeriod(dto.lifetime.techAmount, dto.lifetime.count),
                lastSevenDays = dto.lastSevenDays.map { DailyEarnings(it.date, it.techAmount) },
            )
        }
    }
    ```

- [ ] **T12 — GetEarningsUseCase (TDD)**
  - [ ] Write test FIRST: `technician-app/app/src/test/kotlin/com/homeservices/technician/domain/earnings/GetEarningsUseCaseTest.kt`
    - Test: delegates to repository and returns Result
    - Manual MockK construction
  - [ ] Create `technician-app/app/src/main/kotlin/com/homeservices/technician/domain/earnings/GetEarningsUseCase.kt`
    ```kotlin
    public class GetEarningsUseCase @Inject constructor(
        private val repository: EarningsRepository,
    ) {
        public suspend fun invoke(): Result<EarningsSummary>
    }
    ```

- [ ] **T13 — EarningsModule (Hilt DI)**
  - [ ] Create `technician-app/app/src/main/kotlin/com/homeservices/technician/data/earnings/di/EarningsModule.kt`
    ```kotlin
    @Module
    @InstallIn(SingletonComponent::class)
    public abstract class EarningsModule {
        @Binds
        internal abstract fun bindEarningsRepository(impl: EarningsRepositoryImpl): EarningsRepository

        public companion object {
            @Provides
            @Singleton
            public fun provideEarningsApiService(
                @AuthOkHttpClient client: OkHttpClient,
            ): EarningsApiService =
                Retrofit.Builder()
                    .baseUrl("https://homeservices-api.azurewebsites.net/api/")
                    .client(client)
                    .addConverterFactory(MoshiConverterFactory.create())
                    .build()
                    .create(EarningsApiService::class.java)
        }
    }
    ```
  - **IMPORTANT:** Reuse `@AuthOkHttpClient` from `com.homeservices.technician.data.rating.di.RatingModule` — do NOT create a second auth OkHttpClient. Import and use the existing qualifier.

### WS-D — ViewModel + UI (TDD)

- [ ] **T14 — EarningsUiState**
  - [ ] Create `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/earnings/EarningsUiState.kt`
    ```kotlin
    package com.homeservices.technician.ui.earnings

    import com.homeservices.technician.domain.earnings.model.EarningsSummary

    public sealed class EarningsUiState {
        public object Loading : EarningsUiState()
        public data class Success(val summary: EarningsSummary) : EarningsUiState()
        public object Error : EarningsUiState()
    }
    ```

- [ ] **T15 — EarningsViewModel (TDD)**
  - [ ] Write test FIRST: `technician-app/app/src/test/kotlin/com/homeservices/technician/ui/earnings/EarningsViewModelTest.kt`
    - Manual MockK construction — no Hilt
    - Test: initial state is `Loading`
    - Test: success load → `Success`
    - Test: failure load → `Error`
    - Test: `refresh()` called after FCM event → state transitions Loading → Success
    - Use `kotlinx-coroutines-test` + `TestCoroutineDispatcher`/`UnconfinedTestDispatcher`
  - [ ] Create `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/earnings/EarningsViewModel.kt`
    ```kotlin
    @HiltViewModel
    public class EarningsViewModel @Inject constructor(
        private val getEarningsUseCase: GetEarningsUseCase,
        private val earningsUpdateEventBus: EarningsUpdateEventBus,
    ) : ViewModel() {
        private val _uiState = MutableStateFlow<EarningsUiState>(EarningsUiState.Loading)
        public val uiState: StateFlow<EarningsUiState> = _uiState.asStateFlow()

        init {
            loadEarnings()
            viewModelScope.launch {
                earningsUpdateEventBus.events.collect { loadEarnings() }
            }
        }

        public fun refresh(): Unit = loadEarnings()

        private fun loadEarnings() {
            viewModelScope.launch {
                _uiState.value = EarningsUiState.Loading
                val result = getEarningsUseCase.invoke()
                _uiState.value = result.fold(
                    onSuccess = { EarningsUiState.Success(it) },
                    onFailure = { EarningsUiState.Error },
                )
            }
        }
    }
    ```

- [ ] **T16 — EarningsScreen (Compose UI)**
  - [ ] Create `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/earnings/EarningsScreen.kt`
    - Layout: `Scaffold` with `TopAppBar` titled "कमाई" (Earnings)
    - **Loading state:** shimmer placeholder (M3 `CircularProgressIndicator` centered)
    - **Error state:** centered `Text("डेटा लोड नहीं हो सका")` + `Button("पुनः प्रयास करें") { viewModel.refresh() }`
    - **Success state:**
      - 4 `EarningsPeriodCard` components in a 2×2 `LazyVerticalGrid` (or a Column of 2 Rows)
      - Each card shows: period label (Today/This Week/This Month/Lifetime) + `₹<amount>` + `<count> jobs`
      - Goal progress section: `LinearProgressIndicator(progress = goalProgress)` + label
      - Sparkline section: 7-day earnings bars drawn with `Canvas`

    ```kotlin
    @Composable
    internal fun EarningsScreen(
        modifier: Modifier = Modifier,
        viewModel: EarningsViewModel = hiltViewModel(),
    ) { ... }
    ```

    **Sparkline implementation (Canvas-based, no external charting library):**
    ```kotlin
    @Composable
    internal fun EarningsSparkline(
        days: List<DailyEarnings>,
        modifier: Modifier = Modifier,
    ) {
        // Canvas draws 7 bars proportional to max daily amount
        // If max is 0, all bars at 4dp (baseline indicator)
        // Day labels: "Mon", "Tue" etc. from date string using DayOfWeek parsing
    }
    ```

    **Amount formatting helper:**
    ```kotlin
    internal fun formatRupees(paise: Long): String =
        "₹%,.0f".format(paise / 100.0)
    ```

    **Goal progress computation:**
    ```kotlin
    val MONTHLY_GOAL_PAISE = 3_500_000L  // ₹35,000
    val goalProgress = (summary.month.techAmountPaise.toFloat() / MONTHLY_GOAL_PAISE).coerceIn(0f, 1f)
    ```

- [ ] **T17 — Wire into HomeGraph (MODIFY)**
  - [ ] In `technician-app/app/src/main/kotlin/com/homeservices/technician/navigation/HomeGraph.kt`:
    - Replace the blank `Box(modifier = Modifier.fillMaxSize())` in `home_dashboard` with `EarningsScreen()`
    - Add import for `EarningsScreen`
  - **PRESERVE:** `activeJob/{bookingId}` and `RatingRoutes.ROUTE` composable entries must remain unchanged
  - **DO NOT** add a new navigation graph — `EarningsScreen` IS the `home_dashboard` destination

- [ ] **T18 — Paparazzi stub**
  - [ ] Create `technician-app/app/src/test/kotlin/com/homeservices/technician/ui/earnings/EarningsScreenTest.kt`
    ```kotlin
    public class EarningsScreenTest {
        @Test
        @Ignored
        public fun earningsScreenGolden(): Unit = Unit
    }
    ```
  - Per `docs/patterns/paparazzi-cross-os-goldens.md`: do NOT run `recordPaparazziDebug` on Windows
  - Before push: `git rm -r technician-app/src/test/snapshots/images/ 2>/dev/null || true`

### WS-E — Smoke gate

- [ ] **T19 — Pre-review smoke gates**
  ```bash
  bash tools/pre-codex-smoke-api.sh
  bash tools/pre-codex-smoke.sh technician-app
  ```
  Both must exit 0 before review.

---

## Developer Context & Guardrails

### Critical codebase facts

**FCM EARNINGS_UPDATE already wired on the API side:** `sendTechEarningsUpdate` in `api/src/services/fcm.service.ts` (lines 10-22) is already called from `trigger-booking-completed.ts` (line 110) after a successful Razorpay Route transfer. **No API-side change is needed for FCM delivery** — only the technician-app needs to handle the `EARNINGS_UPDATE` message type.

**Technician FCM topic:** `FcmTopicSubscriber.kt` subscribes to `technician_{uid}` on login and unsubscribes on logout. `sendTechEarningsUpdate` sends to `technician_${technicianId}`. The subscription is already live — no new subscription needed.

**HomeservicesFcmService injection pattern:** The service uses `@AndroidEntryPoint` and field injection (`@Inject public lateinit var`). Add `earningsUpdateEventBus` the same way — DO NOT use constructor injection (Firebase services use field injection). The service already has `serviceScope` for coroutines; there is no async work needed for EARNINGS_UPDATE (just `tryEmit`).

**Retrofit auth — reuse @AuthOkHttpClient qualifier:** `RatingModule.kt` defines `@AuthOkHttpClient` OkHttpClient with Firebase ID token interceptor. `EarningsModule` MUST import and use `@AuthOkHttpClient` from `com.homeservices.technician.data.rating.di.RatingModule` — do NOT define a second qualifier or second auth client. The qualifier annotation is `@AuthOkHttpClient` defined in that file.

**wallet_ledger partition key:** The container is partitioned by `technicianId`. Use `{ partitionKey: technicianId }` in the Cosmos query options to get a single-partition scan. Do NOT add `WHERE c.technicianId = @uid` — let the partition routing handle it.

**No pagination needed at pilot scale:** A tech completing 3 bookings/day × 365 days = ~1,095 entries max. Fetching all at once and aggregating in memory is correct. Do not introduce pagination.

**home_dashboard is a blank Box:** `HomeGraph.kt` line 25 has `composable("home_dashboard") { Box(modifier = Modifier.fillMaxSize()) }`. This is the only change needed in navigation — replace the Box with `EarningsScreen()`. The overall nav graph structure (auth → main → home) is unchanged.

**Explicit API mode (mandatory):** All new Kotlin declarations that are intended as public API (including test classes and `@Test` methods) MUST carry explicit `public` modifier. See `docs/patterns/kotlin-explicit-api-public-modifier.md`. Internal composables use `internal` — they do not need `public`.

**Hilt test scope:** JVM unit tests (EarningsRepositoryImplTest, GetEarningsUseCaseTest, EarningsViewModelTest) MUST use manual MockK construction — no `@HiltAndroidTest`, no `HiltAndroidRule`. See `docs/patterns/hilt-module-android-test-scope.md`.

**Moshi @JsonClass:** All DTO data classes must have `@JsonClass(generateAdapter = true)` for Moshi reflection-free serialization. The `moshi` KSP processor is already in `libs.versions.toml`.

**Amount values are in paise (integer):** The `wallet_ledger.techAmount` is stored in paise. The domain model uses `techAmountPaise: Long`. The UI divides by 100 to show rupees. Never round-trip through floating point in the domain or data layers.

**Week definition:** "This week" = last 7 days inclusive of today (rolling 7-day window). This is deliberately NOT a calendar Mon–Sun week — it matches how delivery drivers mentally track recent earnings.

**Sparkline day labels:** Parse the `date` string (`"yyyy-mm-dd"`) using `LocalDate.parse(date)` and `DayOfWeek` to get short day names. Requires `java.time` which is available on API 26+. The project minSdk is 26 (check `customer-app/app/build.gradle.kts` if uncertain).

**No `@Composable` in test files for Paparazzi stubs:** The `@Ignored` stub is just a plain `@Test` function that returns `Unit`. Do not add Paparazzi `@Test @Paparazzi` infrastructure — the stub exists solely to satisfy the CI test inventory and gets promoted to a real test when goldens are recorded.

### Files to CREATE

**api/**
- `api/src/functions/earnings.ts`
- `api/tests/unit/earnings.test.ts` (test first)

**api/ (MODIFY)**
- `api/src/schemas/wallet-ledger.ts` — add `EarningsPeriodSchema`, `DailyEarningsSchema`, `EarningsResponseSchema`
- `api/src/cosmos/wallet-ledger-repository.ts` — add `getAllByTechnicianId`

**technician-app/**
- `technician-app/app/src/main/kotlin/com/homeservices/technician/data/earnings/EarningsUpdateEventBus.kt`
- `technician-app/app/src/main/kotlin/com/homeservices/technician/data/earnings/remote/dto/EarningsDtos.kt`
- `technician-app/app/src/main/kotlin/com/homeservices/technician/data/earnings/remote/EarningsApiService.kt`
- `technician-app/app/src/main/kotlin/com/homeservices/technician/data/earnings/EarningsRepositoryImpl.kt`
- `technician-app/app/src/main/kotlin/com/homeservices/technician/data/earnings/di/EarningsModule.kt`
- `technician-app/app/src/main/kotlin/com/homeservices/technician/domain/earnings/EarningsRepository.kt`
- `technician-app/app/src/main/kotlin/com/homeservices/technician/domain/earnings/model/EarningsSummary.kt`
- `technician-app/app/src/main/kotlin/com/homeservices/technician/domain/earnings/GetEarningsUseCase.kt`
- `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/earnings/EarningsUiState.kt`
- `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/earnings/EarningsViewModel.kt`
- `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/earnings/EarningsScreen.kt`
- `technician-app/app/src/test/kotlin/com/homeservices/technician/data/earnings/EarningsRepositoryImplTest.kt` (test first)
- `technician-app/app/src/test/kotlin/com/homeservices/technician/domain/earnings/GetEarningsUseCaseTest.kt` (test first)
- `technician-app/app/src/test/kotlin/com/homeservices/technician/ui/earnings/EarningsViewModelTest.kt` (test first)
- `technician-app/app/src/test/kotlin/com/homeservices/technician/ui/earnings/EarningsScreenTest.kt` (Paparazzi `@Ignored` stubs only)

**technician-app/ (MODIFY)**
- `technician-app/gradle/libs.versions.toml` — sync from customer-app (FIRST)
- `technician-app/app/src/main/kotlin/com/homeservices/technician/data/fcm/HomeservicesFcmService.kt` — add EARNINGS_UPDATE handler
- `technician-app/app/src/main/kotlin/com/homeservices/technician/navigation/HomeGraph.kt` — replace blank Box with EarningsScreen

### Files to NOT touch
- `api/src/functions/trigger-booking-completed.ts` — already calls `sendTechEarningsUpdate`; do NOT modify
- `api/src/services/fcm.service.ts` — `sendTechEarningsUpdate` already exists; do NOT modify
- `technician-app/.../data/fcm/FcmTopicSubscriber.kt` — subscription already live; do NOT modify
- `technician-app/.../navigation/AppNavigation.kt` — no changes needed; FCM subscriber + auth routing unchanged
- `customer-app/` — any file
- `api/src/functions/sos.ts` — E07-S05 complete; do NOT touch

### Test patterns (from this codebase)

**API test (Vitest) — mirror sos.test.ts pattern:**
```ts
// api/tests/unit/earnings.test.ts
vi.mock('../../src/services/firebaseAdmin.js', () => ({
  verifyFirebaseIdToken: vi.fn(),
}));
vi.mock('../../src/cosmos/wallet-ledger-repository.js', () => ({
  walletLedgerRepo: { getAllByTechnicianId: vi.fn() },
}));
vi.mock('@sentry/node', () => ({ captureException: vi.fn() }));

import { getEarningsHandler } from '../../src/functions/earnings.js';
import { verifyFirebaseIdToken } from '../../src/services/firebaseAdmin.js';
import { walletLedgerRepo } from '../../src/cosmos/wallet-ledger-repository.js';

const ctx = { log: vi.fn(), error: vi.fn() } as unknown as InvocationContext;

function makeReq(auth?: string): HttpRequest {
  return {
    headers: { get: (h: string) => h.toLowerCase() === 'authorization' ? (auth ?? '') : null },
    params: {},
    query: { get: () => null },
  } as unknown as HttpRequest;
}
```

**Android ViewModel test (JUnit 5 + MockK + Turbine or manual collect):**
```kotlin
public class EarningsViewModelTest {
    private val useCase: GetEarningsUseCase = mockk()
    private val eventBus = EarningsUpdateEventBus()

    @Test
    public fun `initial state is Loading then Success on successful load`() = runTest {
        coEvery { useCase.invoke() } returns Result.success(fakeSummary)
        val vm = EarningsViewModel(useCase, eventBus)
        // Wait for init block to complete
        advanceUntilIdle()
        assertThat(vm.uiState.value).isInstanceOf(EarningsUiState.Success::class.java)
    }
}
```

### Smoke gate commands
```bash
# API smoke gate
bash tools/pre-codex-smoke-api.sh

# Android smoke gate
bash tools/pre-codex-smoke.sh technician-app
```

### Review gate (no Codex available this session)
```
/superpowers:code-reviewer   ← substitute review (Codex quota resets 2026-04-28 17:37 IST)
Open PR — do NOT merge until Codex review is completed
```

---

## Dev Notes (pre-implementation)

**Why in-memory aggregation rather than Cosmos SQL GROUP BY:** Cosmos DB Serverless on the free tier charges per RU. A single query fetching all entries for one partition (single-partition scan) is O(n) with minimal RU overhead per entry. SQL GROUP BY with aggregation functions costs more RUs and adds query complexity. At pilot scale (≤1,000 entries per tech), in-memory aggregation is faster to implement, cheaper, and easier to test. If this becomes a performance concern at scale, a materialized view can be introduced — this is a deliberate deferral, not an oversight.

**Why "week" is not calendar Mon–Sun:** Rolling 7-day is simpler to implement (no timezone-aware start-of-week calculation) and is more accurate from the technician's perspective ("what have I earned in the last 7 days" is more actionable than "what have I earned since last Monday").

**EarningsUpdateEventBus vs SharedFlow in ViewModel:** The event bus is `@Singleton` to survive ViewModel recreation. If the ViewModel collected directly from a local `MutableSharedFlow`, FCM events arriving while the screen is off-screen (ViewModel paused) would be dropped. The Singleton bus buffers `extraBufferCapacity = 1` events, so a completion that fires while the tech is on another screen still triggers a refresh when they return to Earnings.

**Canvas sparkline instead of a charting library:** No charting dependency added. Canvas-based bars are 20 lines of Compose code and avoid licensing/versioning risk. The design spec only asks for a "sparkline trend" — a simple bar chart suffices.

**home_dashboard is the earnings screen:** The tech app's post-auth landing is currently a blank Box. Making it the EarningsScreen is the logical "home tab" for a tech — their main daily screen. Future stories (E08-S02/S03/S04) can add a BottomNavigation if the home tab gets siblings, but for this story a single-screen replacement is correct.

---

*Story E08-S01 created 2026-04-26. Analysis completed — ready for feature-tier execution.*
