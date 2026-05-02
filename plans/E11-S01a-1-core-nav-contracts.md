# E11-S01a-1 — `core-nav` Module + Contracts + TierLadder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land a new pure-Kotlin `core-nav` Gradle module (peer to `design-system`) holding shared route/pending-action contracts and the `TierLadder` pure-function logic for E11. After this plan ships, both Android apps can reference the contract types via `implementation(libs.homeservices.core.nav)` without taking on any Android dependency from core-nav itself.

**Architecture:** `core-nav` is a third Gradle build consumed by both apps via `includeBuild("../core-nav")`. It is JVM-only — no Android, Room, Compose, or Hilt dependencies. It exports 14 contract types: `RouteSpec`, `PendingActionType`/`Status`/`Priority`, `PendingAction`, `NotificationIntent`, `DeepLinkUri`, `NotificationRouter`, `AuthState` (+ `Authenticated`), `ActiveJobSummary`, `BookingSummary`, `RouteContext`, `RouteResolver`, `TierLadder` (+ `Routes`). The `TierLadder.resolve` pure function implements the T0–T6 priority ladder from spec §2.6 and is fully covered by JVM unit tests.

**Tech Stack:** Kotlin 2.0.21 (`-Xexplicit-api=strict`, `-Werror`), Gradle 8.6 wrapper (matched to apps), `kotlin-jvm` plugin, kotlinx-coroutines-core 1.8.1, JUnit 5 + MockK + AssertJ.

**Prerequisite:** None — Wave 1 of E11 (parallel with E11-S02 on the API side).
**Produces:** Compile-clean `core-nav/` module exporting 14 contract types; both apps wire it via composite build and continue to compile.
**Out of scope:** Per-app Room layer (covered by E11-S01a-2), kotlinx-serialization spike (E11-S01a-3), `NotificationRouter` Android adapter / `PendingActionIngestor` / FCM service refactor (S01b-1), mass route migration / event-bus removal (S01b-2).

---

## Spec & invariants the plan must respect

- Spec: `docs/superpowers/specs/2026-05-01-e11-durable-screen-hooks-design.md` §3.1 + §5 "E11-S01a"
- This plan is part 1 of a size-gate-driven 3-way split: `E11-S01a-1` (this), `E11-S01a-2` (per-app Room), `E11-S01a-3` (typed-routes spike).
- `core-nav` is **pure Kotlin** — `kotlinx-coroutines-core` is permitted (it's pure JVM); `androidx`, `com.google.android`, `com.google.firebase`, `dagger` imports are NOT. Verified by a final grep in WS-D.
- Reuse existing FCM wire types in `PendingActionType`: `ADDON_APPROVAL_REQUESTED`, `RATING_PROMPT_CUSTOMER`, `RATING_PROMPT_TECHNICIAN`, `RATING_RECEIVED`, `EARNINGS_UPDATE`, `JOB_OFFER`. New types added in E11: `KYC_RESUME`, `COMPLAINT_UPDATE`, `SUPPORT_FOLLOWUP`, `SAFETY_SOS_FOLLOWUP`. **Do not invent additional names** (spec §9.2).
- libs.versions.toml drift invariant: first task is to copy `customer-app/gradle/libs.versions.toml` to `technician-app/gradle/libs.versions.toml` so the per-app catalogues stay in sync.

---

## File Structure

| Path | Action | Responsibility |
|---|---|---|
| `core-nav/settings.gradle.kts` | Create | Standalone Gradle build root |
| `core-nav/build.gradle.kts` | Create | `kotlin-jvm` pure Kotlin library |
| `core-nav/gradle/libs.versions.toml` | Create | Local version catalogue |
| `core-nav/gradle/wrapper/gradle-wrapper.{jar,properties}` + `gradlew{,.bat}` | Create | Wrapper (copied from customer-app) |
| `core-nav/src/main/kotlin/com/homeservices/corenav/RouteSpec.kt` | Create | `RouteSpec` interface |
| `core-nav/src/main/kotlin/com/homeservices/corenav/PendingActionType.kt` | Create | enum |
| `core-nav/src/main/kotlin/com/homeservices/corenav/PendingActionStatus.kt` | Create | `PendingActionStatus` + `PendingActionPriority` enums |
| `core-nav/src/main/kotlin/com/homeservices/corenav/PendingAction.kt` | Create | data class |
| `core-nav/src/main/kotlin/com/homeservices/corenav/NotificationIntent.kt` | Create | `NotificationIntent` data class + `DeepLinkUri` builder/parser |
| `core-nav/src/main/kotlin/com/homeservices/corenav/NotificationRouter.kt` | Create | parser interface |
| `core-nav/src/main/kotlin/com/homeservices/corenav/AuthState.kt` | Create | `AuthState` sealed + `ActiveJobSummary` + `BookingSummary` |
| `core-nav/src/main/kotlin/com/homeservices/corenav/RouteContext.kt` | Create | `RouteContext` data class + `RouteResolver` interface |
| `core-nav/src/main/kotlin/com/homeservices/corenav/TierLadder.kt` | Create | `TierLadder.resolve` pure function |
| `core-nav/src/test/kotlin/com/homeservices/corenav/PendingActionTest.kt` | Create | Equality + copy round-trip |
| `core-nav/src/test/kotlin/com/homeservices/corenav/DeepLinkUriTest.kt` | Create | build/parse round-trip + URL encoding |
| `core-nav/src/test/kotlin/com/homeservices/corenav/TierLadderTest.kt` | Create | T0–T6 paths + tie-break combinations |
| `customer-app/settings.gradle.kts` | Modify | Add `includeBuild("../core-nav")` |
| `technician-app/settings.gradle.kts` | Modify | Same |
| `customer-app/gradle/libs.versions.toml` | Modify | Add `homeservices-core-nav` lib alias |
| `technician-app/gradle/libs.versions.toml` | Modify | Same — sync from customer first, then layer the alias |
| `customer-app/app/build.gradle.kts` | Modify | Add `implementation(libs.homeservices.core.nav)` |
| `technician-app/app/build.gradle.kts` | Modify | Same |

---

## Work-stream graph

This plan is one work stream (WS-A from spec §S01a) plus its WS-D close-out gate. Tasks A1–A9 must run in order (each builds on the previous file's symbols). A0 is the libs sync; A10 + WS-D are smoke + Codex.

---

## Task A0 — Sync technician-app `libs.versions.toml` from customer-app

- [ ] **A0.1 — Copy and diff**

  ```bash
  cp customer-app/gradle/libs.versions.toml technician-app/gradle/libs.versions.toml
  git diff technician-app/gradle/libs.versions.toml
  ```

  Expected: empty diff in normal operation. If there is drift, it must be reconciled before continuing.

- [ ] **A0.2 — Commit if there was drift**

  ```bash
  git add technician-app/gradle/libs.versions.toml
  git commit -m "chore(technician-app): sync libs.versions.toml from customer-app (E11-S01a-1 invariant)"
  ```

  Skip this step if the diff was empty.

---

## Task A1 — Scaffold `core-nav` Gradle build

- [ ] **A1.1 — Create directory tree + copy wrapper**

  ```bash
  mkdir -p core-nav/gradle/wrapper
  mkdir -p core-nav/src/main/kotlin/com/homeservices/corenav
  mkdir -p core-nav/src/test/kotlin/com/homeservices/corenav
  cp customer-app/gradlew core-nav/gradlew
  cp customer-app/gradlew.bat core-nav/gradlew.bat
  cp customer-app/gradle/wrapper/gradle-wrapper.jar core-nav/gradle/wrapper/gradle-wrapper.jar
  cp customer-app/gradle/wrapper/gradle-wrapper.properties core-nav/gradle/wrapper/gradle-wrapper.properties
  chmod +x core-nav/gradlew
  ```

- [ ] **A1.2 — Create `core-nav/settings.gradle.kts`**

  ```kotlin
  pluginManagement {
      repositories {
          gradlePluginPortal()
          google()
          mavenCentral()
      }
  }

  dependencyResolutionManagement {
      repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
      repositories {
          google()
          mavenCentral()
      }
  }

  rootProject.name = "core-nav"
  ```

- [ ] **A1.3 — Create `core-nav/gradle/libs.versions.toml`**

  ```toml
  [versions]
  kotlin = "2.0.21"
  java = "21"
  coroutines = "1.8.1"
  ktlint = "12.1.1"
  detekt = "1.23.7"
  junit5 = "5.11.3"
  mockk = "1.13.13"
  assertj = "3.26.3"

  [libraries]
  kotlinx-coroutines-core = { module = "org.jetbrains.kotlinx:kotlinx-coroutines-core", version.ref = "coroutines" }
  junit-jupiter = { module = "org.junit.jupiter:junit-jupiter", version.ref = "junit5" }
  junit-jupiter-api = { module = "org.junit.jupiter:junit-jupiter-api", version.ref = "junit5" }
  junit-jupiter-engine = { module = "org.junit.jupiter:junit-jupiter-engine", version.ref = "junit5" }
  mockk = { module = "io.mockk:mockk", version.ref = "mockk" }
  assertj-core = { module = "org.assertj:assertj-core", version.ref = "assertj" }
  kotlinx-coroutines-test = { module = "org.jetbrains.kotlinx:kotlinx-coroutines-test", version.ref = "coroutines" }

  [plugins]
  kotlin-jvm = { id = "org.jetbrains.kotlin.jvm", version.ref = "kotlin" }
  ktlint = { id = "org.jlleitschuh.gradle.ktlint", version.ref = "ktlint" }
  detekt = { id = "io.gitlab.arturbosch.detekt", version.ref = "detekt" }
  ```

- [ ] **A1.4 — Create `core-nav/build.gradle.kts`**

  ```kotlin
  import org.jetbrains.kotlin.gradle.dsl.JvmTarget

  plugins {
      alias(libs.plugins.kotlin.jvm)
      alias(libs.plugins.ktlint)
      alias(libs.plugins.detekt)
  }

  group = "com.homeservices"
  version = "0.1.0"

  kotlin {
      jvmToolchain(libs.versions.java.get().toInt())
      compilerOptions {
          jvmTarget.set(JvmTarget.JVM_17)
          allWarningsAsErrors.set(true)
          freeCompilerArgs.addAll("-Xexplicit-api=strict", "-Xjsr305=strict")
      }
  }

  dependencies {
      implementation(libs.kotlinx.coroutines.core)
      testImplementation(libs.junit.jupiter)
      testImplementation(libs.junit.jupiter.api)
      testRuntimeOnly(libs.junit.jupiter.engine)
      testImplementation(libs.mockk)
      testImplementation(libs.assertj.core)
      testImplementation(libs.kotlinx.coroutines.test)
  }

  tasks.test { useJUnitPlatform() }

  ktlint { version.set("1.3.1"); ignoreFailures.set(false) }

  detekt {
      toolVersion = libs.versions.detekt.get()
      buildUponDefaultConfig = true
      allRules = false
      autoCorrect = false
      ignoreFailures = false
  }
  ```

- [ ] **A1.5 — Smoke build + commit**

  ```bash
  cd core-nav && ./gradlew assemble && cd ..
  git add core-nav/
  git commit -m "feat(core-nav): scaffold pure-Kotlin module for E11 shared contracts"
  ```

  Expected: `BUILD SUCCESSFUL`.

---

## Task A2 — Wire `core-nav` into both apps via composite build

- [ ] **A2.1 — Add `includeBuild("../core-nav")` to both apps' `settings.gradle.kts`**

  Append after the existing `includeBuild("../design-system")` line in both `customer-app/settings.gradle.kts` and `technician-app/settings.gradle.kts`:

  ```kotlin
  includeBuild("../core-nav")
  ```

- [ ] **A2.2 — Add `core-nav` lib alias to both apps' `gradle/libs.versions.toml`**

  In each, insert next to `homeservices-design-system`:

  ```toml
  homeservices-core-nav = { module = "com.homeservices:core-nav", version = "0.1.0" }
  ```

- [ ] **A2.3 — Add `implementation(libs.homeservices.core.nav)` to both apps' `app/build.gradle.kts`**

  In each `dependencies { ... }` block, immediately after the existing `implementation(libs.homeservices.design.system)`:

  ```kotlin
  implementation(libs.homeservices.core.nav)
  ```

- [ ] **A2.4 — Verify both apps still configure**

  ```bash
  cd customer-app && ./gradlew :app:help -q && cd ..
  cd technician-app && ./gradlew :app:help -q && cd ..
  ```

  Expected: both runs exit 0. Composite-build substitution maps `com.homeservices:core-nav:0.1.0` to the local module.

- [ ] **A2.5 — Commit**

  ```bash
  git add customer-app/settings.gradle.kts customer-app/gradle/libs.versions.toml customer-app/app/build.gradle.kts \
          technician-app/settings.gradle.kts technician-app/gradle/libs.versions.toml technician-app/app/build.gradle.kts
  git commit -m "feat(apps): wire core-nav module via composite build"
  ```

---

## Task A3 — `RouteSpec` interface

- [ ] **A3.1 — Create `core-nav/src/main/kotlin/com/homeservices/corenav/RouteSpec.kt`**

  ```kotlin
  package com.homeservices.corenav

  /**
   * Cross-app route identifier. Per-app `RouteSpec` enums implement this; consumers
   * (`TierLadder`, `RouteResolver`) reason about routes by name without knowing
   * which app owns them.
   */
  public interface RouteSpec {
      public val name: String
  }
  ```

- [ ] **A3.2 — Compile + commit**

  ```bash
  cd core-nav && ./gradlew compileKotlin && cd ..
  git add core-nav/src/main/kotlin/com/homeservices/corenav/RouteSpec.kt
  git commit -m "feat(core-nav): RouteSpec interface"
  ```

---

## Task A4 — Pending-action enums + `PendingAction` data class (TDD)

- [ ] **A4.1 — Create the enum files**

  `core-nav/src/main/kotlin/com/homeservices/corenav/PendingActionType.kt`:

  ```kotlin
  package com.homeservices.corenav

  /**
   * Wire-compatible with the existing FCM `data["type"]` strings. Names match
   * `api/src/services/fcm.service.ts` and the existing per-app FCM services.
   * Do not rename or invent variants without amending the API + both FCM services.
   */
  public enum class PendingActionType {
      // Existing FCM wire types (spec §9.2):
      ADDON_APPROVAL_REQUESTED,
      RATING_PROMPT_CUSTOMER,
      RATING_PROMPT_TECHNICIAN,
      RATING_RECEIVED,
      EARNINGS_UPDATE,
      JOB_OFFER,
      // New types in E11:
      KYC_RESUME,
      COMPLAINT_UPDATE,
      SUPPORT_FOLLOWUP,
      SAFETY_SOS_FOLLOWUP,
  }
  ```

  `core-nav/src/main/kotlin/com/homeservices/corenav/PendingActionStatus.kt`:

  ```kotlin
  package com.homeservices.corenav

  public enum class PendingActionStatus { ACTIVE, RESOLVED, EXPIRED }

  public enum class PendingActionPriority { HIGH, NORMAL, LOW }
  ```

- [ ] **A4.2 — Failing test `core-nav/src/test/kotlin/com/homeservices/corenav/PendingActionTest.kt`**

  ```kotlin
  package com.homeservices.corenav

  import org.assertj.core.api.Assertions.assertThat
  import org.junit.jupiter.api.Test

  class PendingActionTest {
      private fun fixture(version: Long = 1L): PendingAction = PendingAction(
          id = "JOB_OFFER:technician:user-1:dispatch_attempt:da-9",
          userId = "user-1",
          role = "technician",
          type = PendingActionType.JOB_OFFER,
          entityType = "dispatch_attempt",
          entityId = "da-9",
          routeUri = "homeservices://action/JOB_OFFER?bookingId=bk-7",
          priority = PendingActionPriority.HIGH,
          status = PendingActionStatus.ACTIVE,
          sourceStatus = null,
          version = version,
          createdAt = 1_700_000_000_000L,
          updatedAt = 1_700_000_000_000L,
          expiresAt = 1_700_000_060_000L,
          resolvedAt = null,
      )

      @Test
      fun `equality is by content`() {
          assertThat(fixture()).isEqualTo(fixture())
      }

      @Test
      fun `copy with bumped version preserves id and shows different equality`() {
          val original = fixture(version = 1L)
          val bumped = original.copy(version = 2L)
          assertThat(bumped.id).isEqualTo(original.id)
          assertThat(bumped.version).isEqualTo(2L)
          assertThat(bumped).isNotEqualTo(original)
      }
  }
  ```

- [ ] **A4.3 — Run test — fails (`PendingAction` does not exist)**

  ```bash
  cd core-nav && ./gradlew test
  ```

- [ ] **A4.4 — Create `core-nav/src/main/kotlin/com/homeservices/corenav/PendingAction.kt`**

  ```kotlin
  package com.homeservices.corenav

  /**
   * Durable action-index row. Source entity is always re-fetched on screen entry —
   * this row is a discovery handle, not the truth about the booking/job/rating.
   *
   * `version` is monotonically bumped server-side via Cosmos optimistic concurrency
   * (`_etag` IfMatch). The ingestor (S01b-1) drops payloads with
   * `incoming.version <= existing.version`.
   */
  public data class PendingAction(
      val id: String,
      val userId: String,
      val role: String,
      val type: PendingActionType,
      val entityType: String,
      val entityId: String,
      val routeUri: String,
      val priority: PendingActionPriority,
      val status: PendingActionStatus,
      val sourceStatus: String?,
      val version: Long,
      val createdAt: Long,
      val updatedAt: Long,
      val expiresAt: Long?,
      val resolvedAt: Long?,
  )
  ```

- [ ] **A4.5 — Run test — must pass; commit**

  ```bash
  cd core-nav && ./gradlew test && cd ..
  git add core-nav/src/main/kotlin/com/homeservices/corenav/PendingActionType.kt \
          core-nav/src/main/kotlin/com/homeservices/corenav/PendingActionStatus.kt \
          core-nav/src/main/kotlin/com/homeservices/corenav/PendingAction.kt \
          core-nav/src/test/kotlin/com/homeservices/corenav/PendingActionTest.kt
  git commit -m "feat(core-nav): PendingAction + Type/Status/Priority enums"
  ```

  Expected: 2 tests pass.

---

## Task A5 — `NotificationIntent` + `DeepLinkUri` (TDD)

- [ ] **A5.1 — Failing test `core-nav/src/test/kotlin/com/homeservices/corenav/DeepLinkUriTest.kt`**

  ```kotlin
  package com.homeservices.corenav

  import org.assertj.core.api.Assertions.assertThat
  import org.junit.jupiter.api.Test

  class DeepLinkUriTest {
      @Test
      fun `build then parse round-trips a simple intent`() {
          val intent = NotificationIntent(
              type = PendingActionType.ADDON_APPROVAL_REQUESTED,
              entityId = "bk-7",
              rawArgs = mapOf("bookingId" to "bk-7"),
          )
          assertThat(DeepLinkUri.parse(DeepLinkUri.build(intent))).isEqualTo(intent)
      }

      @Test
      fun `parse returns null on a non-homeservices scheme`() {
          assertThat(DeepLinkUri.parse("https://example.com/booking?id=1")).isNull()
      }

      @Test
      fun `parse returns null on an unknown action type`() {
          assertThat(DeepLinkUri.parse("homeservices://action/NONSENSE_TYPE?bookingId=bk-1")).isNull()
      }

      @Test
      fun `build URL-encodes argument values containing spaces and ampersands`() {
          val intent = NotificationIntent(
              type = PendingActionType.SUPPORT_FOLLOWUP,
              entityId = "ticket-1",
              rawArgs = mapOf(
                  "ticketId" to "ticket-1",
                  "subject" to "Re: refund & credit",
              ),
          )
          val uri = DeepLinkUri.build(intent)
          assertThat(uri).contains("subject=Re%3A+refund+%26+credit")
          assertThat(DeepLinkUri.parse(uri)?.rawArgs?.get("subject"))
              .isEqualTo("Re: refund & credit")
      }

      @Test
      fun `parse tolerates argument-less URIs`() {
          val parsed = DeepLinkUri.parse("homeservices://action/EARNINGS_UPDATE")
          assertThat(parsed).isNotNull
          assertThat(parsed?.type).isEqualTo(PendingActionType.EARNINGS_UPDATE)
          assertThat(parsed?.rawArgs).isEmpty()
      }

      @Test
      fun `parse extracts entityId from a conventional bookingId arg`() {
          val parsed = DeepLinkUri.parse("homeservices://action/ADDON_APPROVAL_REQUESTED?bookingId=bk-7")
          assertThat(parsed?.entityId).isEqualTo("bk-7")
      }
  }
  ```

- [ ] **A5.2 — Run test — fails**

  ```bash
  cd core-nav && ./gradlew test --tests "com.homeservices.corenav.DeepLinkUriTest"
  ```

- [ ] **A5.3 — Create `core-nav/src/main/kotlin/com/homeservices/corenav/NotificationIntent.kt`**

  ```kotlin
  package com.homeservices.corenav

  import java.net.URLDecoder
  import java.net.URLEncoder
  import java.nio.charset.StandardCharsets

  /**
   * Parsed FCM-data or deep-link payload. `rawArgs` keeps every key/value passed
   * through the URI; `entityId` is extracted to a typed slot for ergonomic ingestor use.
   */
  public data class NotificationIntent(
      val type: PendingActionType,
      val entityId: String,
      val rawArgs: Map<String, String>,
  )

  /**
   * Pure builder/parser for `homeservices://action/<TYPE>?<args>`.
   *
   * `entityId` resolution rule: prefer `entityId`, then `bookingId`, then `jobOfferId`,
   * then `dispatchAttemptId`, then `id`, else empty string.
   */
  public object DeepLinkUri {
      private const val SCHEME = "homeservices"
      private const val HOST = "action"
      private val ENTITY_ID_KEYS: List<String> =
          listOf("entityId", "bookingId", "jobOfferId", "dispatchAttemptId", "id")

      public fun build(intent: NotificationIntent): String {
          val query = intent.rawArgs.entries
              .joinToString("&") { (k, v) -> "${encode(k)}=${encode(v)}" }
          val tail = if (query.isEmpty()) "" else "?$query"
          return "$SCHEME://$HOST/${intent.type.name}$tail"
      }

      public fun parse(uri: String): NotificationIntent? {
          if (!uri.startsWith("$SCHEME://$HOST/")) return null
          val afterPrefix = uri.removePrefix("$SCHEME://$HOST/")
          val parts = afterPrefix.split('?', limit = 2)
          val typeStr = parts[0]
          val queryStr = if (parts.size == 2) parts[1] else ""
          val type = runCatching { PendingActionType.valueOf(typeStr) }.getOrNull() ?: return null
          val rawArgs: Map<String, String> = if (queryStr.isEmpty()) {
              emptyMap()
          } else {
              queryStr.split('&').associate { kv ->
                  val pair = kv.split('=', limit = 2)
                  decode(pair[0]) to decode(if (pair.size == 2) pair[1] else "")
              }
          }
          val entityId = ENTITY_ID_KEYS.firstNotNullOfOrNull { rawArgs[it] } ?: ""
          return NotificationIntent(type = type, entityId = entityId, rawArgs = rawArgs)
      }

      private fun encode(s: String): String = URLEncoder.encode(s, StandardCharsets.UTF_8.name())
      private fun decode(s: String): String = URLDecoder.decode(s, StandardCharsets.UTF_8.name())
  }
  ```

- [ ] **A5.4 — Run test — pass; commit**

  ```bash
  cd core-nav && ./gradlew test --tests "com.homeservices.corenav.DeepLinkUriTest" && cd ..
  git add core-nav/src/main/kotlin/com/homeservices/corenav/NotificationIntent.kt \
          core-nav/src/test/kotlin/com/homeservices/corenav/DeepLinkUriTest.kt
  git commit -m "feat(core-nav): NotificationIntent + DeepLinkUri builder/parser"
  ```

  Expected: 6 tests pass.

---

## Task A6 — `NotificationRouter` interface

- [ ] **A6.1 — Create `core-nav/src/main/kotlin/com/homeservices/corenav/NotificationRouter.kt`**

  ```kotlin
  package com.homeservices.corenav

  /**
   * Pure parser interface. The Android adapter (S01b-1) supplies the FCM
   * `RemoteMessage.data` map; this interface accepts a plain `Map<String, String>`
   * so it stays JVM-only.
   */
  public interface NotificationRouter {
      public fun parseFcmData(data: Map<String, String>): NotificationIntent?

      public fun parseDeepLink(uri: String): NotificationIntent?
  }
  ```

- [ ] **A6.2 — Compile + commit**

  ```bash
  cd core-nav && ./gradlew compileKotlin && cd ..
  git add core-nav/src/main/kotlin/com/homeservices/corenav/NotificationRouter.kt
  git commit -m "feat(core-nav): NotificationRouter parser interface"
  ```

---

## Task A7 — `AuthState` + `ActiveJobSummary` + `BookingSummary`

- [ ] **A7.1 — Create `core-nav/src/main/kotlin/com/homeservices/corenav/AuthState.kt`**

  ```kotlin
  package com.homeservices.corenav

  /**
   * Auth result snapshot used by `RouteContext`. Per-app `SessionManager` collapses
   * its richer auth state into one of these two shapes before invoking the resolver.
   */
  public sealed interface AuthState {
      public object Unauthenticated : AuthState

      public data class Authenticated(val userId: String, val role: String) : AuthState
  }

  /** Minimal active-job projection consumed by Tier 2 (technician-only). */
  public data class ActiveJobSummary(
      val bookingId: String,
      val status: String,
  )

  /** Minimal active-booking projection consumed by Tier 2 (customer-only). */
  public data class BookingSummary(
      val bookingId: String,
      val status: String,
  )
  ```

- [ ] **A7.2 — Compile + commit**

  ```bash
  cd core-nav && ./gradlew compileKotlin && cd ..
  git add core-nav/src/main/kotlin/com/homeservices/corenav/AuthState.kt
  git commit -m "feat(core-nav): AuthState + ActiveJobSummary + BookingSummary"
  ```

---

## Task A8 — `RouteContext` + `RouteResolver` interface

- [ ] **A8.1 — Create `core-nav/src/main/kotlin/com/homeservices/corenav/RouteContext.kt`**

  ```kotlin
  package com.homeservices.corenav

  /**
   * Snapshot used to evaluate the initial-route ladder. Composed once per cold start
   * (after auth + reconcile + parallel source-state probes) and passed to
   * [TierLadder.resolve].
   */
  public data class RouteContext(
      val authState: AuthState,
      val role: String,
      val activeActions: List<PendingAction>,
      val techKycStatus: String?,
      val techActiveJob: ActiveJobSummary?,
      val customerActiveBookings: List<BookingSummary>,
  )

  /**
   * Decides initial and per-event routes. Per-app implementation supplies the
   * `RouteSpec` enum it owns; the interface stays cross-app.
   */
  public interface RouteResolver {
      public suspend fun decideInitialRoute(ctx: RouteContext): RouteSpec

      public fun routeFor(action: PendingAction): RouteSpec

      public fun routeFor(intent: NotificationIntent): RouteSpec
  }
  ```

- [ ] **A8.2 — Compile + commit**

  ```bash
  cd core-nav && ./gradlew compileKotlin && cd ..
  git add core-nav/src/main/kotlin/com/homeservices/corenav/RouteContext.kt
  git commit -m "feat(core-nav): RouteContext + RouteResolver interface"
  ```

---

## Task A9 — `TierLadder.resolve` pure function (TDD)

This is the heart of the contracts module. Tests must cover every T0–T6 path plus the documented tie-break dimensions.

- [ ] **A9.1 — Failing test `core-nav/src/test/kotlin/com/homeservices/corenav/TierLadderTest.kt`**

  ```kotlin
  package com.homeservices.corenav

  import org.assertj.core.api.Assertions.assertThat
  import org.junit.jupiter.api.Nested
  import org.junit.jupiter.api.Test

  /** Test-only RouteSpec impls — keeps the ladder logic tested without per-app deps. */
  private enum class Spec : RouteSpec {
      Auth, Kyc, ActiveJob, PriceApproval, JobOffer, Complaint, Rating, Home, Dashboard
  }

  private val routes: TierLadder.Routes = TierLadder.Routes(
      auth = Spec.Auth,
      kyc = Spec.Kyc,
      activeJob = Spec.ActiveJob,
      priceApproval = Spec.PriceApproval,
      jobOffer = Spec.JobOffer,
      complaint = Spec.Complaint,
      rating = Spec.Rating,
      customerHome = Spec.Home,
      technicianDashboard = Spec.Dashboard,
  )

  private fun action(
      type: PendingActionType,
      priority: PendingActionPriority = PendingActionPriority.NORMAL,
      id: String = "${type.name}:user:1:entity:1",
      expiresAt: Long? = null,
      createdAt: Long = 0L,
  ): PendingAction = PendingAction(
      id = id, userId = "user-1", role = "customer",
      type = type, entityType = "x", entityId = "1",
      routeUri = "", priority = priority, status = PendingActionStatus.ACTIVE,
      sourceStatus = null, version = 1L,
      createdAt = createdAt, updatedAt = createdAt,
      expiresAt = expiresAt, resolvedAt = null,
  )

  private fun ctx(
      auth: AuthState = AuthState.Authenticated("u-1", "customer"),
      role: String = "customer",
      actions: List<PendingAction> = emptyList(),
      techKyc: String? = null,
      techJob: ActiveJobSummary? = null,
      customerBookings: List<BookingSummary> = emptyList(),
  ): RouteContext = RouteContext(auth, role, actions, techKyc, techJob, customerBookings)

  class TierLadderTest {
      @Nested
      inner class Tier0Gate {
          @Test fun `unauthenticated routes to auth`() {
              assertThat(TierLadder.resolve(ctx(auth = AuthState.Unauthenticated), routes))
                  .isEqualTo(Spec.Auth)
          }
      }

      @Nested
      inner class Tier1Blocking {
          @Test fun `tech with NOT_STARTED or INCOMPLETE KYC is blocked`() {
              listOf("NOT_STARTED", "INCOMPLETE").forEach { kyc ->
                  assertThat(TierLadder.resolve(ctx(role = "technician", techKyc = kyc), routes))
                      .withFailMessage("kyc=$kyc").isEqualTo(Spec.Kyc)
              }
          }
          @Test fun `tech with SUBMITTED MANUAL_REVIEW or COMPLETE KYC is NOT blocked`() {
              listOf("SUBMITTED", "MANUAL_REVIEW", "COMPLETE").forEach { kyc ->
                  assertThat(TierLadder.resolve(ctx(role = "technician", techKyc = kyc), routes))
                      .withFailMessage("kyc=$kyc").isEqualTo(Spec.Dashboard)
              }
          }
      }

      @Nested
      inner class Tier2LiveOps {
          @Test fun `tech ASSIGNED EN_ROUTE REACHED IN_PROGRESS routes to ActiveJob`() {
              listOf("ASSIGNED", "EN_ROUTE", "REACHED", "IN_PROGRESS").forEach { status ->
                  assertThat(
                      TierLadder.resolve(
                          ctx(role = "technician", techKyc = "COMPLETE",
                              techJob = ActiveJobSummary("bk-1", status)),
                          routes,
                      ),
                  ).withFailMessage("status=$status").isEqualTo(Spec.ActiveJob)
              }
          }
          @Test fun `customer AWAITING_PRICE_APPROVAL routes to PriceApproval`() {
              assertThat(
                  TierLadder.resolve(
                      ctx(role = "customer",
                          customerBookings = listOf(BookingSummary("bk-2", "AWAITING_PRICE_APPROVAL"))),
                      routes,
                  ),
              ).isEqualTo(Spec.PriceApproval)
          }
          @Test fun `customer ServiceTracking is NOT Tier 2 — asymmetry`() {
              assertThat(
                  TierLadder.resolve(
                      ctx(role = "customer",
                          customerBookings = listOf(BookingSummary("bk-3", "ASSIGNED"))),
                      routes,
                  ),
              ).isEqualTo(Spec.Home)
          }
      }

      @Nested
      inner class Tier3HighAction {
          @Test fun `unexpired JOB_OFFER routes to JobOffer`() {
              assertThat(
                  TierLadder.resolve(
                      ctx(role = "technician", techKyc = "COMPLETE",
                          actions = listOf(action(PendingActionType.JOB_OFFER, PendingActionPriority.HIGH,
                              expiresAt = Long.MAX_VALUE))),
                      routes,
                  ),
              ).isEqualTo(Spec.JobOffer)
          }
          @Test fun `expired JOB_OFFER does NOT take Tier 3`() {
              assertThat(
                  TierLadder.resolve(
                      ctx(role = "technician", techKyc = "COMPLETE",
                          actions = listOf(action(PendingActionType.JOB_OFFER, PendingActionPriority.HIGH,
                              expiresAt = 1L))),
                      routes,
                  ),
              ).isEqualTo(Spec.Dashboard)
          }
      }

      @Nested
      inner class Tier4NormalAction {
          @Test fun `KYC_RESUME routes to Kyc`() {
              assertThat(
                  TierLadder.resolve(
                      ctx(role = "technician", techKyc = "MANUAL_REVIEW",
                          actions = listOf(action(PendingActionType.KYC_RESUME))),
                      routes,
                  ),
              ).isEqualTo(Spec.Kyc)
          }
          @Test fun `COMPLAINT_UPDATE routes to Complaint`() {
              assertThat(
                  TierLadder.resolve(
                      ctx(role = "customer",
                          actions = listOf(action(PendingActionType.COMPLAINT_UPDATE))),
                      routes,
                  ),
              ).isEqualTo(Spec.Complaint)
          }
      }

      @Nested
      inner class Tier5LowAction {
          @Test fun `RATING_PROMPT_CUSTOMER routes to Rating`() {
              assertThat(
                  TierLadder.resolve(
                      ctx(role = "customer",
                          actions = listOf(action(PendingActionType.RATING_PROMPT_CUSTOMER, PendingActionPriority.LOW))),
                      routes,
                  ),
              ).isEqualTo(Spec.Rating)
          }
      }

      @Nested
      inner class Tier6Default {
          @Test fun `customer with no actions lands on Home`() {
              assertThat(TierLadder.resolve(ctx(role = "customer"), routes)).isEqualTo(Spec.Home)
          }
          @Test fun `tech with no actions and complete KYC lands on Dashboard`() {
              assertThat(TierLadder.resolve(ctx(role = "technician", techKyc = "COMPLETE"), routes))
                  .isEqualTo(Spec.Dashboard)
          }
      }

      @Nested
      inner class TieBreaks {
          @Test fun `T1 KYC blocking beats T3 JOB_OFFER`() {
              assertThat(
                  TierLadder.resolve(
                      ctx(role = "technician", techKyc = "NOT_STARTED",
                          actions = listOf(action(PendingActionType.JOB_OFFER, PendingActionPriority.HIGH,
                              expiresAt = Long.MAX_VALUE))),
                      routes,
                  ),
              ).isEqualTo(Spec.Kyc)
          }
          @Test fun `T2 active job beats T3 offer`() {
              assertThat(
                  TierLadder.resolve(
                      ctx(role = "technician", techKyc = "COMPLETE",
                          techJob = ActiveJobSummary("bk-1", "IN_PROGRESS"),
                          actions = listOf(action(PendingActionType.JOB_OFFER, PendingActionPriority.HIGH,
                              expiresAt = Long.MAX_VALUE))),
                      routes,
                  ),
              ).isEqualTo(Spec.ActiveJob)
          }
          @Test fun `pickWithinTier — earliest non-null expiresAt wins`() {
              val a = action(PendingActionType.COMPLAINT_UPDATE, id = "a", expiresAt = 200L, createdAt = 1L)
              val b = action(PendingActionType.COMPLAINT_UPDATE, id = "b", expiresAt = 100L, createdAt = 2L)
              assertThat(TierLadder.pickWithinTier(listOf(a, b))).isEqualTo(b)
          }
          @Test fun `pickWithinTier — null expiresAt loses to non-null`() {
              val a = action(PendingActionType.COMPLAINT_UPDATE, id = "a", expiresAt = null, createdAt = 1L)
              val b = action(PendingActionType.COMPLAINT_UPDATE, id = "b", expiresAt = 100L, createdAt = 2L)
              assertThat(TierLadder.pickWithinTier(listOf(a, b))).isEqualTo(b)
          }
          @Test fun `pickWithinTier — tied expiresAt falls back to oldest createdAt`() {
              val a = action(PendingActionType.COMPLAINT_UPDATE, id = "a", expiresAt = 100L, createdAt = 5L)
              val b = action(PendingActionType.COMPLAINT_UPDATE, id = "b", expiresAt = 100L, createdAt = 1L)
              assertThat(TierLadder.pickWithinTier(listOf(a, b))).isEqualTo(b)
          }
          @Test fun `pickWithinTier — tied createdAt falls back to lexicographic id`() {
              val a = action(PendingActionType.COMPLAINT_UPDATE, id = "z", expiresAt = 100L, createdAt = 1L)
              val b = action(PendingActionType.COMPLAINT_UPDATE, id = "a", expiresAt = 100L, createdAt = 1L)
              assertThat(TierLadder.pickWithinTier(listOf(a, b))).isEqualTo(b)
          }
      }
  }
  ```

- [ ] **A9.2 — Run test — fails (TierLadder doesn't exist)**

  ```bash
  cd core-nav && ./gradlew test --tests "com.homeservices.corenav.TierLadderTest"
  ```

- [ ] **A9.3 — Create `core-nav/src/main/kotlin/com/homeservices/corenav/TierLadder.kt`**

  ```kotlin
  package com.homeservices.corenav

  /**
   * Pure tier-ladder resolver. T0–T6 priority order matches spec §2.6:
   *
   *   T0 GATE          unauthenticated → auth
   *   T1 BLOCKING      tech KYC ∈ {NOT_STARTED, INCOMPLETE} → kyc
   *   T2 LIVE_OPS      tech active job ∈ {ASSIGNED, EN_ROUTE, REACHED, IN_PROGRESS} → activeJob
   *                    customer booking AWAITING_PRICE_APPROVAL → priceApproval
   *   T3 HIGH_ACTION   JOB_OFFER (unexpired), SAFETY_SOS_FOLLOWUP
   *   T4 NORMAL_ACTION KYC_RESUME, COMPLAINT_UPDATE, SUPPORT_FOLLOWUP
   *   T5 LOW_ACTION    RATING_PROMPT_*, RATING_RECEIVED, EARNINGS_UPDATE, ADDON_APPROVAL_REQUESTED
   *   T6 DEFAULT       role-specific home/dashboard
   *
   * Within-tier tie-break: earliest non-null expiresAt → oldest createdAt → lexicographic id.
   * Customer ServiceTracking is deliberately NOT in T2 — see spec §2.6 asymmetry note.
   */
  public object TierLadder {
      public data class Routes(
          val auth: RouteSpec,
          val kyc: RouteSpec,
          val activeJob: RouteSpec,
          val priceApproval: RouteSpec,
          val jobOffer: RouteSpec,
          val complaint: RouteSpec,
          val rating: RouteSpec,
          val customerHome: RouteSpec,
          val technicianDashboard: RouteSpec,
      )

      private val LIVE_OPS_TECH_STATUSES: Set<String> =
          setOf("ASSIGNED", "EN_ROUTE", "REACHED", "IN_PROGRESS")
      private val BLOCKING_KYC_STATUSES: Set<String> = setOf("NOT_STARTED", "INCOMPLETE")

      public fun resolve(
          ctx: RouteContext,
          routes: Routes,
          now: Long = System.currentTimeMillis(),
      ): RouteSpec {
          if (ctx.authState is AuthState.Unauthenticated) return routes.auth

          if (ctx.role == "technician" && ctx.techKycStatus in BLOCKING_KYC_STATUSES) {
              return routes.kyc
          }

          if (ctx.role == "technician" && ctx.techActiveJob?.status in LIVE_OPS_TECH_STATUSES) {
              return routes.activeJob
          }
          if (ctx.role == "customer" &&
              ctx.customerActiveBookings.any { it.status == "AWAITING_PRICE_APPROVAL" }) {
              return routes.priceApproval
          }

          val activeUnexpired: List<PendingAction> = ctx.activeActions
              .filter { it.status == PendingActionStatus.ACTIVE }
              .filter { (it.expiresAt ?: Long.MAX_VALUE) > now }

          val t3Types = setOf(PendingActionType.JOB_OFFER, PendingActionType.SAFETY_SOS_FOLLOWUP)
          if (activeUnexpired.any { it.type in t3Types }) return routes.jobOffer

          val t4Types = setOf(
              PendingActionType.KYC_RESUME,
              PendingActionType.COMPLAINT_UPDATE,
              PendingActionType.SUPPORT_FOLLOWUP,
          )
          val t4 = activeUnexpired.filter { it.type in t4Types }
          if (t4.isNotEmpty()) {
              return when (pickWithinTier(t4).type) {
                  PendingActionType.KYC_RESUME -> routes.kyc
                  PendingActionType.COMPLAINT_UPDATE, PendingActionType.SUPPORT_FOLLOWUP -> routes.complaint
                  else -> routes.complaint
              }
          }

          val t5Types = setOf(
              PendingActionType.RATING_PROMPT_CUSTOMER,
              PendingActionType.RATING_PROMPT_TECHNICIAN,
              PendingActionType.RATING_RECEIVED,
              PendingActionType.EARNINGS_UPDATE,
              PendingActionType.ADDON_APPROVAL_REQUESTED,
          )
          if (activeUnexpired.any { it.type in t5Types }) return routes.rating

          return if (ctx.role == "technician") routes.technicianDashboard else routes.customerHome
      }

      /**
       * Within-tier tie-break: earliest non-null expiresAt → oldest createdAt → lexicographic id.
       * Null `expiresAt` is treated as `Long.MAX_VALUE` (never expires) so it loses to any non-null.
       */
      public fun pickWithinTier(actions: List<PendingAction>): PendingAction {
          require(actions.isNotEmpty()) { "pickWithinTier requires at least one action" }
          return actions.sortedWith(
              compareBy<PendingAction> { it.expiresAt ?: Long.MAX_VALUE }
                  .thenBy { it.createdAt }
                  .thenBy { it.id },
          ).first()
      }
  }
  ```

- [ ] **A9.4 — Run all core-nav tests — must pass; commit**

  ```bash
  cd core-nav && ./gradlew test && cd ..
  git add core-nav/src/main/kotlin/com/homeservices/corenav/TierLadder.kt \
          core-nav/src/test/kotlin/com/homeservices/corenav/TierLadderTest.kt
  git commit -m "feat(core-nav): TierLadder pure resolver with full T0-T6 coverage"
  ```

  Expected: ~22 tests across PendingActionTest + DeepLinkUriTest + TierLadderTest, all passing.

---

## Task A10 — Verify both apps still compile against `core-nav`

- [ ] **A10.1 — Compile check**

  ```bash
  cd customer-app && ./gradlew :app:compileDebugKotlin && cd ..
  cd technician-app && ./gradlew :app:compileDebugKotlin && cd ..
  ```

  Expected: both `BUILD SUCCESSFUL`. core-nav additions are non-breaking.

---

## WS-D — pre-Codex smoke + Codex review + close-out

### Task D1 — Pre-Codex smoke for both apps + core-nav

- [ ] **D1.1 — Customer app smoke**

  ```bash
  bash tools/pre-codex-smoke.sh customer-app
  ```

  Expected: exit 0 (ktlint, detekt, lint, unit tests, assembleDebug all green).

- [ ] **D1.2 — Technician app smoke**

  ```bash
  bash tools/pre-codex-smoke.sh technician-app
  ```

  Expected: exit 0.

- [ ] **D1.3 — core-nav clean build + tests + lint**

  The smoke harness only knows about the two app subprojects. core-nav has its own gradle wrapper.

  ```bash
  cd core-nav && ./gradlew clean build test ktlintCheck detekt
  ```

  Expected: `BUILD SUCCESSFUL`. ~22 unit tests pass.

---

### Task D2 — No-Android-leakage check on `core-nav`

- [ ] **D2.1 — Grep for forbidden imports in core-nav main sources**

  ```bash
  grep -rE "androidx|com.google.android|com.google.firebase|dagger" core-nav/src/main/kotlin/ || echo "clean"
  ```

  Expected output: literal string `clean`. Any matches must be removed before Codex review — core-nav's pure-JVM invariant is non-negotiable.

---

### Task D3 — Codex review

- [ ] **D3.1 — Run Codex against main**

  ```bash
  codex review --base main
  ```

  Expected: review passes; `.codex-review-passed` updated. Any P1 finding → STOP and fix in a new commit before pushing. No `--no-verify`. No `CLAUDE_OVERRIDE_REASON` unless the owner explicitly authorizes.

  This story has no auth/payment/PII surface — `/security-review` is **not** required.

---

### Task D4 — Push + PR

- [ ] **D4.1 — Push + open PR**

  ```bash
  git push -u origin <branch>
  gh pr create --title "feat(android): E11-S01a-1 core-nav module + contracts + TierLadder" --body "$(cat <<'EOF'
  ## Summary
  - New `core-nav` Gradle module (pure Kotlin) wired into both apps via composite build.
  - Exports 14 contract types: RouteSpec, PendingAction*, NotificationIntent, DeepLinkUri, NotificationRouter, RouteContext/RouteResolver, AuthState, ActiveJobSummary, BookingSummary, TierLadder.
  - TierLadder pure-function resolver with full T0-T6 + tie-break test coverage.
  - No Android dependencies in core-nav (verified by grep).

  ## Out of scope
  - Per-app Room layer → E11-S01a-2.
  - kotlinx-serialization typed-route spike → E11-S01a-3.

  ## Test plan
  - [x] core-nav clean build green; ~22 unit tests pass
  - [x] Both apps still compile against core-nav via composite build
  - [x] pre-codex-smoke.sh green for both apps
  - [x] Codex review green
  EOF
  )"
  ```

  PR auto-merges on CI green per project flow.

---

## Acceptance Criteria

This plan completes when ALL of the following hold:

1. **`core-nav` ships:** `core-nav/` compiles, ~22 unit tests pass, and both apps compile against it via composite-build substitution.
2. **14 contract types exported:** `RouteSpec`, `PendingActionType`, `PendingActionStatus`, `PendingActionPriority`, `PendingAction`, `NotificationIntent`, `DeepLinkUri`, `NotificationRouter`, `AuthState`, `ActiveJobSummary`, `BookingSummary`, `RouteContext`, `RouteResolver`, `TierLadder`. `AuthState.Authenticated` and `TierLadder.Routes` are public nested types.
3. **TierLadder coverage:** every T0–T6 path has at least one passing test; tie-break covers nullable `expiresAt`, tied `expiresAt → createdAt`, tied `createdAt → id`. T1 vs T3 and T2 vs T3 cross-tier tests pass.
4. **DeepLinkUri round-trip:** build + parse round-trip preserves all rawArgs incl. URL-encoded values; unknown-type and non-homeservices-scheme inputs return null.
5. **No invented FCM types:** `PendingActionType` enum reuses the 6 existing wire types plus the 4 new types defined in spec §3.1. No additional names introduced.
6. **No Android leakage in core-nav:** `grep -rE "androidx|com.google.android|com.google.firebase|dagger" core-nav/src/main/kotlin/` returns no matches.
7. **Smoke + Codex green:** `tools/pre-codex-smoke.sh customer-app`, `tools/pre-codex-smoke.sh technician-app`, and `cd core-nav && ./gradlew clean build test` all exit 0. `codex review --base main` passes.

---

## Rollback Path

This plan is **purely additive**. Single-commit revertable per task:

- **A1 rollback:** revert all `core-nav/` commits — module disappears; nothing else broken.
- **A2 rollback:** revert the `includeBuild`, the lib alias, and the `implementation(...)` adds. Apps return to current main with no remaining diff.
- **A3–A9 rollback:** revert individual contract commits — apps still compile because nothing in customer-app or technician-app actually imports core-nav symbols yet (consumers arrive in S01a-2 and S01b-1).
- **Catastrophic rollback:** revert the entire branch. Nothing user-visible ships in this plan, so production rollback risk is zero.

---

## Self-review notes

- Spec §3.1 (shared contracts) coverage: every type listed maps to a task — RouteSpec=A3, PendingActionType=A4, PendingAction=A4, NotificationIntent + DeepLinkUri=A5, NotificationRouter=A6, RouteResolver + RouteContext=A8, TierLadder=A9, AuthState/ActiveJobSummary/BookingSummary=A7.
- Spec §S01a "Test surface": TierLadder unit tests (A9, full T0–T6 + tie-break), DeepLinkUri build/parse round-trip incl. URL encoding (A5). The "Room schema migration test" item from §S01a is in scope of E11-S01a-2 (per-app Room), not this plan.
- Type consistency: stable across A3 → A8 → A9. `TierLadder.Routes` named struct holds the per-app `RouteSpec` injection; `pickWithinTier` is reused by name in TierLadderTest.
- Placeholders: none. All test code, file paths, and shell commands are concrete.

---

## Branch & commit decisions (executor: surface to owner before starting)

The current working tree on `feature/E10-S01-karnataka-compliance` has uncommitted WIP across all 4 sub-projects, plus the E11 spec + codex briefings are untracked. **Do not start executing this plan on the current branch.** Surface these options to the owner before A0:

1. **Recommended:** create a worktree off `main` (`git worktree add ../homeservices-e11-s01a-1 -b feature/E11-S01a-1-core-nav main`) so the karnataka WIP stays untouched. Spec + codex briefings get committed first on the new branch (small `docs:` commit) before any code edits.
2. **Alternative:** stash the karnataka WIP (`git stash push -u -m "pre-E11-S01a-1"`) and branch off `main` to `feature/E11-S01a-1-core-nav`.

The branch must be off `main` so this story does not carry karnataka's WIP into Codex review.
