# UI/UX Alignment Pass — Design Spec
**Date:** 2026-05-05  
**Scope:** customer-app + technician-app (both Android apps)  
**Classification:** Feature-tier story  
**Model:** Sonnet 4.6

---

## Problem Statement

All auth/onboarding screens are top-heavy: content anchors at the top and leaves ~40% blank space at the bottom. Root causes:

1. **`AuthFrame` / `KycFrame`** — `Column(fillMaxSize + verticalScroll + Arrangement.spacedBy)`. In Compose, `verticalScroll` columns cannot use `weight` modifiers, so there is no mechanism to distribute space. Content always stacks from the top.
2. **`FirstLaunchLanguageScreen`** — `Column(fillMaxSize + Arrangement.spacedBy(18.dp))`. Button is just another item in the spacedBy flow; it floats wherever the last item lands rather than anchoring to the bottom.
3. **`OnboardingScreen`** — Structurally OK (`Spacer(weight(1f))` exists) but has zero brand presence.
4. **Empty states in `LazyColumn`** — `EmptyJobsCard` / `EmptyBookingsCard` are small cards floating at the top of a full-viewport list when no items are present.

Additionally, auth and onboarding screens are the first thing every user sees but carry no brand personality — the catalogue and home screens already have a polished BrandGreen design language that these screens must match.

---

## Audit Results — Full Screen Inventory

### Screens requiring changes (7 files)

| File | Category | Change type |
|---|---|---|
| `customer-app/ui/auth/AuthScreen.kt` | Auth | Structural + visual lift |
| `technician-app/ui/auth/AuthScreen.kt` | Auth | Structural + visual lift |
| `technician-app/ui/kyc/KycScreen.kt` | Onboarding | Structural + visual lift |
| `customer-app/ui/locale/FirstLaunchLanguageScreen.kt` | Onboarding | Structural + visual lift |
| `technician-app/ui/onboarding/OnboardingScreen.kt` | Onboarding | Structural + visual lift |
| `customer-app/ui/bookings/CustomerBookingsScreen.kt` | Empty state | Structural fix only |
| `technician-app/ui/home/TechnicianHomeScreen.kt` | Empty state | Structural fix only |

### Screens with no issues (no changes)

`CatalogueHomeScreen`, `ServiceDetailScreen`, `ServiceListScreen`, `BookingSummaryScreen`, `SlotPickerScreen`, `AddressScreen`, `PriceApprovalScreen`, `BookingConfirmedScreen`, `ActiveJobScreen`, `JobOfferScreen`, `LiveTrackingScreen`, `RatingScreen`, `ServiceSelectionScreen`, `ComplaintScreen`, `TechnicianHomeScreen` (Today/Earnings/Availability/Profile tabs), `CustomerBookingsScreen` (loaded state), `ProfileScreen`.

---

## Design Decision: Option A — Compose-drawn brand hero panel

**Rationale:** The catalogue home screen already proves the BrandGreen/WarmIvory design language works and looks premium. Auth screens are the first impression — they must match. Compose-drawn gradients require zero external assets and ship immediately. An illustration placeholder (Option B) renders as an empty box to pilot users. A layout-fix-only pass (Option C) leaves auth screens looking like plain forms.

Reference apps for visual intent: Cred, Paytm, Revolut, Razorpay X (auth hero + rounded card lift pattern).

---

## Core Pattern: `AuthHeroFrame`

### Layout structure

```
Box(
    modifier = Modifier
        .fillMaxSize()
        .background(MaterialTheme.colorScheme.background)
        .windowInsetsPadding(WindowInsets.statusBars)
        .imePadding()
) {
    // ZONE 1: Hero — top HeroFraction of screen height
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .fillMaxHeight(HeroFraction)          // 0.38f (0.32f for KYC, 0.30f for language)
            .background(
                Brush.verticalGradient(listOf(HeroStart, HeroEnd))
            )
            .drawBehind {
                // Decorative accent circles — no assets needed
                drawCircle(Color.White.copy(alpha = 0.06f), radius = 140.dp.toPx(),
                    center = Offset(size.width - 80.dp.toPx(), -60.dp.toPx()))
                drawCircle(Color.White.copy(alpha = 0.09f), radius = 70.dp.toPx(),
                    center = Offset(40.dp.toPx(), size.height - 20.dp.toPx()))
            },
        contentAlignment = Alignment.BottomStart,
    ) {
        // Hero content: brand name + tagline + sub-badge
        Column(
            modifier = Modifier.padding(start = 28.dp, end = 28.dp, bottom = 36.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            Text(brandName, headlineLarge, ExtraBold, White)
            Text(tagline, bodyLarge, White.copy(0.82f))
            Text(subBadge, labelSmall, White.copy(0.65f))   // optional, null = hidden
        }
    }

    // ZONE 2: Form card — bottom FormFraction of screen height
    // FormFraction=0.65f → card starts at 35% from top, hero ends at 38% → 3% overlap (~24dp)
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .align(Alignment.BottomCenter)
            .fillMaxHeight(FormFraction),
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
            // Scroll handle indicator (shown only on scrollable states)
            if (scrollable) {
                Box(
                    modifier = Modifier
                        .width(40.dp).height(2.dp)
                        .background(BrandGreen.copy(0.25f), RoundedCornerShape(1.dp))
                        .align(Alignment.CenterHorizontally)
                )
                Spacer(Modifier.height(8.dp))
            }

            // Existing content: eyebrow badge + title + body + HsSectionCard{ content() } + SecurityNote
            Column(verticalArrangement = Arrangement.spacedBy(spacing.space3)) {
                HsTrustBadge(text = eyebrow)
                Text(title, headlineSmall, Bold)
                Text(body, bodyLarge, onSurfaceVariant)
            }
            HsSectionCard { content() }
            SecurityNote(securityText)
        }
    }
}
```

### Key invariants

- `imePadding()` on the outer Box means both zones resize proportionally when the keyboard appears — no content clipping.
- `verticalScroll` lives inside the form card, not the outer container. This means `fillMaxSize()` on the form card works correctly (it measures against the card, not the viewport).
- **Loading states** bypass `AuthHeroFrame` entirely. They use `Box(fillMaxSize, contentAlignment=Center)` as before — no hero when waiting.
- **Error state** uses `AuthHeroFrame` (short content, fits without scroll).

### Color tokens (local constants, per-file)

```kotlin
private val HeroStart    = Color(0xFF062A20)
private val HeroEnd      = Color(0xFF0B3D2E)   // == existing BrandGreen
private const val HeroFraction = 0.38f
private const val FormFraction = 0.65f
```

`KycHeroFrame`: `HeroFraction = 0.32f`, `FormFraction = 0.70f`  
`FirstLaunchLanguageScreen`: `HeroFraction = 0.30f`, `FormFraction = 0.72f`

---

## Per-Screen Hero Copy

### customer-app `AuthScreen`

```
brandName  = "HomeHeroo"
tagline    = "घर पर भरोसेमंद सेवा"
subBadge   = "आधार सत्यापित · 30 दिन गारंटी"
```

SecurityNote text (existing): `"Secure sign-in. Booking and payment actions always need your confirmation."`

### technician-app `AuthScreen`

```
brandName  = "HomeHeroo Partner"
tagline    = "रोज़ काम, रोज़ कमाई"
subBadge   = "सत्यापित पार्टनर प्रोग्राम"
```

SecurityNote text (existing): `"Secure partner sign-in. Job offers, payouts, and documents stay protected."`

### technician-app `KycScreen` (`KycHeroFrame`, compact)

Hero shows the step badge and step title instead of brand name + tagline:
```
eyebrow    = "Step 1 of 2" / "Step 2 of 2" / "Submitted" / "Action needed"
heroTitle  = matches existing KycFrame title (e.g. "Verify your identity")
subBadge   = null  (no sub-badge — document screens are terse)
```

`KycFrame`'s eyebrow/title/body structure is preserved inside the form card unchanged.

### customer-app `FirstLaunchLanguageScreen`

```
brandName  = "HomeHeroo"
tagline    = "भाषा चुनें"
subBadge   = null
```

Form card interior: existing `LanguagePickerCard` + `Spacer(weight(1f))` + `HsPrimaryButton`. Weight spacer anchors button to bottom of form card.

### technician-app `OnboardingScreen`

```
brandName  = "HomeHeroo Partner"
tagline    = "कमाई शुरू करें"
subBadge   = "Quick setup · 3 steps"
```

Form card interior: existing `HsSectionCard` with `HsTimelineStep` items + `Spacer(weight(1f))` + `HsPrimaryButton`. Existing `Spacer(weight(1f))` is kept — it now correctly anchors the button within the scrollable form card column.

---

## Empty-State Fix

### Pattern

In any `LazyColumn` where the empty state is rendered as a single small card item, wrap it in `fillParentMaxSize`:

```kotlin
// BEFORE
item { EmptyBookingsCard() }

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

`fillParentMaxSize()` is a `LazyItemScope`-scoped modifier that fills the parent list's measured viewport — the card centers in the full visible area instead of anchoring top.

### Empty-state visual upgrade

Upgrade the icon treatment in `EmptyBookingsCard` (customer) and `EmptyJobsCard` (technician) from bare `Icon` to a green-tinted container matching the `SupportHero` tile grammar already used in `CatalogueHomeScreen`:

```kotlin
// Icon container
Box(
    modifier = Modifier
        .size(56.dp)
        .background(SoftGreen, RoundedCornerShape(20.dp)),
    contentAlignment = Alignment.Center,
) {
    Icon(icon, tint = DeepGreen, modifier = Modifier.size(28.dp))
}
Spacer(Modifier.height(12.dp))
Text(title, titleMedium, Bold, Ink)
Text(body, bodyMedium, Muted)
```

---

## Files Changed

| File | Nature of change |
|---|---|
| `customer-app/app/src/main/kotlin/.../ui/auth/AuthScreen.kt` | Replace `AuthFrame` composable with `AuthHeroFrame`. All non-loading states route through it. |
| `technician-app/app/src/main/kotlin/.../ui/auth/AuthScreen.kt` | Same change, partner copy in hero. |
| `technician-app/app/src/main/kotlin/.../ui/kyc/KycScreen.kt` | Replace `KycFrame` with `KycHeroFrame` (compact hero variant). |
| `customer-app/app/src/main/kotlin/.../ui/locale/FirstLaunchLanguageScreen.kt` | Replace outer Column with `AuthHeroFrame` (compact variant, no scroll handle). |
| `technician-app/app/src/main/kotlin/.../ui/onboarding/OnboardingScreen.kt` | Wrap existing content in `AuthHeroFrame`. |
| `customer-app/app/src/main/kotlin/.../ui/bookings/CustomerBookingsScreen.kt` | `EmptyBookingsCard` item → `fillParentMaxSize` + icon upgrade. |
| `technician-app/app/src/main/kotlin/.../ui/home/TechnicianHomeScreen.kt` | `EmptyJobsCard` item → `fillParentMaxSize` + icon upgrade. |

---

## Paparazzi Impact

Four test files have existing Paparazzi goldens that will be invalidated by these layout changes:

| Test file | Action |
|---|---|
| `customer-app/.../ui/auth/AuthScreenPaparazziTest.kt` | Delete goldens before push; re-record via `paparazzi-record.yml` workflow_dispatch on CI |
| `customer-app/.../ui/locale/FirstLaunchLanguageScreenPaparazziTest.kt` | Same |
| `technician-app/.../ui/auth/AuthScreenPaparazziTest.kt` | Same |
| `technician-app/.../ui/kyc/KycScreenPaparazziTest.kt` | Same |

Procedure per `docs/patterns/paparazzi-cross-os-goldens.md`: `git rm -r snapshots/images/<ScreenName>*` for each affected screen only — never `git rm -r snapshots/images/` wholesale.

---

## Ceremony

**Story tier:** Feature (existing foundation, isolated UI changes, no new domain/data layer)  
**Work streams:**
- WS-A: customer-app auth + locale screens (2 files, independent)
- WS-B: technician-app auth + kyc + onboarding screens (3 files, independent)
- WS-C: empty-state fixes in both apps (2 files, independent of WS-A/B)
- WS-D: Paparazzi golden delete + CI re-record trigger

WS-A, WS-B, WS-C can run as parallel agents. WS-D follows after all three complete.

**TDD note:** Paparazzi tests are the regression net for these screens. The workflow is: implement → delete affected golden files → push → CI records new goldens → CI green. No unit tests are added (pure layout composables with no logic change).

**Review gate:** Codex CLI (`codex review --base main`) before merge. No `/security-review` trigger (no auth logic, PII, or payment code changes).
