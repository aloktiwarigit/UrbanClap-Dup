# ShieldReportSheet + RatingAppealSheet Wiring — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `ShieldReportSheet` and `RatingAppealSheet` (technician-app) reachable. Both have complete,
tested backing logic but no UI trigger. Wire a Shield-report action into `ActiveJobScreen`'s top bar and
an Appeal action into each `MyRatingsScreen` rating card.

**Architecture:** No ViewModel or backend changes — `ActiveJobViewModel.onShowShieldSheet`/`fileShieldReport`
and `MyRatingsViewModel.fileRatingAppeal`/`appealState` are already correct and tested. This plan only adds
Composable-level triggers, feedback (Snackbar), and two small pure helper functions that keep the
Snackbar-message logic unit-testable (mirrors the `PendingActionCard`/`remainingSeconds` extraction
pattern from S-33, to stay ahead of the Kover-floor risk that pattern was created to fix).

**Tech Stack:** Kotlin + Compose Material3, Hilt (unchanged), JUnit 5 + AssertJ (pure-function tests),
JUnit 4 + Robolectric (string-resolution tests), Paparazzi (screenshot tests, CI-recorded only).

## Global Constraints

- No ViewModel, use case, repository, or backend changes — see spec §6 "Explicitly out of scope."
- Every new user-facing string needs both `values/strings.xml` and `values-hi/strings.xml` entries.
- Paparazzi goldens are never recorded locally on Windows — new tests are added `@Ignore`d, recorded via
  the `paparazzi-record.yml` CI workflow_dispatch, inspected image-by-image, then un-`@Ignore`d
  (`docs/patterns/paparazzi-cross-os-goldens.md`).
- Kotlin explicit API mode + `-Werror`: every new public/internal declaration needs an explicit visibility
  modifier.
- Full source: `docs/superpowers/specs/2026-08-07-shield-rating-appeal-placement-design.md`.

**Correction vs. the approved spec (found while mapping exact file diffs for this plan):** the spec's
§5 said the 4 existing Shield/RatingAppeal Paparazzi *content* tests "don't change shape." That's true
for `RatingAppealSheetContent` (untouched) but **not** for `ShieldReportSheetContent` — the new
block-warning line (§2.3 of the spec) changes its rendered output, so
`ShieldReportSheetPaparazziTest`/`ShieldReportSheetHiPaparazziTest` need re-recording too. The spec also
didn't account for two sets of **existing** goldens that this plan's changes affect independently of any
new test: `ActiveJobScreenPaparazziTest`/`ActiveJobScreenHiPaparazziTest` (5 images — the new TopAppBar
changes every `Active`-state render) and `MyRatingsScreenTest` (1 image — the new "Appeal" button appears
on every rating card). None of these need source changes (new params all take defaults, see Task 4/9) —
only their recorded PNGs go stale. Task 5 and Task 9 cover re-recording all of these explicitly.

---

## Parallel execution note

Work Stream A (Tasks 1–5, `ActiveJobScreen`) and Work Stream B (Tasks 6–9, `MyRatingsScreen`) touch
different files and different ViewModels — fully independent in principle (this plan's controller still
dispatches implementer subagents one at a time; "independent" here means neither stream's tasks block on
the other's outputs, not that they run concurrently). Within each stream, tasks are sequential (string →
pure helper → wiring → goldens). Task 10 (smoke gate + Codex) depends on both streams.

---

## Work Stream A: Shield report wiring (ActiveJobScreen)

### Task 1: Shield-report strings (EN + HI) — TDD

**Files:**
- Modify: `technician-app/app/src/main/res/values/strings.xml`
- Modify: `technician-app/app/src/main/res/values-hi/strings.xml`
- Modify: `technician-app/app/src/test/kotlin/com/homeservices/technician/ui/activeJob/ShieldReportSheetStringsTest.kt`

**Interfaces:**
- Produces: `R.string.shield_report_trigger`, `R.string.shield_report_trigger_desc`,
  `R.string.shield_report_block_warning`, `R.string.shield_report_snackbar_success`,
  `R.string.shield_report_snackbar_error` — consumed by Tasks 2 and 4.

- [ ] **Step 1: Write the failing assertions**

Add to `ShieldReportSheetStringsTest.kt`, inside the existing `` `shield report strings resolve in english by default` `` test (after the existing assertions):

```kotlin
        assertThat(context.getString(R.string.shield_report_trigger)).isEqualTo("Report customer")
        assertThat(context.getString(R.string.shield_report_trigger_desc))
            .isEqualTo("Report this customer for abusive or unsafe behaviour")
        assertThat(context.getString(R.string.shield_report_block_warning))
            .isEqualTo("This will block this customer from future bookings with you.")
        assertThat(context.getString(R.string.shield_report_snackbar_success)).isEqualTo("Report submitted.")
        assertThat(context.getString(R.string.shield_report_snackbar_error))
            .isEqualTo("Could not submit report. Try again.")
```

And inside `` `shield report strings resolve in hindi` ``:

```kotlin
        assertThat(context.getString(R.string.shield_report_trigger)).isEqualTo("ग्राहक की रिपोर्ट करें")
        assertThat(context.getString(R.string.shield_report_block_warning))
            .isEqualTo("इससे यह ग्राहक आपके भविष्य के बुकिंग से ब्लॉक हो जाएगा।")
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd technician-app && ./gradlew :app:testDebugUnitTest --tests "*.ShieldReportSheetStringsTest"
```

Expected: FAIL — `Resource not found` for the new string names.

- [ ] **Step 3: Add the strings**

In `technician-app/app/src/main/res/values/strings.xml`, inside the existing `<!-- Shield report sheet (E06-S02-Codemod) -->` block (after `shield_report_submitting`):

```xml
    <string name="shield_report_trigger">Report customer</string>
    <string name="shield_report_trigger_desc">Report this customer for abusive or unsafe behaviour</string>
    <string name="shield_report_block_warning">This will block this customer from future bookings with you.</string>
    <string name="shield_report_snackbar_success">Report submitted.</string>
    <string name="shield_report_snackbar_error">Could not submit report. Try again.</string>
```

In `technician-app/app/src/main/res/values-hi/strings.xml`, find the matching `shield_report_*` block and add:

```xml
    <string name="shield_report_trigger">ग्राहक की रिपोर्ट करें</string>
    <string name="shield_report_trigger_desc">इस ग्राहक की गलत व्यवहार के लिए रिपोर्ट करें</string>
    <string name="shield_report_block_warning">इससे यह ग्राहक आपके भविष्य के बुकिंग से ब्लॉक हो जाएगा।</string>
    <string name="shield_report_snackbar_success">रिपोर्ट सबमिट हो गई।</string>
    <string name="shield_report_snackbar_error">रिपोर्ट सबमिट नहीं हो सकी। दोबारा कोशिश करें।</string>
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd technician-app && ./gradlew :app:testDebugUnitTest --tests "*.ShieldReportSheetStringsTest"
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add technician-app/app/src/main/res/values/strings.xml technician-app/app/src/main/res/values-hi/strings.xml technician-app/app/src/test/kotlin/com/homeservices/technician/ui/activeJob/ShieldReportSheetStringsTest.kt
git commit -m "feat(technician-app): add shield-report trigger/warning/snackbar strings"
```

---

### Task 2: Block-warning line in ShieldReportSheetContent

**Files:**
- Modify: `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/activeJob/ShieldReportSheet.kt`

**Interfaces:**
- Consumes: `R.string.shield_report_block_warning` (Task 1).

- [ ] **Step 1: Add the warning `Text` above the submit button**

In `ShieldReportSheetContent`, insert immediately before the trailing `Spacer(Modifier.height(8.dp))` /
`Row` that holds the submit button (after the char-count `Text`):

```kotlin
            Text(
                text = stringResource(R.string.shield_report_block_warning),
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.error,
                modifier = Modifier.fillMaxWidth(),
            )
```

- [ ] **Step 2: Verify it compiles and existing Paparazzi tests still build**

```bash
cd technician-app && ./gradlew :app:compileDebugKotlin :app:testDebugUnitTest --tests "*.ShieldReportSheet*"
```

Expected: BUILD SUCCESSFUL. `ShieldReportSheetPaparazziTest`/`ShieldReportSheetHiPaparazziTest` still run
(their recorded PNGs will now mismatch — that's expected and handled in Task 5, not here).

- [ ] **Step 3: Commit**

```bash
git add technician-app/app/src/main/kotlin/com/homeservices/technician/ui/activeJob/ShieldReportSheet.kt
git commit -m "feat(technician-app): add block-consequence warning to ShieldReportSheet"
```

---

### Task 3: `shieldReportSnackbarMessage` pure helper — TDD

**Files:**
- Create: `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/activeJob/ShieldReportSnackbar.kt`
- Create: `technician-app/app/src/test/kotlin/com/homeservices/technician/ui/activeJob/ShieldReportSnackbarTest.kt`

**Interfaces:**
- Produces: `shieldReportSnackbarMessage(success: Boolean, error: String?, successMessage: String, genericErrorMessage: String): String?` — consumed by Task 4.

- [ ] **Step 1: Write the failing test**

```kotlin
package com.homeservices.technician.ui.activeJob

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

public class ShieldReportSnackbarTest {
    @Test
    public fun `success returns the success message`(): Unit {
        val result = shieldReportSnackbarMessage(success = true, error = null, successMessage = "OK", genericErrorMessage = "ERR")
        assertThat(result).isEqualTo("OK")
    }

    @Test
    public fun `error returns the generic error message`(): Unit {
        val result = shieldReportSnackbarMessage(success = false, error = "network timeout", successMessage = "OK", genericErrorMessage = "ERR")
        assertThat(result).isEqualTo("ERR")
    }

    @Test
    public fun `neither success nor error returns null`(): Unit {
        val result = shieldReportSnackbarMessage(success = false, error = null, successMessage = "OK", genericErrorMessage = "ERR")
        assertThat(result).isNull()
    }

    @Test
    public fun `success takes priority when both are somehow set`(): Unit {
        val result = shieldReportSnackbarMessage(success = true, error = "stale error", successMessage = "OK", genericErrorMessage = "ERR")
        assertThat(result).isEqualTo("OK")
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd technician-app && ./gradlew :app:testDebugUnitTest --tests "*.ShieldReportSnackbarTest"
```

Expected: FAIL — `Unresolved reference: shieldReportSnackbarMessage`.

- [ ] **Step 3: Implement**

```kotlin
package com.homeservices.technician.ui.activeJob

/**
 * Pure mapping from [ActiveJobUiState.Active]'s shield-report result flags to the Snackbar text to
 * show, kept out of the Composable so it stays unit-testable without Robolectric/Compose (S-33's
 * PendingActionCard/remainingSeconds extraction is the precedent — see docs/patterns for why
 * LaunchedEffect-only logic risks the Kover floor).
 */
public fun shieldReportSnackbarMessage(
    success: Boolean,
    error: String?,
    successMessage: String,
    genericErrorMessage: String,
): String? =
    when {
        success -> successMessage
        error != null -> genericErrorMessage
        else -> null
    }
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd technician-app && ./gradlew :app:testDebugUnitTest --tests "*.ShieldReportSnackbarTest"
```

Expected: 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add technician-app/app/src/main/kotlin/com/homeservices/technician/ui/activeJob/ShieldReportSnackbar.kt technician-app/app/src/test/kotlin/com/homeservices/technician/ui/activeJob/ShieldReportSnackbarTest.kt
git commit -m "feat(technician-app): add shieldReportSnackbarMessage pure helper"
```

---

### Task 4: Wire TopAppBar + trigger + Snackbar + sheet into ActiveJobScreen

**Files:**
- Modify: `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/activeJob/ActiveJobScreen.kt`

**Interfaces:**
- Consumes: `shieldReportSnackbarMessage` (Task 3), `ActiveJobViewModel.onShowShieldSheet`/`onDismissShieldSheet`/`fileShieldReport`/`consumeShieldReportSuccess`/`consumeShieldReportError` (all pre-existing), `ShieldReportSheet` (pre-existing, unchanged signature).
- Produces: `ActiveJobScreenContent` gains 5 new parameters, all with `= {}`/no-op defaults so the
  existing Paparazzi tests keep compiling unmodified:
  `onShowShieldSheet: () -> Unit = {}`, `onDismissShieldSheet: () -> Unit = {}`,
  `onSubmitShieldReport: (description: String?) -> Unit = {}`, `onConsumeShieldSuccess: () -> Unit = {}`,
  `onConsumeShieldError: () -> Unit = {}`.

- [ ] **Step 1: Add imports**

At the top of `ActiveJobScreen.kt`, add:

```kotlin
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Snackbar
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
```

- [ ] **Step 2: Update `ActiveJobScreen` (the hiltViewModel wrapper) to pass the 5 new callbacks**

Replace the body of `ActiveJobScreen`:

```kotlin
@Composable
internal fun ActiveJobScreen(
    modifier: Modifier = Modifier,
    viewModel: ActiveJobViewModel = hiltViewModel(),
    onBackToDashboard: () -> Unit = {},
): Unit {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    ActiveJobScreenContent(
        uiState = uiState,
        onTransitionRequested = viewModel::onTransitionRequested,
        onPhotoCancelled = viewModel::onPhotoCancelled,
        onPhotoConfirmed = viewModel::onPhotoConfirmed,
        onPhotoRetake = viewModel::onPhotoRetake,
        onPhotoRetryRequested = viewModel::onPhotoRetryRequested,
        onCompleteConfirmRequest = viewModel::requestCompletionConfirm,
        onCompleteConfirm = viewModel::confirmCompletion,
        onCompleteCancel = viewModel::cancelCompletionConfirm,
        onShowShieldSheet = viewModel::onShowShieldSheet,
        onDismissShieldSheet = viewModel::onDismissShieldSheet,
        onSubmitShieldReport = viewModel::fileShieldReport,
        onConsumeShieldSuccess = viewModel::consumeShieldReportSuccess,
        onConsumeShieldError = viewModel::consumeShieldReportError,
        onBackToDashboard = onBackToDashboard,
        modifier = modifier,
    )
}
```

- [ ] **Step 3: Rewrite `ActiveJobScreenContent`**

Replace the whole function signature and body:

```kotlin
@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun ActiveJobScreenContent(
    uiState: ActiveJobUiState,
    onTransitionRequested: (stage: String) -> Unit,
    onPhotoCancelled: () -> Unit,
    onPhotoConfirmed: (filePath: String) -> Unit,
    onPhotoRetake: () -> Unit,
    onPhotoRetryRequested: () -> Unit,
    onCompleteConfirmRequest: () -> Unit,
    onCompleteConfirm: () -> Unit,
    onCompleteCancel: () -> Unit,
    onShowShieldSheet: () -> Unit = {},
    onDismissShieldSheet: () -> Unit = {},
    onSubmitShieldReport: (description: String?) -> Unit = {},
    onConsumeShieldSuccess: () -> Unit = {},
    onConsumeShieldError: () -> Unit = {},
    modifier: Modifier = Modifier,
    onBackToDashboard: () -> Unit = {},
): Unit {
    val snackbarHostState = remember { SnackbarHostState() }
    val shieldSuccessMsg = stringResource(R.string.shield_report_snackbar_success)
    val shieldErrorMsg = stringResource(R.string.shield_report_snackbar_error)
    val shieldTriggerDesc = stringResource(R.string.shield_report_trigger_desc)

    if (uiState is ActiveJobUiState.Active) {
        LaunchedEffect(uiState.shieldReportSuccess, uiState.shieldReportError) {
            val message =
                shieldReportSnackbarMessage(
                    success = uiState.shieldReportSuccess,
                    error = uiState.shieldReportError,
                    successMessage = shieldSuccessMsg,
                    genericErrorMessage = shieldErrorMsg,
                )
            if (message != null) {
                snackbarHostState.showSnackbar(message)
                if (uiState.shieldReportSuccess) onConsumeShieldSuccess() else onConsumeShieldError()
            }
        }
    }

    Scaffold(
        modifier = modifier,
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            if (uiState is ActiveJobUiState.Active) {
                TopAppBar(
                    title = { Text(uiState.job.serviceName) },
                    actions = {
                        TextButton(
                            onClick = onShowShieldSheet,
                            colors = ButtonDefaults.textButtonColors(contentColor = MaterialTheme.colorScheme.error),
                            modifier =
                                Modifier
                                    .defaultMinSize(minWidth = 48.dp, minHeight = 48.dp)
                                    .semantics { contentDescription = shieldTriggerDesc },
                        ) {
                            Icon(Icons.Filled.Warning, contentDescription = null)
                            Spacer(Modifier.width(4.dp))
                            Text(
                                text = stringResource(R.string.shield_report_trigger),
                                style = MaterialTheme.typography.labelLarge,
                                fontWeight = FontWeight.Bold,
                            )
                        }
                    },
                )
            }
        },
    ) { padding ->
        Surface(
            modifier = Modifier.fillMaxSize().padding(padding),
            color = MaterialTheme.colorScheme.background,
        ) {
            when (uiState) {
                is ActiveJobUiState.Loading -> ActiveJobSkeleton()
                is ActiveJobUiState.Completed ->
                    CenterMessage(
                        title = stringResource(R.string.active_job_complete_title),
                        body = stringResource(R.string.active_job_complete_body),
                        actionLabel = stringResource(R.string.active_job_back_to_dashboard),
                        onAction = onBackToDashboard,
                    )
                is ActiveJobUiState.Error ->
                    CenterMessage(
                        title = stringResource(R.string.active_job_error_title),
                        body = uiState.message,
                        actionLabel = stringResource(R.string.active_job_back_to_dashboard),
                        onAction = onBackToDashboard,
                    )
                is ActiveJobUiState.Active -> {
                    ActiveJobContent(
                        state = uiState,
                        onTransitionRequested = onTransitionRequested,
                        onCompleteConfirmRequest = onCompleteConfirmRequest,
                        onPhotoRetryRequested = onPhotoRetryRequested,
                    )
                    uiState.pendingPhotoStage?.let { stage ->
                        var lastCapturedPath by remember { mutableStateOf<String?>(null) }
                        PhotoCaptureScreen(
                            stage = stage,
                            onPhotoTaken = { path ->
                                lastCapturedPath = path
                                onPhotoConfirmed(path)
                            },
                            onDismiss = onPhotoCancelled,
                            isUploading = uiState.photoUploadInProgress,
                            uploadError = uiState.photoUploadError,
                            onRetry = { lastCapturedPath?.let(onPhotoConfirmed) },
                            onRetake = onPhotoRetake,
                        )
                    }
                    if (uiState.awaitingCompletionConfirm) {
                        CompletionConfirmationDialog(
                            onConfirm = onCompleteConfirm,
                            onDismiss = onCompleteCancel,
                        )
                    }
                    if (uiState.showShieldSheet) {
                        ShieldReportSheet(
                            onDismiss = onDismissShieldSheet,
                            onSubmit = onSubmitShieldReport,
                            isSubmitting = uiState.shieldReportInProgress,
                        )
                    }
                }
            }
        }
    }
}
```

This is a straight lift of the existing `when` branches (unchanged bodies) into the new `Scaffold`'s
content slot, plus the new top bar/Snackbar/sheet wiring — no other behavior changes.

- [ ] **Step 4: Compile and run the existing (unmodified) test suite**

```bash
cd technician-app && ./gradlew :app:compileDebugKotlin :app:testDebugUnitTest --tests "*.ActiveJob*"
```

Expected: BUILD SUCCESSFUL, all `ActiveJobViewModelTest` cases still pass unchanged. The two Paparazzi
test classes compile and run (goldens will mismatch — expected, see Task 5).

- [ ] **Step 5: Commit**

```bash
git add technician-app/app/src/main/kotlin/com/homeservices/technician/ui/activeJob/ActiveJobScreen.kt
git commit -m "feat(technician-app): wire Shield-report trigger into ActiveJobScreen top bar"
```

---

### Task 5: Re-record Shield-related Paparazzi goldens (CI)

**Files:** none locally — CI-driven artifact refresh.

- [ ] **Step 1: Push the branch, trigger `paparazzi-record.yml` via `workflow_dispatch`**

```bash
gh workflow run paparazzi-record.yml --ref <branch-name>
```

- [ ] **Step 2: Download the recorded artifacts, unzip inside the gradle root**

Per `docs/patterns/paparazzi-cross-os-goldens.md`.

- [ ] **Step 3: Inspect every changed image individually — do not trust a green diff**

Confirm: `ShieldReportSheetPaparazziTest`/`ShieldReportSheetHiPaparazziTest` (2 images — new warning line
visible, correctly wrapped, not clipped). `ActiveJobScreenPaparazziTest`
(`activeJobScreen_enRoute`/`_reached`/`_inProgress`, 3 images) / `ActiveJobScreenHiPaparazziTest`
(`activeJobScreen_enRoute_hi`/`_inProgress_hi`, 2 images) — new top bar renders with the service name as
title and the error-tinted "Report customer" action, correctly positioned, Hindi label not clipped/wrapped
badly.

- [ ] **Step 4: Commit the updated PNGs**

```bash
git add technician-app/app/src/test/snapshots/images/
git commit -m "chore(technician-app): re-record Shield-report goldens (top bar + warning line)"
```

---

## Work Stream B: Rating appeal wiring (MyRatingsScreen)

### Task 6: Rating-appeal strings (EN + HI) — TDD

**Files:**
- Modify: `technician-app/app/src/main/res/values/strings.xml`
- Modify: `technician-app/app/src/main/res/values-hi/strings.xml`
- Create: `technician-app/app/src/test/kotlin/com/homeservices/technician/ui/myratings/RatingAppealActionStringsTest.kt`

**Interfaces:**
- Produces: `R.string.rating_appeal_action`, `R.string.rating_appeal_disputed_badge`,
  `R.string.rating_appeal_success`, `R.string.rating_appeal_quota_exceeded`,
  `R.string.rating_appeal_error_generic` — consumed by Tasks 7, 8, 9.

- [ ] **Step 1: Write the failing test**

```kotlin
package com.homeservices.technician.ui.myratings

import androidx.test.core.app.ApplicationProvider
import com.homeservices.technician.R
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@RunWith(RobolectricTestRunner::class)
public class RatingAppealActionStringsTest {
    @Test
    public fun `rating appeal action strings resolve in english by default`(): Unit {
        val context = ApplicationProvider.getApplicationContext<android.content.Context>()

        assertThat(context.getString(R.string.rating_appeal_action)).isEqualTo("Appeal")
        assertThat(context.getString(R.string.rating_appeal_disputed_badge)).isEqualTo("Disputed")
        assertThat(context.getString(R.string.rating_appeal_success)).isEqualTo("Appeal submitted.")
        assertThat(context.getString(R.string.rating_appeal_quota_exceeded, "12 Aug"))
            .isEqualTo("You've reached your appeal limit — try again after 12 Aug.")
        assertThat(context.getString(R.string.rating_appeal_error_generic))
            .isEqualTo("Could not submit appeal. Try again.")
    }

    @Test
    public fun `rating appeal action strings resolve in hindi`(): Unit {
        RuntimeEnvironment.setQualifiers("hi")
        val context = ApplicationProvider.getApplicationContext<android.content.Context>()

        assertThat(context.getString(R.string.rating_appeal_action)).isEqualTo("अपील करें")
        assertThat(context.getString(R.string.rating_appeal_disputed_badge)).isEqualTo("विवादित")
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd technician-app && ./gradlew :app:testDebugUnitTest --tests "*.RatingAppealActionStringsTest"
```

Expected: FAIL — `Resource not found`.

- [ ] **Step 3: Add the strings**

In `technician-app/app/src/main/res/values/strings.xml`, inside the existing `<!-- Ratings screens -->`
block:

```xml
    <string name="rating_appeal_action">Appeal</string>
    <string name="rating_appeal_disputed_badge">Disputed</string>
    <string name="rating_appeal_success">Appeal submitted.</string>
    <string name="rating_appeal_quota_exceeded">You\'ve reached your appeal limit — try again after %s.</string>
    <string name="rating_appeal_error_generic">Could not submit appeal. Try again.</string>
```

In `technician-app/app/src/main/res/values-hi/strings.xml`, find the matching `rating_appeal_*` block and
add:

```xml
    <string name="rating_appeal_action">अपील करें</string>
    <string name="rating_appeal_disputed_badge">विवादित</string>
    <string name="rating_appeal_success">अपील सबमिट हो गई।</string>
    <string name="rating_appeal_quota_exceeded">आपकी अपील सीमा समाप्त हो गई है — %s के बाद फिर कोशिश करें।</string>
    <string name="rating_appeal_error_generic">अपील सबमिट नहीं हो सकी। दोबारा कोशिश करें।</string>
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd technician-app && ./gradlew :app:testDebugUnitTest --tests "*.RatingAppealActionStringsTest"
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add technician-app/app/src/main/res/values/strings.xml technician-app/app/src/main/res/values-hi/strings.xml technician-app/app/src/test/kotlin/com/homeservices/technician/ui/myratings/RatingAppealActionStringsTest.kt
git commit -m "feat(technician-app): add rating-appeal action/badge/snackbar strings"
```

---

### Task 7: `appealOutcomeMessage` pure helper — TDD

**Files:**
- Create: `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/myratings/AppealOutcomeMessage.kt`
- Create: `technician-app/app/src/test/kotlin/com/homeservices/technician/ui/myratings/AppealOutcomeMessageTest.kt`

**Interfaces:**
- Consumes: `AppealState` (pre-existing, `MyRatingsUiState.kt`).
- Produces: `appealOutcomeMessage(state: AppealState, successMessage: String, quotaExceededTemplate: String, genericErrorMessage: String, formatNextAvailable: (String) -> String): String?` — consumed by Task 8.

- [ ] **Step 1: Write the failing test**

```kotlin
package com.homeservices.technician.ui.myratings

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

public class AppealOutcomeMessageTest {
    private fun message(state: AppealState): String? =
        appealOutcomeMessage(
            state = state,
            successMessage = "Appeal submitted.",
            quotaExceededTemplate = "Limit reached — try again after %s.",
            genericErrorMessage = "Could not submit appeal.",
            formatNextAvailable = { "formatted($it)" },
        )

    @Test
    public fun `idle returns null`(): Unit {
        assertThat(message(AppealState.Idle)).isNull()
    }

    @Test
    public fun `loading returns null`(): Unit {
        assertThat(message(AppealState.Loading(bookingId = "bk-1"))).isNull()
    }

    @Test
    public fun `success returns the success message`(): Unit {
        assertThat(message(AppealState.Success)).isEqualTo("Appeal submitted.")
    }

    @Test
    public fun `quota exceeded formats the next-available date into the template`(): Unit {
        assertThat(message(AppealState.QuotaExceeded(nextAvailableAt = "2026-08-14T00:00:00Z")))
            .isEqualTo("Limit reached — try again after formatted(2026-08-14T00:00:00Z).")
    }

    @Test
    public fun `quota exceeded falls back to a placeholder when nextAvailableAt is null`(): Unit {
        assertThat(message(AppealState.QuotaExceeded(nextAvailableAt = null)))
            .isEqualTo("Limit reached — try again after —.")
    }

    @Test
    public fun `error returns the generic error message`(): Unit {
        assertThat(message(AppealState.Error)).isEqualTo("Could not submit appeal.")
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd technician-app && ./gradlew :app:testDebugUnitTest --tests "*.AppealOutcomeMessageTest"
```

Expected: FAIL — `Unresolved reference: appealOutcomeMessage`.

- [ ] **Step 3: Implement**

```kotlin
package com.homeservices.technician.ui.myratings

/**
 * Pure mapping from [AppealState] to the Snackbar text to show (or null for no snackbar), kept out of
 * the Composable so it stays unit-testable without Robolectric/Compose — same rationale as
 * ActiveJobScreen's shieldReportSnackbarMessage.
 */
public fun appealOutcomeMessage(
    state: AppealState,
    successMessage: String,
    quotaExceededTemplate: String,
    genericErrorMessage: String,
    formatNextAvailable: (String) -> String,
): String? =
    when (state) {
        is AppealState.Success -> successMessage
        is AppealState.QuotaExceeded ->
            quotaExceededTemplate.format(state.nextAvailableAt?.let(formatNextAvailable) ?: "—")
        is AppealState.Error -> genericErrorMessage
        AppealState.Idle, is AppealState.Loading -> null
    }
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd technician-app && ./gradlew :app:testDebugUnitTest --tests "*.AppealOutcomeMessageTest"
```

Expected: 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add technician-app/app/src/main/kotlin/com/homeservices/technician/ui/myratings/AppealOutcomeMessage.kt technician-app/app/src/test/kotlin/com/homeservices/technician/ui/myratings/AppealOutcomeMessageTest.kt
git commit -m "feat(technician-app): add appealOutcomeMessage pure helper"
```

---

### Task 8: RatingItemCard appeal affordance + wire appeal sheet/Snackbar into MyRatingsScreen

*(Originally split into two tasks; merged during pre-flight review — the RatingItemCard signature change
and its only call site cannot be verified independently of each other, so splitting them left the first
half uncompilable with no test to run. See plan's ledger for the pre-flight note.)*

**Files:**
- Modify: `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/myratings/MyRatingsScreen.kt`

**Interfaces:**
- Consumes: `ReceivedRating.appealDisputed` (pre-existing field, currently unused), `HsActionButton`,
  `HsTrustBadge` (pre-existing design-system components), `R.string.rating_appeal_action`,
  `R.string.rating_appeal_disputed_badge` (Task 6), `appealOutcomeMessage` (Task 7),
  `MyRatingsViewModel.appealState`/`fileRatingAppeal`/`consumeAppealState`/`refresh` (all pre-existing),
  `RatingAppealSheet` (pre-existing, unchanged signature), the existing private `formatDate` helper at the
  bottom of this file.
- Produces: `RatingItemCard(rating: ReceivedRating, onAppealClick: (bookingId: String) -> Unit)` — new
  required parameter, single call site, updated in this same task (below). `MyRatingsContent` gains 4 new
  parameters, all defaulted so the existing `MyRatingsContent(uiState = ..., onRetry = {})` call in
  `MyRatingsScreenTest.kt` keeps compiling unmodified: `appealState: AppealState = AppealState.Idle`,
  `onSubmitAppeal: (bookingId: String, reason: String) -> Unit = { _, _ -> }`,
  `onConsumeAppeal: () -> Unit = {}`, `snackbarHostState: SnackbarHostState = remember { SnackbarHostState() }`.

- [ ] **Step 1: Add all new imports**

`MyRatingsScreen.kt` currently imports `HsPrimaryButton` and `HsSectionCard` from the design system, but
not `HsActionButton`/`HsTrustBadge`. `Scaffold` and `getValue` are already imported — do not re-add them.
Add:

```kotlin
import com.homeservices.designsystem.components.HsActionButton
import com.homeservices.designsystem.components.HsTrustBadge
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberSaveable
import androidx.compose.runtime.setValue
```

- [ ] **Step 2: Update `RatingItemCard`'s signature and body**

```kotlin
@Composable
private fun RatingItemCard(
    rating: ReceivedRating,
    onAppealClick: (bookingId: String) -> Unit,
) {
    HsSectionCard {
        Row(horizontalArrangement = Arrangement.spacedBy(2.dp)) {
            repeat(5) { i ->
                Text(
                    if (i <
                        rating.overall
                    ) {
                        "★"
                    } else {
                        "☆"
                    },
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.primary,
                )
            }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            SuggestionChip(onClick = {}, label = { Text(stringResource(R.string.rating_punctuality_chip, rating.punctuality)) })
            SuggestionChip(onClick = {}, label = { Text(stringResource(R.string.rating_skill_chip, rating.skill)) })
        }
        if (!rating.comment.isNullOrBlank()) {
            Text(rating.comment, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        Text(formatDate(rating.submittedAt), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.outline)
        if (rating.appealDisputed) {
            HsTrustBadge(text = stringResource(R.string.rating_appeal_disputed_badge))
        } else {
            HsActionButton(
                text = stringResource(R.string.rating_appeal_action),
                onClick = { onAppealClick(rating.bookingId) },
            )
        }
    }
}
```

`Scaffold` is already imported in this file (used by `MyRatingsScreen`'s existing top-level `Scaffold`) —
do not re-add it. `getValue` is already imported; nothing else used below is. Add:

```kotlin
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberSaveable
import androidx.compose.runtime.setValue
```

- [ ] **Step 3: Update `MyRatingsScreen` to own the SnackbarHostState and pass ViewModel wiring down**

```kotlin
@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun MyRatingsScreen(
    modifier: Modifier = Modifier,
    viewModel: MyRatingsViewModel = hiltViewModel(),
    onBack: () -> Unit,
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val appealState by viewModel.appealState.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.my_ratings_title)) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = stringResource(R.string.action_back))
                    }
                },
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) },
        modifier = modifier,
    ) { padding ->
        MyRatingsContent(
            uiState = uiState,
            onRetry = viewModel::refresh,
            appealState = appealState,
            onSubmitAppeal = viewModel::fileRatingAppeal,
            onConsumeAppeal = viewModel::consumeAppealState,
            snackbarHostState = snackbarHostState,
            modifier = Modifier.padding(padding),
        )
    }
}
```

- [ ] **Step 4: Update `MyRatingsContent` and `RatingsSuccess` signatures + bodies (this is the real call site for `RatingItemCard`, wired below)**

```kotlin
@Composable
internal fun MyRatingsContent(
    uiState: MyRatingsUiState,
    onRetry: () -> Unit,
    modifier: Modifier = Modifier,
    appealState: AppealState = AppealState.Idle,
    onSubmitAppeal: (bookingId: String, reason: String) -> Unit = { _, _ -> },
    onConsumeAppeal: () -> Unit = {},
    snackbarHostState: SnackbarHostState = remember { SnackbarHostState() },
) {
    Surface(modifier = modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        when (val state = uiState) {
            is MyRatingsUiState.Loading ->
                CenterState {
                    CircularProgressIndicator(
                        modifier = Modifier.size(56.dp),
                        color = MaterialTheme.colorScheme.primary,
                        strokeWidth = 4.dp,
                    )
                }
            is MyRatingsUiState.Error ->
                CenterState {
                    Text(
                        stringResource(R.string.my_ratings_load_error),
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold,
                    )
                    HsPrimaryButton(text = "Try again", onClick = onRetry)
                }
            is MyRatingsUiState.Success ->
                RatingsSuccess(
                    summary = state.summary,
                    appealState = appealState,
                    onSubmitAppeal = onSubmitAppeal,
                    onConsumeAppeal = onConsumeAppeal,
                    onRefreshAfterAppeal = onRetry,
                    snackbarHostState = snackbarHostState,
                )
        }
    }
}

@Composable
private fun RatingsSuccess(
    summary: TechRatingSummary,
    appealState: AppealState,
    onSubmitAppeal: (bookingId: String, reason: String) -> Unit,
    onConsumeAppeal: () -> Unit,
    onRefreshAfterAppeal: () -> Unit,
    snackbarHostState: SnackbarHostState,
) {
    var appealSheetFor by rememberSaveable { mutableStateOf<String?>(null) }
    val successMsg = stringResource(R.string.rating_appeal_success)
    val quotaTemplate = stringResource(R.string.rating_appeal_quota_exceeded)
    val errorMsg = stringResource(R.string.rating_appeal_error_generic)

    LaunchedEffect(appealState) {
        val message =
            appealOutcomeMessage(
                state = appealState,
                successMessage = successMsg,
                quotaExceededTemplate = quotaTemplate,
                genericErrorMessage = errorMsg,
                formatNextAvailable = ::formatDate,
            )
        if (message != null) {
            if (appealState is AppealState.Success || appealState is AppealState.QuotaExceeded) {
                appealSheetFor = null
            }
            snackbarHostState.showSnackbar(message)
            onConsumeAppeal()
            if (appealState is AppealState.Success) onRefreshAfterAppeal()
        }
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        item {
            HsSectionCard {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column {
                        Text(
                            "%.1f".format(summary.averageOverall),
                            style = MaterialTheme.typography.displaySmall,
                            fontWeight = FontWeight.Bold,
                        )
                        Text(
                            "${summary.totalCount} customer ratings",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                    Text("★", style = MaterialTheme.typography.displaySmall, color = MaterialTheme.colorScheme.primary)
                }
            }
        }
        item {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                SubScoreColumn("Punctuality", summary.averageSubScores.punctuality)
                SubScoreColumn("Skill", summary.averageSubScores.skill)
                SubScoreColumn("Behaviour", summary.averageSubScores.behaviour)
            }
        }
        if (summary.trend.isNotEmpty()) item { TrendCard(weeks = summary.trend) }
        if (summary.items.isEmpty()) {
            item {
                Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                    Text(stringResource(R.string.my_ratings_empty), style = MaterialTheme.typography.bodyLarge)
                }
            }
        } else {
            items(summary.items) { rating ->
                RatingItemCard(rating = rating, onAppealClick = { bookingId -> appealSheetFor = bookingId })
            }
        }
    }

    appealSheetFor?.let { bookingId ->
        RatingAppealSheet(
            bookingId = bookingId,
            onDismiss = { appealSheetFor = null },
            onSubmit = onSubmitAppeal,
            isSubmitting = appealState is AppealState.Loading && appealState.bookingId == bookingId,
        )
    }
}
```

- [ ] **Step 5: Compile and run the existing (unmodified) test suite**

```bash
cd technician-app && ./gradlew :app:compileDebugKotlin :app:testDebugUnitTest --tests "*.MyRatings*"
```

Expected: BUILD SUCCESSFUL. `MyRatingsViewModelTest` passes unchanged.
`MyRatingsScreenTest.myRatingsSuccess()` compiles and runs (golden mismatches expected — Task 9).

- [ ] **Step 6: Commit**

```bash
git add technician-app/app/src/main/kotlin/com/homeservices/technician/ui/myratings/MyRatingsScreen.kt
git commit -m "feat(technician-app): wire RatingAppealSheet + Appeal/Disputed affordance into MyRatingsScreen"
```

---

### Task 9: New Disputed-state golden + re-record existing Rating goldens (CI)

**Files:**
- Modify: `technician-app/app/src/test/kotlin/com/homeservices/technician/ui/myratings/MyRatingsScreenTest.kt`

- [ ] **Step 1: Add a new golden test covering the Disputed badge**

```kotlin
    @Test
    public fun myRatingsSuccess_withDisputedAppeal(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                MyRatingsContent(
                    uiState = MyRatingsUiState.Success(sampleSummary().let { it.copy(items = it.items.map { r -> r.copy(appealDisputed = r.bookingId == "bk-1") }) }),
                    onRetry = {},
                )
            }
        }
    }
```

- [ ] **Step 2: Push the branch, trigger `paparazzi-record.yml` via `workflow_dispatch`**

```bash
gh workflow run paparazzi-record.yml --ref <branch-name>
```

- [ ] **Step 3: Download the recorded artifacts, unzip inside the gradle root, inspect every image**

Confirm: `myRatingsSuccess` (re-recorded — both cards now show an "Appeal" button below the date).
`myRatingsSuccess_withDisputedAppeal` (new — `bk-1`'s card shows the "Disputed" `HsTrustBadge` instead of
the button, `bk-2`'s card still shows "Appeal").

- [ ] **Step 4: Commit**

```bash
git add technician-app/app/src/test/kotlin/com/homeservices/technician/ui/myratings/MyRatingsScreenTest.kt technician-app/app/src/test/snapshots/images/
git commit -m "test(technician-app): add Disputed-badge golden, re-record MyRatingsScreen goldens"
```

---

## Task 10: Smoke gate + Codex review

**Files:** none — verification only.

- [ ] **Step 1: Run the pre-Codex smoke gate**

```bash
bash tools/pre-codex-smoke.sh technician-app
```

Non-zero exit = stop and fix before continuing. The gate's `koverVerify` step is the one to watch: per
the Global Constraints correction above, if the new `LaunchedEffect`s in Task 4/Task 8 drop coverage below
the 80% floor, apply the established fix (extract the remaining testable logic, add the Composable's `*Kt`
wrapper — e.g. `ActiveJobScreenKt`/`MyRatingsScreenKt` — to the Kover exclusion precedent block in
`build.gradle.kts`) rather than lowering the floor.

- [ ] **Step 2: Generate the review diff**

```bash
git diff origin/main...HEAD > docs/reviews/shield-rating-appeal-wiring.diff
```

- [ ] **Step 3: Run Codex (static only — do not let it attempt a build)**

```bash
codex exec --sandbox read-only -c 'sandbox_permissions=["disk-full-read-access"]' "STATIC ONLY, do not build. Review docs/reviews/shield-rating-appeal-wiring.diff. Flag CRITICAL/MAJOR correctness, security, or accessibility issues only."
```

- [ ] **Step 4: Fix any CRITICAL/MAJOR findings, then re-run Codex once (do not iterate further rounds)**

- [ ] **Step 5: Push, open a PR, do not merge — report and let the owner decide**

```bash
git push -u origin <branch-name>
gh pr create --title "feat(technician-app): wire ShieldReportSheet + RatingAppealSheet triggers" --body "$(cat <<'EOF'
## Summary
- Wires the previously-unreachable ShieldReportSheet (ActiveJobScreen top-bar trigger) and
  RatingAppealSheet (per-rating-card Appeal/Disputed affordance on MyRatingsScreen) into the technician
  app. No ViewModel, use case, repository, or backend changes — both state machines were already correct
  and tested; this only adds the missing UI trigger + feedback.
- Design spec: docs/superpowers/specs/2026-08-07-shield-rating-appeal-placement-design.md
- Re-records 8 existing Paparazzi goldens whose rendered output changed (new top bar / warning line /
  Appeal button) and adds 1 new golden for the Disputed-badge state — see that commit for the exact list.

## Test plan
- [x] shieldReportSnackbarMessage / appealOutcomeMessage pure-helper unit tests (TDD, written first)
- [x] EN/HI string-resolution Robolectric tests for all new strings
- [x] Existing ActiveJobViewModelTest / MyRatingsViewModelTest suites pass unchanged
- [x] Pre-Codex smoke gate green (bash tools/pre-codex-smoke.sh technician-app)
- [x] Codex review round — no CRITICAL/MAJOR findings
- [ ] CI green on this PR (pending)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
