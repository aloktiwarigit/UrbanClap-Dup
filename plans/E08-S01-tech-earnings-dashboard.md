# E08-S01 Tech Earnings Dashboard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `GET /v1/technicians/me/earnings` API endpoint and an `EarningsScreen` in `technician-app/` that shows today / week / month / lifetime earnings totals, a goal progress bar, and a 7-day sparkline, updating in real-time via FCM `EARNINGS_UPDATE` messages.

**Architecture:** Single Cosmos read per request — single-partition scan of `wallet_ledger` (partitioned by `technicianId`), all aggregation in-memory. FCM `EARNINGS_UPDATE` is already fired by `trigger-booking-completed.ts`; only the Android handler needs extending. `EarningsUpdateEventBus` (Singleton SharedFlow) bridges FCM → ViewModel. Earnings screen replaces the blank `home_dashboard` Box.

**Tech Stack:** Azure Functions + Cosmos DB Serverless (API) · Kotlin + Compose + Hilt + Retrofit + Moshi (Android) · Vitest (API tests) · JUnit 5 + MockK (Android tests)

**Story file:** `docs/stories/E08-S01-tech-earnings-dashboard.md`

**Pattern files to re-read before starting:**
- `docs/patterns/hilt-module-android-test-scope.md` — JVM unit tests use manual MockK construction, no `@HiltAndroidTest`
- `docs/patterns/kotlin-explicit-api-public-modifier.md` — every public declaration needs `public` modifier
- `docs/patterns/paparazzi-cross-os-goldens.md` — never run `recordPaparazziDebug` on Windows

---

## File Map

**api/ — CREATE**
- `api/src/functions/earnings.ts` — `getEarningsHandler` + `app.http` registration
- `api/tests/unit/earnings.test.ts` — Vitest unit tests (written first)

**api/ — MODIFY**
- `api/src/schemas/wallet-ledger.ts` — add `EarningsPeriodSchema`, `DailyEarningsSchema`, `EarningsResponseSchema`
- `api/src/cosmos/wallet-ledger-repository.ts` — add `getAllByTechnicianId`

**technician-app/ — CREATE**
- `...data/earnings/EarningsUpdateEventBus.kt` — Singleton SharedFlow (FCM → ViewModel bridge)
- `...data/earnings/remote/dto/EarningsDtos.kt` — Moshi DTOs for API response
- `...data/earnings/remote/EarningsApiService.kt` — Retrofit interface
- `...data/earnings/EarningsRepositoryImpl.kt` — maps DTOs → domain
- `...data/earnings/di/EarningsModule.kt` — Hilt bindings
- `...domain/earnings/EarningsRepository.kt` — interface
- `...domain/earnings/model/EarningsSummary.kt` — domain models (paise)
- `...domain/earnings/GetEarningsUseCase.kt` — thin delegator
- `...ui/earnings/EarningsUiState.kt` — Loading / Success / Error sealed class
- `...ui/earnings/EarningsViewModel.kt` — loads on init, refreshes on FCM
- `...ui/earnings/EarningsScreen.kt` — cards + goal bar + sparkline (Canvas)
- `...test/.../data/earnings/EarningsRepositoryImplTest.kt`
- `...test/.../domain/earnings/GetEarningsUseCaseTest.kt`
- `...test/.../ui/earnings/EarningsViewModelTest.kt`
- `...test/.../ui/earnings/EarningsScreenTest.kt` — Paparazzi `@Ignored` stub

**technician-app/ — MODIFY**
- `technician-app/gradle/libs.versions.toml` — sync from `customer-app/` (Task 1)
- `...data/fcm/HomeservicesFcmService.kt` — add `EARNINGS_UPDATE` branch
- `...navigation/HomeGraph.kt` — replace blank Box with `EarningsScreen()`

All paths under `technician-app/app/src/main/kotlin/com/homeservices/technician/` — abbreviated as `...`.

---

## Task 1: libs.versions.toml sync (mandatory first step)

**Files:** Modify `technician-app/gradle/libs.versions.toml`

- [ ] Copy `customer-app/gradle/libs.versions.toml` to `technician-app/gradle/libs.versions.toml`:
  ```bash
  cp customer-app/gradle/libs.versions.toml technician-app/gradle/libs.versions.toml
  ```

- [ ] Commit:
  ```bash
  git add technician-app/gradle/libs.versions.toml
  git commit -m "chore(e08-s01): sync technician-app libs.versions.toml from customer-app"
  ```

---

## Task 2: API schema additions + Cosmos repo method

**Files:** Modify `api/src/schemas/wallet-ledger.ts`, `api/src/cosmos/wallet-ledger-repository.ts`

- [ ] Add to the **bottom** of `api/src/schemas/wallet-ledger.ts`:
  ```ts
  export const EarningsPeriodSchema = z.object({
    techAmount: z.number().int().nonnegative(),
    count: z.number().int().nonnegative(),
  });
  export type EarningsPeriod = z.infer<typeof EarningsPeriodSchema>;

  export const DailyEarningsSchema = z.object({
    date: z.string(),
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

- [ ] Add `getAllByTechnicianId` to the `walletLedgerRepo` object in `api/src/cosmos/wallet-ledger-repository.ts` (before the closing `};`):
  ```ts
  async getAllByTechnicianId(technicianId: string): Promise<WalletLedgerEntry[]> {
    const { resources } = await getWalletLedgerContainer()
      .items.query<WalletLedgerEntry>(
        { query: `SELECT * FROM c WHERE c.payoutStatus IN ('PENDING', 'PAID')` },
        { partitionKey: technicianId },
      )
      .fetchAll();
    return resources;
  },
  ```
  > The `{ partitionKey: technicianId }` option routes the query to a single partition — no cross-partition RU cost. Do NOT add `WHERE c.technicianId = @uid` in the query; the partition routing already scopes it.

- [ ] Verify typecheck passes:
  ```bash
  cd api && pnpm typecheck
  ```
  Expected: 0 errors.

- [ ] Commit:
  ```bash
  git add api/src/schemas/wallet-ledger.ts api/src/cosmos/wallet-ledger-repository.ts
  git commit -m "feat(e08-s01): add EarningsResponse schema and wallet_ledger aggregation query"
  ```

---

## Task 3: API earnings function (TDD)

**Files:** Create `api/tests/unit/earnings.test.ts`, `api/src/functions/earnings.ts`

- [ ] Create `api/tests/unit/earnings.test.ts` (test first — do NOT create earnings.ts yet):
  ```ts
  import { describe, it, expect, vi, beforeEach } from 'vitest';
  import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

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
  import type { WalletLedgerEntry } from '../../src/schemas/wallet-ledger.js';

  const ctx = { log: vi.fn(), error: vi.fn() } as unknown as InvocationContext;

  function makeReq(auth?: string): HttpRequest {
    return {
      headers: { get: (h: string) => h.toLowerCase() === 'authorization' ? (auth ?? '') : null },
      params: {},
    } as unknown as HttpRequest;
  }

  function makeEntry(createdAt: string, techAmount: number, payoutStatus: 'PENDING' | 'PAID' | 'FAILED' = 'PAID'): WalletLedgerEntry {
    return {
      id: 'e1', bookingId: 'bk-1', technicianId: 'tech-1', partitionKey: 'tech-1',
      bookingAmount: techAmount + 10000, completedJobCountAtSettlement: 1,
      commissionBps: 1000, commissionAmount: 1000, techAmount, payoutStatus, createdAt,
    };
  }

  const today = new Date().toISOString().slice(0, 10);

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(verifyFirebaseIdToken).mockResolvedValue({ uid: 'tech-1' } as any);
    vi.mocked(walletLedgerRepo.getAllByTechnicianId).mockResolvedValue([]);
  });

  describe('GET /v1/technicians/me/earnings', () => {
    it('returns 401 when no Authorization header', async () => {
      vi.mocked(verifyFirebaseIdToken).mockRejectedValue(new Error('No token'));
      const res = await getEarningsHandler(makeReq(), ctx) as HttpResponseInit;
      expect(res.status).toBe(401);
    });

    it('returns 200 with all-zero response when no entries', async () => {
      const res = await getEarningsHandler(makeReq('Bearer tok'), ctx) as HttpResponseInit;
      expect(res.status).toBe(200);
      const body = res.jsonBody as any;
      expect(body.today.techAmount).toBe(0);
      expect(body.today.count).toBe(0);
      expect(body.lastSevenDays).toHaveLength(7);
      expect(body.lastSevenDays.every((d: any) => d.techAmount === 0)).toBe(true);
    });

    it('aggregates today entry correctly', async () => {
      vi.mocked(walletLedgerRepo.getAllByTechnicianId).mockResolvedValue([
        makeEntry(`${today}T10:00:00.000Z`, 120000),
      ]);
      const res = await getEarningsHandler(makeReq('Bearer tok'), ctx) as HttpResponseInit;
      const body = res.jsonBody as any;
      expect(body.today.techAmount).toBe(120000);
      expect(body.today.count).toBe(1);
      expect(body.lifetime.techAmount).toBe(120000);
      expect(body.lifetime.count).toBe(1);
    });

    it('excludes FAILED entries from all totals', async () => {
      // getAllByTechnicianId only returns PENDING/PAID (filtered in query)
      // But also test that handler doesn't count anything returned with FAILED status
      vi.mocked(walletLedgerRepo.getAllByTechnicianId).mockResolvedValue([]);
      const res = await getEarningsHandler(makeReq('Bearer tok'), ctx) as HttpResponseInit;
      const body = res.jsonBody as any;
      expect(body.lifetime.techAmount).toBe(0);
    });

    it('lastSevenDays is always exactly 7 entries ordered oldest-to-newest', async () => {
      vi.mocked(walletLedgerRepo.getAllByTechnicianId).mockResolvedValue([
        makeEntry(`${today}T08:00:00.000Z`, 50000),
      ]);
      const res = await getEarningsHandler(makeReq('Bearer tok'), ctx) as HttpResponseInit;
      const body = res.jsonBody as any;
      expect(body.lastSevenDays).toHaveLength(7);
      expect(body.lastSevenDays[6].date).toBe(today);
      expect(body.lastSevenDays[6].techAmount).toBe(50000);
      expect(body.lastSevenDays[0].techAmount).toBe(0);
    });

    it('calls getAllByTechnicianId with the authenticated uid', async () => {
      await getEarningsHandler(makeReq('Bearer tok'), ctx);
      expect(walletLedgerRepo.getAllByTechnicianId).toHaveBeenCalledWith('tech-1');
    });
  });
  ```

- [ ] Run tests (expect import failure — handler not yet created):
  ```bash
  cd api && pnpm test -- earnings.test
  ```
  Expected: FAIL — `Cannot find module '../../src/functions/earnings.js'`

- [ ] Create `api/src/functions/earnings.ts`:
  ```ts
  import '../bootstrap.js';
  import { app } from '@azure/functions';
  import type { HttpHandler, HttpRequest, InvocationContext } from '@azure/functions';
  import { verifyTechnicianToken } from '../middleware/verifyTechnicianToken.js';
  import { walletLedgerRepo } from '../cosmos/wallet-ledger-repository.js';
  import type { EarningsResponse, EarningsPeriod, DailyEarnings } from '../schemas/wallet-ledger.js';
  import type { WalletLedgerEntry } from '../schemas/wallet-ledger.js';

  function aggregate(entries: WalletLedgerEntry[], filter: (e: WalletLedgerEntry) => boolean): EarningsPeriod {
    const subset = entries.filter(filter);
    return { techAmount: subset.reduce((s, e) => s + e.techAmount, 0), count: subset.length };
  }

  export const getEarningsHandler: HttpHandler = async (req: HttpRequest, _ctx: InvocationContext) => {
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
    const monthStr = todayStr.slice(0, 7);
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    const lastSevenDays: DailyEarnings[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayTotal = entries
        .filter(e => e.createdAt.slice(0, 10) === dateStr)
        .reduce((s, e) => s + e.techAmount, 0);
      lastSevenDays.push({ date: dateStr, techAmount: dayTotal });
    }

    const response: EarningsResponse = {
      today: aggregate(entries, e => e.createdAt.slice(0, 10) === todayStr),
      week:  aggregate(entries, e => new Date(e.createdAt) >= weekStart),
      month: aggregate(entries, e => e.createdAt.startsWith(monthStr)),
      lifetime: aggregate(entries, _ => true),
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

- [ ] Run tests:
  ```bash
  cd api && pnpm test -- earnings.test
  ```
  Expected: All 5 tests PASS.

- [ ] Run full smoke gate:
  ```bash
  bash tools/pre-codex-smoke-api.sh
  ```
  Expected: typecheck → lint → vitest all green.

- [ ] Commit:
  ```bash
  git add api/src/functions/earnings.ts api/tests/unit/earnings.test.ts
  git commit -m "feat(e08-s01): GET /v1/technicians/me/earnings with Vitest coverage"
  ```

---

## Task 4: EarningsUpdateEventBus + FCM service extension

**Files:** Create `...data/earnings/EarningsUpdateEventBus.kt`; Modify `...data/fcm/HomeservicesFcmService.kt`

- [ ] Create `technician-app/app/src/main/kotlin/com/homeservices/technician/data/earnings/EarningsUpdateEventBus.kt`:
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

- [ ] In `technician-app/app/src/main/kotlin/com/homeservices/technician/data/fcm/HomeservicesFcmService.kt`:
  - Add field injection after `ratingPromptEventBus`:
    ```kotlin
    @Inject
    public lateinit var earningsUpdateEventBus: EarningsUpdateEventBus
    ```
  - Add import:
    ```kotlin
    import com.homeservices.technician.data.earnings.EarningsUpdateEventBus
    ```
  - Add `"EARNINGS_UPDATE"` branch in `when (data["type"])` after `"RATING_PROMPT_TECHNICIAN"`:
    ```kotlin
    "EARNINGS_UPDATE" -> {
        earningsUpdateEventBus.notify()
    }
    ```
  > `tryEmit` is non-suspending — no `serviceScope.launch` needed.

- [ ] Commit:
  ```bash
  git add technician-app/app/src/main/kotlin/com/homeservices/technician/data/earnings/EarningsUpdateEventBus.kt
  git add technician-app/app/src/main/kotlin/com/homeservices/technician/data/fcm/HomeservicesFcmService.kt
  git commit -m "feat(e08-s01): EarningsUpdateEventBus + FCM EARNINGS_UPDATE handler"
  ```

---

## Task 5: Domain model + DTOs + EarningsApiService

**Files:** Create `...domain/earnings/model/EarningsSummary.kt`, `...data/earnings/remote/dto/EarningsDtos.kt`, `...data/earnings/remote/EarningsApiService.kt`, `...domain/earnings/EarningsRepository.kt`

- [ ] Create `technician-app/app/src/main/kotlin/com/homeservices/technician/domain/earnings/model/EarningsSummary.kt`:
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

- [ ] Create `technician-app/app/src/main/kotlin/com/homeservices/technician/data/earnings/remote/dto/EarningsDtos.kt`:
  ```kotlin
  package com.homeservices.technician.data.earnings.remote.dto

  import com.squareup.moshi.JsonClass

  @JsonClass(generateAdapter = true)
  public data class EarningsPeriodDto(val techAmount: Long, val count: Int)

  @JsonClass(generateAdapter = true)
  public data class DailyEarningsDto(val date: String, val techAmount: Long)

  @JsonClass(generateAdapter = true)
  public data class EarningsResponseDto(
      val today: EarningsPeriodDto,
      val week: EarningsPeriodDto,
      val month: EarningsPeriodDto,
      val lifetime: EarningsPeriodDto,
      val lastSevenDays: List<DailyEarningsDto>,
  )
  ```

- [ ] Create `technician-app/app/src/main/kotlin/com/homeservices/technician/data/earnings/remote/EarningsApiService.kt`:
  ```kotlin
  package com.homeservices.technician.data.earnings.remote

  import com.homeservices.technician.data.earnings.remote.dto.EarningsResponseDto
  import retrofit2.http.GET

  public interface EarningsApiService {
      @GET("v1/technicians/me/earnings")
      public suspend fun getEarnings(): EarningsResponseDto
  }
  ```

- [ ] Create `technician-app/app/src/main/kotlin/com/homeservices/technician/domain/earnings/EarningsRepository.kt`:
  ```kotlin
  package com.homeservices.technician.domain.earnings

  import com.homeservices.technician.domain.earnings.model.EarningsSummary

  public interface EarningsRepository {
      public suspend fun getEarnings(): Result<EarningsSummary>
  }
  ```

- [ ] Commit:
  ```bash
  git add technician-app/app/src/main/kotlin/com/homeservices/technician/domain/earnings/
  git add technician-app/app/src/main/kotlin/com/homeservices/technician/data/earnings/remote/
  git commit -m "feat(e08-s01): domain model, DTOs, EarningsApiService interface"
  ```

---

## Task 6: EarningsRepositoryImpl + GetEarningsUseCase (TDD)

**Files:** Create test files first, then impl files.

- [ ] Create `technician-app/app/src/test/kotlin/com/homeservices/technician/data/earnings/EarningsRepositoryImplTest.kt`:
  ```kotlin
  package com.homeservices.technician.data.earnings

  import com.homeservices.technician.data.earnings.remote.EarningsApiService
  import com.homeservices.technician.data.earnings.remote.dto.DailyEarningsDto
  import com.homeservices.technician.data.earnings.remote.dto.EarningsPeriodDto
  import com.homeservices.technician.data.earnings.remote.dto.EarningsResponseDto
  import io.mockk.coEvery
  import io.mockk.mockk
  import kotlinx.coroutines.test.runTest
  import org.junit.jupiter.api.Assertions.assertEquals
  import org.junit.jupiter.api.Assertions.assertTrue
  import org.junit.jupiter.api.Test

  public class EarningsRepositoryImplTest {
      private val apiService: EarningsApiService = mockk()
      private val repository = EarningsRepositoryImpl(apiService)

      private val dto = EarningsResponseDto(
          today = EarningsPeriodDto(120000L, 1),
          week = EarningsPeriodDto(360000L, 3),
          month = EarningsPeriodDto(360000L, 3),
          lifetime = EarningsPeriodDto(960000L, 8),
          lastSevenDays = listOf(DailyEarningsDto("2026-04-26", 120000L)),
      )

      @Test
      public fun `getEarnings maps DTO fields to domain model`() = runTest {
          coEvery { apiService.getEarnings() } returns dto
          val result = repository.getEarnings()
          assertTrue(result.isSuccess)
          val s = result.getOrThrow()
          assertEquals(120000L, s.today.techAmountPaise)
          assertEquals(1, s.today.count)
          assertEquals(8, s.lifetime.count)
          assertEquals(1, s.lastSevenDays.size)
          assertEquals("2026-04-26", s.lastSevenDays[0].date)
          assertEquals(120000L, s.lastSevenDays[0].techAmountPaise)
      }

      @Test
      public fun `getEarnings returns failure on API exception`() = runTest {
          coEvery { apiService.getEarnings() } throws RuntimeException("Network error")
          val result = repository.getEarnings()
          assertTrue(result.isFailure)
      }
  }
  ```

- [ ] Create `technician-app/app/src/test/kotlin/com/homeservices/technician/domain/earnings/GetEarningsUseCaseTest.kt`:
  ```kotlin
  package com.homeservices.technician.domain.earnings

  import com.homeservices.technician.domain.earnings.model.DailyEarnings
  import com.homeservices.technician.domain.earnings.model.EarningsPeriod
  import com.homeservices.technician.domain.earnings.model.EarningsSummary
  import io.mockk.coEvery
  import io.mockk.coVerify
  import io.mockk.mockk
  import kotlinx.coroutines.test.runTest
  import org.junit.jupiter.api.Assertions.assertTrue
  import org.junit.jupiter.api.Test

  public class GetEarningsUseCaseTest {
      private val repository: EarningsRepository = mockk()
      private val useCase = GetEarningsUseCase(repository)

      private val fakeSummary = EarningsSummary(
          today = EarningsPeriod(0L, 0), week = EarningsPeriod(0L, 0),
          month = EarningsPeriod(0L, 0), lifetime = EarningsPeriod(0L, 0),
          lastSevenDays = emptyList(),
      )

      @Test
      public fun `invoke delegates to repository and returns result`() = runTest {
          coEvery { repository.getEarnings() } returns Result.success(fakeSummary)
          val result = useCase.invoke()
          assertTrue(result.isSuccess)
          coVerify(exactly = 1) { repository.getEarnings() }
      }

      @Test
      public fun `invoke propagates repository failure`() = runTest {
          coEvery { repository.getEarnings() } returns Result.failure(RuntimeException())
          assertTrue(useCase.invoke().isFailure)
      }
  }
  ```

- [ ] Run tests (expect compile failures — impl not yet created):
  ```bash
  cd technician-app && ./gradlew testDebugUnitTest --tests "com.homeservices.technician.data.earnings.*" --tests "com.homeservices.technician.domain.earnings.*" 2>&1 | tail -20
  ```
  Expected: FAIL with `Unresolved reference: EarningsRepositoryImpl` and `GetEarningsUseCase`.

- [ ] Create `technician-app/app/src/main/kotlin/com/homeservices/technician/data/earnings/EarningsRepositoryImpl.kt`:
  ```kotlin
  package com.homeservices.technician.data.earnings

  import com.homeservices.technician.data.earnings.remote.EarningsApiService
  import com.homeservices.technician.domain.earnings.EarningsRepository
  import com.homeservices.technician.domain.earnings.model.DailyEarnings
  import com.homeservices.technician.domain.earnings.model.EarningsPeriod
  import com.homeservices.technician.domain.earnings.model.EarningsSummary
  import javax.inject.Inject

  public class EarningsRepositoryImpl @Inject constructor(
      private val apiService: EarningsApiService,
  ) : EarningsRepository {
      public override suspend fun getEarnings(): Result<EarningsSummary> = runCatching {
          val dto = apiService.getEarnings()
          EarningsSummary(
              today = EarningsPeriod(dto.today.techAmount, dto.today.count),
              week = EarningsPeriod(dto.week.techAmount, dto.week.count),
              month = EarningsPeriod(dto.month.techAmount, dto.month.count),
              lifetime = EarningsPeriod(dto.lifetime.techAmount, dto.lifetime.count),
              lastSevenDays = dto.lastSevenDays.map { DailyEarnings(it.date, it.techAmount) },
          )
      }
  }
  ```

- [ ] Create `technician-app/app/src/main/kotlin/com/homeservices/technician/domain/earnings/GetEarningsUseCase.kt`:
  ```kotlin
  package com.homeservices.technician.domain.earnings

  import com.homeservices.technician.domain.earnings.model.EarningsSummary
  import javax.inject.Inject

  public class GetEarningsUseCase @Inject constructor(
      private val repository: EarningsRepository,
  ) {
      public suspend fun invoke(): Result<EarningsSummary> = repository.getEarnings()
  }
  ```

- [ ] Run tests:
  ```bash
  cd technician-app && ./gradlew testDebugUnitTest --tests "com.homeservices.technician.data.earnings.*" --tests "com.homeservices.technician.domain.earnings.*" 2>&1 | tail -10
  ```
  Expected: BUILD SUCCESSFUL, 4 tests passing.

- [ ] Commit:
  ```bash
  git add technician-app/app/src/main/kotlin/com/homeservices/technician/data/earnings/EarningsRepositoryImpl.kt
  git add technician-app/app/src/main/kotlin/com/homeservices/technician/domain/earnings/GetEarningsUseCase.kt
  git add technician-app/app/src/test/kotlin/com/homeservices/technician/data/earnings/
  git add technician-app/app/src/test/kotlin/com/homeservices/technician/domain/earnings/
  git commit -m "feat(e08-s01): EarningsRepository + GetEarningsUseCase with TDD"
  ```

---

## Task 7: EarningsModule (Hilt DI)

**Files:** Create `...data/earnings/di/EarningsModule.kt`

- [ ] Create `technician-app/app/src/main/kotlin/com/homeservices/technician/data/earnings/di/EarningsModule.kt`:
  ```kotlin
  package com.homeservices.technician.data.earnings.di

  import com.homeservices.technician.data.earnings.EarningsRepositoryImpl
  import com.homeservices.technician.data.earnings.remote.EarningsApiService
  import com.homeservices.technician.data.rating.di.AuthOkHttpClient
  import com.homeservices.technician.domain.earnings.EarningsRepository
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
  > `@AuthOkHttpClient` is imported from `com.homeservices.technician.data.rating.di`. Do NOT define a new auth client — reuse the existing one that adds the Firebase Bearer token.

- [ ] Verify assembleDebug compiles:
  ```bash
  cd technician-app && ./gradlew assembleDebug --quiet 2>&1 | tail -10
  ```
  Expected: BUILD SUCCESSFUL.

- [ ] Commit:
  ```bash
  git add technician-app/app/src/main/kotlin/com/homeservices/technician/data/earnings/di/EarningsModule.kt
  git commit -m "feat(e08-s01): Hilt EarningsModule — binds EarningsRepository, provides EarningsApiService"
  ```

---

## Task 8: EarningsViewModel (TDD)

**Files:** Create test first, then impl.

- [ ] Create `technician-app/app/src/test/kotlin/com/homeservices/technician/ui/earnings/EarningsViewModelTest.kt`:
  ```kotlin
  package com.homeservices.technician.ui.earnings

  import com.homeservices.technician.data.earnings.EarningsUpdateEventBus
  import com.homeservices.technician.domain.earnings.GetEarningsUseCase
  import com.homeservices.technician.domain.earnings.model.DailyEarnings
  import com.homeservices.technician.domain.earnings.model.EarningsPeriod
  import com.homeservices.technician.domain.earnings.model.EarningsSummary
  import io.mockk.coEvery
  import io.mockk.coVerify
  import io.mockk.mockk
  import kotlinx.coroutines.Dispatchers
  import kotlinx.coroutines.ExperimentalCoroutinesApi
  import kotlinx.coroutines.test.UnconfinedTestDispatcher
  import kotlinx.coroutines.test.resetMain
  import kotlinx.coroutines.test.runTest
  import kotlinx.coroutines.test.setMain
  import org.junit.jupiter.api.AfterEach
  import org.junit.jupiter.api.Assertions.assertEquals
  import org.junit.jupiter.api.Assertions.assertInstanceOf
  import org.junit.jupiter.api.BeforeEach
  import org.junit.jupiter.api.Test

  @OptIn(ExperimentalCoroutinesApi::class)
  public class EarningsViewModelTest {
      private val dispatcher = UnconfinedTestDispatcher()
      private val useCase: GetEarningsUseCase = mockk()
      private val eventBus = EarningsUpdateEventBus()

      private val fakeSummary = EarningsSummary(
          today = EarningsPeriod(120000L, 1), week = EarningsPeriod(240000L, 2),
          month = EarningsPeriod(360000L, 3), lifetime = EarningsPeriod(960000L, 8),
          lastSevenDays = List(7) { DailyEarnings("2026-04-${20 + it}", 0L) },
      )

      @BeforeEach
      public fun setUp() { Dispatchers.setMain(dispatcher) }

      @AfterEach
      public fun tearDown() { Dispatchers.resetMain() }

      @Test
      public fun `init loads earnings and transitions to Success`() = runTest {
          coEvery { useCase.invoke() } returns Result.success(fakeSummary)
          val vm = EarningsViewModel(useCase, eventBus)
          assertInstanceOf(EarningsUiState.Success::class.java, vm.uiState.value)
          assertEquals(fakeSummary, (vm.uiState.value as EarningsUiState.Success).summary)
      }

      @Test
      public fun `init failure transitions to Error`() = runTest {
          coEvery { useCase.invoke() } returns Result.failure(RuntimeException())
          val vm = EarningsViewModel(useCase, eventBus)
          assertEquals(EarningsUiState.Error, vm.uiState.value)
      }

      @Test
      public fun `refresh() reloads earnings`() = runTest {
          coEvery { useCase.invoke() } returns Result.success(fakeSummary)
          val vm = EarningsViewModel(useCase, eventBus)
          vm.refresh()
          coVerify(exactly = 2) { useCase.invoke() }
      }

      @Test
      public fun `FCM notify triggers reload`() = runTest {
          coEvery { useCase.invoke() } returns Result.success(fakeSummary)
          val vm = EarningsViewModel(useCase, eventBus)
          eventBus.notify()
          coVerify(atLeast = 2) { useCase.invoke() }
      }
  }
  ```

- [ ] Run test (expect compile failure):
  ```bash
  cd technician-app && ./gradlew testDebugUnitTest --tests "com.homeservices.technician.ui.earnings.EarningsViewModelTest" 2>&1 | tail -10
  ```

- [ ] Create `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/earnings/EarningsUiState.kt`:
  ```kotlin
  package com.homeservices.technician.ui.earnings

  import com.homeservices.technician.domain.earnings.model.EarningsSummary

  public sealed class EarningsUiState {
      public object Loading : EarningsUiState()
      public data class Success(val summary: EarningsSummary) : EarningsUiState()
      public object Error : EarningsUiState()
  }
  ```

- [ ] Create `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/earnings/EarningsViewModel.kt`:
  ```kotlin
  package com.homeservices.technician.ui.earnings

  import androidx.lifecycle.ViewModel
  import androidx.lifecycle.viewModelScope
  import com.homeservices.technician.data.earnings.EarningsUpdateEventBus
  import com.homeservices.technician.domain.earnings.GetEarningsUseCase
  import dagger.hilt.android.lifecycle.HiltViewModel
  import kotlinx.coroutines.flow.MutableStateFlow
  import kotlinx.coroutines.flow.StateFlow
  import kotlinx.coroutines.flow.asStateFlow
  import kotlinx.coroutines.launch
  import javax.inject.Inject

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

- [ ] Run tests:
  ```bash
  cd technician-app && ./gradlew testDebugUnitTest --tests "com.homeservices.technician.ui.earnings.EarningsViewModelTest" 2>&1 | tail -10
  ```
  Expected: BUILD SUCCESSFUL, 4 tests passing.

- [ ] Commit:
  ```bash
  git add technician-app/app/src/main/kotlin/com/homeservices/technician/ui/earnings/EarningsUiState.kt
  git add technician-app/app/src/main/kotlin/com/homeservices/technician/ui/earnings/EarningsViewModel.kt
  git add technician-app/app/src/test/kotlin/com/homeservices/technician/ui/earnings/EarningsViewModelTest.kt
  git commit -m "feat(e08-s01): EarningsViewModel with FCM refresh and TDD"
  ```

---

## Task 9: EarningsScreen Compose UI

**Files:** Create `...ui/earnings/EarningsScreen.kt`

- [ ] Create `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/earnings/EarningsScreen.kt`:
  ```kotlin
  package com.homeservices.technician.ui.earnings

  import androidx.compose.foundation.Canvas
  import androidx.compose.foundation.layout.*
  import androidx.compose.foundation.lazy.LazyColumn
  import androidx.compose.material3.*
  import androidx.compose.runtime.Composable
  import androidx.compose.runtime.getValue
  import androidx.compose.ui.Alignment
  import androidx.compose.ui.Modifier
  import androidx.compose.ui.geometry.Offset
  import androidx.compose.ui.geometry.Size
  import androidx.compose.ui.unit.dp
  import androidx.hilt.navigation.compose.hiltViewModel
  import androidx.lifecycle.compose.collectAsStateWithLifecycle
  import com.homeservices.technician.domain.earnings.model.DailyEarnings
  import com.homeservices.technician.domain.earnings.model.EarningsPeriod
  import com.homeservices.technician.domain.earnings.model.EarningsSummary
  import java.time.LocalDate
  import java.time.format.TextStyle
  import java.util.Locale

  @Composable
  internal fun EarningsScreen(
      modifier: Modifier = Modifier,
      viewModel: EarningsViewModel = hiltViewModel(),
  ) {
      val uiState by viewModel.uiState.collectAsStateWithLifecycle()
      Scaffold(
          topBar = { TopAppBar(title = { Text("कमाई") }) },
          modifier = modifier,
      ) { padding ->
          Box(
              modifier = Modifier.fillMaxSize().padding(padding),
              contentAlignment = Alignment.Center,
          ) {
              when (val state = uiState) {
                  is EarningsUiState.Loading -> CircularProgressIndicator()
                  is EarningsUiState.Error -> Column(
                      horizontalAlignment = Alignment.CenterHorizontally,
                      verticalArrangement = Arrangement.spacedBy(12.dp),
                  ) {
                      Text("डेटा लोड नहीं हो सका", style = MaterialTheme.typography.bodyLarge)
                      Button(onClick = viewModel::refresh) { Text("पुनः प्रयास करें") }
                  }
                  is EarningsUiState.Success -> SuccessContent(summary = state.summary, modifier = Modifier.fillMaxSize())
              }
          }
      }
  }

  @Composable
  private fun SuccessContent(summary: EarningsSummary, modifier: Modifier = Modifier) {
      LazyColumn(
          modifier = modifier,
          contentPadding = PaddingValues(16.dp),
          verticalArrangement = Arrangement.spacedBy(16.dp),
      ) {
          item {
              Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                  Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                      PeriodCard("आज", summary.today, modifier = Modifier.weight(1f))
                      PeriodCard("इस सप्ताह", summary.week, modifier = Modifier.weight(1f))
                  }
                  Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                      PeriodCard("इस महीने", summary.month, modifier = Modifier.weight(1f))
                      PeriodCard("कुल", summary.lifetime, modifier = Modifier.weight(1f))
                  }
              }
          }
          item { GoalProgressCard(summary.month.techAmountPaise) }
          item { SparklineCard(summary.lastSevenDays) }
      }
  }

  @Composable
  private fun PeriodCard(label: String, period: EarningsPeriod, modifier: Modifier = Modifier) {
      Card(modifier = modifier) {
          Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
              Text(label, style = MaterialTheme.typography.labelMedium)
              Text(formatRupees(period.techAmountPaise), style = MaterialTheme.typography.titleLarge)
              Text("${period.count} jobs", style = MaterialTheme.typography.bodySmall)
          }
      }
  }

  private val MONTHLY_GOAL_PAISE = 3_500_000L

  @Composable
  private fun GoalProgressCard(monthAmountPaise: Long) {
      Card(modifier = Modifier.fillMaxWidth()) {
          Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
              Text("Monthly Goal", style = MaterialTheme.typography.labelMedium)
              LinearProgressIndicator(
                  progress = { (monthAmountPaise.toFloat() / MONTHLY_GOAL_PAISE).coerceIn(0f, 1f) },
                  modifier = Modifier.fillMaxWidth(),
              )
              Text(
                  "${formatRupees(monthAmountPaise)} / ${formatRupees(MONTHLY_GOAL_PAISE)}",
                  style = MaterialTheme.typography.bodySmall,
              )
          }
      }
  }

  @Composable
  private fun SparklineCard(days: List<DailyEarnings>) {
      Card(modifier = Modifier.fillMaxWidth()) {
          Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
              Text("पिछले 7 दिन", style = MaterialTheme.typography.labelMedium)
              EarningsSparkline(days = days, modifier = Modifier.fillMaxWidth().height(80.dp))
          }
      }
  }

  @Composable
  private fun EarningsSparkline(days: List<DailyEarnings>, modifier: Modifier = Modifier) {
      if (days.isEmpty()) return
      val maxAmount = days.maxOfOrNull { it.techAmountPaise } ?: 0L
      val barColor = MaterialTheme.colorScheme.primary
      val labelColor = MaterialTheme.colorScheme.onSurfaceVariant

      Column(modifier = modifier) {
          Canvas(modifier = Modifier.weight(1f).fillMaxWidth()) {
              val count = days.size
              val spacing = size.width / count
              val barWidth = spacing * 0.6f
              val minBarPx = 4.dp.toPx()
              val maxBarHeight = size.height - minBarPx

              days.forEachIndexed { i, day ->
                  val barHeight = if (maxAmount > 0L)
                      (day.techAmountPaise.toFloat() / maxAmount) * maxBarHeight + minBarPx
                  else minBarPx
                  val x = i * spacing + (spacing - barWidth) / 2f
                  drawRect(
                      color = barColor,
                      topLeft = Offset(x, size.height - barHeight),
                      size = Size(barWidth, barHeight),
                  )
              }
          }
          Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
              days.forEach { day ->
                  val label = try {
                      LocalDate.parse(day.date).dayOfWeek.getDisplayName(TextStyle.SHORT, Locale.ENGLISH)
                  } catch (_: Exception) { "?" }
                  Text(label, style = MaterialTheme.typography.labelSmall, color = labelColor)
              }
          }
      }
  }

  private fun formatRupees(paise: Long): String = "₹%,.0f".format(paise / 100.0)
  ```

- [ ] Compile check:
  ```bash
  cd technician-app && ./gradlew assembleDebug --quiet 2>&1 | tail -10
  ```
  Expected: BUILD SUCCESSFUL.

---

## Task 10: Navigation wiring + Paparazzi stub + final commit

**Files:** Modify `...navigation/HomeGraph.kt`; Create `...ui/earnings/EarningsScreenTest.kt`

- [ ] In `technician-app/app/src/main/kotlin/com/homeservices/technician/navigation/HomeGraph.kt`:
  - Replace `Box(modifier = Modifier.fillMaxSize())` in the `home_dashboard` composable with `EarningsScreen()`
  - Add import: `import com.homeservices.technician.ui.earnings.EarningsScreen`
  - The diff is:
    ```kotlin
    // BEFORE:
    composable("home_dashboard") {
        Box(modifier = Modifier.fillMaxSize())
    }
    // AFTER:
    composable("home_dashboard") {
        EarningsScreen()
    }
    ```
  - Remove the `Box` import if it is now unused (check — `Box` is also used in the outer `Box` in HomeGraph, so keep the import).

- [ ] Create `technician-app/app/src/test/kotlin/com/homeservices/technician/ui/earnings/EarningsScreenTest.kt`:
  ```kotlin
  package com.homeservices.technician.ui.earnings

  import org.junit.jupiter.api.Disabled
  import org.junit.jupiter.api.Test

  public class EarningsScreenTest {
      @Test
      @Disabled
      public fun earningsScreenGolden(): Unit = Unit
  }
  ```

- [ ] Delete any auto-generated Paparazzi goldens (Windows artifacts):
  ```bash
  git rm -r technician-app/src/test/snapshots/images/ 2>/dev/null || true
  ```

- [ ] Full compile + all unit tests:
  ```bash
  cd technician-app && ./gradlew assembleDebug testDebugUnitTest --quiet 2>&1 | tail -15
  ```
  Expected: BUILD SUCCESSFUL, all tests green.

- [ ] Commit all remaining files:
  ```bash
  git add technician-app/app/src/main/kotlin/com/homeservices/technician/ui/earnings/EarningsScreen.kt
  git add technician-app/app/src/main/kotlin/com/homeservices/technician/navigation/HomeGraph.kt
  git add technician-app/app/src/test/kotlin/com/homeservices/technician/ui/earnings/EarningsScreenTest.kt
  git commit -m "feat(e08-s01): EarningsScreen (cards + goal bar + sparkline) wired into home_dashboard"
  ```

---

## Task 11: Smoke gates + /superpowers:code-reviewer

- [ ] Run API smoke gate:
  ```bash
  bash tools/pre-codex-smoke-api.sh
  ```
  Expected: typecheck → lint → vitest — all green.

- [ ] Run Android smoke gate:
  ```bash
  bash tools/pre-codex-smoke.sh technician-app
  ```
  Expected: assembleDebug → ktlintCheck → testDebugUnitTest → koverVerify — all green.

- [ ] If either gate fails — fix before proceeding. Common issues:
  - `MissingExplicitModifiers` → add `public` to all new Kotlin declarations
  - `Unresolved reference` → check import paths match package declarations
  - Vitest failure → check mock module paths match actual file paths (`.js` extension required)

- [ ] After both gates green: invoke `/superpowers:code-reviewer` for substitute review

- [ ] Open PR (do NOT merge — hold for Codex review on 2026-04-28 17:37 IST):
  ```bash
  git push -u origin HEAD
  gh pr create --title "feat(E08-S01): tech earnings dashboard" --body "$(cat <<'EOF'
  ## Summary
  - Adds `GET /v1/technicians/me/earnings` — single-partition Cosmos scan, in-memory aggregation for today/week/month/lifetime + 7-day sparkline
  - Extends `HomeservicesFcmService` to handle `EARNINGS_UPDATE` and notify `EarningsUpdateEventBus`
  - Adds `EarningsScreen` as `home_dashboard` — 4 period cards + goal progress bar (₹35k/month) + Canvas sparkline
  - Full TDD: 4 Vitest tests (API) + 2 repository + 2 use case + 4 ViewModel tests

  ## Test plan
  - [ ] `bash tools/pre-codex-smoke-api.sh` → all green
  - [ ] `bash tools/pre-codex-smoke.sh technician-app` → all green
  - [ ] Codex review on 2026-04-28 before merge

  🤖 Generated with [Claude Code](https://claude.com/claude-code)
  EOF
  )"
  ```

---

*E08-S01 plan complete. Story: `docs/stories/E08-S01-tech-earnings-dashboard.md`*
