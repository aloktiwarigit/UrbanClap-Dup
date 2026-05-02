# E11-S01a-2 — Per-App Room Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land per-app Room persistence for `pending_actions` in both customer-app and technician-app: `PendingActionEntity` (Room `@Entity`), `PendingActionDao` (8 methods per spec §3.4), `PendingActionDatabase` (v1 schema, exported), `PendingActionStore` (thin domain-facing facade), and a Hilt module providing the lot to each app's singleton graph.

**Architecture:** Both apps get an identically-shaped `data/pendingActions/` package under their own root namespace. The DAO's `purgeExpired` constrains to `status='ACTIVE'` so `purgeTombstones` (30-day cutoff) controls tombstone retention — the FCM TTL invariant from spec §2.10 (tombstone window > 28-day FCM max) is enforced at the SQL level. `PendingActionStore` exposes `PendingAction` (domain type from `core-nav`); `PendingActionEntity` (persistence type) never leaks past the store.

**Tech Stack:** Kotlin 2.0.21 (`-Xexplicit-api=strict`, `-Werror`), Room 2.6.1 (already in `libs.versions.toml`, first use), Hilt 2.52, kotlinx-coroutines-core 1.8.1, JUnit 5 + Robolectric + AssertJ.

**Prerequisite:** **E11-S01a-1 must be merged to `main`.** The Room layer references `PendingAction`, `PendingActionType`, `PendingActionStatus`, and `PendingActionPriority` from `core-nav`.
**Produces:** Per-app `PendingActionDatabase` + `PendingActionDao` + `PendingActionStore` wired through Hilt; v1 schema JSON exported under each app's `app/schemas/`; both apps continue to assemble.
**Out of scope:** kotlinx-serialization typed-route spike (E11-S01a-3); `PendingActionIngestor` orchestrator + FCM service refactor (S01b-1); reconcile-driver and store consumers (S01b-1).

---

## Spec & invariants

- Spec: `docs/superpowers/specs/2026-05-01-e11-durable-screen-hooks-design.md` §3.4 + §5 "E11-S01a"
- This plan is part 2 of a size-gate-driven 3-way split: `E11-S01a-1` (core-nav), `E11-S01a-2` (this), `E11-S01a-3` (typed-routes spike).
- DAO `purgeExpired` SQL **must** include `status = 'ACTIVE'` so RESOLVED tombstones are protected by `purgeTombstones`'s 30-day cutoff (FCM TTL invariant per spec §2.10).
- `PendingActionEntity` mirrors `PendingAction` shape exactly + adds `lastFetchedAt: Long` (used by reconcile-driver in S01b-1).
- Hilt test scoping per `docs/patterns/hilt-module-android-test-scope.md` (Robolectric for in-memory Room tests; no `@HiltAndroidTest`).
- Room schema export must produce `app/schemas/<package>.PendingActionDatabase/1.json` so future migration tests in S01b-1 can pin against v1.

---

## File Structure

| Path | Action | Responsibility |
|---|---|---|
| `customer-app/app/build.gradle.kts` | Modify | Add Room deps + `room.schemaLocation` ksp arg + Kover exclusions |
| `customer-app/app/src/main/kotlin/com/homeservices/customer/data/pendingActions/PendingActionEntity.kt` | Create | Room `@Entity` mirroring `PendingAction` + `lastFetchedAt` + `toDomain` / `fromDomain` |
| `customer-app/app/src/main/kotlin/com/homeservices/customer/data/pendingActions/PendingActionDao.kt` | Create | Room DAO — 8 methods per spec §3.4 |
| `customer-app/app/src/main/kotlin/com/homeservices/customer/data/pendingActions/PendingActionDatabase.kt` | Create | Room `@Database`, v1, schema exported |
| `customer-app/app/src/main/kotlin/com/homeservices/customer/data/pendingActions/PendingActionStore.kt` | Create | Thin domain-facing facade |
| `customer-app/app/src/main/kotlin/com/homeservices/customer/data/pendingActions/di/PendingActionModule.kt` | Create | Hilt `@Module` (DB + DAO + store) |
| `customer-app/app/src/test/kotlin/com/homeservices/customer/data/pendingActions/PendingActionDaoTest.kt` | Create | Robolectric in-memory Room — 8 tests covering DAO behavior |
| `customer-app/app/schemas/com.homeservices.customer.data.pendingActions.PendingActionDatabase/1.json` | Create (Room-generated) | Locked v1 schema |
| `technician-app/...` | Create | Mirror of all customer-app files in the `com.homeservices.technician.data.pendingActions` package |

---

## Work-stream graph

```
WS-B-customer  (4 tasks: B1 → B2 → B3) ─┐
                                         ├─► WS-D (smoke + Codex)
WS-B-technician (3 tasks: BT1 → BT2 → BT3) ─┘
```

The two WS-B streams are independent — different files, different package. Run as parallel Sonnet subagents. Smoke + Codex run after both streams merge into the working branch.

---

## WS-B-customer — customer-app Room layer

### Task B1 — Add Room deps + `PendingActionEntity`

- [ ] **B1.1 — Add Room deps to `customer-app/app/build.gradle.kts`**

  In the `dependencies { ... }` block, alongside other implementations (Room libs already exist in `libs.versions.toml`):

  ```kotlin
  implementation(libs.room.runtime)
  implementation(libs.room.ktx)
  ksp(libs.room.compiler)
  ```

- [ ] **B1.2 — Configure Room schema export**

  Find the existing `ksp { ... }` block at the bottom of `customer-app/app/build.gradle.kts` (currently has `arg("dagger.hilt.android.internal.disableAndroidSuperclassValidation", "true")`) and add inside the same block:

  ```kotlin
  arg("room.schemaLocation", "$projectDir/schemas")
  ```

- [ ] **B1.3 — Create `customer-app/app/src/main/kotlin/com/homeservices/customer/data/pendingActions/PendingActionEntity.kt`**

  ```kotlin
  package com.homeservices.customer.data.pendingActions

  import androidx.room.Entity
  import androidx.room.Index
  import androidx.room.PrimaryKey
  import com.homeservices.corenav.PendingAction
  import com.homeservices.corenav.PendingActionPriority
  import com.homeservices.corenav.PendingActionStatus
  import com.homeservices.corenav.PendingActionType

  @Entity(
      tableName = "pending_actions",
      indices = [
          Index("status"),
          Index("type"),
          Index("expiresAt"),
          Index("priority"),
          Index("createdAt"),
      ],
  )
  public data class PendingActionEntity(
      @PrimaryKey public val id: String,
      public val userId: String,
      public val role: String,
      public val type: String,
      public val entityType: String,
      public val entityId: String,
      public val routeUri: String,
      public val priority: String,
      public val status: String,
      public val sourceStatus: String?,
      public val version: Long,
      public val createdAt: Long,
      public val updatedAt: Long,
      public val expiresAt: Long?,
      public val resolvedAt: Long?,
      public val lastFetchedAt: Long,
  ) {
      public fun toDomain(): PendingAction = PendingAction(
          id = id, userId = userId, role = role,
          type = PendingActionType.valueOf(type),
          entityType = entityType, entityId = entityId, routeUri = routeUri,
          priority = PendingActionPriority.valueOf(priority),
          status = PendingActionStatus.valueOf(status),
          sourceStatus = sourceStatus, version = version,
          createdAt = createdAt, updatedAt = updatedAt,
          expiresAt = expiresAt, resolvedAt = resolvedAt,
      )

      public companion object {
          public fun fromDomain(action: PendingAction, lastFetchedAt: Long): PendingActionEntity =
              PendingActionEntity(
                  id = action.id, userId = action.userId, role = action.role,
                  type = action.type.name,
                  entityType = action.entityType, entityId = action.entityId,
                  routeUri = action.routeUri,
                  priority = action.priority.name, status = action.status.name,
                  sourceStatus = action.sourceStatus, version = action.version,
                  createdAt = action.createdAt, updatedAt = action.updatedAt,
                  expiresAt = action.expiresAt, resolvedAt = action.resolvedAt,
                  lastFetchedAt = lastFetchedAt,
              )
      }
  }
  ```

- [ ] **B1.4 — Compile + commit**

  ```bash
  cd customer-app && ./gradlew :app:compileDebugKotlin && cd ..
  git add customer-app/app/build.gradle.kts \
          customer-app/app/src/main/kotlin/com/homeservices/customer/data/pendingActions/PendingActionEntity.kt
  git commit -m "feat(customer-app): PendingActionEntity (Room) for E11"
  ```

---

### Task B2 — `PendingActionDao` + `PendingActionDatabase` (TDD)

- [ ] **B2.1 — Failing test `customer-app/app/src/test/kotlin/com/homeservices/customer/data/pendingActions/PendingActionDaoTest.kt`**

  ```kotlin
  package com.homeservices.customer.data.pendingActions

  import android.content.Context
  import androidx.room.Room
  import androidx.test.core.app.ApplicationProvider
  import com.homeservices.corenav.PendingActionType
  import kotlinx.coroutines.flow.first
  import kotlinx.coroutines.test.runTest
  import org.assertj.core.api.Assertions.assertThat
  import org.junit.jupiter.api.AfterEach
  import org.junit.jupiter.api.BeforeEach
  import org.junit.jupiter.api.Test
  import org.junit.runner.RunWith
  import org.robolectric.RobolectricTestRunner
  import org.robolectric.annotation.Config

  @RunWith(RobolectricTestRunner::class)
  @Config(sdk = [33])
  class PendingActionDaoTest {
      private lateinit var db: PendingActionDatabase
      private lateinit var dao: PendingActionDao

      @BeforeEach
      fun setUp() {
          val ctx = ApplicationProvider.getApplicationContext<Context>()
          db = Room.inMemoryDatabaseBuilder(ctx, PendingActionDatabase::class.java)
              .allowMainThreadQueries()
              .build()
          dao = db.pendingActionDao()
      }

      @AfterEach
      fun tearDown() = db.close()

      private fun row(
          id: String,
          status: String = "ACTIVE",
          priority: String = "NORMAL",
          createdAt: Long = 0L,
          expiresAt: Long? = null,
          resolvedAt: Long? = null,
          type: String = PendingActionType.COMPLAINT_UPDATE.name,
      ) = PendingActionEntity(
          id = id, userId = "u-1", role = "customer",
          type = type, entityType = "x", entityId = "1",
          routeUri = "", priority = priority, status = status,
          sourceStatus = null, version = 1L,
          createdAt = createdAt, updatedAt = createdAt,
          expiresAt = expiresAt, resolvedAt = resolvedAt,
          lastFetchedAt = 0L,
      )

      @Test
      fun `upsertAll then observeActive returns rows in priority desc createdAt asc order`() = runTest {
          dao.upsertAll(listOf(
              row(id = "a", priority = "LOW",    createdAt = 1L),
              row(id = "b", priority = "HIGH",   createdAt = 5L),
              row(id = "c", priority = "NORMAL", createdAt = 3L),
              row(id = "d", priority = "HIGH",   createdAt = 2L),
          ))
          assertThat(dao.observeActive("u-1").first().map { it.id })
              .containsExactly("d", "b", "c", "a")
      }

      @Test
      fun `observeActive omits RESOLVED rows`() = runTest {
          dao.upsertAll(listOf(
              row(id = "a", status = "ACTIVE"),
              row(id = "b", status = "RESOLVED", resolvedAt = 1L),
          ))
          assertThat(dao.observeActive("u-1").first().map { it.id }).containsExactly("a")
      }

      @Test
      fun `markMissingAsResolved tombstones rows not in keep set`() = runTest {
          dao.upsertAll(listOf(row(id = "a"), row(id = "b"), row(id = "c")))
          dao.markMissingAsResolved(userId = "u-1", keep = setOf("a"), now = 100L)
          assertThat(dao.findById("a")?.status).isEqualTo("ACTIVE")
          assertThat(dao.findById("b")?.status).isEqualTo("RESOLVED")
          assertThat(dao.findById("b")?.resolvedAt).isEqualTo(100L)
          assertThat(dao.findById("c")?.status).isEqualTo("RESOLVED")
      }

      @Test
      fun `markMissingAsResolved leaves already-resolved rows alone`() = runTest {
          dao.upsertAll(listOf(row(id = "a", status = "RESOLVED", resolvedAt = 50L)))
          dao.markMissingAsResolved(userId = "u-1", keep = emptySet(), now = 200L)
          assertThat(dao.findById("a")?.resolvedAt).isEqualTo(50L)
      }

      @Test
      fun `markResolved sets the row to RESOLVED with timestamp`() = runTest {
          dao.upsertAll(listOf(row(id = "a")))
          dao.markResolved(id = "a", now = 999L)
          assertThat(dao.findById("a")?.status).isEqualTo("RESOLVED")
          assertThat(dao.findById("a")?.resolvedAt).isEqualTo(999L)
      }

      @Test
      fun `purgeExpired deletes only ACTIVE rows whose expiresAt has passed`() = runTest {
          dao.upsertAll(listOf(
              row(id = "a", status = "ACTIVE",   expiresAt = 100L),
              row(id = "b", status = "ACTIVE",   expiresAt = 500L),
              row(id = "c", status = "ACTIVE",   expiresAt = null),
              row(id = "d", status = "RESOLVED", expiresAt = 100L, resolvedAt = 200L),
          ))
          dao.purgeExpired(now = 300L)
          assertThat(dao.findById("a")).isNull()              // expired & active → purged
          assertThat(dao.findById("b")).isNotNull             // not yet expired
          assertThat(dao.findById("c")).isNotNull             // null expiresAt → never purged here
          assertThat(dao.findById("d")).isNotNull             // RESOLVED tombstone → protected
      }

      @Test
      fun `purgeTombstones deletes only RESOLVED rows whose resolvedAt is older than cutoff`() = runTest {
          dao.upsertAll(listOf(
              row(id = "a", status = "RESOLVED", resolvedAt = 100L),
              row(id = "b", status = "RESOLVED", resolvedAt = 500L),
              row(id = "c", status = "ACTIVE",   resolvedAt = null),
          ))
          dao.purgeTombstones(cutoff = 200L)
          assertThat(dao.findById("a")).isNull()
          assertThat(dao.findById("b")).isNotNull
          assertThat(dao.findById("c")).isNotNull
      }

      @Test
      fun `clearAll empties the table`() = runTest {
          dao.upsertAll(listOf(row(id = "a"), row(id = "b")))
          dao.clearAll()
          assertThat(dao.observeActive("u-1").first()).isEmpty()
      }
  }
  ```

- [ ] **B2.2 — Run test — fails (DAO + DB don't exist)**

  ```bash
  cd customer-app && ./gradlew :app:testDebugUnitTest --tests "*PendingActionDaoTest"
  ```

- [ ] **B2.3 — Create `customer-app/app/src/main/kotlin/com/homeservices/customer/data/pendingActions/PendingActionDao.kt`**

  ```kotlin
  package com.homeservices.customer.data.pendingActions

  import androidx.room.Dao
  import androidx.room.Insert
  import androidx.room.OnConflictStrategy
  import androidx.room.Query
  import kotlinx.coroutines.flow.Flow

  @Dao
  public interface PendingActionDao {
      @Insert(onConflict = OnConflictStrategy.REPLACE)
      public suspend fun upsertAll(rows: List<PendingActionEntity>)

      /**
       * Tombstone rows present locally but missing from the server response.
       * Only ACTIVE rows are touched — RESOLVED rows keep their original `resolvedAt`.
       */
      @Query(
          """
          UPDATE pending_actions
          SET status = 'RESOLVED', resolvedAt = :now
          WHERE userId = :userId AND status = 'ACTIVE' AND id NOT IN (:keep)
          """,
      )
      public suspend fun markMissingAsResolved(userId: String, keep: Set<String>, now: Long)

      @Query(
          """
          SELECT * FROM pending_actions
          WHERE userId = :userId AND status = 'ACTIVE'
          ORDER BY
              CASE priority WHEN 'HIGH' THEN 0 WHEN 'NORMAL' THEN 1 ELSE 2 END,
              createdAt ASC
          """,
      )
      public fun observeActive(userId: String): Flow<List<PendingActionEntity>>

      @Query("SELECT * FROM pending_actions WHERE id = :id LIMIT 1")
      public suspend fun findById(id: String): PendingActionEntity?

      @Query("UPDATE pending_actions SET status = 'RESOLVED', resolvedAt = :now WHERE id = :id")
      public suspend fun markResolved(id: String, now: Long)

      /**
       * Purge ACTIVE rows whose TTL has passed. RESOLVED tombstones are protected here —
       * they are handled by [purgeTombstones] only after the 30-day window
       * (FCM TTL > 28 days, see spec §2.10).
       */
      @Query(
          """
          DELETE FROM pending_actions
          WHERE status = 'ACTIVE' AND expiresAt IS NOT NULL AND expiresAt < :now
          """,
      )
      public suspend fun purgeExpired(now: Long)

      /** Tombstone purge: RESOLVED rows older than the 30-day cutoff. */
      @Query(
          """
          DELETE FROM pending_actions
          WHERE status = 'RESOLVED' AND resolvedAt IS NOT NULL AND resolvedAt < :cutoff
          """,
      )
      public suspend fun purgeTombstones(cutoff: Long)

      @Query("DELETE FROM pending_actions")
      public suspend fun clearAll()
  }
  ```

- [ ] **B2.4 — Create `customer-app/app/src/main/kotlin/com/homeservices/customer/data/pendingActions/PendingActionDatabase.kt`**

  ```kotlin
  package com.homeservices.customer.data.pendingActions

  import androidx.room.Database
  import androidx.room.RoomDatabase

  @Database(
      entities = [PendingActionEntity::class],
      version = 1,
      exportSchema = true,
  )
  public abstract class PendingActionDatabase : RoomDatabase() {
      public abstract fun pendingActionDao(): PendingActionDao
  }
  ```

- [ ] **B2.5 — Run test — must pass; verify schema export**

  ```bash
  cd customer-app && ./gradlew :app:testDebugUnitTest --tests "*PendingActionDaoTest" && cd ..
  ls customer-app/app/schemas/com.homeservices.customer.data.pendingActions.PendingActionDatabase/
  ```

  Expected: 8 tests pass; `1.json` exists in the schemas directory. The schema file locks v1 for migration tests added in S01b-1.

- [ ] **B2.6 — Commit**

  ```bash
  git add customer-app/app/src/main/kotlin/com/homeservices/customer/data/pendingActions/PendingActionDao.kt \
          customer-app/app/src/main/kotlin/com/homeservices/customer/data/pendingActions/PendingActionDatabase.kt \
          customer-app/app/src/test/kotlin/com/homeservices/customer/data/pendingActions/PendingActionDaoTest.kt \
          customer-app/app/schemas/
  git commit -m "feat(customer-app): PendingActionDao + Database with full query suite"
  ```

---

### Task B3 — `PendingActionStore` + Hilt module

- [ ] **B3.1 — Create `customer-app/app/src/main/kotlin/com/homeservices/customer/data/pendingActions/PendingActionStore.kt`**

  ```kotlin
  package com.homeservices.customer.data.pendingActions

  import com.homeservices.corenav.PendingAction
  import kotlinx.coroutines.flow.Flow
  import kotlinx.coroutines.flow.map
  import javax.inject.Inject
  import javax.inject.Singleton

  /**
   * Thin facade over [PendingActionDao]. Conversion between [PendingAction] (domain)
   * and [PendingActionEntity] (persistence) lives here; consumers never see entities.
   *
   * `PendingActionIngestor` (S01b-1) will call this — version-compare logic and FCM
   * orchestration are NOT this class's concern.
   */
  @Singleton
  public class PendingActionStore
      @Inject
      constructor(
          private val dao: PendingActionDao,
      ) {
          public suspend fun upsertAll(actions: List<PendingAction>, lastFetchedAt: Long) {
              dao.upsertAll(actions.map { PendingActionEntity.fromDomain(it, lastFetchedAt) })
          }

          public suspend fun upsert(action: PendingAction, lastFetchedAt: Long) {
              dao.upsertAll(listOf(PendingActionEntity.fromDomain(action, lastFetchedAt)))
          }

          public fun observeActive(userId: String): Flow<List<PendingAction>> =
              dao.observeActive(userId).map { rows -> rows.map { it.toDomain() } }

          public suspend fun findById(id: String): PendingAction? = dao.findById(id)?.toDomain()

          public suspend fun markMissingAsResolved(userId: String, keep: Set<String>, now: Long) {
              dao.markMissingAsResolved(userId, keep, now)
          }

          public suspend fun markResolved(id: String, now: Long) = dao.markResolved(id, now)

          public suspend fun purgeExpired(now: Long) = dao.purgeExpired(now)

          public suspend fun purgeTombstones(cutoff: Long) = dao.purgeTombstones(cutoff)

          public suspend fun clearAll() = dao.clearAll()
      }
  ```

- [ ] **B3.2 — Create Hilt module `customer-app/app/src/main/kotlin/com/homeservices/customer/data/pendingActions/di/PendingActionModule.kt`**

  ```kotlin
  package com.homeservices.customer.data.pendingActions.di

  import android.content.Context
  import androidx.room.Room
  import com.homeservices.customer.data.pendingActions.PendingActionDao
  import com.homeservices.customer.data.pendingActions.PendingActionDatabase
  import dagger.Module
  import dagger.Provides
  import dagger.hilt.InstallIn
  import dagger.hilt.android.qualifiers.ApplicationContext
  import dagger.hilt.components.SingletonComponent
  import javax.inject.Singleton

  @Module
  @InstallIn(SingletonComponent::class)
  public object PendingActionModule {
      @Provides
      @Singleton
      public fun providePendingActionDatabase(
          @ApplicationContext context: Context,
      ): PendingActionDatabase =
          Room.databaseBuilder(
              context,
              PendingActionDatabase::class.java,
              "pending_actions.db",
          ).build()

      @Provides
      public fun providePendingActionDao(database: PendingActionDatabase): PendingActionDao =
          database.pendingActionDao()
  }
  ```

- [ ] **B3.3 — Add Kover exclusions for the new DI/data files**

  Edit `customer-app/app/build.gradle.kts` — inside the `kover { reports { filters { excludes { classes(...) } } } }` block, append (alongside the existing exclusions):

  ```kotlin
  // PendingActionModule — Hilt @Provides wiring (Room.databaseBuilder requires Android Context),
  // same rationale as data.auth.di.* and data.catalogue.di.*
  "*.data.pendingActions.di.*",
  // PendingActionStore — thin DAO pass-through, exercised via DAO tests
  "*.PendingActionStore",
  "*.PendingActionStore\$*",
  // PendingActionEntity — Room data holder + companion mappers, no logic branches
  "*.PendingActionEntity",
  "*.PendingActionEntity\$*",
  ```

- [ ] **B3.4 — Compile + verify Hilt graph; commit**

  ```bash
  cd customer-app && ./gradlew :app:assembleDebug && cd ..
  git add customer-app/app/build.gradle.kts \
          customer-app/app/src/main/kotlin/com/homeservices/customer/data/pendingActions/PendingActionStore.kt \
          customer-app/app/src/main/kotlin/com/homeservices/customer/data/pendingActions/di/PendingActionModule.kt
  git commit -m "feat(customer-app): PendingActionStore facade + Hilt module"
  ```

  Expected: `BUILD SUCCESSFUL`. Hilt KSP processor accepts the new module.

---

## WS-B-technician — technician-app Room layer

This stream mirrors WS-B-customer file-for-file under `com.homeservices.technician.data.pendingActions`. Run as a parallel subagent — no shared mutable state with WS-B-customer.

### Task BT1 — Mirror B1 in technician-app

- [ ] **BT1.1 — Add Room deps + schema export**

  Same edits as B1.1 + B1.2 in `technician-app/app/build.gradle.kts`. The libs aliases match because S01a-1's A0 already synced the catalogues.

- [ ] **BT1.2 — Create `technician-app/app/src/main/kotlin/com/homeservices/technician/data/pendingActions/PendingActionEntity.kt`**

  Identical contents to B1.3 except the package line is:

  ```kotlin
  package com.homeservices.technician.data.pendingActions
  ```

  All `com.homeservices.corenav.*` imports stay the same — that's the whole point of core-nav.

- [ ] **BT1.3 — Compile + commit**

  ```bash
  cd technician-app && ./gradlew :app:compileDebugKotlin && cd ..
  git add technician-app/app/build.gradle.kts \
          technician-app/app/src/main/kotlin/com/homeservices/technician/data/pendingActions/PendingActionEntity.kt
  git commit -m "feat(technician-app): PendingActionEntity (Room) for E11"
  ```

---

### Task BT2 — Mirror B2 (TDD)

- [ ] **BT2.1 — Failing test `technician-app/app/src/test/kotlin/com/homeservices/technician/data/pendingActions/PendingActionDaoTest.kt`**

  Identical to B2.1 except:
  - `package com.homeservices.technician.data.pendingActions`
  - `role = "technician"` in the `row(...)` helper

  Confirm red:

  ```bash
  cd technician-app && ./gradlew :app:testDebugUnitTest --tests "*PendingActionDaoTest"
  ```

- [ ] **BT2.2 — Create `PendingActionDao.kt` and `PendingActionDatabase.kt`**

  Identical to B2.3 + B2.4 with the `com.homeservices.technician.data.pendingActions` package. SQL is unchanged — DAO behavior is identical between apps.

- [ ] **BT2.3 — Run test — must pass; verify schema export**

  ```bash
  cd technician-app && ./gradlew :app:testDebugUnitTest --tests "*PendingActionDaoTest" && cd ..
  ls technician-app/app/schemas/com.homeservices.technician.data.pendingActions.PendingActionDatabase/
  ```

  Expected: 8 tests pass; `1.json` schema file exists.

- [ ] **BT2.4 — Commit**

  ```bash
  git add technician-app/app/src/main/kotlin/com/homeservices/technician/data/pendingActions/PendingActionDao.kt \
          technician-app/app/src/main/kotlin/com/homeservices/technician/data/pendingActions/PendingActionDatabase.kt \
          technician-app/app/src/test/kotlin/com/homeservices/technician/data/pendingActions/PendingActionDaoTest.kt \
          technician-app/app/schemas/
  git commit -m "feat(technician-app): PendingActionDao + Database with full query suite"
  ```

---

### Task BT3 — Mirror B3

- [ ] **BT3.1 — Create `PendingActionStore.kt`**

  Identical to B3.1 with `package com.homeservices.technician.data.pendingActions`.

- [ ] **BT3.2 — Create `di/PendingActionModule.kt`**

  Identical to B3.2 with `package com.homeservices.technician.data.pendingActions.di` and the `com.homeservices.technician.data.pendingActions.*` import paths.

- [ ] **BT3.3 — Add Kover exclusions to `technician-app/app/build.gradle.kts`**

  Same patterns as B3.3 (the technician-app's Kover excludes block is the analogous companion).

- [ ] **BT3.4 — Compile + commit**

  ```bash
  cd technician-app && ./gradlew :app:assembleDebug && cd ..
  git add technician-app/app/build.gradle.kts \
          technician-app/app/src/main/kotlin/com/homeservices/technician/data/pendingActions/PendingActionStore.kt \
          technician-app/app/src/main/kotlin/com/homeservices/technician/data/pendingActions/di/PendingActionModule.kt
  git commit -m "feat(technician-app): PendingActionStore facade + Hilt module"
  ```

---

## WS-D — pre-Codex smoke + Codex review + close-out

### Task D1 — Pre-Codex smoke for both apps

- [ ] **D1.1 — Customer smoke**

  ```bash
  bash tools/pre-codex-smoke.sh customer-app
  ```

  Expected: exit 0.

- [ ] **D1.2 — Technician smoke**

  ```bash
  bash tools/pre-codex-smoke.sh technician-app
  ```

  Expected: exit 0.

---

### Task D2 — Codex review

- [ ] **D2.1 — Run Codex against main**

  ```bash
  codex review --base main
  ```

  Expected: review passes; `.codex-review-passed` updated. P1 finding → STOP and fix in a new commit. No `--no-verify`.

  This story has no auth/payment/PII surface — `/security-review` is **not** required.

---

### Task D3 — Push + PR

- [ ] **D3.1 — Push + open PR**

  ```bash
  git push -u origin <branch>
  gh pr create --title "feat(android): E11-S01a-2 per-app pending_actions Room layer" --body "$(cat <<'EOF'
  ## Summary
  - Per-app Room layer (`pending_actions` table) wired into both customer-app and technician-app.
  - 8-method DAO covering upsert, observe, tombstone-on-reconcile, expire, 30-day tombstone purge, clear-all.
  - Hilt module providing the database + DAO + store to the singleton component.
  - v1 schema JSON exported in both apps under `app/schemas/`.

  ## Out of scope
  - kotlinx-serialization typed-route spike → E11-S01a-3.
  - PendingActionIngestor + FCM refactor → S01b-1.

  ## Test plan
  - [x] customer-app: 8 DAO tests via Robolectric in-memory Room
  - [x] technician-app: 8 DAO tests via Robolectric in-memory Room
  - [x] pre-codex-smoke.sh green for both apps
  - [x] Codex review green
  - [x] Both `app/schemas/.../1.json` files committed
  EOF
  )"
  ```

  PR auto-merges on CI green per project flow.

---

## Acceptance Criteria

This plan completes when ALL of the following hold:

1. **Per-app Room ships:** both apps wire `PendingActionDatabase` + `PendingActionDao` + `PendingActionStore` through Hilt; both assemble cleanly.
2. **8-method DAO surface complete:** `upsertAll`, `markMissingAsResolved`, `observeActive`, `findById`, `markResolved`, `purgeExpired`, `purgeTombstones`, `clearAll` — names match spec §3.4 exactly.
3. **purgeExpired/purgeTombstones invariants:** `purgeExpired` does NOT delete RESOLVED tombstones; `purgeTombstones` does NOT delete ACTIVE rows. Both behaviors covered by tests in both apps.
4. **observeActive ordering correct:** rows returned ordered by priority HIGH→NORMAL→LOW, then `createdAt ASC` within each priority. Test in both apps verifies this.
5. **markMissingAsResolved idempotency:** already-RESOLVED rows keep their original `resolvedAt`. Test in both apps verifies this.
6. **Schema v1 exported:** `customer-app/app/schemas/com.homeservices.customer.data.pendingActions.PendingActionDatabase/1.json` and the technician analogue exist in the working tree, committed.
7. **Smoke + Codex green:** both `tools/pre-codex-smoke.sh` runs exit 0; Codex review passes.

---

## Rollback Path

This plan is **purely additive**. Single-commit revertable per task:

- **WS-B rollback:** revert each app's `data/pendingActions/` package + the Room dep adds + the schema export ksp arg + the Kover exclusions. Hilt graph stays clean because nothing else injects `PendingActionStore` yet (S01b-1 introduces consumers).
- **Catastrophic rollback:** revert the entire branch. Nothing user-visible ships, so production rollback risk is zero.
- **Schema-export gone wrong:** if a Room migration test is added later in S01b-1 and the v1 schema turns out to be wrong, that's a v1 fixup — not an S01a-2 issue. The schema exported here is the source of truth for v1.

---

## Self-review notes

- Spec §3.4 (DAO surface) coverage: all 8 methods present in B2.3 with the exact SQL from the spec, plus the `purgeExpired` `status = 'ACTIVE'` constraint that protects tombstones (this is the one subtle invariant that the spec gets right and a naive implementation would miss).
- Spec §S01a "Test surface" relevant items: "DAO query correctness (priority ordering, expiry filter, tombstone purge at 30d)" — covered by B2.1 and BT2.1's 8 tests each. "Room schema migration test" interpreted as v1 schema-export verification: B2.5 + BT2.3 verify `1.json` exists; future v1→v2 migration tests are in scope of S01b-1.
- Type consistency: `PendingActionEntity.toDomain()` round-trips `PendingAction` from core-nav — the `valueOf(String)` calls on the three enums will throw `IllegalArgumentException` if storage ever contains an unknown value, which is acceptable because the only writer is `fromDomain(PendingAction, lastFetchedAt)` from the same companion. SQL strings (`'ACTIVE'`, `'RESOLVED'`, `'HIGH'`, `'NORMAL'`, `'LOW'`) match `PendingActionStatus.name` and `PendingActionPriority.name` exactly.
- Placeholders: none. All test code, schema paths, and shell commands are concrete.
- Mirror tasks BT1-BT3 are deliberately compressed by reference to the customer tasks because the only differences are the package line and (in tests) the `role = "technician"` literal. The executor can lift the customer files verbatim and patch the package — the rest is identical.

---

## Branch & commit decisions (executor: surface to owner before starting)

This plan starts AFTER E11-S01a-1 has been merged to `main`. Branch options:

1. **Recommended:** new worktree off latest `main` after S01a-1 merges (`git worktree add ../homeservices-e11-s01a-2 -b feature/E11-S01a-2-per-app-room main`).
2. **Alternative:** branch `feature/E11-S01a-2-per-app-room` from `main` directly in the existing checkout.

Surface to owner before starting WS-B-customer to confirm S01a-1 has merged and which option is preferred.
