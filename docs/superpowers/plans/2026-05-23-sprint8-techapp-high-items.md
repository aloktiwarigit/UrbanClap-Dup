# Sprint 8 — technician-app HIGH audit items (batch 1)

**Ceremony:** Feature  
**Branch:** `fix/sprint8-techapp-high-items`  
**Worktree:** `C:\Alok\Business Projects\Urbanclap-sprint8`  
**Source audit:** `docs/reviews/audit-techapp-master-20260521-0738.md`  
**Stories:** E20-S10, E20-S13, E20-S14, E20-S16, E20-S18

## Known gotchas (read before coding)

- `docs/patterns/kotlin-explicit-api-public-modifier.md` — any new public class needs explicit `public` modifier; any new internal class that is currently `public` in an `internal` file needs `internal`.
- `docs/patterns/paparazzi-cross-os-goldens.md` — do NOT record goldens on Windows. If a test uses `@Ignored` it needs no golden. If a Paparazzi test is added, record on CI only.
- `docs/patterns/hilt-module-android-test-scope.md` — Hilt injection in instrumented tests.
- The `technician-ship.yml` CI already has a **Zero hardcoded Text() literals** gate. Any `Text("hardcoded string")` in `ui/` will fail CI.

## Scope — what IS in this sprint

| Story | Items |
|---|---|
| **E20-S10** | `collectAsStateWithLifecycle()` parity (6 calls in RatingScreen); `rememberSaveable` for AuthScreen phone + OTP fields, ShieldReportSheet.description, RatingAppealSheet.reason |
| **E20-S13** | `AnalyticsTracker` singleton + 6 PostHog funnel events; `Crashlytics.recordException` at 4 failure paths |
| **E20-S14** | `HomeservicesFcmService.onNewToken` → enqueue WorkRequest with CONNECTED constraint + exponential backoff; `EncryptedSharedPreferences.create` → `withContext(Dispatchers.IO)` in `AuthModule`; `CoroutineExceptionHandler` on foreground-service coroutine scopes |
| **E20-S16** | Fix `app_name` → "HomeHeroo Technician"; add `workflow_dispatch` to `technician-ship.yml`; add `bundleRelease` + `upload-artifact` step; add `resConfigs("en","hi")`; add Sentry Gradle plugin for R8 mappings |
| **E20-S18** | `runBlocking` → `runTest` in `ActiveJobApiServicePostLocationTest.kt:65,111`; `throw RuntimeException` → sealed error in `AcceptJobOfferUseCase`; remove `else -> Unit` on sealed `when` in `KycScreen` + `PayoutCadenceScreen`; change `public` → `internal` on 6 ApiService interfaces; remove wildcard ProGuard keep → explicit interface names; Detekt: add `excludes: "**/test/**"` for `FunctionMaxLength` + raise `maxLineLength` to 140 |

## Scope — what is NOT in this sprint

- E20-S11 (62 string extractions) — separate Haiku codemod sprint
- E20-S12 (accessibility a11y semantics) — separate sprint
- E20-S15 (WebP images, Baseline Profile) — separate sprint
- E20-S17 (App Links migration, ProGuard log stripping) — separate sprint
- customer-app files — another agent owns those

---

## Work Streams

### WS-A: Architecture P0/P1 parity (E20-S18)
**Model:** haiku | **Depends on:** nothing | **Runs:** first (no other deps)

**Files to modify:**

1. `technician-app/app/src/test/kotlin/com/homeservices/technician/data/activeJob/ActiveJobApiServicePostLocationTest.kt`
   - Lines 65 and 111: replace `kotlinx.coroutines.runBlocking {` → `kotlinx.coroutines.test.runTest {`
   - Add `import kotlinx.coroutines.test.runTest` (it's already a test module with coroutines-test dep)

2. `technician-app/app/src/main/kotlin/com/homeservices/technician/domain/jobOffer/AcceptJobOfferUseCase.kt`
   - Replace `throw RuntimeException("Accept offer failed: HTTP ${response.code()}")` with `JobOfferResult.UnknownError(response.code())`
   - Add `data class UnknownError(val httpCode: Int) : JobOfferResult` to `JobOfferResult` sealed class

3. `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/kyc/KycScreen.kt` (line ~71)
   - Find `else -> Unit` in the `when(kycStatus)` block on a sealed class → replace with explicit exhaustive branches

4. `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/payout/PayoutCadenceScreen.kt` (line ~70)
   - Same: remove `else -> Unit` on sealed `when`

5. **ApiService interfaces → `internal`:** Change 6 interfaces:
   - `technician-app/app/src/main/kotlin/com/homeservices/technician/data/activeJob/ActiveJobApiService.kt`
   - `technician-app/app/src/main/kotlin/com/homeservices/technician/data/auth/remote/AuthApiService.kt`
   - `technician-app/app/src/main/kotlin/com/homeservices/technician/data/fcm/FcmApiService.kt` (if exists)
   - `technician-app/app/src/main/kotlin/com/homeservices/technician/data/jobOffer/JobOfferApiService.kt`
   - `technician-app/app/src/main/kotlin/com/homeservices/technician/data/rating/RatingApiService.kt`
   - `technician-app/app/src/main/kotlin/com/homeservices/technician/data/wallet/WalletApiService.kt`
   - Verify the above paths exist; search for `interface *ApiService` to get the actual list

6. **ProGuard keep rules** in `technician-app/app/proguard-rules.pro`:
   - Remove wildcard `-keep interface * extends **ApiService` (or similar)
   - Replace with explicit `-keep interface com.homeservices.technician.data.*.NAME_OF_EACH_INTERFACE`

7. **Detekt config** at `technician-app/config/detekt/detekt.yml` (or similar):
   - Add `excludes` for test files under `FunctionMaxLength` rule
   - Raise `maxLineLength` to 140 (match customer-app if it has the same setting)

**Tests to write:** 
- Add a test for `AcceptJobOfferUseCase` covering `UnknownError` path
- Verify `runTest` migration compiles and tests pass

**Commit message:** `fix(tech-app): ARCH parity — sealed exhaustiveness, internal ApiService, runTest, ProGuard explicit keeps`

---

### WS-B: ARCH-03 parity — collectAsStateWithLifecycle + rememberSaveable (E20-S10)
**Model:** haiku | **Depends on:** nothing | **Runs:** parallel with WS-A

**Files to modify:**

1. `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/rating/RatingScreen.kt:44-49`
   - Replace 6x `collectAsState()` → `collectAsStateWithLifecycle()` (same pattern as customer-app Sprint 7)
   - Add `import androidx.lifecycle.compose.collectAsStateWithLifecycle`

2. **AuthScreen** phone number + OTP input fields:
   - Find the file (likely `AuthScreen.kt`)
   - Change `var phoneNumber by remember { mutableStateOf("") }` → `rememberSaveable`
   - Change OTP code field similarly

3. **ShieldReportSheet.kt** (Rating Shield escalation sheet):
   - `description` input field: `remember` → `rememberSaveable`

4. **RatingAppealSheet.kt**:
   - `reason` input field: `remember` → `rememberSaveable`

**Tests:** 
- Add `RatingScreenTest` checking all states are collected via lifecycle-aware collector (or update existing test)

**Commit message:** `fix(tech-app): E20-S10 lifecycle hardening — collectAsStateWithLifecycle + rememberSaveable`

---

### WS-C: Observability funnel (E20-S13)
**Model:** sonnet | **Depends on:** nothing | **Runs:** parallel with WS-A, WS-B

**TDD: write tests first, then implementation.**

**New file:** `technician-app/app/src/main/kotlin/com/homeservices/technician/observability/analytics/AnalyticsTracker.kt`
```kotlin
// Null-safe PostHog facade — all capture calls are fire-and-forget
public object AnalyticsTracker {
    public fun capture(event: String, properties: Map<String, Any> = emptyMap()) {
        runCatching { PostHog.capture(event, properties = properties) }
    }
}
```

**Wire 6 funnel events** (add `AnalyticsTracker.capture(...)` calls):

1. `otp_verified` → in `AuthViewModel` or `AuthOrchestrator`, when Firebase auth returns success
2. `signup_completed` → in `SaveSessionUseCase.invoke()`, after session saved
3. `job_offer_received` → in `HomeservicesFcmService.handleMessageData(...)`, when message type = `JOB_OFFER`
4. `job_offer_accepted` → in `AcceptJobOfferUseCase.invoke(...)`, on `JobOfferResult.Accepted`
5. `job_started` → in `StartWorkUseCase.invoke()`
6. `job_completed` → in `CompleteJobUseCase.invoke()`

**Add Crashlytics.recordException** at:
1. `AuthOrchestrator` catch block (or equivalent auth failure path in technician-app)
2. `FcmTokenSyncUseCase` failure path (if exists; otherwise `HomeservicesFcmService` token failure)
3. Firebase Storage uploader upload failure (if exists in technician-app)
4. Any WorkManager permanent failure path (if OutboxSyncWorker has been created; skip if not)

**New test file:** `technician-app/app/src/test/kotlin/com/homeservices/technician/observability/analytics/AnalyticsTrackerTest.kt`
- Test: `capture() does not throw when PostHog is not initialized`
- Test: `capture() calls PostHog.capture with correct event name and properties`

**Commit message:** `feat(tech-app): E20-S13 observability — AnalyticsTracker + 6 PostHog funnel events + Crashlytics.recordException`

---

### WS-D: FCM + WorkManager reliability (E20-S14)
**Model:** sonnet | **Depends on:** WS-C (shares FCM service file) | **Runs:** after WS-C

**TDD: write tests first.**

**1. `HomeservicesFcmService.onNewToken`** — add WorkRequest enqueue:
```kotlin
override fun onNewToken(token: String) {
    val request = OneTimeWorkRequestBuilder<FcmTokenRegisterWorker>()
        .setConstraints(Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build())
        .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, WorkRequest.MIN_BACKOFF_MILLIS, TimeUnit.MILLISECONDS)
        .build()
    WorkManager.getInstance(applicationContext).enqueueUniqueWork(
        "fcm_token_register",
        ExistingWorkPolicy.REPLACE,
        request
    )
}
```
- Create `FcmTokenRegisterWorker` if it doesn't exist. It should call the existing FCM token sync use case.

**2. `AuthModule.provideAuthPrefs`** — wrap `EncryptedSharedPreferences.create(...)` in `withContext(Dispatchers.IO)`:
- `provideAuthPrefs` is likely a `@Provides` `suspend` function or needs to become one. If Hilt doesn't support suspend providers, use a lazy init pattern instead: initialize on first access inside `withContext(Dispatchers.IO)`.
- If the function is NOT a suspend function, add a `runBlocking(Dispatchers.IO)` wrapper ONLY in the DI provider (acceptable since this is one-time app startup).

**3. `ActiveJobForegroundService`** — add `CoroutineExceptionHandler`:
```kotlin
private val exceptionHandler = CoroutineExceptionHandler { _, throwable ->
    Crashlytics.recordException(throwable)
}
private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.Main + exceptionHandler)
```

**Test:** `FcmTokenRegisterWorkerTest` — verify worker calls token sync use case and handles network errors gracefully.

**Commit message:** `fix(tech-app): E20-S14 FCM/WorkManager reliability — onNewToken WorkRequest + IO dispatch + CoroutineExceptionHandler`

---

### WS-E: Release pipeline + CI (E20-S16)
**Model:** sonnet | **Depends on:** nothing | **Runs:** parallel with WS-A/B/C

**1. Fix `app_name`** in `technician-app/app/src/main/res/values/strings.xml`:
```xml
<string name="app_name">HomeHeroo Technician</string>
```
Also update `technician-app/app/src/main/res/values-hi/strings.xml` if `app_name` appears there (it usually stays in English).

**2. `technician-ship.yml`** — add `workflow_dispatch`:
```yaml
on:
  workflow_dispatch:
  pull_request:
    ...
```
Also add `bundleRelease` step + artifact upload after `assembleRelease`:
```yaml
- name: assemble release AAB
  run: ./gradlew bundleRelease
- name: upload release AAB
  uses: actions/upload-artifact@v4
  with:
    name: technician-release-${{ env.GIT_SHA }}
    path: technician-app/app/build/outputs/bundle/release/app-release.aab
    retention-days: 7
```

**3. `technician-app/app/build.gradle.kts`** — add `resConfigs` + `isDebuggable`:
```kotlin
defaultConfig {
    ...
    resourceConfigurations += listOf("en", "hi")
}
buildTypes {
    release {
        isDebuggable = false
        ...
    }
}
```

**4. Sentry Gradle plugin** — add to `technician-app/app/build.gradle.kts`:
```kotlin
plugins {
    ...
    id("io.sentry.android.gradle") version "4.14.0"  // use version from libs.versions.toml
}

sentry {
    autoUploadProguardMapping = true
    ignoredBuildTypes = setOf("debug")
}
```
Add the plugin to `technician-app/settings.gradle.kts` or root `build.gradle.kts` pluginManagement if not already declared. Check if customer-app already has this plugin — mirror the exact version.

**Tests:** No unit tests needed for CI YAML changes. Verify the `app_name` change with a smoke build.

**Commit message:** `fix(tech-app): E20-S16 release pipeline — HomeHeroo app_name, bundleRelease CI, resConfigs, Sentry R8 plugin, workflow_dispatch`

---

### WS-F: Pre-Codex smoke gate + Codex review
**Runs:** after WS-A/B/C/D/E all merged to the branch

```bash
cd "C:\Alok\Business Projects\Urbanclap-sprint8\technician-app"
bash ../tools/pre-codex-smoke.sh technician-app
```

If smoke fails:
1. Fix the issue in the relevant work stream
2. Re-run smoke gate
3. Only proceed to Codex when green

Then from `C:\Alok\Business Projects\Urbanclap-sprint8`:
```
codex review --base main
```

---

## Acceptance criteria

- [ ] `RatingScreen.kt`: all 6 `collectAsState()` replaced with `collectAsStateWithLifecycle()`
- [ ] `AuthScreen`: phone + OTP fields use `rememberSaveable`
- [ ] `ShieldReportSheet`, `RatingAppealSheet`: text input fields use `rememberSaveable`
- [ ] `AnalyticsTracker` singleton exists with null-safe `capture()`
- [ ] 6 PostHog events wired at correct callsites
- [ ] `Crashlytics.recordException` at 4 failure paths
- [ ] `onNewToken` enqueues `FcmTokenRegisterWorker` with CONNECTED constraint
- [ ] `EncryptedSharedPreferences.create` wrapped in IO context
- [ ] `ActiveJobForegroundService` scope has `CoroutineExceptionHandler`
- [ ] `app_name` = "HomeHeroo Technician"
- [ ] `technician-ship.yml` has `workflow_dispatch` + `bundleRelease` + artifact upload
- [ ] `resConfigs("en", "hi")` in `defaultConfig`
- [ ] Sentry Gradle plugin configured for R8 mapping upload
- [ ] `runBlocking` → `runTest` in `ActiveJobApiServicePostLocationTest`
- [ ] `AcceptJobOfferUseCase` throws typed `UnknownError` not `RuntimeException`
- [ ] Sealed `when` exhaustive in `KycScreen` + `PayoutCadenceScreen`
- [ ] 6 ApiService interfaces changed to `internal`
- [ ] ProGuard wildcards replaced with explicit interface names
- [ ] Detekt: `FunctionMaxLength` excludes test files; `maxLineLength` = 140
- [ ] Smoke gate green
- [ ] Codex review clean (or issues fixed)
- [ ] CI green on PR
