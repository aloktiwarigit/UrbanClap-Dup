# Customer App New-Service Presentation Implementation Plan — Story C

> ## STATUS: SUPERSEDED — most of this plan was unnecessary. Read this before the plan body.
>
> **Only Task 1's test shipped.** Tasks 1 (map entries), 2 and 3 were all cancelled after
> verification against `origin/main`, on 2026-09-15:
>
> - **Task 1's map entries already existed.** All seven Hindi entries (six services plus the
>   `appliance-repair` category) were already in `HindiLocaleNames.kt` on `main`, added by PRs #346
>   and #350. This plan was written after reading that file from a working directory checked out on
>   the stale, unmerged `fix/customer-privacy-policy-url` branch, where they are absent. What
>   shipped is only the *test* that pins them, whose four assertions were each proven non-vacuous by
>   mutation.
> - **Tasks 2 and 3 (six hero images + drawable wiring) were cancelled.** `ServiceDetailScreen.kt`
>   has a three-branch fallback — local drawable, then `service.imageUrl` via `AsyncImage`, then a
>   branded gradient — and `ServiceDto.kt` maps `imageUrl = heroImageUrl`. All five newly activated
>   services already have working hero images on the `homeservices-prod-001` bucket (verified 200),
>   so they render correctly through the remote branch with no local drawable. Adding local copies
>   would have added roughly 12 MB to a 45 MB bundle, required blind-cropping 2268x4032 portrait
>   photos to the house 1672x941 standard, and produced the same on-screen result, since both
>   branches render through the same `aspectRatio(1.18f)` + `ContentScale.Crop`.
>
> **Known gap, pre-existing and unchanged:** `ac-deep-clean-window` has no local drawable and its
> `heroImageUrl` is on the dead `homeservices-mvp` bucket, so it falls through to the branded
> gradient. The five active *categories* are in the same state. Both belong to the standing
> dead-bucket backlog, not to this story.
>
> The task bodies below are retained as written, for the record.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the six services that currently have no client-side presentation — the five being activated by Story A plus `ac-deep-clean-window`, which is already live without either — their Hindi copy and detail-screen hero image.

**Architecture:** The customer app fetches the catalogue live from `/v1/categories`, so new services already appear in lists. Two per-service tails are hardcoded client-side and must be extended by hand: `HindiLocaleNames.kt` (Hindi names and short descriptions, substituted locally when the locale is `hi`) and `serviceHeroImageRes()` in `ServiceDetailScreen.kt` (a `when` over service id returning a local drawable, `else -> null`). Both are additive map/branch entries — no architectural change.

**Tech Stack:** Kotlin, Jetpack Compose, Paparazzi.

**Spec:** Owner directive, 2026-09-15, in answer to "Customer-app Hindi copy and hero images for the new services?" — "Include in this work". Depends on Story A for the services to exist in production.

## Global Constraints

- All Hindi strings are copied **verbatim** from `api/src/cosmos/seeds/catalogue.ts`, which is the source of truth named in `HindiLocaleNames.kt`'s own header comment. Do not re-translate or paraphrase.
- Kotlin explicit API mode is on — `HindiLocaleNames` is a `public object` and its maps are `public val`.
- Hero drawables are PNG, live in `customer-app/app/src/main/res/drawable/`, and follow the existing name pattern `service_hero_<service_id_with_underscores>.png`.
- Never run `recordPaparazziDebug` on Windows; never delete an existing golden. See `docs/patterns/paparazzi-cross-os-goldens.md`.
- Images must be free-licence and commercially usable (Pexels / Unsplash licence). No stock-watermarked or rights-reserved photography.
- **Known duplication, deliberately not addressed here:** the catalogue in Cosmos already carries `nameHi` and `shortDescriptionHi` for every service, so this client-side map is a second copy that can drift. The owner was offered a server-driven refactor and chose to keep the current pattern for now. Note it as follow-up; do not refactor in this story.

---

### Task 1: Add Hindi copy for the six services

**Files:**
- Modify: `customer-app/app/src/main/kotlin/com/homeservices/customer/data/catalogue/HindiLocaleNames.kt`
- Test: `customer-app/app/src/test/kotlin/com/homeservices/customer/data/catalogue/HindiLocaleNamesTest.kt`

**Interfaces:**
- Produces: entries in `categoryHindiNames`, `serviceHindiNames`, `serviceShortDescriptionsHindi`

- [ ] **Step 1: Write the failing test**

This test pins the client map against the ids the API actually serves, so a future catalogue addition that forgets its Hindi copy fails here rather than shipping English text to Hindi users.

```kotlin
package com.homeservices.customer.data.catalogue

import org.junit.Assert.assertTrue
import org.junit.Test

class HindiLocaleNamesTest {
    // The services activated 2026-09-15 (ADR-0030), plus ac-deep-clean-window which
    // was already live with no Hindi copy and no hero image.
    private val requiredServiceIds = listOf(
        "ac-deep-clean-window",
        "appliance-fridge-repair",
        "appliance-cooler-service",
        "appliance-washing-machine-repair",
        "electrical-camera-installation",
        "appliance-inverter-service",
    )

    @Test
    fun `every required service has a Hindi name`() {
        val missing = requiredServiceIds.filterNot { HindiLocaleNames.serviceHindiNames.containsKey(it) }
        assertTrue("Missing Hindi names for: $missing", missing.isEmpty())
    }

    @Test
    fun `every required service has a Hindi short description`() {
        val missing = requiredServiceIds.filterNot { HindiLocaleNames.serviceShortDescriptionsHindi.containsKey(it) }
        assertTrue("Missing Hindi descriptions for: $missing", missing.isEmpty())
    }

    @Test
    fun `the appliance-repair category has a Hindi name`() {
        assertTrue(HindiLocaleNames.categoryHindiNames.containsKey("appliance-repair"))
    }

    @Test
    fun `no Hindi value is accidentally left in Latin script`() {
        val devanagari = Regex("[\\u0900-\\u097F]")
        val latinOnly = (HindiLocaleNames.serviceHindiNames + HindiLocaleNames.categoryHindiNames)
            .filterValues { !devanagari.containsMatchIn(it) }
        assertTrue("Non-Devanagari values: ${latinOnly.keys}", latinOnly.isEmpty())
    }
}
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd customer-app && ./gradlew testDebugUnitTest --tests "*HindiLocaleNamesTest*"`
Expected: FAIL on the first three tests, listing all six ids and `appliance-repair`.

- [ ] **Step 3: Add the category entry**

In `categoryHindiNames`, after the `"water-purifier"` line:

```kotlin
            "appliance-repair" to "उपकरण मरम्मत",
```

- [ ] **Step 4: Add the six service names**

In `serviceHindiNames`, after the `"ro-service-amc"` line:

```kotlin
            "ac-deep-clean-window" to "विंडो एसी डीप क्लीन",
            "appliance-fridge-repair" to "फ्रिज मरम्मत",
            "appliance-cooler-service" to "कूलर सर्विस",
            "appliance-washing-machine-repair" to "वाशिंग मशीन मरम्मत",
            "electrical-camera-installation" to "सीसीटीवी कैमरा इंस्टॉलेशन",
            "appliance-inverter-service" to "इन्वर्टर इंस्टॉलेशन और सर्विस",
```

- [ ] **Step 5: Add the six short descriptions**

In `serviceShortDescriptionsHindi`, at the end of the map:

```kotlin
            "ac-deep-clean-window" to "विंडो एसी की केमिकल वॉश और पूरी सर्विस।",
            "appliance-fridge-repair" to "कूलिंग, कंप्रेसर या आवाज़ की समस्या की जांच और मरम्मत।",
            "appliance-cooler-service" to "एयर कूलर के पंप, मोटर और कूलिंग पैड की सर्विस।",
            "appliance-washing-machine-repair" to "मोटर, ड्रम या ड्रेनेज की समस्या की जांच और मरम्मत।",
            "electrical-camera-installation" to "सीसीटीवी कैमरा लगाना, वायरिंग और मोबाइल ऐप सेटअप।",
            "appliance-inverter-service" to "घरेलू इन्वर्टर और यूपीएस की इंस्टॉलेशन, बैटरी जांच और सर्विसिंग।",
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `cd customer-app && ./gradlew testDebugUnitTest --tests "*HindiLocaleNamesTest*"`
Expected: PASS.

- [ ] **Step 7: Verify against the source of truth**

Run this and confirm each printed `nameHi` matches what you added character-for-character:

```bash
git show origin/main:api/src/cosmos/seeds/catalogue.ts | grep -A2 -E "id: '(ac-deep-clean-window|appliance-|electrical-camera-installation)'" | grep -E "id:|nameHi:|shortDescriptionHi:"
```

- [ ] **Step 8: Commit**

```bash
git add customer-app/app/src/main/kotlin/com/homeservices/customer/data/catalogue/HindiLocaleNames.kt customer-app/app/src/test/kotlin/com/homeservices/customer/data/catalogue/HindiLocaleNamesTest.kt
git commit -m "feat(customer-app): Hindi copy for the six newly presentable services"
```

---

### Task 2: Source and add six hero images

**Files:**
- Create: `customer-app/app/src/main/res/drawable/service_hero_ac_deep_clean_window.png`
- Create: `customer-app/app/src/main/res/drawable/service_hero_appliance_fridge_repair.png`
- Create: `customer-app/app/src/main/res/drawable/service_hero_appliance_cooler_service.png`
- Create: `customer-app/app/src/main/res/drawable/service_hero_appliance_washing_machine_repair.png`
- Create: `customer-app/app/src/main/res/drawable/service_hero_electrical_camera_installation.png`
- Create: `customer-app/app/src/main/res/drawable/service_hero_appliance_inverter_service.png`
- Create: `docs/attributions/customer-app-service-heroes.md` (if absent; append if present)

- [ ] **Step 1: Match the existing images' dimensions and weight**

Run:

```bash
cd customer-app/app/src/main/res/drawable && \
  for f in service_hero_*.png; do echo -n "$f "; file "$f" | grep -oE "[0-9]+ x [0-9]+"; done && \
  ls -la service_hero_*.png | awk '{print $5, $9}'
```

Record the dominant dimensions and the typical byte size. Every new image must match those dimensions and stay within roughly the same size band — a 4 MB hero among 200 KB ones is a regression.

- [ ] **Step 2: Source the six photographs**

Use Pexels (free licence, commercial use permitted, no attribution legally required but we record it anyway). Suggested search terms, one image each:

| Service | Search term | Must show |
|---|---|---|
| `ac-deep-clean-window` | "window air conditioner cleaning" | a window-mounted AC unit, not a split unit |
| `appliance-fridge-repair` | "refrigerator repair technician" | a technician working on an open fridge |
| `appliance-cooler-service` | "evaporative air cooler" | a portable/desert air cooler |
| `appliance-washing-machine-repair` | "washing machine repair" | a technician at an open washing machine |
| `electrical-camera-installation` | "cctv camera installation" | a camera being mounted, ideally with hands/tools |
| `appliance-inverter-service` | "inverter battery home" | an inverter or battery bank, not a car battery |

If no honest photo exists for a service, reuse the category image rather than an unrelated one, and say so in the attribution file — E22-S02 did exactly this for the cooler. Never ship a photo that shows a different appliance than the service sells.

- [ ] **Step 3: Resize, convert, and place**

Resize each to the dimensions recorded in Step 1, save as PNG with the exact filenames listed under **Files** above, and place them in `customer-app/app/src/main/res/drawable/`.

- [ ] **Step 4: Record attributions**

Create or append `docs/attributions/customer-app-service-heroes.md` with one row per image:

```markdown
| Drawable | Source URL | Photographer | Licence |
|---|---|---|---|
| service_hero_appliance_fridge_repair.png | <pexels url> | <name> | Pexels Licence |
```

- [ ] **Step 5: Confirm the resources compile**

Run: `cd customer-app && ./gradlew assembleDebug`
Expected: BUILD SUCCESSFUL. A malformed PNG or an illegal filename fails resource merging here.

- [ ] **Step 6: Commit**

```bash
git add customer-app/app/src/main/res/drawable/service_hero_*.png docs/attributions/customer-app-service-heroes.md
git commit -m "feat(customer-app): hero images for the six newly presentable services"
```

---

### Task 3: Wire the images into the detail screen

**Files:**
- Modify: `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/catalogue/ServiceDetailScreen.kt:290-307`
- Test: `customer-app/app/src/test/kotlin/com/homeservices/customer/ui/catalogue/ServiceHeroImageResTest.kt`

**Interfaces:**
- Consumes: the drawables from Task 2
- Produces: a non-null `serviceHeroImageRes()` result for all 20 active service ids

- [ ] **Step 1: Make `serviceHeroImageRes` testable**

It is currently `private`. Change it to `internal` so a unit test can call it, and add a comment saying why:

```kotlin
// internal rather than private so ServiceHeroImageResTest can assert that every
// active catalogue service has a hero image — the `else -> null` branch used to
// swallow new services silently.
@DrawableRes
internal fun serviceHeroImageRes(serviceId: String): Int? =
```

- [ ] **Step 2: Write the failing test**

```kotlin
package com.homeservices.customer.ui.catalogue

import org.junit.Assert.assertTrue
import org.junit.Test

class ServiceHeroImageResTest {
    // Every service that is active in the production catalogue as of 2026-09-15
    // (ADR-0030). A service with no hero image renders an empty detail header.
    private val activeServiceIds = listOf(
        "ac-deep-clean", "ac-deep-clean-window", "ac-gas-refill", "ac-installation",
        "water-pump-repair", "borewell-servicing",
        "plumbing-leak-fix", "plumbing-tap-install", "plumbing-pipe-repair",
        "electrical-fan-install", "electrical-switchboard-fix", "electrical-wiring",
        "electrical-camera-installation",
        "ro-installation", "ro-service-amc",
        "appliance-fridge-repair", "appliance-cooler-service",
        "appliance-washing-machine-repair", "appliance-inverter-service",
    )

    @Test
    fun `every active service resolves to a hero drawable`() {
        val missing = activeServiceIds.filter { serviceHeroImageRes(it) == null }
        assertTrue("No hero image for: $missing", missing.isEmpty())
    }

    @Test
    fun `an unknown service id still returns null rather than throwing`() {
        assertTrue(serviceHeroImageRes("not-a-real-service") == null)
    }
}
```

- [ ] **Step 3: Run it to verify it fails**

Run: `cd customer-app && ./gradlew testDebugUnitTest --tests "*ServiceHeroImageResTest*"`
Expected: FAIL, listing all six ids that have no branch.

- [ ] **Step 4: Add the six branches**

In the `when` block, before `else -> null`:

```kotlin
        "ac-deep-clean-window" -> R.drawable.service_hero_ac_deep_clean_window
        "appliance-fridge-repair" -> R.drawable.service_hero_appliance_fridge_repair
        "appliance-cooler-service" -> R.drawable.service_hero_appliance_cooler_service
        "appliance-washing-machine-repair" -> R.drawable.service_hero_appliance_washing_machine_repair
        "electrical-camera-installation" -> R.drawable.service_hero_electrical_camera_installation
        "appliance-inverter-service" -> R.drawable.service_hero_appliance_inverter_service
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd customer-app && ./gradlew testDebugUnitTest --tests "*ServiceHeroImageResTest*"`
Expected: PASS.

- [ ] **Step 6: Run the full unit suite**

Run: `cd customer-app && ./gradlew testDebugUnitTest`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add customer-app/app/src/main/kotlin/com/homeservices/customer/ui/catalogue/ServiceDetailScreen.kt customer-app/app/src/test/kotlin/com/homeservices/customer/ui/catalogue/ServiceHeroImageResTest.kt
git commit -m "feat(customer-app): hero images for the six newly presentable services"
```

---

### Task 4: Visual verification and review

- [ ] **Step 1: UI/UX audit before review**

Per the standing UI gate, run a visual audit of the Appliance Repair category card and one new service detail screen in both light and dark themes, at phone width. Check: hero image is not stretched or cropped through its subject, Hindi text does not clip or overflow its container, and no hardcoded `Color` makes text unreadable in dark mode.

- [ ] **Step 2: Add Paparazzi cases**

Add a snapshot of `ServiceDetailScreen` for `appliance-fridge-repair` in both light and dark themes, following the existing cases in the customer-app Paparazzi test file.

- [ ] **Step 3: Record goldens on CI only**

Do not run `recordPaparazziDebug` locally. Trigger `paparazzi-record.yml` via workflow_dispatch with `gradle_root=customer-app` and `gradle_task=recordPaparazziDebug` — fill both fields explicitly. Do not delete any existing golden. Commit the produced artifact.

- [ ] **Step 4: Run the smoke gate**

Run: `bash tools/pre-codex-smoke.sh customer-app -PexcludePaparazzi`
Expected: exit 0 across all six steps. Run it bare, not piped to `tail`.

- [ ] **Step 5: Codex review**

Run: `codex review --base main`
Fix findings in this session and re-run Codex at most once.

- [ ] **Step 6: Push and open the PR**

```bash
git push -u origin <branch>
gh pr create --title "feat(customer-app): Hindi copy and hero images for six services" --body "<summary>"
```

- [ ] **Step 7: Bump versionCode and ship**

After merge, bump `customer-app` `versionCode` to 14 and `versionName` to 0.1.9, build with `tools/build-play-bundles.ps1`, and upload to Play. Last uploaded to Play was versionCode 12; `main` currently carries 13.
