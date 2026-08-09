# S-40 Catalogue + Service Detail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Raise the customer catalogue, service list and service detail screens to the D1 contract — legible accent, on-scale shape, designed states, a skeleton that renders — and restore the visual regression coverage these screens have lacked since April.

**Architecture:** One additive design-system token (`accentInk`) and one repaired primitive (`HsSkeletonBlock`) land first because every screen depends on them. Three ViewModels gain a retry trigger in parallel. Screen work follows. Verification closes by fixing a Paparazzi test that guards the wrong theme and re-arming four ignored ones.

**Tech Stack:** Kotlin (explicit API mode, `-Werror`), Jetpack Compose, Material 3, Hilt, Coroutines/Flow, JUnit4 + Truth + MockK (app), JUnit5 + AssertJ (design-system), Paparazzi, Detekt, ktlint, Kover.

## Global Constraints

- **Spec:** `docs/superpowers/specs/2026-08-08-s40-catalogue-service-detail-design.md` **rev 2**. Where plan and spec disagree, stop and ask.
- **D1 customer radius scale:** `8 / 12 / 20 / 999` dp only. No other corner radius may remain in the three screens.
- **D1 contrast:** body text ≥ 4.5:1, **target 7:1** (D2 sunlight). Never use `colorScheme.primary` as a foreground on a light surface — it measures 2.08:1 on canvas, 1.93:1 on surface.
- **Explicit API mode:** every new top-level declaration needs `public`/`internal`. Omitting it fails the build.
- **No raw `Color(0x…)`** outside `design-system/theme/`.
- **Kover floor 80%.** New logic goes in pure functions in their own files, not inside Composables.
- **Paparazzi:** never record on Windows; never `git rm -r snapshots/images/`. Use `-PexcludePaparazzi` locally.
- **Imagery:** nothing under `customer-app/app/src/main/res/drawable*/` may change.
- **i18n:** every user-facing string is a resource in **both** `values/strings.xml` and `values-hi/strings.xml`.
- **Commits:** conventional prefix, end with `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.

---

## File structure

**Design-system (WS-A)**
- Modify `design-system/src/main/kotlin/com/homeservices/designsystem/theme/Color.kt` — add `AccentInkLight`.
- Modify `.../theme/ExtendedColors.kt` — add `accentInk` to the data class and both instances.
- Create `.../motion/ReducedMotion.kt` — pure predicate + composable reader. Own file so the predicate is unit-testable outside a Composable.
- Modify `.../components/HsComponents.kt:167-178` — `HsSkeletonBlock` resting fill + shimmer.
- Modify `design-system/src/test/.../theme/D1TokenCoreTest.kt` — accentInk contrast assertions.
- Create `design-system/src/test/.../motion/ReducedMotionTest.kt`.

**ViewModels (WS-B)** — `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/catalogue/{CatalogueHome,ServiceList,ServiceDetail}ViewModel.kt` plus their existing test files.

**Dead code (WS-C)** — delete `.../catalogue/CatalogueVisualImage.kt`; modify `customer-app/app/build.gradle.kts`, `customer-app/app/detekt-baseline.xml`, `.../catalogue/PhotoFirstCategoryCard.kt`, `.../catalogue/CatalogueHomeScreen.kt`.

**Screens (WS-D)** — `CatalogueHomeScreen.kt`, `ServiceListScreen.kt`, `ServiceDetailScreen.kt`, `ui/shared/TrustDossierCard.kt`, both `strings.xml`.

**Verification (WS-E)** — five Paparazzi test classes.

**Dependency order:** WS-A → WS-D. WS-B and WS-C are independent of WS-A and of each other; run them in parallel with WS-A. WS-E last.

---

# WS-A — Design-system foundation

### Task 1: `accentInk` token

The accent is used as a foreground at 20 sites across these screens and measures 2.08:1 on canvas. `ExtendedColors.kt:57-74` already documents this ("marigold on warm paper is inherently low-contrast") and calls it "a gap in the contract… raised as a finding" — it fixed the focus-ring role only. This task closes it for text.

`#6F4610` measures **7.61:1** on light canvas and **7.04:1** on light surface. In dark mode the accent already measures 8.03:1 on canvas, so the dark instance keeps `BrandAccent` unchanged.

**Files:**
- Modify: `design-system/src/main/kotlin/com/homeservices/designsystem/theme/Color.kt`
- Modify: `design-system/src/main/kotlin/com/homeservices/designsystem/theme/ExtendedColors.kt:45-97`
- Test: `design-system/src/test/kotlin/com/homeservices/designsystem/theme/D1TokenCoreTest.kt`

**Interfaces:**
- Produces: `HomeservicesExtendedColors.accentInk: Color`, read as `LocalHomeservicesExtendedColors.current.accentInk`. Every later task uses this instead of `MaterialTheme.colorScheme.primary` for text and icon tints on light surfaces.

- [ ] **Step 1: Write the failing test**

Add inside the existing `@Nested` contrast class in `D1TokenCoreTest.kt`, matching the file's existing `Wcag21Contrast.ratio` / `isCloseTo` / `TOLERANCE` idiom:

```kotlin
@Test
internal fun accent_ink_clears_the_field_target_on_light_canvas() {
    val ratio = Wcag21Contrast.ratio(ACCENT_INK_LIGHT, CANVAS_LIGHT)
    assertThat(ratio)
        .`as`("accent-as-text = %.2f:1 (D2 sunlight target >= 7)", ratio)
        .isGreaterThanOrEqualTo(7.0)
}

@Test
internal fun accent_ink_clears_the_field_target_on_light_surface() {
    val ratio = Wcag21Contrast.ratio(ACCENT_INK_LIGHT, SURFACE_LIGHT)
    assertThat(ratio).isGreaterThanOrEqualTo(7.0)
}

/** The regression this token exists to prevent: the raw accent is not a foreground in light mode. */
@Test
internal fun the_raw_accent_is_not_body_legible_on_light_canvas() {
    assertThat(Wcag21Contrast.ratio(BRAND_ACCENT, CANVAS_LIGHT))
        .isCloseTo(2.08, within(TOLERANCE))
}
```

Add `ACCENT_INK_LIGHT` to the same companion/constants block that already defines `CANVAS_LIGHT` and `BRAND_ACCENT`. If `SURFACE_LIGHT` is not already defined there, add it with the D1 value `Color(0xFFF4EDDF)`.

- [ ] **Step 2: Run test to verify it fails**

Run: `./gradlew :design-system:testDebugUnitTest --tests "*D1TokenCoreTest*"`
Expected: FAIL — `ACCENT_INK_LIGHT` unresolved.

- [ ] **Step 3: Add the colour and the token**

In `Color.kt`, beside the other D1 palette values:

```kotlin
/**
 * Accent as a *foreground* on light surfaces. D1 §Palette's `#E2A04A` is a surface/fill colour —
 * it measures 2.08:1 on canvas and 1.93:1 on surface, so it is not legible as text or as an icon
 * tint in light mode. `ExtendedColors.focusRing` already documents this for non-text indicators;
 * this is the same finding applied to text.
 *
 * Measured: 7.61:1 on canvas-light, 7.04:1 on surface-light — both clear the D2 target of 7:1.
 * Dark mode needs no equivalent: the raw accent measures 8.03:1 on canvas-dark.
 */
internal val AccentInkLight: Color = Color(0xFF6F4610)
```

In `ExtendedColors.kt`, add to the data class after `focusRing`:

```kotlin
    /**
     * Accent hue as a legible foreground. Use for prices, accent labels and accent icon tints on
     * light surfaces. **Do not use `colorScheme.primary` for text** — see [AccentInkLight].
     *
     * Light: `#6F4610` (7.61:1 canvas / 7.04:1 surface). Dark: the raw accent, already 8.03:1.
     */
    val accentInk: Color,
```

Then `accentInk = AccentInkLight` in `HomeservicesExtendedColorsLight` and `accentInk = BrandAccent` in `HomeservicesExtendedColorsDark`.

- [ ] **Step 4: Run test to verify it passes**

Run: `./gradlew :design-system:testDebugUnitTest --tests "*D1TokenCoreTest*"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add design-system/src/main/kotlin/com/homeservices/designsystem/theme/Color.kt \
        design-system/src/main/kotlin/com/homeservices/designsystem/theme/ExtendedColors.kt \
        design-system/src/test/kotlin/com/homeservices/designsystem/theme/D1TokenCoreTest.kt
git commit -m "feat(design-system): add accentInk, a light-mode-legible accent foreground

The raw accent measures 2.08:1 on canvas and 1.93:1 on surface. ExtendedColors
already documented this for the focus-ring role and logged the general case as
an open finding; this closes it for text. 7.61:1 / 7.04:1 measured.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: reduced-motion predicate

**Files:**
- Create: `design-system/src/main/kotlin/com/homeservices/designsystem/motion/ReducedMotion.kt`
- Test: `design-system/src/test/kotlin/com/homeservices/designsystem/motion/ReducedMotionTest.kt`

**Interfaces:**
- Produces: `isReducedMotion(animatorDurationScale: Float): Boolean` and `@Composable rememberReducedMotion(): Boolean`. Task 3 consumes the latter.

The pure predicate lives outside the Composable so Kover covers it — a `@Composable` reading `Settings.Global` is not unit-testable and would drag the module under the 80% floor.

- [ ] **Step 1: Write the failing test**

```kotlin
package com.homeservices.designsystem.motion

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

internal class ReducedMotionTest {
    @Test
    fun `zero animator scale means reduced motion`() {
        assertThat(isReducedMotion(0f)).isTrue()
    }

    @Test
    fun `normal animator scale means motion is allowed`() {
        assertThat(isReducedMotion(1f)).isFalse()
    }

    @Test
    fun `a slowed animator scale is still motion`() {
        assertThat(isReducedMotion(2f)).isFalse()
    }

    /** Settings.Global returns the default when unset; a negative value is malformed. Fail safe. */
    @Test
    fun `a malformed negative scale is treated as reduced`() {
        assertThat(isReducedMotion(-1f)).isTrue()
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./gradlew :design-system:testDebugUnitTest --tests "*ReducedMotionTest*"`
Expected: FAIL — unresolved reference `isReducedMotion`.

- [ ] **Step 3: Write the implementation**

```kotlin
package com.homeservices.designsystem.motion

import android.provider.Settings
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalContext

/**
 * True when the platform animation scale disables animation.
 *
 * D1 §Motion: "Honor reduced-motion on web and Android." Compose has no first-class API for this,
 * so the platform signal is `Settings.Global.ANIMATOR_DURATION_SCALE`. Pure so it is unit-testable
 * without a Context.
 *
 * Fails safe: a non-positive scale (including a malformed negative) is treated as reduced.
 */
public fun isReducedMotion(animatorDurationScale: Float): Boolean = animatorDurationScale <= 0f

/** Reads [isReducedMotion] from the current platform settings. */
@Composable
public fun rememberReducedMotion(): Boolean {
    val resolver = LocalContext.current.contentResolver
    return remember(resolver) {
        isReducedMotion(
            Settings.Global.getFloat(resolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f),
        )
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./gradlew :design-system:testDebugUnitTest --tests "*ReducedMotionTest*"`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add design-system/src/main/kotlin/com/homeservices/designsystem/motion/ReducedMotion.kt \
        design-system/src/test/kotlin/com/homeservices/designsystem/motion/ReducedMotionTest.kt
git commit -m "feat(design-system): add reduced-motion predicate (D1 Motion)

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: `HsSkeletonBlock` — resting fill plus shimmer

The defect (spec §1.1 V-1): `DurableHooksSkeleton` builds its gradient as `[background, highlight, background]`, so the skeleton's *base* colour is the canvas. Outside the 400px gradient window it renders as bare background, and at the initial offset the whole gradient sits off-box, so frame one is blank. A skeleton needs a **resting fill**, with the shimmer as a highlight drawn on top.

**Files:**
- Modify: `design-system/src/main/kotlin/com/homeservices/designsystem/components/HsComponents.kt:167-178`

**Interfaces:**
- Consumes: `rememberReducedMotion()` from Task 2.
- Produces: `HsSkeletonBlock(modifier: Modifier = Modifier, widthFraction: Float = 1f, height: Dp, shape: Shape = MaterialTheme.shapes.small)`. The `shape` parameter is **new and defaulted**, so the two existing callers in `booking/` compile unchanged.

- [ ] **Step 1: Replace the implementation**

There is no unit test for this — it is a Composable with no extractable logic beyond Task 2's predicate, which is already covered. Its verification is the Paparazzi goldens in Task 13. Replace `HsComponents.kt:167-178` with:

```kotlin
private const val SKELETON_BAND_FRACTION = 0.4f
private const val SKELETON_SWEEP_MILLIS = 1_200

@Composable
public fun HsSkeletonBlock(
    modifier: Modifier = Modifier,
    widthFraction: Float = 1f,
    height: Dp,
    shape: Shape = MaterialTheme.shapes.small,
) {
    val restingFill = MaterialTheme.colorScheme.surfaceVariant
    val highlight = MaterialTheme.colorScheme.surface
    val reducedMotion = rememberReducedMotion()

    val progress =
        if (reducedMotion) {
            0f
        } else {
            val transition = rememberInfiniteTransition(label = "hs_skeleton")
            val animated by transition.animateFloat(
                initialValue = 0f,
                targetValue = 1f,
                animationSpec =
                    infiniteRepeatable(
                        animation = tween(SKELETON_SWEEP_MILLIS, easing = LinearEasing),
                        repeatMode = RepeatMode.Restart,
                    ),
                label = "hs_skeleton_progress",
            )
            animated
        }

    Box(
        modifier =
            modifier
                .fillMaxWidth(widthFraction)
                .height(height)
                .clip(shape)
                .drawBehind {
                    // Resting fill first — this is what makes the block visible on frame one and
                    // between sweeps. The previous implementation had none.
                    drawRect(color = restingFill)
                    if (!reducedMotion) {
                        val band = size.width * SKELETON_BAND_FRACTION
                        val startX = -band + progress * (size.width + 2f * band)
                        drawRect(
                            brush =
                                Brush.horizontalGradient(
                                    colors = listOf(Color.Transparent, highlight, Color.Transparent),
                                    startX = startX,
                                    endX = startX + band,
                                ),
                        )
                    }
                },
    )
}
```

Add the imports this needs: `androidx.compose.animation.core.LinearEasing`, `RepeatMode`, `animateFloat`, `infiniteRepeatable`, `rememberInfiniteTransition`, `tween`; `androidx.compose.foundation.layout.Box`, `fillMaxWidth`, `height`; `androidx.compose.foundation.draw.clip` (`androidx.compose.ui.draw.clip`), `androidx.compose.ui.draw.drawBehind`; `androidx.compose.ui.graphics.Brush`, `Color`, `Shape`; `androidx.compose.runtime.getValue`; `com.homeservices.designsystem.motion.rememberReducedMotion`.

Remove the now-unused `Surface` import only if nothing else in the file uses it.

- [ ] **Step 2: Verify it compiles and nothing regressed**

Run: `./gradlew :design-system:assembleDebug :design-system:testDebugUnitTest -PexcludePaparazzi`
Expected: BUILD SUCCESSFUL. The two existing callers (`BookingSummaryScreen`, `PriceApprovalScreen`) must compile untouched — if either fails, the `shape` parameter was not defaulted correctly.

- [ ] **Step 3: Commit**

```bash
git add design-system/src/main/kotlin/com/homeservices/designsystem/components/HsComponents.kt
git commit -m "fix(design-system): give HsSkeletonBlock a resting fill and a shimmer

The old primitive was a static rectangle, and the one animated skeleton in the
codebase (DurableHooksSkeleton) used the canvas colour as its gradient base, so
it rendered as nothing on frame one. Resting fill now draws first; the sweep is
a highlight on top and is suppressed under reduced motion.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

# WS-B — ViewModel retry (parallel with WS-A)

All three ViewModels share one shape: a single `combine(...).collect{}` inside `init` with no
re-trigger, so an error state is terminal. Each gains a trigger. **Task 6 is not a copy of Tasks 4-5**
— `ServiceDetailViewModel` has two coroutines.

### Task 4: `CatalogueHomeViewModel.retry()`

**Files:**
- Modify: `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/catalogue/CatalogueHomeViewModel.kt:30-46`
- Test: `customer-app/app/src/test/kotlin/com/homeservices/customer/ui/catalogue/CatalogueHomeViewModelTest.kt`

**Interfaces:**
- Produces: `CatalogueHomeViewModel.retry(): Unit`. Task 9 wires it to the error state's button.

- [ ] **Step 1: Write the failing test**

Append to the existing test class (which already uses Truth, MockK and `UnconfinedTestDispatcher`):

```kotlin
@Test
public fun `retry re-enters Loading then recovers to Success`(): Unit =
    runTest(dispatcher) {
        every { useCase() } returns flowOf(Result.failure(IOException("net err")))
        sut = CatalogueHomeViewModel(useCase, localizer, getCurrentLocale, NoOpAnalyticsFacade())
        assertThat(sut.uiState.value).isInstanceOf(CatalogueHomeUiState.Error::class.java)

        every { useCase() } returns
            flowOf(Result.success(listOf(Category("1", "Plumbing", "", 3, minPricePaise = 39900))))
        sut.retry()

        assertThat(sut.uiState.value).isInstanceOf(CatalogueHomeUiState.Success::class.java)
    }
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./gradlew :app:testDebugUnitTest --tests "*CatalogueHomeViewModelTest*" -PexcludePaparazzi` from `customer-app/`
Expected: FAIL — unresolved reference `retry`.

- [ ] **Step 3: Implement**

Replace the `init` block and add the trigger:

```kotlin
private val retryTrigger = MutableStateFlow(0)

@OptIn(ExperimentalCoroutinesApi::class)
init {
    runCatching { analytics.track(AnalyticsEvents.CATALOGUE_VIEW) }
    viewModelScope.launch {
        retryTrigger
            .flatMapLatest {
                combine(getCategories(), getCurrentLocale()) { result, locale ->
                    result.fold(
                        onSuccess = { categories ->
                            CatalogueHomeUiState.Success(
                                categories.map { localizer.localizeCategory(it, locale) },
                            )
                        },
                        onFailure = { CatalogueHomeUiState.Error(it.message ?: "Unknown error") },
                    )
                }
            }.collect { state -> _uiState.value = state }
    }
}

/** Re-fetches the catalogue. Returns to [CatalogueHomeUiState.Loading] first so the skeleton shows. */
public fun retry() {
    _uiState.value = CatalogueHomeUiState.Loading
    retryTrigger.value += 1
}
```

Add imports `kotlinx.coroutines.ExperimentalCoroutinesApi` and `kotlinx.coroutines.flow.flatMapLatest`.

- [ ] **Step 4: Run test to verify it passes**

Run: `./gradlew :app:testDebugUnitTest --tests "*CatalogueHomeViewModelTest*" -PexcludePaparazzi`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add customer-app/app/src/main/kotlin/com/homeservices/customer/ui/catalogue/CatalogueHomeViewModel.kt \
        customer-app/app/src/test/kotlin/com/homeservices/customer/ui/catalogue/CatalogueHomeViewModelTest.kt
git commit -m "feat(customer-app): add retry to CatalogueHomeViewModel

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: `ServiceListViewModel.retry()`

**Files:**
- Modify: `.../catalogue/ServiceListViewModel.kt:31-46`
- Test: `.../catalogue/ServiceListViewModelTest.kt`

**Interfaces:**
- Produces: `ServiceListViewModel.retry(): Unit`. Task 10 wires it.

- [ ] **Step 1: Write the failing test**

```kotlin
@Test
public fun `retry re-enters Loading then recovers to Success`(): Unit =
    runTest(dispatcher) {
        every { useCase(any()) } returns flowOf(Result.failure(IOException("net err")))
        sut = ServiceListViewModel(savedStateHandle, useCase, localizer, getCurrentLocale)
        assertThat(sut.uiState.value).isInstanceOf(ServiceListUiState.Error::class.java)

        every { useCase(any()) } returns flowOf(Result.success(emptyList()))
        sut.retry()

        assertThat(sut.uiState.value).isInstanceOf(ServiceListUiState.Success::class.java)
    }
```

Match the constructor argument names and mock setup already used in `ServiceListViewModelTest.kt` — read the file's existing `setUp` before writing this, and reuse its fixtures rather than inventing new ones.

- [ ] **Step 2: Run test to verify it fails**

Run: `./gradlew :app:testDebugUnitTest --tests "*ServiceListViewModelTest*" -PexcludePaparazzi`
Expected: FAIL — unresolved reference `retry`.

- [ ] **Step 3: Implement**

Same shape as Task 4:

```kotlin
private val retryTrigger = MutableStateFlow(0)

@OptIn(ExperimentalCoroutinesApi::class)
init {
    viewModelScope.launch {
        retryTrigger
            .flatMapLatest {
                combine(getServices(categoryId), getCurrentLocale()) { result, locale ->
                    result.fold(
                        onSuccess = { services ->
                            ServiceListUiState.Success(
                                services.map { localizer.localizeService(it, locale) },
                            )
                        },
                        onFailure = { ServiceListUiState.Error(it.message ?: "Unknown error") },
                    )
                }
            }.collect { state -> _uiState.value = state }
    }
}

/** Re-fetches the service list. Returns to [ServiceListUiState.Loading] first. */
public fun retry() {
    _uiState.value = ServiceListUiState.Loading
    retryTrigger.value += 1
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./gradlew :app:testDebugUnitTest --tests "*ServiceListViewModelTest*" -PexcludePaparazzi`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add customer-app/app/src/main/kotlin/com/homeservices/customer/ui/catalogue/ServiceListViewModel.kt \
        customer-app/app/src/test/kotlin/com/homeservices/customer/ui/catalogue/ServiceListViewModelTest.kt
git commit -m "feat(customer-app): add retry to ServiceListViewModel

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: `ServiceDetailViewModel.retry()` — **both** coroutines

`ServiceDetailViewModel.kt`'s `init` spans `:49-86` and contains **two** `viewModelScope.launch` blocks: the service detail at `:50-67` and the confidence score at `:69-84`, the latter guarded by `technicianId != null`. A retry wired only to the first restores the service and leaves the confidence row stale. Both must re-fire.

**Files:**
- Modify: `.../catalogue/ServiceDetailViewModel.kt:49-86`
- Test: `.../catalogue/ServiceDetailViewModelTest.kt`

**Interfaces:**
- Produces: `ServiceDetailViewModel.retry(): Unit`. Task 11 wires it.

- [ ] **Step 1: Write the failing test**

```kotlin
@Test
public fun `retry recovers the service detail`(): Unit =
    runTest(dispatcher) {
        every { getServiceDetail(any()) } returns flowOf(Result.failure(IOException("net err")))
        sut = buildViewModel()
        assertThat(sut.uiState.value).isInstanceOf(ServiceDetailUiState.Error::class.java)

        every { getServiceDetail(any()) } returns flowOf(Result.success(sampleService()))
        sut.retry()

        assertThat(sut.uiState.value).isInstanceOf(ServiceDetailUiState.Success::class.java)
    }

/** Guards the rev-2 correction: retry must re-fire the second coroutine too. */
@Test
public fun `retry re-requests the confidence score when a technician is present`(): Unit =
    runTest(dispatcher) {
        sut = buildViewModel()
        clearMocks(getConfidenceScore, answers = false)
        every { getConfidenceScore(any(), any(), any()) } returns
            flowOf(Result.success(sampleConfidenceScore()))

        sut.retry()

        verify(atLeast = 1) { getConfidenceScore(any(), any(), any()) }
    }
```

Reuse the existing fixtures in `ServiceDetailViewModelTest.kt` / `ServiceDetailViewModelConfidenceScoreTest.kt` for `buildViewModel()`, `sampleService()` and `sampleConfidenceScore()` — read both files first; a `techId` must be present in the `SavedStateHandle` for the second test. Import `io.mockk.clearMocks` and `io.mockk.verify`.

- [ ] **Step 2: Run test to verify it fails**

Run: `./gradlew :app:testDebugUnitTest --tests "*ServiceDetailViewModelTest*" -PexcludePaparazzi`
Expected: FAIL — unresolved reference `retry`.

- [ ] **Step 3: Implement**

```kotlin
private val retryTrigger = MutableStateFlow(0)

@OptIn(ExperimentalCoroutinesApi::class)
init {
    viewModelScope.launch {
        retryTrigger
            .flatMapLatest {
                combine(getServiceDetail(serviceId), getCurrentLocale()) { result, locale ->
                    result.fold(
                        onSuccess = { service ->
                            runCatching {
                                analytics.track(
                                    AnalyticsEvents.SERVICE_VIEW,
                                    mapOf("service_id" to serviceId),
                                )
                            }
                            ServiceDetailUiState.Success(localizer.localizeService(service, locale))
                        },
                        onFailure = { ServiceDetailUiState.Error(it.message ?: "Unknown error") },
                    )
                }
            }.collect { state -> _uiState.value = state }
    }
    if (technicianId != null) {
        viewModelScope.launch {
            retryTrigger
                .flatMapLatest {
                    val (lat, lng) = resolveGps()
                    getConfidenceScore(technicianId, lat, lng)
                }.collect { result ->
                    _confidenceScoreState.value =
                        result.fold(
                            onSuccess = { score ->
                                if (score.isLimitedData) {
                                    ConfidenceScoreUiState.Limited
                                } else {
                                    ConfidenceScoreUiState.Loaded(score)
                                }
                            },
                            onFailure = { ConfidenceScoreUiState.Hidden },
                        )
                }
        }
    }
}

/**
 * Re-fetches the service **and** the confidence score. Both coroutines are keyed off the same
 * trigger — a retry that re-fired only the detail would leave a stale confidence row behind it.
 */
public fun retry() {
    _uiState.value = ServiceDetailUiState.Loading
    if (technicianId != null) {
        _confidenceScoreState.value = ConfidenceScoreUiState.Loading
    }
    retryTrigger.value += 1
}
```

Note `flatMapLatest`'s lambda here is a `suspend` block, so the `resolveGps()` call is legal inside it.

- [ ] **Step 4: Run test to verify it passes**

Run: `./gradlew :app:testDebugUnitTest --tests "*ServiceDetailViewModel*" -PexcludePaparazzi`
Expected: PASS across all four `ServiceDetailViewModel*` test classes — the GPS and confidence-score suites must not regress.

- [ ] **Step 5: Commit**

```bash
git add customer-app/app/src/main/kotlin/com/homeservices/customer/ui/catalogue/ServiceDetailViewModel.kt \
        customer-app/app/src/test/kotlin/com/homeservices/customer/ui/catalogue/ServiceDetailViewModelTest.kt
git commit -m "feat(customer-app): add retry to ServiceDetailViewModel, both coroutines

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

# WS-C — Dead code and duplication (parallel with WS-A/B)

### Task 7: delete `CatalogueVisualImage.kt`

Verified dead: neither `CatalogueVisualImage` nor its enum `CatalogueVisualSize` is referenced outside its own file, across `main/`, `test/` and `androidTest/`.

**Files:**
- Delete: `.../catalogue/CatalogueVisualImage.kt`
- Modify: `customer-app/app/build.gradle.kts:663-666`
- Modify: `customer-app/app/detekt-baseline.xml` (entries at :24, :27, :52-69, :101)

- [ ] **Step 1: Confirm it is still dead before deleting**

Run: `grep -rn "CatalogueVisualImage\|CatalogueVisualSize" --include=*.kt customer-app/`
Expected: matches **only** inside `CatalogueVisualImage.kt` itself. If anything else appears, stop — the premise has changed since the spec was written.

- [ ] **Step 2: Delete the file and its references**

```bash
git rm customer-app/app/src/main/kotlin/com/homeservices/customer/ui/catalogue/CatalogueVisualImage.kt
```

In `build.gradle.kts`, remove the two Kover exclusion lines `"*.CatalogueVisualImageKt"` and `"*.CatalogueVisualImageKt\$*"` together with the comment above them. In `detekt-baseline.xml`, remove every `<ID>` whose text contains `CatalogueVisualImage`.

- [ ] **Step 3: Verify the build and coverage still pass**

Run: `./gradlew :app:assembleDebug :app:detekt :app:koverVerify -PexcludePaparazzi`
Expected: BUILD SUCCESSFUL. A `koverVerify` failure means the deleted file was propping up the ratio — report it rather than re-adding the exclusion.

- [ ] **Step 4: Commit**

```bash
git add -A customer-app/
git commit -m "chore(customer-app): delete dead CatalogueVisualImage

239 lines with zero references. Removes its Kover exclusion and the stale
detekt-baseline entries naming colour literals S-32 already removed.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 8: dedupe `categoryStyle`

Two implementations that **disagree**: `CatalogueHomeScreen.kt:154` tints the fallback `onSurfaceVariant`, `PhotoFirstCategoryCard.kt:232` tints it `primary`. An unrecognised category id therefore renders differently depending on a feature flag.

**Files:**
- Create: `.../catalogue/CategoryStyle.kt`
- Modify: `.../catalogue/CatalogueHomeScreen.kt:138-156` (delete local copy)
- Modify: `.../catalogue/PhotoFirstCategoryCard.kt:193-241` (delete local copy)

**Interfaces:**
- Produces: `internal data class CategoryStyle(val iconBackground: Color, val iconTint: Color, val icon: ImageVector)` and `@Composable internal fun categoryStyle(id: String): CategoryStyle`. Tasks 9 and 11 use these names.

- [ ] **Step 1: Create the single definition**

New file `CategoryStyle.kt` containing one `CategoryStyle` data class and one `categoryStyle(id)` function. Carry over the five known ids exactly as they appear today (`ac-repair`, `water-pump`, `plumbing`, `electrical`, `water-purifier`) with their existing container/on-container pairs and icons.

**Resolve the disagreement toward `onSurfaceVariant`:** it is the correct on-colour for a `surfaceVariant` background, and `primary` on `surfaceVariant` measures 1.93:1 — the same illegibility Task 1 exists to fix.

```kotlin
else ->
    CategoryStyle(
        iconBackground = MaterialTheme.colorScheme.surfaceVariant,
        iconTint = MaterialTheme.colorScheme.onSurfaceVariant,
        icon = Icons.Default.Build,
    )
```

- [ ] **Step 2: Delete both local copies and fix imports**

Remove `CategoryStyle` + `categoryStyle` from `CatalogueHomeScreen.kt`, and `CategoryStyleTokens` + `categoryStyle` + the three-line comment at `:193-195` from `PhotoFirstCategoryCard.kt`. Change `PhotoCardIconFallback`'s parameter type from `CategoryStyleTokens` to `CategoryStyle`.

- [ ] **Step 3: Verify**

Run: `./gradlew :app:assembleDebug :app:testDebugUnitTest --tests "*PhotoFirstCardFallbackTest*" -PexcludePaparazzi`
Expected: BUILD SUCCESSFUL, tests PASS.

- [ ] **Step 4: Commit**

```bash
git add -A customer-app/
git commit -m "refactor(customer-app): one categoryStyle definition, not two that disagree

The fallback tint was onSurfaceVariant in one copy and primary in the other, so
an unknown category id rendered differently depending on a feature flag.
Resolved toward onSurfaceVariant; primary on surfaceVariant is 1.93:1.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

# WS-D — Screens (depends on WS-A and WS-B)

### Task 9: `CatalogueHomeScreen` — fold, states, shape, accent

**Files:**
- Modify: `.../catalogue/CatalogueHomeScreen.kt`
- Modify: `customer-app/app/src/main/res/values/strings.xml`, `values-hi/strings.xml`
- Test: `.../catalogue/CatalogueHomeScreenTest.kt`

**Interfaces:**
- Consumes: `accentInk` (Task 1), `HsSkeletonBlock` (Task 3), `CatalogueHomeViewModel.retry()` (Task 4), `categoryStyle` (Task 8).
- Produces: `CatalogueHomeContent(..., onRetry: () -> Unit = {})` — a new parameter with a default, so existing Paparazzi call sites compile unchanged.

- [ ] **Step 1: Add the strings**

Add to both files (Hindi first-class, not a machine gloss):

| key | en | hi |
|---|---|---|
| `catalogue_empty_title` | No services here yet | यहाँ अभी कोई सेवा नहीं है |
| `catalogue_empty_body` | We are adding services in your area. Check back soon. | हम आपके क्षेत्र में सेवाएँ जोड़ रहे हैं। जल्द ही देखें। |
| `catalogue_retry` | Try again | फिर कोशिश करें |

- [ ] **Step 2: Write the failing test**

Add to `CatalogueHomeScreenTest.kt` — a Paparazzi snapshot for the empty state and one for the error state, both `HomeservicesTheme(darkTheme = false)`-wrapped like the existing two:

```kotlin
@Test
public fun `catalogue home empty state`(): Unit {
    paparazzi.snapshot {
        HomeservicesTheme(darkTheme = false) {
            CatalogueHomeContent(
                uiState = CatalogueHomeUiState.Success(emptyList()),
                onCategoryClick = {}, onSettingsClick = {},
                onProfileLanguageClick = {}, onTrackBooking = {},
            )
        }
    }
}

@Test
public fun `catalogue home error state`(): Unit {
    paparazzi.snapshot {
        HomeservicesTheme(darkTheme = false) {
            CatalogueHomeContent(
                uiState = CatalogueHomeUiState.Error("net err"),
                onCategoryClick = {}, onSettingsClick = {},
                onProfileLanguageClick = {}, onTrackBooking = {},
            )
        }
    }
}
```

- [ ] **Step 3: Verify the new snapshot cases compile**

Run: `./gradlew :app:compileDebugUnitTestKotlin -PexcludePaparazzi`
Expected: BUILD SUCCESSFUL.

**Do not run Paparazzi locally.** These two cases have no golden yet and cannot get one here — goldens
are Linux-CI-recorded in Task 14, and a Windows-recorded golden diverges 3-5% from CI. Leaving the
task with a red Paparazzi suite would be a false signal, not a TDD red step. The screen's visual
gate is Task 14; this step only proves the test code compiles against the changed signatures.

- [ ] **Step 4: Implement the screen changes**

Six changes in one file:

1. **Delete `HeroSearchBar`** (`:513-547`) and its call in `StickyHero` (`:452`), plus the now-unused `TextField`/`TextFieldDefaults`/`Search` imports. Leave `catalogue_search_hint` in both `strings.xml` — a real search is a future story.
2. **Invert the fold** in `CatalogueTab` (`:361-431`): move the `PromoSlider` and `TrustStrip` items to **after** the category grid. Order becomes `CustomerHomeTabContent` → pending-payment banner → "Our services" + grid → `PromoSlider` → `TrustStrip`.
3. **Empty state**: guard the `Success` branch. When `uiState.categories.isEmpty()`, render an empty state — icon, `catalogue_empty_title`, `catalogue_empty_body` — instead of the heading over blank space. Model it on `ServiceListScreen.kt:166` `EmptyServiceList`.
4. **Error state**: give `ErrorState` an `onRetry: () -> Unit` parameter and an `HsPrimaryButton` labelled `catalogue_retry`. Keep the existing title and body strings. **Do not render `uiState.message`** — it is a diagnostic.
5. **Radii onto the D1 scale**: `18.dp`→`20.dp` (search removed, so only the remaining uses), `14.dp`→`12.dp` (trust chip), `16.dp`→`20.dp` (category card), `24.dp`→`20.dp` (promo card, support hero), `28.dp`→`20.dp` (bottom nav), `22.dp`→`20.dp` (nav item), `15.dp`→`12.dp` (support icon tile), `3.dp`→`8.dp` (promo dot). Prefer `MaterialTheme.shapes.large/medium/small` over raw values where the element maps cleanly.
6. **Accent as foreground → `accentInk`**: `:474` (wordmark), `:481` (location icon), `:506` (settings icon), `:708`+`:713` (trust chip icon and label), `:795` (category price), `:1070` (support icon). Read via `LocalHomeservicesExtendedColors.current.accentInk`. The `CircularProgressIndicator` at `:880` needs no colour decision — item 9 below deletes it outright.
7. **Price rail**: the category-card price gets `fontFamily = HomeservicesMonoFontFamily`. `formatRupees` returns a plain `String`; the family is applied at the call site.
8. **Trust chip sizing** (audit A11Y-004): remove `maxLines = 1` / `TextOverflow.Ellipsis` from `TrustChip` and let the row wrap, so `30-day guarantee` and `30 दिन गारंटी` both fit. Do not shorten the English copy.
9. Replace `LoadingState`'s `CircularProgressIndicator` with `HsSkeletonBlock` calls mirroring the 2-up grid.

- [ ] **Step 5: Verify compile and lint**

Run: `./gradlew :app:assembleDebug :app:ktlintCheck :app:detekt -PexcludePaparazzi`
Expected: BUILD SUCCESSFUL.

Then confirm no off-scale radii remain:
Run: `grep -oE "RoundedCornerShape\([0-9]+\.dp\)" customer-app/app/src/main/kotlin/com/homeservices/customer/ui/catalogue/CatalogueHomeScreen.kt | sort -u`
Expected: only `8.dp`, `12.dp`, `20.dp`, `999.dp`.

- [ ] **Step 6: Commit**

```bash
git add -A customer-app/
git commit -m "feat(customer-app): rebuild catalogue home around the category grid

Deletes the inert search field, moves the grid above the promo carousel, adds
the missing empty state, gives the error state a retry, puts every radius on the
D1 customer scale, and moves accent foregrounds to accentInk (2.08:1 -> 7.61:1).
Trust chip now wraps instead of truncating '30-day guara...' (audit A11Y-004).

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 10: `ServiceListScreen`

**Files:**
- Modify: `.../catalogue/ServiceListScreen.kt`
- Test: `.../catalogue/ServiceListScreenPaparazziTest.kt`

**Interfaces:**
- Consumes: `accentInk`, `HsSkeletonBlock`, `ServiceListViewModel.retry()`.
- Produces: `ServiceListContent(..., onRetry: () -> Unit = {})`.

- [ ] **Step 1: Add an error-state snapshot test**

Add a `ServiceListUiState.Error("net err")` case to `ServiceListScreenPaparazziTest.kt`, wrapped in `HomeservicesTheme(darkTheme = false)` like the existing success case.

- [ ] **Step 2: Implement**

1. Replace the naked `Text` error branch (`:121-129`) with a designed state matching `EmptyServiceList` (`:166`) — icon, bold title, supporting line — plus an `HsPrimaryButton` labelled `catalogue_retry` calling `onRetry`. Reuse `catalogue_error_title` and `catalogue_error`.
2. Delete `private val SkeletonLine = Color(0xFFEDE7DD)` (`:54`) and `PlaceholderLine` (`:389-399`); rebuild `ServiceListSkeleton` on `HsSkeletonBlock`.
3. Hierarchy: drop the price from `22.sp` to `18.sp` so the `16.sp` name leads; add `fontFamily = HomeservicesMonoFontFamily` to the price (`:265`).
4. `accentInk` for `:182`, `:266`, `:311`, `:317`. Leave `:332` — `primaryContainer` is a fill.
5. Radii: `ServiceCardShape` `12.dp` is already on scale. `PillShape` (`percent = 50`) is "full" and stays.

- [ ] **Step 3: Verify**

Run: `./gradlew :app:assembleDebug :app:ktlintCheck :app:detekt -PexcludePaparazzi`
Expected: BUILD SUCCESSFUL, and `grep -n "Color(0x" ServiceListScreen.kt` returns nothing.

- [ ] **Step 4: Commit**

```bash
git add -A customer-app/
git commit -m "feat(customer-app): designed error state and legible pricing on the service list

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 11: `ServiceDetailScreen`

**Files:**
- Modify: `.../catalogue/ServiceDetailScreen.kt`
- Test: `.../catalogue/ServiceDetailScreenTest.kt`

**Interfaces:**
- Consumes: `accentInk`, `HsSkeletonBlock`, `ServiceDetailViewModel.retry()`.
- Produces: `ServiceDetailContent(..., onRetry: () -> Unit = {})`.

- [ ] **Step 1: Implement**

1. **Palette leaks.** Delete `MetricNeutralBg` (`:66`) and `SkeletonLine` (`:67`). `ServiceMetricTile`'s non-emphasised background becomes `MaterialTheme.colorScheme.surface`; its label becomes `onSurfaceVariant` and its value `onSurface`, replacing the hardcoded `Color(0xFF5F6C66)` (`:351`) and `Color(0xFF18231F)` (`:359`). Delete the `@Suppress("MagicNumber")` at `:324` — with the literals gone it has nothing to suppress.
2. **One authoritative price.** Remove the price tile from `ServiceMetricRow` (`:310-315`). The row keeps "typical visit" and gains a trust tile reading `service_detail_trust_metric` (new string: en `Verified pro`, hi `सत्यापित पेशेवर`). The sticky `ServiceBookingBar` price stays and gains `HomeservicesMonoFontFamily`.
3. **Raise the trust dossier** above `ServiceMetricRow` in `ServiceDetailBody` (`:143-148`).
4. **Error state**: `ServiceDetailError` gains `onRetry` and an `HsPrimaryButton` labelled `catalogue_retry`.
5. **Skeleton**: delete `PlaceholderLine` (`:599`) and `PlaceholderBlock` (`:611`); rebuild `ServiceDetailSkeleton` on `HsSkeletonBlock`.
6. **Radii**: `CardShape` `12.dp` stays. No other raw radii exist in this file.
7. **accentInk** for `:438`, `:475`, `:510`.

Leave the hero's `Color.White` and `Color.Black.copy(alpha = …)` scrim values — they sit on a fixed photographic scrim and are correct in both themes, as their existing comments explain.

- [ ] **Step 2: Verify**

Run: `./gradlew :app:assembleDebug :app:ktlintCheck :app:detekt -PexcludePaparazzi`
Expected: BUILD SUCCESSFUL. `grep -n "Color(0xFF" ServiceDetailScreen.kt` returns nothing.

- [ ] **Step 3: Commit**

```bash
git add -A customer-app/
git commit -m "feat(customer-app): one price, raised trust, tokenised palette on service detail

Removes the fixed-light MetricNeutralBg that rendered as a grey slab in dark
mode, plus two pre-pivot green-grey literals kept behind a MagicNumber suppress.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 12: `TrustDossierCard` i18n and iconography

**Files:**
- Modify: `.../ui/shared/TrustDossierCard.kt`
- Modify: both `strings.xml`

- [ ] **Step 1: Add the strings**

| key | en | hi |
|---|---|---|
| `trust_dossier_review_rating` | `Rated %1$s out of 5` | `5 में से %1$s` |

- [ ] **Step 2: Implement**

1. `:205` — replace `"Rating ${"%.1f".format(review.rating)}/5"` with `stringResource(R.string.trust_dossier_review_rating, formatRating(review.rating))`, where `formatRating` uses `Locale.getDefault()` explicitly rather than `String.format`'s implicit default.
2. `:211` — replace `review.date.take(10)` with a locale-aware formatted date. Parse the ISO-8601 string and render via `java.time.format.DateTimeFormatter.ofLocalizedDate(FormatStyle.MEDIUM)`. If parsing fails, render nothing rather than the raw string.
3. `:231` — swap `Icons.Default.Lock` for `Icons.Default.VerifiedUser`. A padlock reads *locked*, not *verified*.
4. `:241`, `:266` — `accentInk`. Leave `:228`, `:309`, `:334` — those are `primaryContainer` fills.
5. `:349`, `:361` — delete `PlaceholderLine` / `PlaceholderBlock`, use `HsSkeletonBlock`.

- [ ] **Step 3: Verify**

Run: `./gradlew :app:assembleDebug :app:testDebugUnitTest --tests "*TrustDossier*" -PexcludePaparazzi`
Expected: BUILD SUCCESSFUL, tests PASS.

- [ ] **Step 4: Commit**

```bash
git add -A customer-app/
git commit -m "fix(customer-app): translate the trust dossier rating, format its dates

An English literal and a raw ISO-8601 substring were reaching users in an app
whose resources are otherwise fully translated. Lock icon -> verification mark.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

# WS-E — Verification

### Task 13: repair and re-arm the Paparazzi suite

`ConfidenceScoreRowPaparazziTest` is the **only** enforced catalogue screenshot (`customer-ship.yml:105` runs `verifyPaparazziDebug`) and it never wraps `HomeservicesTheme` (`:12-15`), so it guards stock Material3 rendering that no user sees — which is why its 2026-04-25 golden survived the marigold core.

**Files:** the five test classes below.

- [ ] **Step 1: Fix the theme bug**

In `ConfidenceScoreRowPaparazziTest.kt`, wrap both `paparazzi.snapshot { }` bodies in `HomeservicesTheme(darkTheme = false) { }` and import it, matching `CatalogueHomeScreenTest.kt:20`.

- [ ] **Step 2: Remove the `@Ignore`s**

| File | Annotation |
|---|---|
| `ServiceDetailScreenTest.kt` | `:19` method-level |
| `ServiceListScreenPaparazziTest.kt` | `:13` class-level |
| `CustomerHomeScreenPaparazziTest.kt` | `:25` class-level and `:70`, `:91`, `:112` |
| `TrustDossierCardPaparazziTest.kt` | `:13` class-level and `:41`, `:53` |

Leave `PhotoFirstCategoryCardPaparazziTest` and `PhotoFirstServiceCardPaparazziTest` ignored — the flag stays OFF and those assets are out of scope.

- [ ] **Step 3: Commit**

```bash
git add -A customer-app/
git commit -m "test(customer-app): fix ConfidenceScoreRow theme, re-arm four ignored suites

ConfidenceScoreRowPaparazziTest was CI-enforced but never wrapped
HomeservicesTheme, so it guarded a rendering no user sees.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 14: record goldens on CI, then run the gate

Paparazzi goldens must never be recorded on Windows — cross-OS antialiasing diverges 3-5%, far above the 0.1% threshold.

- [ ] **Step 1: Run the local smoke gate with Paparazzi excluded**

Run: `bash tools/pre-codex-smoke.sh customer-app`
Expected: all six steps green. Non-zero exit stops the story.

- [ ] **Step 2: Push the branch and record on CI**

```bash
git push -u origin feat/s40-catalogue
gh workflow run paparazzi-record.yml -f gradle_root=customer-app -f gradle_task=:app:recordPaparazziDebug
gh workflow run paparazzi-record.yml -f gradle_root=design-system -f gradle_task=:recordPaparazziDebug
```

The design-system run is required because Task 3 changes `HsSkeletonBlock`, which its own goldens cover.

- [ ] **Step 3: Download, unzip in place, commit**

Download `paparazzi-snapshots-customer-app` and `paparazzi-snapshots-design-system` from the Actions tab, then unzip each **inside its Gradle root** (`cd customer-app && unzip ~/Downloads/paparazzi-snapshots-customer-app.zip`).

Verify before committing: `git status --short customer-app/app/src/test/snapshots/` must show **modified and added** files, never deletions. Deletions mean the unzip landed in the wrong directory — reset and redo.

Expect `BookingSummaryScreen` and `PriceApproval` goldens to move: they are existing `HsSkeletonBlock` callers and inherit Task 3's fix. That is intended.

```bash
git add customer-app/app/src/test/snapshots design-system/src/test/snapshots
git commit -m "test: record Paparazzi goldens for S-40 on CI Linux

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
git push
```

- [ ] **Step 4: Codex review**

`codex review --base` hangs trying to build. Produce a static diff and review that instead:

```bash
git diff origin/main...HEAD > /tmp/s40.diff
codex exec --sandbox read-only -c 'sandbox_permissions=["disk-full-read-access"]' \
  "Review /tmp/s40.diff against docs/superpowers/specs/2026-08-08-s40-catalogue-service-detail-design.md. STATIC ONLY, do not build."
```

Fix findings, re-run **once**. Do not iterate further.

- [ ] **Step 5: Open the PR — do not merge**

```bash
gh pr create --base main --head feat/s40-catalogue \
  --title "S-40: catalogue + service detail craft pass" \
  --body "Implements docs/superpowers/specs/2026-08-08-s40-catalogue-service-detail-design.md rev 2.

Leaves imagery untouched per owner decision. Deferred items are recorded in spec section 11.

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

Leave the PR open for the owner. Root `CLAUDE.md` forbids direct pushes to `main`; the last phase-3 story breached this and it is not to be repeated.

---

## Spec coverage check

| Spec section | Task |
|---|---|
| §1 dead code | 7 |
| §1.1 V-1 skeleton | 2, 3 |
| §1.1 V-2 / §3.1.1 search cut | 9 |
| §3.1 fold, card, price | 9 |
| §3.1.2 A11Y-004 | 9 step 4.8 |
| §3.2 service list | 10 |
| §3.3 service detail | 11 |
| §3.4 trust dossier | 12 |
| §3.5 shape conformance | 9, 10, 11 |
| §4 HsSkeletonBlock | 3 |
| §5 dedupe | 8 |
| §6 retry (3 VMs, 2 coroutines) | 4, 5, 6 |
| §7 imagery untouched | no task modifies `res/drawable*` |
| §8 five Paparazzi classes | 13, 14 |
| §10 acceptance 1-12 | all |

**Not covered by any task, by design:** spec §11 (offline/success/destructive state rows, accessibility semantics, dynamic type, fold-inversion telemetry). These were deferred explicitly, not missed.

**`accentInk` (Task 1):** raised by the design-direction pass, **approved by the owner 2026-08-09**,
and folded back into the spec as §3.6 with acceptance criterion 6b. Plan and spec agree.

## Size-gate override

This plan is **1088 lines** against the Feature-tier "split required above 800" gate in root
`CLAUDE.md`. **Owner approved proceeding as one PR, 2026-08-09.**

Recorded so the gate is not silently ignored: all four blast-radius criteria the same section
defines are negative — 3 new files (gate: >20), UI and ViewModel layers only (gate: all four),
0 external SDK integrations (gate: ≥2), ~7 test files (gate: ≥10). The length comes from verbatim
code blocks, which the writing-plans skill requires and which reduce implementer risk rather than
increasing it.

If a future story hits this gate with any blast-radius criterion positive, split it — this override
is specific to a long plan for a narrow change, not a precedent for large ones.
