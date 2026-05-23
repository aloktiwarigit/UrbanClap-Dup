# UI/UX Alignment Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace top-anchored `AuthFrame`/`KycFrame` layouts across both apps with a two-zone hero+card pattern that eliminates the ~40% blank bottom space and adds brand presence.

**Architecture:** Each affected screen gets a `Box(fillMaxSize)` root with a BrandGreen gradient hero zone (`fillMaxHeight(fraction)`) and a white rounded-top `Surface` form card (`align(BottomCenter) + fillMaxHeight(fraction)`). Scrollable form card for auth/KYC (variable content); non-scrollable `fillMaxSize` form card for onboarding/language (fixed content — required for `weight(1f)` spacers to work). Empty-state `LazyColumn` items gain `fillParentMaxSize` centering.

**Tech Stack:** Kotlin, Jetpack Compose, Material3, Paparazzi (screenshot tests), `./gradlew ktlintFormat`

**Spec:** `docs/superpowers/specs/2026-05-05-ui-alignment-design.md`

**Parallel execution:** WS-A (Tasks 1–2), WS-B (Tasks 3–5), and WS-C (Task 6) are independent and can be dispatched as parallel agents. WS-D (Task 7) runs after all three complete.

---

## File Map

| File | Change |
|---|---|
| `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/auth/AuthScreen.kt` | Replace `AuthFrame`; simplify `LoadingContent` |
| `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/locale/FirstLaunchLanguageScreen.kt` | Replace root Column with hero+card layout |
| `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/auth/AuthScreen.kt` | Same as customer AuthScreen, partner copy |
| `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/kyc/KycScreen.kt` | Replace `KycFrame`; simplify `KycLoadingContent` |
| `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/onboarding/OnboardingScreen.kt` | Replace root Surface/Column with hero+card layout |
| `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/bookings/CustomerBookingsScreen.kt` | Empty state: `fillParentMaxSize` + icon upgrade |
| `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/home/TechnicianHomeScreen.kt` | Empty state: `fillParentMaxSize` + icon upgrade |

---

## WS-A: customer-app

### Task 1: customer-app `AuthScreen.kt`

**Files:**
- Modify: `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/auth/AuthScreen.kt`
- Test: `customer-app/app/src/test/kotlin/com/homeservices/customer/ui/auth/AuthScreenPaparazziTest.kt` (golden delete only)

- [ ] **Step 1: Delete the existing Paparazzi goldens for AuthScreen**

```bash
cd "C:/Alok/Business Projects/Urbanclap-dup"
git rm -r customer-app/app/src/test/snapshots/images/*AuthScreen* --ignore-unmatch
```

Expected: either `rm` output listing deleted files, or no output if goldens haven't been committed yet. Both are fine.

- [ ] **Step 2: Add new imports to `AuthScreen.kt`**

Add these six imports after the existing import block (keep alphabetical order within each group):

```kotlin
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
```

- [ ] **Step 3: Add hero color constants after `private const val PHONE_LAST_DIGITS = 4`**

```kotlin
private val AuthHeroStart = Color(0xFF062A20)
private val AuthHeroEnd   = Color(0xFF0B3D2E)
private const val AUTH_HERO_FRACTION = 0.38f
private const val AUTH_FORM_FRACTION = 0.65f
```

- [ ] **Step 4: Replace `AuthFrame` with the hero+card implementation**

Find the existing `private fun AuthFrame(...)` composable and replace it entirely with:

```kotlin
@Composable
private fun AuthFrame(
    eyebrow: String,
    title: String,
    body: String,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    val spacing = LocalHomeservicesSpacing.current
    Box(
        modifier = modifier
            .fillMaxSize()
            .background(AuthHeroEnd)
            .statusBarsPadding()
            .imePadding(),
    ) {
        // Hero zone — fixed top portion with brand identity
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(AUTH_HERO_FRACTION)
                .background(Brush.verticalGradient(listOf(AuthHeroStart, AuthHeroEnd)))
                .drawBehind {
                    drawCircle(
                        color = Color.White.copy(alpha = 0.06f),
                        radius = 140.dp.toPx(),
                        center = Offset(size.width - 80.dp.toPx(), -60.dp.toPx()),
                    )
                    drawCircle(
                        color = Color.White.copy(alpha = 0.09f),
                        radius = 70.dp.toPx(),
                        center = Offset(40.dp.toPx(), size.height - 20.dp.toPx()),
                    )
                },
            contentAlignment = Alignment.BottomStart,
        ) {
            Column(
                modifier = Modifier.padding(start = 28.dp, end = 28.dp, bottom = 36.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                Text(
                    text = "HomeHeroo",
                    style = MaterialTheme.typography.headlineLarge,
                    fontWeight = FontWeight.ExtraBold,
                    color = Color.White,
                )
                Text(
                    text = "घर पर भरोसेमंद सेवा",
                    style = MaterialTheme.typography.bodyLarge,
                    color = Color.White.copy(alpha = 0.82f),
                )
                Text(
                    text = "आधार सत्यापित · 30 दिन गारंटी",
                    style = MaterialTheme.typography.labelSmall,
                    color = Color.White.copy(alpha = 0.65f),
                )
            }
        }

        // Form card — scrollable, overlaps hero by ~24 dp
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .align(Alignment.BottomCenter)
                .fillMaxHeight(AUTH_FORM_FRACTION),
            shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
            color = Color.White,
            shadowElevation = 8.dp,
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 24.dp)
                    .padding(top = 28.dp, bottom = 24.dp),
                verticalArrangement = Arrangement.spacedBy(spacing.space6),
            ) {
                // Scroll-handle pill
                Box(
                    modifier = Modifier
                        .width(40.dp)
                        .height(2.dp)
                        .background(
                            Color(0xFF0B3D2E).copy(alpha = 0.25f),
                            RoundedCornerShape(1.dp),
                        )
                        .align(Alignment.CenterHorizontally),
                )
                Column(verticalArrangement = Arrangement.spacedBy(spacing.space3)) {
                    HsTrustBadge(text = eyebrow)
                    Text(
                        text = title,
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                    )
                    Text(
                        text = body,
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                HsSectionCard { content() }
                SecurityNote(
                    text = "Secure sign-in. Booking and payment actions always need your confirmation.",
                )
            }
        }
    }
}
```

- [ ] **Step 5: Replace `LoadingContent` with a standalone centered layout (no longer calls `AuthFrame`)**

Find `private fun LoadingContent(eyebrow: String, title: String, message: String)` and replace it:

```kotlin
@Composable
private fun LoadingContent(
    title: String,
    message: String,
) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(
            modifier = Modifier.padding(horizontal = 32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            CircularProgressIndicator()
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center,
                )
                Text(
                    text = message,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center,
                )
            }
        }
    }
}
```

- [ ] **Step 6: Update the `when (uiState)` block in `AuthScreen` to drop the `eyebrow` argument from all `LoadingContent` calls**

Find and replace each `LoadingContent(eyebrow = ..., title = ..., message = ...)` call — remove the `eyebrow = "..."` line from each. There are five:

```kotlin
is AuthUiState.Idle, is AuthUiState.TruecallerLoading ->
    LoadingContent(
        title = "Checking Truecaller",
        message = "We are verifying your number before falling back to OTP.",
    )

is AuthUiState.GoogleSigningIn ->
    LoadingContent(
        title = "Signing in with Google",
        message = "Choose your Google account to continue.",
    )

is AuthUiState.EmailSubmitting ->
    LoadingContent(
        title =
            if (uiState.mode == AuthUiState.EmailEntry.Mode.SignUp) {
                "Creating account"
            } else {
                "Signing in"
            },
        message = "Keep this screen open while we verify ${uiState.email}.",
    )

is AuthUiState.OtpSending ->
    LoadingContent(
        title = "Sending OTP",
        message = "Keep this screen open while we send your secure code.",
    )

is AuthUiState.OtpVerifying ->
    LoadingContent(
        title = "Verifying code",
        message = "This usually takes a few seconds.",
    )
```

- [ ] **Step 7: Run ktlintFormat and verify no compile errors**

```bash
cd "C:/Alok/Business Projects/Urbanclap-dup/customer-app"
./gradlew ktlintFormat :app:compileDebugKotlin
```

Expected: `BUILD SUCCESSFUL`. Fix any ktlint formatting issues reported before proceeding.

- [ ] **Step 8: Commit**

```bash
cd "C:/Alok/Business Projects/Urbanclap-dup"
git add customer-app/app/src/main/kotlin/com/homeservices/customer/ui/auth/AuthScreen.kt
git add customer-app/app/src/test/snapshots/  # pick up any golden deletes
git commit -m "feat(customer): AuthHeroFrame — brand hero panel on auth screens"
```

---

### Task 2: customer-app `FirstLaunchLanguageScreen.kt`

**Files:**
- Modify: `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/locale/FirstLaunchLanguageScreen.kt`
- Test: `customer-app/app/src/test/kotlin/com/homeservices/customer/ui/locale/FirstLaunchLanguageScreenPaparazziTest.kt` (golden delete only)

- [ ] **Step 1: Delete Paparazzi goldens**

```bash
cd "C:/Alok/Business Projects/Urbanclap-dup"
git rm -r customer-app/app/src/test/snapshots/images/*FirstLaunchLanguage* --ignore-unmatch
```

- [ ] **Step 2: Replace the entire file body of `FirstLaunchLanguageScreen.kt`**

Keep the `package` and `import` declarations. Add these imports (merge into existing alphabetical block):

```kotlin
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
```

Then replace everything from `private val LangHeroStart` (new constant) down to the end of `FirstLaunchLanguageScreen`:

```kotlin
private val LangHeroStart    = Color(0xFF062A20)
private val LangHeroEnd      = Color(0xFF0B3D2E)
private const val LANG_HERO_FRACTION = 0.30f
private const val LANG_FORM_FRACTION = 0.72f

@Composable
public fun FirstLaunchLanguageScreen(
    onConfirmed: () -> Unit,
    viewModel: FirstLaunchLanguageViewModel = hiltViewModel(),
) {
    val selected by viewModel.selectedTag.collectAsStateWithLifecycle()
    val confirmed by viewModel.confirmedFlow.collectAsStateWithLifecycle()

    LaunchedEffect(confirmed) {
        if (confirmed) {
            viewModel.confirmedFlow.value = false
            onConfirmed()
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(LangHeroEnd)
            .statusBarsPadding()
            .imePadding(),
    ) {
        // Hero zone
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(LANG_HERO_FRACTION)
                .background(Brush.verticalGradient(listOf(LangHeroStart, LangHeroEnd)))
                .drawBehind {
                    drawCircle(
                        color = Color.White.copy(alpha = 0.06f),
                        radius = 140.dp.toPx(),
                        center = Offset(size.width - 80.dp.toPx(), -60.dp.toPx()),
                    )
                    drawCircle(
                        color = Color.White.copy(alpha = 0.09f),
                        radius = 70.dp.toPx(),
                        center = Offset(40.dp.toPx(), size.height - 20.dp.toPx()),
                    )
                },
            contentAlignment = Alignment.BottomStart,
        ) {
            Column(
                modifier = Modifier.padding(start = 28.dp, end = 28.dp, bottom = 32.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                Text(
                    text = "HomeHeroo",
                    style = MaterialTheme.typography.headlineLarge,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                )
                Text(
                    text = "भाषा चुनें",
                    style = MaterialTheme.typography.bodyLarge,
                    color = Color.White.copy(alpha = 0.82f),
                )
            }
        }

        // Form card — non-scrollable so Spacer(weight(1f)) anchors the button
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .align(Alignment.BottomCenter)
                .fillMaxHeight(LANG_FORM_FRACTION),
            shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
            color = MaterialTheme.colorScheme.background,
            shadowElevation = 8.dp,
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 24.dp)
                    .padding(top = 28.dp, bottom = 24.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                Text(
                    text = "Choose your language",
                    style = MaterialTheme.typography.headlineSmall,
                    color = MaterialTheme.colorScheme.onBackground,
                )
                Text(
                    text = "Language can be changed anytime from Settings.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                LanguagePickerCard(
                    options = DefaultLanguageOptions,
                    selectedTag = selected,
                    onSelect = viewModel::onSelect,
                )
                Spacer(modifier = Modifier.weight(1f))
                HsPrimaryButton(
                    text = "Continue",
                    onClick = viewModel::onConfirm,
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        }
    }
}
```

- [ ] **Step 3: Remove the `HsTrustBadge` import — it is no longer used in this file**

```kotlin
// DELETE this line from the import block:
import com.homeservices.designsystem.components.HsTrustBadge
```

The rewritten `FirstLaunchLanguageScreen` uses plain `Text` composables for the hero copy instead of `HsTrustBadge`. Leaving the import will cause a ktlintFormat unused-import error.

- [ ] **Step 4: Run ktlintFormat and verify**

```bash
cd "C:/Alok/Business Projects/Urbanclap-dup/customer-app"
./gradlew ktlintFormat :app:compileDebugKotlin
```

Expected: `BUILD SUCCESSFUL`.

- [ ] **Step 5: Commit**

```bash
cd "C:/Alok/Business Projects/Urbanclap-dup"
git add customer-app/app/src/main/kotlin/com/homeservices/customer/ui/locale/FirstLaunchLanguageScreen.kt
git add customer-app/app/src/test/snapshots/
git commit -m "feat(customer): hero+card layout on FirstLaunchLanguageScreen"
```

---

## WS-B: technician-app

### Task 3: technician-app `AuthScreen.kt`

**Files:**
- Modify: `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/auth/AuthScreen.kt`
- Test: `technician-app/app/src/test/kotlin/com/homeservices/technician/ui/auth/AuthScreenPaparazziTest.kt` (golden delete only)

This task is structurally identical to Task 1. Follow the same steps 1–8, with these differences:

**Hero copy (partner-specific):**
```kotlin
// Constants — add after PHONE_LAST_DIGITS:
private val AuthHeroStart = Color(0xFF062A20)
private val AuthHeroEnd   = Color(0xFF0B3D2E)
private const val AUTH_HERO_FRACTION = 0.38f
private const val AUTH_FORM_FRACTION = 0.65f
```

**Hero Column text (in `AuthFrame`):**
```kotlin
Text(
    text = "HomeHeroo Partner",
    style = MaterialTheme.typography.headlineLarge,
    fontWeight = FontWeight.ExtraBold,
    color = Color.White,
)
Text(
    text = "रोज़ काम, रोज़ कमाई",
    style = MaterialTheme.typography.bodyLarge,
    color = Color.White.copy(alpha = 0.82f),
)
Text(
    text = "सत्यापित पार्टनर प्रोग्राम",
    style = MaterialTheme.typography.labelSmall,
    color = Color.White.copy(alpha = 0.65f),
)
```

**SecurityNote text (in `AuthFrame`):**
```kotlin
SecurityNote(
    text = "Secure partner sign-in. Job offers, payouts, and documents stay protected.",
)
```

Everything else (imports to add, `LoadingContent` replacement, `when(uiState)` call-site update, ktlintFormat, golden delete, commit) is identical to Task 1. Use commit message:

```bash
git commit -m "feat(technician): AuthHeroFrame — brand hero panel on auth screens"
```

- [ ] Step 1: Delete Paparazzi goldens
- [ ] Step 2: Add new imports
- [ ] Step 3: Add constants (partner copy above)
- [ ] Step 4: Replace `AuthFrame` (same structure as Task 1, partner hero text above)
- [ ] Step 5: Replace `LoadingContent` (identical to Task 1)
- [ ] Step 6: Update `when(uiState)` call sites (identical to Task 1)
- [ ] Step 7: Run `./gradlew ktlintFormat :app:compileDebugKotlin` from `technician-app/`
- [ ] Step 8: Commit

---

### Task 4: technician-app `KycScreen.kt`

**Files:**
- Modify: `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/kyc/KycScreen.kt`
- Test: `technician-app/app/src/test/kotlin/com/homeservices/technician/ui/kyc/KycScreenPaparazziTest.kt` (golden delete only)

- [ ] **Step 1: Delete Paparazzi goldens**

```bash
cd "C:/Alok/Business Projects/Urbanclap-dup"
git rm -r technician-app/app/src/test/snapshots/images/*Kyc* --ignore-unmatch
```

- [ ] **Step 2: Add new imports to `KycScreen.kt`**

```kotlin
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
```

(`statusBarsPadding` is already imported in this file.)

- [ ] **Step 3: Add KYC hero constants — place before `KycScreen` composable**

```kotlin
private val KycHeroStart = Color(0xFF062A20)
private val KycHeroEnd   = Color(0xFF0B3D2E)
private const val KYC_HERO_FRACTION = 0.32f
private const val KYC_FORM_FRACTION = 0.70f
```

- [ ] **Step 4: Replace `KycFrame` with the hero+card implementation**

Find `private fun KycFrame(...)` and replace entirely:

```kotlin
@Composable
private fun KycFrame(
    eyebrow: String,
    title: String,
    body: String,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    val spacing = LocalHomeservicesSpacing.current
    Box(
        modifier = modifier
            .fillMaxSize()
            .background(KycHeroEnd)
            .statusBarsPadding()
            .imePadding(),
    ) {
        // Hero zone — shows step badge + step title
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(KYC_HERO_FRACTION)
                .background(Brush.verticalGradient(listOf(KycHeroStart, KycHeroEnd)))
                .drawBehind {
                    drawCircle(
                        color = Color.White.copy(alpha = 0.06f),
                        radius = 140.dp.toPx(),
                        center = Offset(size.width - 80.dp.toPx(), -60.dp.toPx()),
                    )
                    drawCircle(
                        color = Color.White.copy(alpha = 0.09f),
                        radius = 70.dp.toPx(),
                        center = Offset(40.dp.toPx(), size.height - 20.dp.toPx()),
                    )
                },
            contentAlignment = Alignment.BottomStart,
        ) {
            Column(
                modifier = Modifier.padding(start = 28.dp, end = 28.dp, bottom = 28.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                HsTrustBadge(text = eyebrow)
                Text(
                    text = title,
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                )
            }
        }

        // Form card — scrollable for PAN upload (content can be tall)
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .align(Alignment.BottomCenter)
                .fillMaxHeight(KYC_FORM_FRACTION),
            shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
            color = Color.White,
            shadowElevation = 8.dp,
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 24.dp)
                    .padding(top = 28.dp, bottom = 24.dp),
                verticalArrangement = Arrangement.spacedBy(spacing.space6),
            ) {
                Text(
                    text = body,
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                HsSectionCard { content() }
            }
        }
    }
}
```

- [ ] **Step 5: Replace `KycLoadingContent` with a standalone centered layout**

Find `internal fun KycLoadingContent(...)` and replace:

```kotlin
@Composable
internal fun KycLoadingContent(
    message: String,
    modifier: Modifier = Modifier,
) {
    Box(modifier = modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(
            modifier = Modifier.padding(horizontal = 32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            CircularProgressIndicator()
            Text(
                text = message,
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center,
            )
        }
    }
}
```

- [ ] **Step 6: Run ktlintFormat and verify**

```bash
cd "C:/Alok/Business Projects/Urbanclap-dup/technician-app"
./gradlew ktlintFormat :app:compileDebugKotlin
```

Expected: `BUILD SUCCESSFUL`.

- [ ] **Step 7: Commit**

```bash
cd "C:/Alok/Business Projects/Urbanclap-dup"
git add technician-app/app/src/main/kotlin/com/homeservices/technician/ui/kyc/KycScreen.kt
git add technician-app/app/src/test/snapshots/
git commit -m "feat(technician): KycHeroFrame — compact hero panel on KYC screens"
```

---

### Task 5: technician-app `OnboardingScreen.kt`

**Files:**
- Modify: `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/onboarding/OnboardingScreen.kt`

No Paparazzi test exists for this screen — no golden delete needed.

- [ ] **Step 1: Add new imports**

The current file imports are minimal. Replace the import block with:

```kotlin
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.homeservices.designsystem.components.HsPrimaryButton
import com.homeservices.designsystem.components.HsSectionCard
import com.homeservices.designsystem.components.HsTimelineStep
```

- [ ] **Step 2: Replace the entire composable body**

Keep the `package` declaration. After imports, replace everything:

```kotlin
private val OnboardingHeroStart = Color(0xFF062A20)
private val OnboardingHeroEnd   = Color(0xFF0B3D2E)
private const val ONBOARDING_HERO_FRACTION = 0.38f
private const val ONBOARDING_FORM_FRACTION = 0.65f

@Composable
internal fun OnboardingScreen(
    modifier: Modifier = Modifier,
    onContinue: () -> Unit = {},
) {
    Box(
        modifier = modifier
            .fillMaxSize()
            .background(OnboardingHeroEnd)
            .statusBarsPadding(),
    ) {
        // Hero zone
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(ONBOARDING_HERO_FRACTION)
                .background(
                    Brush.verticalGradient(listOf(OnboardingHeroStart, OnboardingHeroEnd)),
                )
                .drawBehind {
                    drawCircle(
                        color = Color.White.copy(alpha = 0.06f),
                        radius = 140.dp.toPx(),
                        center = Offset(size.width - 80.dp.toPx(), -60.dp.toPx()),
                    )
                    drawCircle(
                        color = Color.White.copy(alpha = 0.09f),
                        radius = 70.dp.toPx(),
                        center = Offset(40.dp.toPx(), size.height - 20.dp.toPx()),
                    )
                },
            contentAlignment = Alignment.BottomStart,
        ) {
            Column(
                modifier = Modifier.padding(start = 28.dp, end = 28.dp, bottom = 36.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                Text(
                    text = "HomeHeroo Partner",
                    style = MaterialTheme.typography.headlineLarge,
                    fontWeight = FontWeight.ExtraBold,
                    color = Color.White,
                )
                Text(
                    text = "कमाई शुरू करें",
                    style = MaterialTheme.typography.bodyLarge,
                    color = Color.White.copy(alpha = 0.82f),
                )
                Text(
                    text = "Quick setup · 3 steps",
                    style = MaterialTheme.typography.labelSmall,
                    color = Color.White.copy(alpha = 0.65f),
                )
            }
        }

        // Form card — non-scrollable: Spacer(weight(1f)) anchors button to bottom
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .align(Alignment.BottomCenter)
                .fillMaxHeight(ONBOARDING_FORM_FRACTION),
            shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
            color = MaterialTheme.colorScheme.background,
            shadowElevation = 8.dp,
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                HsSectionCard(title = "Setup checklist") {
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        HsTimelineStep("Verify identity", "Finish Aadhaar and PAN checks securely.")
                        HsTimelineStep("Go online", "Receive nearby fixed-price service jobs.")
                        HsTimelineStep("Track earnings", "Review daily payouts, ratings, and support cases.")
                    }
                }
                Spacer(Modifier.weight(1f))
                HsPrimaryButton(
                    text = "Continue setup",
                    onClick = onContinue,
                    modifier = Modifier.fillMaxWidth(),
                )
                Spacer(Modifier.height(4.dp))
            }
        }
    }
}
```

- [ ] **Step 3: Run ktlintFormat and verify**

```bash
cd "C:/Alok/Business Projects/Urbanclap-dup/technician-app"
./gradlew ktlintFormat :app:compileDebugKotlin
```

Expected: `BUILD SUCCESSFUL`.

- [ ] **Step 4: Commit**

```bash
cd "C:/Alok/Business Projects/Urbanclap-dup"
git add technician-app/app/src/main/kotlin/com/homeservices/technician/ui/onboarding/OnboardingScreen.kt
git commit -m "feat(technician): hero+card layout on OnboardingScreen"
```

---

## WS-C: Empty-state fixes

### Task 6: Empty-state centering and icon upgrade

**Files:**
- Modify: `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/bookings/CustomerBookingsScreen.kt`
- Modify: `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/home/TechnicianHomeScreen.kt`

No Paparazzi tests for these screens — no golden delete needed.

- [ ] **Step 1: Add missing imports to `CustomerBookingsScreen.kt`**

```kotlin
import androidx.compose.foundation.background
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.text.style.TextAlign
```

- [ ] **Step 2: Wrap the empty-state item in `CustomerBookingsContent` with `fillParentMaxSize`**

Find the empty-state `item` in `CustomerBookingsContent`:
```kotlin
// BEFORE
item { EmptyBookingsCard() }
```

Replace with:
```kotlin
// AFTER
item {
    Box(
        modifier = Modifier.fillParentMaxSize(),
        contentAlignment = Alignment.Center,
    ) {
        EmptyBookingsCard()
    }
}
```

- [ ] **Step 3: Upgrade `EmptyBookingsCard` icon treatment**

Find `private fun EmptyBookingsCard()` and replace:

```kotlin
@Composable
private fun EmptyBookingsCard() {
    Column(
        modifier = Modifier.padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Box(
            modifier = Modifier
                .size(56.dp)
                .background(SoftGreen, RoundedCornerShape(20.dp)),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                imageVector = Icons.Default.BookOnline,
                contentDescription = null,
                tint = DeepGreen,
                modifier = Modifier.size(28.dp),
            )
        }
        Text(
            text = "No bookings yet",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = Ink,
        )
        Text(
            text = "Confirmed bookings will appear here with service date, status, and tracking access.",
            style = MaterialTheme.typography.bodyMedium,
            color = Muted,
            textAlign = TextAlign.Center,
        )
    }
}
```

- [ ] **Step 4: Fix the empty-state item in `TechnicianHomeScreen` → `JobsScreen`**

Find `JobsScreen` composable and locate:
```kotlin
// BEFORE
if (uiState.bookings.isEmpty()) {
    item { EmptyJobsCard() }
```

Replace with:
```kotlin
// AFTER
if (uiState.bookings.isEmpty()) {
    item {
        Box(
            modifier = Modifier.fillParentMaxSize(),
            contentAlignment = Alignment.Center,
        ) {
            EmptyJobsCard()
        }
    }
```

- [ ] **Step 5: Upgrade `EmptyJobsCard` icon treatment in `TechnicianHomeScreen.kt`**

Find `private fun EmptyJobsCard()` and replace:

```kotlin
@Composable
private fun EmptyJobsCard() {
    Column(
        modifier = Modifier.padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Box(
            modifier = Modifier
                .size(56.dp)
                .background(SoftGreen, RoundedCornerShape(20.dp)),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                imageVector = Icons.Default.Badge,
                contentDescription = null,
                tint = DeepGreen,
                modifier = Modifier.size(28.dp),
            )
        }
        Text(
            text = "No assigned jobs right now",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = Ink,
        )
        Text(
            text = "New requests arrive as full-screen offers with accept and decline actions.",
            style = MaterialTheme.typography.bodyMedium,
            color = Muted,
            textAlign = TextAlign.Center,
        )
    }
}
```

- [ ] **Step 6: Run ktlintFormat for both apps and verify**

```bash
cd "C:/Alok/Business Projects/Urbanclap-dup/customer-app"
./gradlew ktlintFormat :app:compileDebugKotlin

cd "C:/Alok/Business Projects/Urbanclap-dup/technician-app"
./gradlew ktlintFormat :app:compileDebugKotlin
```

Both expected: `BUILD SUCCESSFUL`.

- [ ] **Step 7: Commit**

```bash
cd "C:/Alok/Business Projects/Urbanclap-dup"
git add customer-app/app/src/main/kotlin/com/homeservices/customer/ui/bookings/CustomerBookingsScreen.kt
git add technician-app/app/src/main/kotlin/com/homeservices/technician/ui/home/TechnicianHomeScreen.kt
git commit -m "fix: center empty-state cards in LazyColumn viewport + icon upgrade"
```

---

## WS-D: Smoke gate + Paparazzi re-record + Codex review

*Run after WS-A, WS-B, and WS-C all complete.*

### Task 7: Smoke gate, Paparazzi CI trigger, and Codex review

- [ ] **Step 1: Run pre-Codex smoke gate for customer-app**

```bash
bash "C:/Alok/Business Projects/Urbanclap-dup/tools/pre-codex-smoke.sh" customer-app
```

Expected: exit 0. If non-zero, fix reported failures before proceeding.

- [ ] **Step 2: Run pre-Codex smoke gate for technician-app**

```bash
bash "C:/Alok/Business Projects/Urbanclap-dup/tools/pre-codex-smoke.sh" technician-app
```

Expected: exit 0.

- [ ] **Step 3: Push branch and trigger Paparazzi golden re-record on CI**

```bash
cd "C:/Alok/Business Projects/Urbanclap-dup"
git push
```

Then trigger the Paparazzi record workflow for both apps via GitHub Actions `workflow_dispatch`:
- Go to Actions → `paparazzi-record.yml` → Run workflow (select branch) for **customer-app**
- Repeat for **technician-app**

Wait for both workflows to complete and commit the new goldens back. Pull when done:

```bash
git pull
```

- [ ] **Step 4: Run Codex review**

```bash
codex review --base main
```

Expected: `.codex-review-passed` marker written. If Codex raises P1 issues, fix in Claude, then run `codex review --base main` once more.

- [ ] **Step 5: Open PR**

```bash
gh pr create \
  --title "feat: UI/UX alignment pass — AuthHeroFrame + empty-state centering" \
  --body "Replaces top-anchored auth/KYC/onboarding layouts with a two-zone hero+card pattern. Fixes ~40% blank bottom space and adds brand presence across 5 screens. Empty-state cards now center in LazyColumn viewport. See docs/superpowers/specs/2026-05-05-ui-alignment-design.md."
```
