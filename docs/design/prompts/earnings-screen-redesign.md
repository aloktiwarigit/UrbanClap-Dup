# Earnings Screen Redesign Prompt
**Session type:** Pure UI redesign — no logic changes, no API changes  
**Target device:** Moto G Power 5G (ZY22KL6XXC), connected via ADB  
**Goal:** Replace generic M3 defaults with Home Heroo design language (Warm Authority)

---

You are redesigning the EarningsScreen for the Home Heroo technician-app using a new
design system. This is a pure UI session — no logic changes, no API changes, no new
stories. Goal: go from generic Material Design 3 defaults to Airbnb/CRED-tier visual
quality. A Moto G Power 5G (ZY22KL6XXC) is connected — install and verify at the end.

## Worktree setup

```bash
cd "C:/Alok/Business Projects/Urbanclap-dup"
git fetch origin
git worktree add ../homeservices-design-earnings feature/design-earnings-screen origin/main
cd ../homeservices-design-earnings
```

## Files to read FIRST (understand what exists before touching anything)

```bash
cat technician-app/app/src/main/kotlin/com/homeservices/technician/ui/earnings/EarningsScreen.kt
cat technician-app/app/src/main/kotlin/com/homeservices/technician/ui/earnings/EarningsUiState.kt
cat technician-app/app/src/main/kotlin/com/homeservices/technician/domain/earnings/model/EarningsSummary.kt
cat design-system/src/main/kotlin/com/homeservices/designsystem/theme/Theme.kt
cat design-system/src/main/kotlin/com/homeservices/designsystem/theme/Color.kt
cat design-system/src/main/kotlin/com/homeservices/designsystem/theme/Type.kt
ls technician-app/app/src/main/res/font/ 2>/dev/null || echo "no font dir yet"
ls design-system/src/main/res/ 2>/dev/null || echo "no design-system res dir"
```

---

## Step 1 — Install fonts

```bash
mkdir -p technician-app/app/src/main/res/font

# Sora
curl -L "https://github.com/sora-font/Sora/raw/main/fonts/ttf/Sora-Regular.ttf" \
  -o technician-app/app/src/main/res/font/sora_regular.ttf
curl -L "https://github.com/sora-font/Sora/raw/main/fonts/ttf/Sora-Medium.ttf" \
  -o technician-app/app/src/main/res/font/sora_medium.ttf
curl -L "https://github.com/sora-font/Sora/raw/main/fonts/ttf/Sora-SemiBold.ttf" \
  -o technician-app/app/src/main/res/font/sora_semibold.ttf
curl -L "https://github.com/sora-font/Sora/raw/main/fonts/ttf/Sora-Bold.ttf" \
  -o technician-app/app/src/main/res/font/sora_bold.ttf

# DM Sans
curl -L "https://github.com/googlefonts/dm-fonts/raw/main/Sans/Fonts/static/DMSans-Regular.ttf" \
  -o technician-app/app/src/main/res/font/dmsans_regular.ttf
curl -L "https://github.com/googlefonts/dm-fonts/raw/main/Sans/Fonts/static/DMSans-Medium.ttf" \
  -o technician-app/app/src/main/res/font/dmsans_medium.ttf

# Verify — each file should be > 50KB
ls -lh technician-app/app/src/main/res/font/
```

If GitHub URLs fail (rate limited): download from fonts.google.com/specimen/Sora and
fonts.google.com/specimen/DM+Sans, extract TTF files, name them exactly as above.

Also copy fonts to design-system if it has its own res dir:
```bash
if [ -d "design-system/src/main/res" ]; then
  mkdir -p design-system/src/main/res/font
  cp technician-app/app/src/main/res/font/*.ttf design-system/src/main/res/font/
fi
```

---

## Step 2 — Update design-system Color.kt

Read the existing file first. Then REPLACE its entire content with:

```kotlin
package com.homeservices.designsystem.theme

import androidx.compose.material3.lightColorScheme
import androidx.compose.ui.graphics.Color

// Primary — Terracotta: earthy, trustworthy, premium-without-exclusion
val Terracotta10 = Color(0xFF3B0A00)
val Terracotta20 = Color(0xFF601500)
val Terracotta30 = Color(0xFF872100)
val Terracotta40 = Color(0xFFAF2F00)
val Terracotta80 = Color(0xFFFFB5A0)
val Terracotta90 = Color(0xFFFFDBD1)
val Terracotta95 = Color(0xFFFFEDE8)
val Terracotta99 = Color(0xFFFFF8F6)

// Secondary — Deep Forest: growth, reliability
val Forest10 = Color(0xFF002108)
val Forest20 = Color(0xFF003912)
val Forest30 = Color(0xFF005320)
val Forest40 = Color(0xFF006E2C)
val Forest80 = Color(0xFF72DC8B)
val Forest90 = Color(0xFF8FF8A3)

// Gold — ratings, highlights, success sparkle
val Gold40 = Color(0xFFC89B3C)
val Gold80 = Color(0xFFE8C15A)
val Gold90 = Color(0xFFFFDF9E)

// Warm neutrals — never cool grey
val WarmNeutral10 = Color(0xFF1A1208)
val WarmNeutral20 = Color(0xFF2E2218)
val WarmNeutral40 = Color(0xFF5C4A3C)
val WarmNeutral60 = Color(0xFF8E7A6C)
val WarmNeutral80 = Color(0xFFCFBEB3)
val WarmNeutral90 = Color(0xFFEDE0D9)
val WarmNeutral95 = Color(0xFFFBF7F4)
val WarmNeutral99 = Color(0xFFFFFBFF)

val LightColorScheme = lightColorScheme(
    primary              = Terracotta40,
    onPrimary            = Color.White,
    primaryContainer     = Terracotta90,
    onPrimaryContainer   = Terracotta10,
    secondary            = Forest40,
    onSecondary          = Color.White,
    secondaryContainer   = Forest90,
    onSecondaryContainer = Forest10,
    tertiary             = Gold40,
    onTertiary           = Color.White,
    tertiaryContainer    = Gold90,
    background           = WarmNeutral95,
    onBackground         = WarmNeutral10,
    surface              = Color.White,
    onSurface            = WarmNeutral10,
    surfaceVariant       = WarmNeutral90,
    onSurfaceVariant     = WarmNeutral40,
    outline              = WarmNeutral80,
    outlineVariant       = WarmNeutral90,
    error                = Color(0xFFBA1A1A),
    onError              = Color.White,
)
```

---

## Step 3 — Update design-system Type.kt

Read existing file first. Then REPLACE entire content with:

```kotlin
package com.homeservices.designsystem.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

// NOTE: If R.font is in the design-system module, import com.homeservices.designsystem.R
// If fonts are in technician-app only, move this file there and adjust package.
// Read the existing imports to determine which applies.

val SoraFamily = FontFamily(
    Font(R.font.sora_regular,   FontWeight.Normal),
    Font(R.font.sora_medium,    FontWeight.Medium),
    Font(R.font.sora_semibold,  FontWeight.SemiBold),
    Font(R.font.sora_bold,      FontWeight.Bold),
)

val DmSansFamily = FontFamily(
    Font(R.font.dmsans_regular, FontWeight.Normal),
    Font(R.font.dmsans_medium,  FontWeight.Medium),
)

val HomeHerooTypography = Typography(
    displayLarge = TextStyle(
        fontFamily = SoraFamily, fontWeight = FontWeight.Bold,
        fontSize = 48.sp, lineHeight = 52.sp, letterSpacing = (-1.5).sp,
    ),
    headlineLarge = TextStyle(
        fontFamily = SoraFamily, fontWeight = FontWeight.SemiBold,
        fontSize = 28.sp, lineHeight = 36.sp, letterSpacing = (-0.5).sp,
    ),
    headlineMedium = TextStyle(
        fontFamily = SoraFamily, fontWeight = FontWeight.SemiBold,
        fontSize = 22.sp, lineHeight = 28.sp,
    ),
    titleLarge = TextStyle(
        fontFamily = SoraFamily, fontWeight = FontWeight.SemiBold,
        fontSize = 18.sp, lineHeight = 24.sp,
    ),
    titleMedium = TextStyle(
        fontFamily = SoraFamily, fontWeight = FontWeight.Medium,
        fontSize = 16.sp, lineHeight = 22.sp, letterSpacing = 0.15.sp,
    ),
    bodyLarge = TextStyle(
        fontFamily = DmSansFamily, fontWeight = FontWeight.Normal,
        fontSize = 16.sp, lineHeight = 24.sp,
    ),
    bodyMedium = TextStyle(
        fontFamily = DmSansFamily, fontWeight = FontWeight.Normal,
        fontSize = 14.sp, lineHeight = 20.sp,
    ),
    labelLarge = TextStyle(
        fontFamily = SoraFamily, fontWeight = FontWeight.Medium,
        fontSize = 14.sp, lineHeight = 20.sp, letterSpacing = 0.1.sp,
    ),
    labelSmall = TextStyle(
        fontFamily = SoraFamily, fontWeight = FontWeight.Medium,
        fontSize = 11.sp, lineHeight = 16.sp, letterSpacing = 0.5.sp,
    ),
)
```

---

## Step 4 — Wire new theme into Theme.kt

Find the `HomeservicesTheme` composable in the design-system. Update the
`MaterialTheme` call to use the new color scheme and typography:

```kotlin
MaterialTheme(
    colorScheme = LightColorScheme,
    typography  = HomeHerooTypography,
    // keep existing shapes or use:
    // shapes = Shapes(medium = RoundedCornerShape(16.dp)),
    content     = content,
)
```

---

## Step 5 — Rewrite EarningsScreen.kt

PRESERVE the ViewModel wiring, UiState handling, and onViewRatings lambda.
ONLY replace the visual composition. Data model stays unchanged.

```kotlin
package com.homeservices.technician.ui.earnings

import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.*
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.*
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.*
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.homeservices.designsystem.theme.*
import com.homeservices.technician.domain.earnings.model.DailyEarnings
import com.homeservices.technician.domain.earnings.model.EarningsSummary

@Composable
internal fun EarningsScreen(
    modifier: Modifier = Modifier,
    onViewRatings: () -> Unit = {},
    viewModel: EarningsViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    EarningsContent(uiState = uiState, onRetry = viewModel::refresh,
        onViewRatings = onViewRatings, modifier = modifier)
}

@Composable
private fun EarningsContent(
    uiState: EarningsUiState,
    onRetry: () -> Unit,
    onViewRatings: () -> Unit,
    modifier: Modifier = Modifier,
) {
    when (uiState) {
        is EarningsUiState.Loading -> EarningsLoadingState(modifier)
        is EarningsUiState.Error   -> EarningsErrorState(onRetry, modifier)
        is EarningsUiState.Success -> EarningsDashboard(uiState.summary, onViewRatings, modifier)
    }
}

// ── Shimmer loading ───────────────────────────────────────────────────────────

@Composable
private fun EarningsLoadingState(modifier: Modifier = Modifier) {
    val transition = rememberInfiniteTransition(label = "shimmer")
    val alpha by transition.animateFloat(
        initialValue = 0.35f, targetValue = 0.85f, label = "a",
        animationSpec = infiniteRepeatable(tween(900, easing = FastOutSlowInEasing),
            RepeatMode.Reverse)
    )
    LazyColumn(
        modifier = modifier.fillMaxSize().background(WarmNeutral95),
        contentPadding = PaddingValues(20.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item {
            Box(Modifier.fillMaxWidth().height(180.dp)
                .clip(RoundedCornerShape(24.dp))
                .background(Terracotta40.copy(alpha = alpha)))
        }
        items(3) {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                repeat(2) {
                    Box(Modifier.weight(1f).height(90.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(WarmNeutral90.copy(alpha = alpha)))
                }
            }
        }
    }
}

// ── Error ─────────────────────────────────────────────────────────────────────

@Composable
private fun EarningsErrorState(onRetry: () -> Unit, modifier: Modifier = Modifier) {
    Column(modifier = modifier.fillMaxSize().background(WarmNeutral95),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally) {
        Text("😕", fontSize = 48.sp)
        Spacer(Modifier.height(16.dp))
        Text("डेटा लोड नहीं हो सका",
            style = MaterialTheme.typography.titleMedium, color = WarmNeutral40)
        Spacer(Modifier.height(24.dp))
        FilledTonalButton(onClick = onRetry, shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.filledTonalButtonColors(
                containerColor = Terracotta90, contentColor = Terracotta20)) {
            Text("पुनः प्रयास करें", style = MaterialTheme.typography.labelLarge)
        }
    }
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

@Composable
private fun EarningsDashboard(
    summary: EarningsSummary,
    onViewRatings: () -> Unit,
    modifier: Modifier = Modifier,
) {
    LazyColumn(
        modifier = modifier.fillMaxSize().background(WarmNeutral95),
        contentPadding = PaddingValues(20.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        // Hero card
        item {
            Surface(modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(24.dp),
                color = Terracotta40, shadowElevation = 4.dp) {
                Column(modifier = Modifier.padding(24.dp)) {
                    Text("आज की कमाई",
                        style = MaterialTheme.typography.labelSmall,
                        color = Color.White.copy(alpha = 0.7f))
                    Spacer(Modifier.height(4.dp))
                    Text("₹${formatRupees(summary.today.techAmountPaise)}",
                        style = MaterialTheme.typography.displayLarge,
                        color = Color.White)
                    Text("${summary.today.count} काम",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color.White.copy(alpha = 0.65f))
                    Spacer(Modifier.height(20.dp))
                    GoalProgressBar(summary = summary)
                }
            }
        }

        // Period cards — 2-column layout
        item {
            val periods = listOf(
                Triple("इस हफ्ते", summary.week.techAmountPaise, summary.week.count),
                Triple("इस महीने", summary.month.techAmountPaise, summary.month.count),
                Triple("कुल कमाई", summary.lifetime.techAmountPaise, summary.lifetime.count),
            )
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                periods.chunked(2).forEach { row ->
                    Row(modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        row.forEach { (label, paise, count) ->
                            PeriodCard(label, paise, count, Modifier.weight(1f))
                        }
                        if (row.size == 1) Spacer(Modifier.weight(1f))
                    }
                }
            }
        }

        // Sparkline
        item {
            EarningsCard("7 दिन का ट्रेंड") {
                EarningsSparkline(days = summary.lastSevenDays,
                    modifier = Modifier.fillMaxWidth().height(80.dp))
            }
        }

        // Ratings shortcut
        item {
            OutlinedButton(onClick = onViewRatings,
                modifier = Modifier.fillMaxWidth().height(48.dp),
                shape = RoundedCornerShape(12.dp),
                border = BorderStroke(1.5.dp, Terracotta90),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = Terracotta30)) {
                Icon(Icons.Rounded.Star, null, modifier = Modifier.size(18.dp), tint = Gold40)
                Spacer(Modifier.width(8.dp))
                Text("मेरी रेटिंग देखें", style = MaterialTheme.typography.labelLarge)
            }
        }
    }
}

// ── Goal bar ──────────────────────────────────────────────────────────────────

@Composable
private fun GoalProgressBar(summary: EarningsSummary) {
    val progress = (summary.month.techAmountPaise.toFloat() / 3_500_000L).coerceIn(0f, 1f)
    val animated by animateFloatAsState(progress,
        tween(1200, easing = FastOutSlowInEasing), label = "goal")
    Column {
        Row(Modifier.fillMaxWidth(), Arrangement.SpaceBetween) {
            Text("मासिक लक्ष्य", style = MaterialTheme.typography.labelSmall,
                color = Color.White.copy(0.7f))
            Text("₹${formatRupees(summary.month.techAmountPaise)} / ₹35,000",
                style = MaterialTheme.typography.labelSmall, color = Color.White.copy(0.9f))
        }
        Spacer(Modifier.height(8.dp))
        LinearProgressIndicator(progress = { animated },
            modifier = Modifier.fillMaxWidth().height(6.dp).clip(RoundedCornerShape(3.dp)),
            color = Gold80, trackColor = Color.White.copy(0.25f))
    }
}

// ── Period card ────────────────────────────────────────────────────────────────

@Composable
private fun PeriodCard(label: String, paise: Long, count: Int, modifier: Modifier) {
    Surface(modifier = modifier, shape = RoundedCornerShape(16.dp),
        color = Color.White, shadowElevation = 2.dp) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(label, style = MaterialTheme.typography.labelSmall, color = WarmNeutral60)
            Spacer(Modifier.height(6.dp))
            Text("₹${formatRupees(paise)}", style = MaterialTheme.typography.headlineMedium,
                color = WarmNeutral10)
            Text("$count काम", style = MaterialTheme.typography.bodyMedium, color = WarmNeutral60)
        }
    }
}

// ── Card wrapper ──────────────────────────────────────────────────────────────

@Composable
private fun EarningsCard(title: String, content: @Composable ColumnScope.() -> Unit) {
    Surface(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp),
        color = Color.White, shadowElevation = 2.dp) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(title, style = MaterialTheme.typography.titleMedium)
            Spacer(Modifier.height(12.dp))
            content()
        }
    }
}

// ── Sparkline ─────────────────────────────────────────────────────────────────

@Composable
internal fun EarningsSparkline(days: List<DailyEarnings>, modifier: Modifier = Modifier) {
    val maxAmount = days.maxOfOrNull { it.techAmountPaise } ?: 1L
    val animatedHeights = days.mapIndexed { i, day ->
        val target = if (maxAmount > 0) day.techAmountPaise.toFloat() / maxAmount else 0f
        animateFloatAsState(target, tween(600, i * 60, FastOutSlowInEasing), label = "b$i").value
    }
    Canvas(modifier = modifier) {
        val n = days.size
        val bw = (size.width / n) * 0.55f
        val gap = (size.width - bw * n) / (n + 1)
        val maxH = size.height * 0.8f
        val baseY = size.height * 0.85f
        days.forEachIndexed { i, day ->
            val x = gap + i * (bw + gap)
            val h = (animatedHeights[i] * maxH).coerceAtLeast(4f)
            drawRoundRect(
                color = if (day.techAmountPaise > 0) Terracotta40 else WarmNeutral90,
                topLeft = Offset(x, baseY - h),
                size = Size(bw, h),
                cornerRadius = CornerRadius(4f, 4f),
            )
        }
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

private fun formatRupees(paise: Long): String {
    val r = paise / 100.0
    return when {
        r >= 100_000 -> "%.1fL".format(r / 100_000)
        r >= 1_000   -> "%,.0f".format(r)
        else         -> "%.0f".format(r)
    }
}
```

---

## Step 6 — Build and install

```bash
cd ../homeservices-design-earnings

./technician-app/gradlew -p technician-app assembleDebug 2>&1 | tail -15

ADB="C:/Users/alokt/AppData/Local/Android/Sdk/platform-tools/adb.exe"
"$ADB" -s ZY22KL6XXC install -r \
  technician-app/app/build/outputs/apk/debug/app-debug.apk

"$ADB" -s ZY22KL6XXC shell am start \
  -n "com.homeservices.technician/.MainActivity"
```

---

## Step 7 — Screenshot and report

```bash
ADB="C:/Users/alokt/AppData/Local/Android/Sdk/platform-tools/adb.exe"
sleep 4
"$ADB" -s ZY22KL6XXC shell screencap -p /sdcard/earnings_redesign.png
"$ADB" -s ZY22KL6XXC pull /sdcard/earnings_redesign.png /tmp/earnings_redesign.png
echo "Screenshot saved to /tmp/earnings_redesign.png"
```

---

## What to report back to orchestrator

1. Build result — SUCCESS or FAILURE with error message
2. Screenshot description — what's visible on screen (font rendering, colors, layout)
3. Whether the terracotta hero card is showing
4. Any Kotlin compile errors or import issues encountered

**DO NOT open a PR — this is a design-verify iteration. Orchestrator reviews the
screenshot and decides next steps.**

Begin.
