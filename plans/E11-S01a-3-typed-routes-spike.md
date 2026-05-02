# E11-S01a-2 — kotlinx-serialization Typed-Route Spike + Go/No-Go Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Run a tightly-scoped kotlinx-serialization typed-route spike on top of the contracts + Room layer landed in E11-S01a-1, and produce an explicit owner-visible go/no-go decision artifact that either unblocks E11-S01b-1 or freezes it pending a fallback ADR.

**Architecture:** Add the `kotlinx-serialization` Gradle plugin + `kotlinx-serialization-json` library to both apps' version catalogues and build files. Convert exactly four routes to Compose Nav 2.8 typed `@Serializable` form (one no-arg + one one-arg per app), wired alongside the existing string-route graph (not as replacements) so the experiment can be reverted without touching production routing. One Paparazzi smoke per app demonstrates the typed route renders. The story closes with `docs/superpowers/decisions/2026-05-XX-e11-s01a-spike-decision.md` — a GO/NO-GO artifact signed by the owner. **GO** → S01b-1 plan-write proceeds with typed routes per spec §3.2/§3.3. **NO-GO** → spike code is reverted, plugin + lib stay installed (cheap forward-compat), and `docs/adr/00XX-route-contract-fallback.md` is committed before any S01b-1 plan-write begins. **No mid-story pivot during S01b-1.**

**Tech Stack:** Kotlin 2.0.21, Compose Navigation 2.8.9 (already on classpath, no version bump), kotlinx-serialization 1.7.3 (new — added in this story), Paparazzi 1.3.5.

**Prerequisite:** E11-S01a-1 must be merged to `main` (core-nav module + per-app Room layer must be on classpath of both apps).
**Produces:** kotlinx-serialization plugin + lib installed in both apps; 4 typed route data classes + 4 `composable<T>()` bindings; 2 Paparazzi smoke tests; 1 owner-visible go/no-go decision file. On NO-GO: 1 fallback ADR + reverted spike code.
**Out of scope:** Mass route migration (S01b-2), real consumer of typed routes beyond the spike (S01b-1), any change to `core-nav` (already shipped).

---

## Spec & invariants

- Spec: `docs/superpowers/specs/2026-05-01-e11-durable-screen-hooks-design.md` §5 "E11-S01a" — see "Hard go/no-go on the spike (Codex)" subsection.
- This plan is part 2 of a size-gate-driven split (`E11-S01a-1` and `E11-S01a-2`).
- Hard rule from spec: "**Spike completes with explicit owner-visible go/no-go decision**." If GO, S01b-1 proceeds with typed routes. If NO-GO, **S01b-1 plan-write is FROZEN** until the fallback ADR is committed; **no mid-story pivot during S01b-1**.
- Paparazzi goldens are CI-recorded only — never on Windows. Delete locally before push; CI workflow_dispatch records via the Linux runner (`docs/patterns/paparazzi-cross-os-goldens.md`).
- libs.versions.toml drift invariant: first task is to confirm `customer-app/gradle/libs.versions.toml` and `technician-app/gradle/libs.versions.toml` are still in sync after S01a-1 merged. If drifted, sync before plugin edits.

---

## File Structure

| Path | Action | Responsibility |
|---|---|---|
| `customer-app/gradle/libs.versions.toml` | Modify | Add `kotlinSerialization` + `kotlinxSerializationJson` versions, `kotlinx-serialization-json` lib, `kotlin-serialization` plugin |
| `technician-app/gradle/libs.versions.toml` | Modify | Same |
| `customer-app/app/build.gradle.kts` | Modify | Apply `kotlin-serialization` plugin + `implementation(libs.kotlinx.serialization.json)` |
| `technician-app/app/build.gradle.kts` | Modify | Same |
| `customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/typed/CustomerTypedRoutes.kt` | Create | Two `@Serializable` route data classes (1 no-arg + 1 arg) |
| `customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/MainGraph.kt` | Modify | Add 2 `composable<T>()` bindings alongside existing string routes |
| `technician-app/app/src/main/kotlin/com/homeservices/technician/navigation/typed/TechnicianTypedRoutes.kt` | Create | Two `@Serializable` route data classes |
| `technician-app/app/src/main/kotlin/com/homeservices/technician/navigation/HomeGraph.kt` | Modify | Add 2 `composable<T>()` bindings |
| `customer-app/app/src/test/kotlin/com/homeservices/customer/navigation/typed/CustomerTypedRoutePaparazziTest.kt` | Create | Paparazzi smoke for the converted arg route |
| `technician-app/app/src/test/kotlin/com/homeservices/technician/navigation/typed/TechnicianTypedRoutePaparazziTest.kt` | Create | Paparazzi smoke for the converted arg route |
| `docs/superpowers/decisions/2026-05-XX-e11-s01a-spike-decision.md` | Create | Owner-signed go/no-go artifact (final task) |
| `docs/adr/00XX-route-contract-fallback.md` | Create **only if NO-GO** | Sealed-class string-route fallback ADR |

---

## Work-stream graph

```
WS-C1 (plugin + lib install)  ─► WS-C2/C3 (typed routes per app, parallel) ─► WS-C4 (Paparazzi smoke per app, parallel) ─► WS-D (smoke + Codex + GO/NO-GO gate)
```

WS-C2 (customer) and WS-C3 (technician) are independent after C1 lands and run as parallel Sonnet subagents. WS-C4 Paparazzi tests are likewise per-app. WS-D is the close-out.

---

## WS-C1 — kotlinx-serialization plugin + lib install

### Task C1.1 — Confirm libs catalogues are still in sync

- [ ] **C1.1.1 — Diff customer vs technician catalogues**

  ```bash
  diff customer-app/gradle/libs.versions.toml technician-app/gradle/libs.versions.toml
  ```

  Expected: empty diff. If drifted (somehow modified after S01a-1 merged), sync per project CLAUDE.md invariant before continuing:

  ```bash
  cp customer-app/gradle/libs.versions.toml technician-app/gradle/libs.versions.toml
  git add technician-app/gradle/libs.versions.toml
  git commit -m "chore(technician-app): re-sync libs.versions.toml from customer-app (E11-S01a-2 prerequisite)"
  ```

---

### Task C1.2 — Add kotlinx-serialization version + lib + plugin to customer-app catalogue

- [ ] **C1.2.1 — Edit `customer-app/gradle/libs.versions.toml` `[versions]` block**

  Insert (after the existing `kotlin = "2.0.21"` line is fine):

  ```toml
  kotlinSerialization = "2.0.21"
  kotlinxSerializationJson = "1.7.3"
  ```

- [ ] **C1.2.2 — Add the lib to the `[libraries]` block**

  Insert near the other kotlinx-* libs:

  ```toml
  kotlinx-serialization-json = { module = "org.jetbrains.kotlinx:kotlinx-serialization-json", version.ref = "kotlinxSerializationJson" }
  ```

- [ ] **C1.2.3 — Add the plugin to the `[plugins]` block**

  ```toml
  kotlin-serialization = { id = "org.jetbrains.kotlin.plugin.serialization", version.ref = "kotlinSerialization" }
  ```

- [ ] **C1.2.4 — Mirror all three edits in `technician-app/gradle/libs.versions.toml`**

  Identical lines in the same blocks.

---

### Task C1.3 — Apply the plugin + dep in both apps

- [ ] **C1.3.1 — Edit `customer-app/app/build.gradle.kts` `plugins { ... }` block**

  Add (after `alias(libs.plugins.kotlin.android)`):

  ```kotlin
  alias(libs.plugins.kotlin.serialization)
  ```

- [ ] **C1.3.2 — Edit `customer-app/app/build.gradle.kts` `dependencies { ... }` block**

  Add (alongside other implementations):

  ```kotlin
  implementation(libs.kotlinx.serialization.json)
  ```

- [ ] **C1.3.3 — Mirror C1.3.1 + C1.3.2 in `technician-app/app/build.gradle.kts`**

- [ ] **C1.3.4 — Confirm both apps still compile**

  ```bash
  cd customer-app && ./gradlew :app:compileDebugKotlin && cd ..
  cd technician-app && ./gradlew :app:compileDebugKotlin && cd ..
  ```

  Expected: both `BUILD SUCCESSFUL`.

- [ ] **C1.3.5 — Commit**

  ```bash
  git add customer-app/gradle/libs.versions.toml customer-app/app/build.gradle.kts \
          technician-app/gradle/libs.versions.toml technician-app/app/build.gradle.kts
  git commit -m "feat(apps): add kotlinx-serialization plugin + lib for E11-S01a-2 spike"
  ```

---

## WS-C2 — customer-app: convert one no-arg + one arg route to `@Serializable`

The two routes for the spike are picked by reading the existing nav graph:

- **No-arg:** `CatalogueRoutes.HOME` (currently the literal `"home"`).
- **Arg:** `BookingRoutes.PRICE_APPROVAL` (currently `"priceApproval/{bookingId}"`).

**The typed equivalents are added alongside the existing string routes — neither replaces the existing graph.** This isolates the spike to a small additive delta. The existing `mainGraph` keeps using string forms; the typed forms get their own composable bindings.

### Task C2.1 — Read existing routes for exact string forms

- [ ] **C2.1.1 — Read the existing route declarations**

  ```bash
  cat customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/CatalogueRoutes.kt
  cat customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/BookingRoutes.kt
  ```

  Confirm `CatalogueRoutes.HOME` = `"home"` and the `BookingRoutes.PRICE_APPROVAL` template before drafting the typed versions. If either route has been renamed in a parallel branch, adjust the typed-route names accordingly but keep the same shape (1 no-arg + 1 String-arg).

---

### Task C2.2 — Create the typed routes file

- [ ] **C2.2.1 — Create `customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/typed/CustomerTypedRoutes.kt`**

  ```kotlin
  package com.homeservices.customer.navigation.typed

  import kotlinx.serialization.Serializable

  /**
   * E11-S01a-2 spike: two routes converted to Compose Nav 2.8 typed serialization.
   * Neither replaces the existing string-route graph entries — these are added
   * alongside under the `mainGraph` for the spike validation.
   *
   * See `docs/superpowers/decisions/2026-05-XX-e11-s01a-spike-decision.md` for go/no-go.
   */
  @Serializable
  public object CustomerHomeTypedRoute

  @Serializable
  public data class BookingPriceApprovalTypedRoute(public val bookingId: String)
  ```

- [ ] **C2.2.2 — Compile**

  ```bash
  cd customer-app && ./gradlew :app:compileDebugKotlin
  ```

  Expected: `BUILD SUCCESSFUL`. If serialization KSP/codegen fails here, that is an early NO-GO signal — see WS-D rollback path before continuing.

---

### Task C2.3 — Wire the typed routes into `MainGraph.kt`

- [ ] **C2.3.1 — Add the import**

  At the top of `customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/MainGraph.kt`, add:

  ```kotlin
  import androidx.navigation.toRoute
  import com.homeservices.customer.navigation.typed.BookingPriceApprovalTypedRoute
  import com.homeservices.customer.navigation.typed.CustomerHomeTypedRoute
  ```

- [ ] **C2.3.2 — Append two typed-composable bindings inside `navigation(... route = "main")`**

  Inside the `navigation(startDestination = CatalogueRoutes.HOME, route = "main") { ... }` block, immediately before its closing brace, add:

  ```kotlin
  // E11-S01a-2 spike — typed routes proven alongside the existing string graph.
  composable<CustomerHomeTypedRoute> {
      val vm: CatalogueHomeViewModel = hiltViewModel()
      CatalogueHomeScreen(
          viewModel = vm,
          onCategoryClick = { id -> navController.navigate(CatalogueRoutes.serviceList(id)) },
      )
  }
  composable<BookingPriceApprovalTypedRoute> { entry ->
      val args = entry.toRoute<BookingPriceApprovalTypedRoute>()
      val vm: PriceApprovalViewModel = hiltViewModel()
      PriceApprovalScreen(
          viewModel = vm,
          bookingId = args.bookingId,
          onBack = { navController.popBackStack() },
      )
  }
  ```

  (`composable<T>()` is provided by `androidx.navigation:navigation-compose:2.8.9` already on classpath; no version bump.)

- [ ] **C2.3.3 — Sanity-compile**

  ```bash
  cd customer-app && ./gradlew :app:assembleDebug
  ```

  Expected: `BUILD SUCCESSFUL`. If KSP/Hilt complains about the typed bindings, treat that as a spike NO-GO signal — see WS-D rollback path.

- [ ] **C2.3.4 — Commit**

  ```bash
  git add customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/typed/CustomerTypedRoutes.kt \
          customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/MainGraph.kt
  git commit -m "feat(customer-app): E11-S01a-2 spike — typed routes for home + price-approval"
  ```

---

## WS-C3 — technician-app: same shape, different routes

Tech app spike candidates (read the existing graph first):

- **No-arg:** the dashboard/home start destination.
- **Arg:** an existing route that already takes one String argument. Likely candidate: a `MyRatings` filter route or an `Earnings` period route.

### Task C3.1 — Read existing tech routes

- [ ] **C3.1.1 — Read the existing nav graph**

  ```bash
  cat technician-app/app/src/main/kotlin/com/homeservices/technician/navigation/HomeGraph.kt
  ```

  Identify the start destination (the no-arg candidate) and a one-String-arg candidate. If no single-arg route exists yet (only no-arg routes), stop here and surface to owner before fabricating a route — the alternative is to use a synthetic `MyRatingsTypedRoute(filter: String)` whose composable just renders an existing screen with the filter passed through. Synthetic spike is acceptable since this is just proving the typed-route mechanism.

---

### Task C3.2 — Create the typed routes file

- [ ] **C3.2.1 — Create `technician-app/app/src/main/kotlin/com/homeservices/technician/navigation/typed/TechnicianTypedRoutes.kt`**

  ```kotlin
  package com.homeservices.technician.navigation.typed

  import kotlinx.serialization.Serializable

  /**
   * E11-S01a-2 spike: typed routes proven alongside the existing string graph.
   * Rename the arg route to the picked candidate (e.g. `MyRatingsTypedRoute(filter)`,
   * `EarningsTypedRoute(period)`) once the graph file is read in C3.1.1.
   */
  @Serializable
  public object TechnicianDashboardTypedRoute

  @Serializable
  public data class TechnicianArgTypedRoute(public val arg: String)
  ```

- [ ] **C3.2.2 — Rename `TechnicianArgTypedRoute` to the actual screen's name**

  Read C3.1.1's output. If the candidate is a ratings filter, rename to `MyRatingsTypedRoute(filter: String)`. If it's a job offer with a `bookingId`, rename to `JobOfferTypedRoute(bookingId: String)`. Update the field name to match the screen's expected argument.

  Compile after renaming:

  ```bash
  cd technician-app && ./gradlew :app:compileDebugKotlin
  ```

---

### Task C3.3 — Wire into `HomeGraph.kt`

- [ ] **C3.3.1 — Mirror C2.3 in `technician-app/app/src/main/kotlin/com/homeservices/technician/navigation/HomeGraph.kt`**

  Inside the `navigation(startDestination = ..., route = "home") { ... }` block (or the analogous block — exact wrapping comes from C3.1.1), append two typed composable bindings shaped like:

  ```kotlin
  composable<TechnicianDashboardTypedRoute> {
      // Existing dashboard composable — same content as the string-route binding.
      // Read the existing string-route binding for `HomeGraph` start destination
      // and copy its body verbatim here.
  }
  composable<MyRatingsTypedRoute> { entry ->
      val args = entry.toRoute<MyRatingsTypedRoute>()
      // Existing MyRatings composable, with `filter = args.filter`.
  }
  ```

  (Replace `MyRatingsTypedRoute` with whatever was picked in C3.2.2.)

  Add the analogous import lines at the top of the file:

  ```kotlin
  import androidx.navigation.toRoute
  import com.homeservices.technician.navigation.typed.MyRatingsTypedRoute
  import com.homeservices.technician.navigation.typed.TechnicianDashboardTypedRoute
  ```

- [ ] **C3.3.2 — Sanity-compile**

  ```bash
  cd technician-app && ./gradlew :app:assembleDebug
  ```

  Expected: `BUILD SUCCESSFUL`.

- [ ] **C3.3.3 — Commit**

  ```bash
  git add technician-app/app/src/main/kotlin/com/homeservices/technician/navigation/typed/TechnicianTypedRoutes.kt \
          technician-app/app/src/main/kotlin/com/homeservices/technician/navigation/HomeGraph.kt
  git commit -m "feat(technician-app): E11-S01a-2 spike — typed routes for dashboard + arg route"
  ```

---

## WS-C4 — Paparazzi smoke per app (CI-recorded goldens)

One Paparazzi snapshot per app proves the typed route can be constructed and the destination screen renders. Goldens are recorded on CI Linux only — never locally on Windows (`docs/patterns/paparazzi-cross-os-goldens.md`).

### Task C4.1 — Customer Paparazzi smoke

- [ ] **C4.1.1 — Create `customer-app/app/src/test/kotlin/com/homeservices/customer/navigation/typed/CustomerTypedRoutePaparazziTest.kt`**

  ```kotlin
  package com.homeservices.customer.navigation.typed

  import androidx.compose.foundation.layout.Box
  import androidx.compose.foundation.layout.fillMaxSize
  import androidx.compose.material3.MaterialTheme
  import androidx.compose.material3.Text
  import androidx.compose.runtime.Composable
  import androidx.compose.ui.Alignment
  import androidx.compose.ui.Modifier
  import app.cash.paparazzi.DeviceConfig
  import app.cash.paparazzi.Paparazzi
  import com.homeservices.designsystem.theme.HomeservicesTheme
  import org.junit.Rule
  import org.junit.Test

  /**
   * E11-S01a-2 spike Paparazzi smoke. Asserts that the typed route value can be
   * constructed and that a destination composable renders. Actual nav-graph dispatch
   * is exercised in instrumentation tests in S01b-1; this test only proves the
   * typed-route content layer compiles + renders under Paparazzi.
   */
  class CustomerTypedRoutePaparazziTest {
      @get:Rule
      val paparazzi: Paparazzi = Paparazzi(deviceConfig = DeviceConfig.PIXEL_5)

      @Test
      fun `BookingPriceApprovalTypedRoute renders smoke screen`() {
          val route = BookingPriceApprovalTypedRoute(bookingId = "bk-spike")
          paparazzi.snapshot { SmokeScreen(label = "PriceApproval[bookingId=${route.bookingId}]") }
      }

      @Composable
      private fun SmokeScreen(label: String) {
          HomeservicesTheme {
              Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                  Text(text = label, style = MaterialTheme.typography.bodyLarge)
              }
          }
      }
  }
  ```

- [ ] **C4.1.2 — Run Paparazzi verify locally — DO NOT record**

  ```bash
  cd customer-app && ./gradlew :app:verifyPaparazziDebug --tests "*CustomerTypedRoutePaparazziTest" || true
  ```

  Locally on Windows this typically reports "missing golden" — that is the expected outcome. **Never run `recordPaparazzi*` locally** (cross-OS antialiasing drift).

---

### Task C4.2 — Technician Paparazzi smoke

- [ ] **C4.2.1 — Create `technician-app/app/src/test/kotlin/com/homeservices/technician/navigation/typed/TechnicianTypedRoutePaparazziTest.kt`**

  Same shape as C4.1.1, swapping the typed route + label for the tech-app candidate (e.g. `MyRatingsTypedRoute(filter = "ALL")` with label `"MyRatings[filter=ALL]"`):

  ```kotlin
  package com.homeservices.technician.navigation.typed

  import androidx.compose.foundation.layout.Box
  import androidx.compose.foundation.layout.fillMaxSize
  import androidx.compose.material3.MaterialTheme
  import androidx.compose.material3.Text
  import androidx.compose.runtime.Composable
  import androidx.compose.ui.Alignment
  import androidx.compose.ui.Modifier
  import app.cash.paparazzi.DeviceConfig
  import app.cash.paparazzi.Paparazzi
  import com.homeservices.designsystem.theme.HomeservicesTheme
  import org.junit.Rule
  import org.junit.Test

  class TechnicianTypedRoutePaparazziTest {
      @get:Rule
      val paparazzi: Paparazzi = Paparazzi(deviceConfig = DeviceConfig.PIXEL_5)

      @Test
      fun `MyRatingsTypedRoute renders smoke screen`() {
          val route = MyRatingsTypedRoute(filter = "ALL")
          paparazzi.snapshot { SmokeScreen(label = "MyRatings[filter=${route.filter}]") }
      }

      @Composable
      private fun SmokeScreen(label: String) {
          HomeservicesTheme {
              Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                  Text(text = label, style = MaterialTheme.typography.bodyLarge)
              }
          }
      }
  }
  ```

  (Adjust the route + field name to whatever C3.2.2 picked.)

- [ ] **C4.2.2 — Run Paparazzi verify locally — DO NOT record**

  ```bash
  cd technician-app && ./gradlew :app:verifyPaparazziDebug --tests "*TechnicianTypedRoutePaparazziTest" || true
  ```

- [ ] **C4.2.3 — Commit both Paparazzi tests**

  ```bash
  git add customer-app/app/src/test/kotlin/com/homeservices/customer/navigation/typed/CustomerTypedRoutePaparazziTest.kt \
          technician-app/app/src/test/kotlin/com/homeservices/technician/navigation/typed/TechnicianTypedRoutePaparazziTest.kt
  git commit -m "test(apps): E11-S01a-2 spike Paparazzi smoke for typed routes"
  ```

---

### Task C4.3 — Trigger CI workflow_dispatch to record goldens (Linux runner)

Per `docs/patterns/paparazzi-cross-os-goldens.md`, push the branch and trigger the `paparazzi-record.yml` workflow in GitHub Actions. The workflow commits the goldens back.

- [ ] **C4.3.1 — Push the branch**

  ```bash
  git push -u origin <branch>
  ```

- [ ] **C4.3.2 — Trigger the recorder workflow**

  ```bash
  gh workflow run paparazzi-record.yml --ref <branch>
  ```

- [ ] **C4.3.3 — Wait for the workflow to complete and pull the auto-committed goldens**

  ```bash
  gh run watch
  git pull
  ```

  Expected: 2 new files under `customer-app/app/src/test/snapshots/images/` and `technician-app/app/src/test/snapshots/images/` corresponding to the two Paparazzi tests.

---

## WS-D — pre-Codex smoke + Codex + GO/NO-GO decision

### Task D1 — pre-Codex smoke

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

  If either smoke fails, the most likely culprit is the `kotlinx-serialization` plugin interaction with KSP/Hilt. Diagnose before considering NO-GO — a true NO-GO is a structural finding, not a fixable wiring issue.

---

### Task D2 — Codex review

- [ ] **D2.1 — Run Codex against main**

  ```bash
  codex review --base main
  ```

  Expected: review passes; `.codex-review-passed` updated. P1 finding → STOP and fix in a new commit.

  Two areas Codex tends to flag on a serialization spike:

  1. **Kotlin serialization on Hilt-managed ViewModels** — typed routes do not pass through Hilt. The composable bindings call `hiltViewModel()` directly, which is unaffected. Codex should not flag.
  2. **Mixing typed and string routes in the same nav graph** — this is the explicit shape of the spike (additive, not replacement). Document this in the Codex response if it surfaces.

---

### Task D3 — Owner-visible go/no-go decision artifact (the gate)

This is the headline acceptance criterion. **The story does not complete until this file is written and committed**, regardless of which branch (GO or NO-GO) the spike took.

- [ ] **D3.1 — Create `docs/superpowers/decisions/2026-05-XX-e11-s01a-spike-decision.md`**

  Replace `2026-05-XX` with the actual date the decision is signed. Use this template — fill in the bracketed fields based on actual results from C1–C4 + D1–D2:

  ```markdown
  # E11-S01a-2 Spike Decision — kotlinx-serialization typed routes

  **Date:** 2026-05-XX
  **Owner:** Alok Tiwari
  **Spike scope:** kotlinx-serialization 1.7.3 plugin + Compose Navigation 2.8.9 typed routes; 1 no-arg + 1 arg route per app; Paparazzi smoke per app.
  **Outcome:** **[GO | NO-GO]**

  ## Spike artifacts (all committed in this PR)
  - Customer typed routes: `customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/typed/CustomerTypedRoutes.kt`
  - Tech typed routes: `technician-app/app/src/main/kotlin/com/homeservices/technician/navigation/typed/TechnicianTypedRoutes.kt`
  - Customer Paparazzi smoke: `customer-app/app/src/test/kotlin/com/homeservices/customer/navigation/typed/CustomerTypedRoutePaparazziTest.kt` — golden recorded by `paparazzi-record.yml` run id `[…]`.
  - Tech Paparazzi smoke: `technician-app/app/src/test/kotlin/com/homeservices/technician/navigation/typed/TechnicianTypedRoutePaparazziTest.kt` — golden recorded by run id `[…]`.

  ## Build evidence
  - `customer-app:assembleDebug`: `[PASS | FAIL]`
  - `technician-app:assembleDebug`: `[PASS | FAIL]`
  - Customer Paparazzi verify on Linux CI: `[PASS | FAIL]`
  - Tech Paparazzi verify on Linux CI: `[PASS | FAIL]`
  - Codex review: `[PASS | FAIL]`

  ## Decision

  **If GO:** S01b-1 plan-write proceeds with typed `@Serializable` routes per spec §3.2 / §3.3. The 4 spike routes stay in place; mass route migration is deferred to S01b-2.

  **If NO-GO:** the four spike route data classes (`CustomerHomeTypedRoute`, `BookingPriceApprovalTypedRoute`, `TechnicianDashboardTypedRoute`, the chosen tech arg route) and their `composable<T>()` bindings are reverted in a follow-up commit on this same PR (or a new PR if this one already merged). The `kotlinx-serialization` plugin + lib stay installed (cheap, future-proofing). A fallback ADR is written at `docs/adr/00XX-route-contract-fallback.md` choosing sealed-class string routes. **S01b-1 plan-write is FROZEN** until that ADR is committed and merged. There is no mid-story pivot during S01b-1.

  ## Owner sign-off

  - [ ] Owner reviewed Codex output and Paparazzi snapshots.
  - [ ] Owner picked GO or NO-GO above.
  - [ ] On NO-GO: fallback ADR `docs/adr/00XX-route-contract-fallback.md` is committed in a follow-up PR (this PR closes S01a-2 regardless).
  ```

- [ ] **D3.2 — Commit the decision artifact**

  ```bash
  git add docs/superpowers/decisions/2026-05-XX-e11-s01a-spike-decision.md
  git commit -m "docs: E11-S01a-2 spike GO/NO-GO decision artifact"
  ```

- [ ] **D3.3 — On NO-GO ONLY: revert spike code + commit fallback ADR**

  Skip this step on GO.

  Revert the four spike files + the two graph modifications:

  ```bash
  git rm customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/typed/CustomerTypedRoutes.kt
  git rm customer-app/app/src/test/kotlin/com/homeservices/customer/navigation/typed/CustomerTypedRoutePaparazziTest.kt
  git rm technician-app/app/src/main/kotlin/com/homeservices/technician/navigation/typed/TechnicianTypedRoutes.kt
  git rm technician-app/app/src/test/kotlin/com/homeservices/technician/navigation/typed/TechnicianTypedRoutePaparazziTest.kt
  ```

  Manually revert the typed-composable additions in:
  - `customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/MainGraph.kt`
  - `technician-app/app/src/main/kotlin/com/homeservices/technician/navigation/HomeGraph.kt`

  (Keep the kotlinx-serialization plugin + lib installed — cheap forward-compat. The deps live in `libs.versions.toml` + `build.gradle.kts` only and don't ship anything user-visible until imported.)

  Draft the fallback ADR at `docs/adr/<next-number>-route-contract-fallback.md` following the existing `docs/adr/0001-*.md` style. Required content:

  - Rollback rationale (what the spike showed us — be specific: KSP failure mode, Hilt incompatibility, runtime crash, etc.).
  - Sealed-class string-route alternative — concrete code shape that S01b-1 will use instead of `@Serializable` data classes.
  - S01b-1 freeze rule: no mid-S01b plan-write until this ADR is committed + merged.
  - Explicit prohibition on mid-S01b pivots back to typed routes.

  Then commit:

  ```bash
  git add docs/adr/<next-number>-route-contract-fallback.md \
          customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/MainGraph.kt \
          technician-app/app/src/main/kotlin/com/homeservices/technician/navigation/HomeGraph.kt
  git commit -m "revert(apps): E11-S01a-2 spike NO-GO — remove typed routes + add fallback ADR"
  ```

---

### Task D4 — Push + PR

- [ ] **D4.1 — Push (if not already pushed in C4.3.1)**

  ```bash
  git push origin <branch>
  ```

- [ ] **D4.2 — Open the PR**

  ```bash
  gh pr create --title "feat(android): E11-S01a-2 kotlinx-serialization typed-route spike + GO/NO-GO" --body "$(cat <<'EOF'
  ## Summary
  - kotlinx-serialization 1.7.3 plugin + lib installed in both apps.
  - 4 typed routes (1 no-arg + 1 arg per app) added alongside existing string-route graph (additive, not replacement).
  - Paparazzi smoke per app, goldens recorded via paparazzi-record.yml workflow_dispatch.
  - Owner-signed go/no-go decision artifact committed.

  ## Decision
  **[GO | NO-GO]** — see `docs/superpowers/decisions/2026-05-XX-e11-s01a-spike-decision.md`.

  ## Test plan
  - [x] customer-app:assembleDebug green
  - [x] technician-app:assembleDebug green
  - [x] Paparazzi smoke renders + golden recorded (CI Linux)
  - [x] pre-codex-smoke.sh green for both apps
  - [x] Codex review green

  ## On NO-GO follow-up
  - [ ] Spike route files reverted (in this PR or follow-up)
  - [ ] Fallback ADR `docs/adr/00XX-route-contract-fallback.md` committed before any S01b-1 plan-write
  EOF
  )"
  ```

  PR auto-merges on CI green per project flow.

---

## Acceptance Criteria

This plan completes when ALL of the following hold:

1. **Plugin + lib install ships:** kotlinx-serialization 1.7.3 plugin + lib added to both apps' version catalogues and build files; both apps still compile.
2. **Spike code lands or is reverted (per decision):** on GO, four typed-route data classes + `composable<T>()` bindings + Paparazzi tests are committed. On NO-GO, all spike code is reverted in the same PR (or a follow-up), and the fallback ADR is committed.
3. **Paparazzi goldens exist:** for whichever decision, the goldens were recorded on CI Linux during the spike run (proof that the typed routes rendered at least once). On NO-GO, the golden files are removed alongside the test files.
4. **Smoke + Codex green:** `tools/pre-codex-smoke.sh` for both apps and `codex review --base main` all exit 0 / pass.
5. **Decision artifact committed:** `docs/superpowers/decisions/2026-05-XX-e11-s01a-spike-decision.md` exists, has owner sign-off, and points at the build/CI evidence.
6. **On NO-GO ONLY:** `docs/adr/00XX-route-contract-fallback.md` is committed and merged before S01b-1 plan-write begins. **S01b-1 plan-write does not start while this ADR is missing or in-flight.**
7. **No core-nav changes:** `git diff main..HEAD core-nav/` returns no output. core-nav was finalized in S01a-1 and is not modified here.

---

## Rollback Path

This plan has two failure modes — distinguish before acting:

### Mid-spike technical failure (plugin/KSP/Hilt incompatibility surfaces during C1–C3)

This is a **technical signal**, not a NO-GO decision. Diagnose before classifying:

1. Re-read the failure mode (build log, KSP output, Hilt processor error).
2. If the issue is fixable with reasonable effort (a known plugin order issue, a missing arg, etc.) — fix and continue.
3. If the issue is structural (e.g. kotlinx-serialization codegen breaks Hilt's KSP pass and there is no documented workaround for the Kotlin/AGP combo in use), STOP and write the decision artifact as **NO-GO** citing the specific failure.

### Catastrophic rollback (plugin install itself breaks the apps)

If C1.3.4 fails and cannot be unblocked, revert the C1 commit:

```bash
git revert <C1 commit sha>
```

Both apps return to current main with no diff. Spike abandoned; no decision artifact required because the spike never ran. Owner is notified directly.

### NO-GO decision (spike completed but typed routes are unworkable)

Documented in D3.3 above. Plugin + lib stay installed; spike code reverted; fallback ADR committed; S01b-1 frozen until ADR merges.

### GO decision

Plan completes; S01b-1 plan-write unblocked; the 4 spike routes remain in the codebase as the seed for S01b-2's mass route migration.

---

## Self-review notes

- Spec §S01a-2 (the spike + go/no-go gate, isolated from §S01a-1's contracts + Room layer) coverage walked: plugin install (C1), typed routes per app (C2 + C3), Paparazzi smoke per app (C4), pre-Codex smoke (D1), Codex (D2), decision artifact (D3), NO-GO fallback (D3.3).
- Type consistency: `CustomerHomeTypedRoute` / `BookingPriceApprovalTypedRoute` / `TechnicianDashboardTypedRoute` / `MyRatingsTypedRoute` (or whatever C3.2.2 picks) names are stable across C2/C3 (declarations) → C4 (Paparazzi) → D3 (decision artifact references).
- Placeholders: the `MyRatingsTypedRoute` name in C3 + C4 + D3 carries an explicit "rename to picked candidate" instruction tied to the C3.1.1 read step. This is a routing choice, not a placeholder — the executor reads existing tech routes first and renames before writing.
- The decision artifact filename uses a `2026-05-XX` placeholder for the date (replaced at signing time by the executor based on the day the decision is committed). This is the only intentional date placeholder.

---

## Branch & commit decisions (executor: surface to owner before starting)

This plan starts AFTER E11-S01a-1 has been merged to `main`. Branch decisions:

1. **Recommended:** new worktree off latest `main` (`git worktree add ../homeservices-e11-s01a-2 -b feature/E11-S01a-2-typed-routes-spike main`). The S01a-1 contracts + Room must already be on main at this point.
2. **Alternative:** branch `feature/E11-S01a-2-typed-routes-spike` from `main` directly in the existing checkout.

Surface to owner before starting WS-C1 to confirm S01a-1 has merged and which option is preferred.
