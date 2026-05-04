# E12-S02a — Hindi i18n Android (customer-app + shared) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Story split note:** E12-S02 was split at plan-write time per spec §4.2's 1500-line cap. This plan (S02a) covers customer-app, design-system shared picker, the AppCompat-dep TOML mirror across both apps, and customer-app catalogue Hindi-name lookup. The companion plan **`2026-05-02-E12-S02b-hindi-android-technician.md`** covers technician-app (theme migration + locale repo + use cases + DI + UI + values-hi creation + Paparazzi). S02a ships first; S02b builds on the mirrored TOML entry without further `gradle/libs.versions.toml` changes.

**Goal:** Customer-app ships in-app Hindi/English language switching via `AppCompatDelegate.setApplicationLocales()`, a first-launch language picker, complete `values-hi/strings.xml` translations (15 missing strings + 4 settings strings), and catalogue serviceId/categoryId → Hindi name client-side substitution for API-returned strings. AppCompat 1.7.0 is mirrored into BOTH apps' identical `gradle/libs.versions.toml` (technician-app declares but does not consume in this story).

**Architecture:** `LocaleRepository` backed by DataStore Preferences (locale tag + first-launch flag) + tiny use cases that drive `AppCompatDelegate.setApplicationLocales()`. First-launch flag gates `AppNavigation` start destination so a `LanguagePickerScreen` shows once before auth. Settings → Language is reachable from the catalogue home top-bar and re-uses a shared `LanguagePickerCard` Composable in `design-system`. Catalogue ViewModels run a `CatalogueLocalizer` over API-returned `Category`/`Service` names when current locale is `hi`. customer-app theme migrates from `android:Theme.Material.Light.NoActionBar` to `Theme.AppCompat.DayNight.NoActionBar` so per-app locale survives configuration change. technician-app's theme is NOT touched in this story (S02b's job).

**Tech Stack:** Kotlin 2.0.21, Jetpack Compose (BOM 2024.11.00), Hilt 2.52, AndroidX AppCompat 1.7.0 (NEW), AndroidX DataStore Preferences 1.1.1, Material3, Paparazzi 1.3.5, JUnit 5 + MockK + Robolectric, ktlint + detekt + Kover (≥80%).

**Pattern library reads required (BEFORE writing any code):**
- `docs/patterns/paparazzi-cross-os-goldens.md` — Hindi snapshot variants must be recorded on CI Linux, never Windows
- `docs/patterns/hilt-module-android-test-scope.md` — new `LocaleModule` + DataStore qualifier; pick correct test type (Robolectric for repo, JVM unit for use cases)
- `docs/patterns/kotlin-explicit-api-public-modifier.md` — every new `public class`/`fun`/`object` MUST carry `public`; `-Xexplicit-api=strict` is enforced

**Non-negotiables across all tasks:**
- TDD: failing test committed in same step as the production code; `pre-codex-smoke.sh` is the gate
- `customer-app/gradle/libs.versions.toml` and `technician-app/gradle/libs.versions.toml` MUST stay byte-identical (CI gate). The new appcompat entry lands in BOTH simultaneously even though only customer-app consumes it in S02a; technician-app consumes it in S02b.
- Paparazzi goldens NEVER recorded on Windows. Re-record runs on CI Linux via `paparazzi-record.yml workflow_dispatch` after the diff is pushed (WS-E).
- `ktlintFormat` only when smoke gate flags real ktlint violations on the diff — never speculatively (it shifts Compose rendering microscopically and cascades Paparazzi goldens).
- **technician-app Paparazzi cascade:** This S02a story does NOT touch technician-app source/themes/strings, so technician-app goldens should NOT drift here. If `verifyPaparazziDebug` flags technician-app images, treat as a real regression and investigate before re-recording.

---

## File Structure

### Files created — design-system

| Path | Responsibility |
|---|---|
| `design-system/src/main/kotlin/com/homeservices/designsystem/locale/LanguagePickerCard.kt` | Stateless Compose card listing English / हिन्दी radio options; signature `LanguagePickerCard(options: List<LanguageOption>, selectedTag: String, onSelect: (String) -> Unit, modifier: Modifier = Modifier)`. Pure UI, no DI. |
| `design-system/src/test/kotlin/com/homeservices/designsystem/locale/LanguagePickerCardPaparazziTest.kt` | Paparazzi snapshots (en+hi × light+dark = 4 goldens). |

### Files created — customer-app

| Path | Responsibility |
|---|---|
| `customer-app/app/src/main/kotlin/com/homeservices/customer/domain/locale/LocaleRepository.kt` | Interface: `currentLocale: Flow<String>`, `firstLaunchPending: Flow<Boolean>`, `suspend setLocale(tag: String)`, `suspend markFirstLaunchCompleted()`. |
| `customer-app/app/src/main/kotlin/com/homeservices/customer/data/locale/LocaleRepositoryImpl.kt` | DataStore-backed impl. |
| `customer-app/app/src/main/kotlin/com/homeservices/customer/data/locale/di/LocaleModule.kt` | Hilt @Module — provides DataStore + binds repo. |
| `customer-app/app/src/main/kotlin/com/homeservices/customer/data/locale/di/LocalePrefs.kt` | `@Qualifier` for `DataStore<Preferences>` named `locale_prefs`. |
| `customer-app/app/src/main/kotlin/com/homeservices/customer/domain/locale/SetAppLocaleUseCase.kt` | Calls `AppCompatDelegate.setApplicationLocales(LocaleListCompat.forLanguageTags(tag))` then `repo.setLocale(tag)` then `repo.markFirstLaunchCompleted()`. |
| `customer-app/app/src/main/kotlin/com/homeservices/customer/domain/locale/GetCurrentLocaleUseCase.kt` | Returns `Flow<String>` from repo. |
| `customer-app/app/src/main/kotlin/com/homeservices/customer/domain/locale/IsFirstLaunchUseCase.kt` | Returns `Flow<Boolean>` from repo. |
| `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/locale/FirstLaunchLanguageScreen.kt` | First-run screen wrapping `LanguagePickerCard` + Continue CTA. |
| `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/locale/FirstLaunchLanguageViewModel.kt` | Holds selected locale, calls `SetAppLocaleUseCase` on confirm. |
| `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/settings/SettingsScreen.kt` | Single-row list ("Language"); opens language picker route. |
| `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/settings/LanguageSettingsScreen.kt` | Wraps `LanguagePickerCard` with a save action; navigates back on success. |
| `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/settings/LanguageSettingsViewModel.kt` | Same pattern as FirstLaunchLanguageViewModel; no first-launch flag flip. |
| `customer-app/app/src/main/kotlin/com/homeservices/customer/data/catalogue/HindiLocaleNames.kt` | Constant maps: `categoryHindiNames`, `serviceHindiNames`, `serviceShortDescriptionHindi`. |
| `customer-app/app/src/main/kotlin/com/homeservices/customer/domain/catalogue/CatalogueLocalizer.kt` | Pure helper: `localize(category: Category, locale: String): Category` and same for `Service`. |
| `customer-app/app/src/test/kotlin/com/homeservices/customer/data/locale/LocaleRepositoryImplTest.kt` | Robolectric — DataStore round-trip. |
| `customer-app/app/src/test/kotlin/com/homeservices/customer/domain/locale/SetAppLocaleUseCaseTest.kt` | JVM unit. |
| `customer-app/app/src/test/kotlin/com/homeservices/customer/domain/locale/IsFirstLaunchUseCaseTest.kt` | JVM unit. |
| `customer-app/app/src/test/kotlin/com/homeservices/customer/domain/locale/GetCurrentLocaleUseCaseTest.kt` | JVM unit. |
| `customer-app/app/src/test/kotlin/com/homeservices/customer/domain/catalogue/CatalogueLocalizerTest.kt` | JVM unit — substitution + fallback semantics. |
| `customer-app/app/src/test/kotlin/com/homeservices/customer/ui/locale/FirstLaunchLanguageScreenPaparazziTest.kt` | Paparazzi (4 goldens: en/hi × light/dark, recorded on CI). |
| `customer-app/app/src/test/kotlin/com/homeservices/customer/ui/settings/SettingsScreenPaparazziTest.kt` | Paparazzi. |

### Files modified

| Path | Reason |
|---|---|
| `customer-app/gradle/libs.versions.toml` | + `androidxAppcompat = "1.7.0"` version + `androidx-appcompat` library. |
| `technician-app/gradle/libs.versions.toml` | **ONLY** mirrored TOML edit to maintain byte-equality with customer-app. No other tech-app file is touched in S02a. |
| `customer-app/app/build.gradle.kts` | Add `implementation(libs.androidx.appcompat)`. |
| `customer-app/app/src/main/res/values/themes.xml` | Parent → `Theme.AppCompat.DayNight.NoActionBar`. |
| `customer-app/app/src/main/AndroidManifest.xml` | Add `<service android:name="androidx.appcompat.app.AppLocalesMetadataHolderService"…>` with `autoStoreLocales` meta-data. |
| `customer-app/app/src/main/kotlin/com/homeservices/customer/HomeservicesCustomerApplication.kt` | `onCreate()` reads cached locale and calls `AppCompatDelegate.setApplicationLocales()` before any Activity starts. |
| `customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/AppNavigation.kt` | Inject + observe `IsFirstLaunchUseCase`; gate start destination on first-launch state. Add settings + language-settings routes. |
| `customer-app/app/src/main/kotlin/com/homeservices/customer/MainActivity.kt` | Inject `IsFirstLaunchUseCase`; pass to `AppNavigation`. |
| `customer-app/app/src/main/res/values-hi/strings.xml` | + 15 missing strings + 4 settings-related strings. |
| `customer-app/app/src/main/res/values/strings.xml` | + 4 settings-related strings (English source). |
| `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/catalogue/CatalogueHomeScreen.kt` | Add Settings icon button to top bar; thread `onSettingsClick` callback. |
| `customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/MainGraph.kt` | Pass `onSettingsClick` from CatalogueHomeScreen to navigate to `LocaleRoutes.SETTINGS`. |
| `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/catalogue/CatalogueHomeViewModel.kt` | Inject `CatalogueLocalizer` + `GetCurrentLocaleUseCase`; localize on emit. |
| `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/catalogue/ServiceListViewModel.kt` | Same. |
| `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/catalogue/ServiceDetailViewModel.kt` | Same. |
| `customer-app/app/src/test/kotlin/com/homeservices/customer/HiltWiringTest.kt` | Assert `LocaleRepository` is wired in the SingletonComponent. |
| Paparazzi goldens (customer-app + design-system) | Re-record on CI Linux after theme migration (see Task 19). |

---

## Work-stream order and parallelism

Streams labelled `[customer]` / `[shared]` to indicate ownership; tasks within a stream are sequential, streams without a dependency edge run in parallel.

```
WS-A: libs mirror + customer theme + customer locale repo
   ├── Task 1 (toml mirror — both apps) → Task 2 (customer deps) → Task 3 (customer theme) → Task 4–5 (customer repo)
WS-B: customer use cases (Tasks 6–7; parallel-able by use case after WS-A repo lands)
WS-C: customer Hilt + manifest + Application.onCreate (Task 8; after WS-B)
WS-D-shared: design-system LanguagePickerCard (Task 10; independent — can run after WS-A or in parallel with WS-B/C)
WS-D-customer: First-launch + Settings + Language settings UI (Tasks 11–12; after WS-C + WS-D-shared)
WS-D2: customer values-hi/ translations (Task 14; independent of all Kotlin work — can run any time after WS-A)
WS-D3: customer catalogue Hindi names (Tasks 16–17; after WS-B repo lands)
WS-E: pre-Codex smoke + Paparazzi re-record on CI + codex review (Tasks 18–20; last)
```

Independent fan-out points for parallel agents:
- After WS-A repo lands: Task 6 (SetAppLocaleUseCase), Task 7 (GetCurrentLocale + IsFirstLaunch use cases), Task 10 (LanguagePickerCard) can all run in parallel as separate subagents.
- Task 14 (translations) is independent of all Kotlin work; can dispatch alongside any other stream after Task 1 lands.
- Task 16 (HindiLocaleNames + CatalogueLocalizer) is independent of UI work — only touches data + domain layers.

---

## Tasks

### Task 1: Mirror AppCompat dep into BOTH libs.versions.toml `[shared]`

**Files:**
- Modify: `customer-app/gradle/libs.versions.toml`
- Modify: `technician-app/gradle/libs.versions.toml`

**Why both:** Project CLAUDE.md "Android story invariants" — the two TOMLs MUST be byte-identical (CI gate). Even though only customer-app consumes appcompat in this task, both files are updated in lockstep.

- [ ] **Step 1: Add the version + library entry to customer-app TOML**

After the existing `androidxBiometric = "1.1.0"` line (around line 9), insert:

```toml
androidxAppcompat = "1.7.0"
```

After `androidx-biometric = { module = "androidx.biometric:biometric", version.ref = "androidxBiometric" }` (around line 80), insert:

```toml
androidx-appcompat = { module = "androidx.appcompat:appcompat", version.ref = "androidxAppcompat" }
```

- [ ] **Step 2: Apply identical edit to technician-app TOML**

Same insertions, same line positions.

- [ ] **Step 3: Verify byte-equality**

Run: `diff customer-app/gradle/libs.versions.toml technician-app/gradle/libs.versions.toml`
Expected: empty diff (exit code 0).

- [ ] **Step 4: Commit**

```bash
git add customer-app/gradle/libs.versions.toml technician-app/gradle/libs.versions.toml
git commit -m "feat(E12-S02): mirror androidx.appcompat 1.7.0 into both apps' libs.versions.toml"
```

---

### Task 2: Add `androidx.appcompat` implementation dep to customer-app `[customer]`

**Files:**
- Modify: `customer-app/app/build.gradle.kts`

(technician-app/build.gradle.kts is updated in S02b — the TOML entry from Task 1 is declared but unused in technician-app until then; this is allowed.)

- [ ] **Step 1: Add dep to customer-app/app/build.gradle.kts**

Inside the `dependencies { … }` block, immediately after `implementation(libs.androidx.core.ktx)`:

```kotlin
    implementation(libs.androidx.appcompat)
```

- [ ] **Step 2: Verify build**

```bash
cd customer-app && ./gradlew :app:dependencies --configuration debugRuntimeClasspath --quiet | grep -i appcompat
```
Expected: shows `androidx.appcompat:appcompat:1.7.0`.

- [ ] **Step 3: Commit**

```bash
git add customer-app/app/build.gradle.kts
git commit -m "feat(E12-S02a): wire androidx.appcompat into customer-app"
```

---

### Task 3: Migrate customer-app theme to AppCompat parent `[customer]`

**Files:**
- Modify: `customer-app/app/src/main/res/values/themes.xml`

(technician-app's theme migrates in S02b alongside its locale wiring.)

**Why:** `AppCompatDelegate.setApplicationLocales()` requires the activity's theme to descend from a `Theme.AppCompat.*` parent so the `LayoutInflater` re-applies the locale on Activity recreation. Material3 theming runs unaffected — `Theme.AppCompat.DayNight.NoActionBar` is the documented parent for Compose-only apps using AppCompat APIs.

**Paparazzi cascade warning:** Theme parent change shifts Compose rendering microscopically; the customer-app Paparazzi goldens for ALL existing screens (~30 of them) will need re-recording on CI in WS-E. Account for this — do not panic when goldens flag.

- [ ] **Step 1: Update customer-app/app/src/main/res/values/themes.xml**

Replace the entire file with:

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources xmlns:tools="http://schemas.android.com/tools">
    <style name="Theme.HomeservicesCustomer" parent="Theme.AppCompat.DayNight.NoActionBar">
        <item name="android:statusBarColor">@android:color/transparent</item>
        <item name="android:windowLightStatusBar" tools:targetApi="m">true</item>
    </style>
</resources>
```

- [ ] **Step 2: Verify assemble still passes**

```bash
cd customer-app && ./gradlew :app:assembleDebug --quiet
```
Expected: BUILD SUCCESSFUL.

- [ ] **Step 3: Commit**

```bash
git add customer-app/app/src/main/res/values/themes.xml
git commit -m "feat(E12-S02a): migrate customer-app theme to Theme.AppCompat.DayNight parent"
```

---

### Task 4: customer-app `LocaleRepository` interface `[customer]`

**Files:**
- Create: `customer-app/app/src/main/kotlin/com/homeservices/customer/domain/locale/LocaleRepository.kt`

- [ ] **Step 1: Write the interface**

```kotlin
package com.homeservices.customer.domain.locale

import kotlinx.coroutines.flow.Flow

public interface LocaleRepository {
    public val currentLocale: Flow<String>

    public val firstLaunchPending: Flow<Boolean>

    public suspend fun setLocale(tag: String)

    public suspend fun markFirstLaunchCompleted()
}
```

- [ ] **Step 2: Verify the file compiles**

```bash
cd customer-app && ./gradlew :app:compileDebugKotlin --quiet
```
Expected: BUILD SUCCESSFUL.

- [ ] **Step 3: Commit**

```bash
git add customer-app/app/src/main/kotlin/com/homeservices/customer/domain/locale/LocaleRepository.kt
git commit -m "feat(E12-S02 customer): add LocaleRepository interface"
```

---

### Task 5: customer-app `LocaleRepositoryImpl` (TDD) `[customer]`

**Files:**
- Test: `customer-app/app/src/test/kotlin/com/homeservices/customer/data/locale/LocaleRepositoryImplTest.kt`
- Create: `customer-app/app/src/main/kotlin/com/homeservices/customer/data/locale/LocaleRepositoryImpl.kt`
- Create: `customer-app/app/src/main/kotlin/com/homeservices/customer/data/locale/di/LocalePrefs.kt`

- [ ] **Step 1: Write the failing repository test**

```kotlin
package com.homeservices.customer.data.locale

import androidx.datastore.core.DataStoreFactory
import androidx.datastore.preferences.core.PreferencesSerializer
import androidx.test.core.app.ApplicationProvider
import com.google.common.truth.Truth.assertThat
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.io.File

@RunWith(RobolectricTestRunner::class)
public class LocaleRepositoryImplTest {
    @get:Rule
    public val tempFolder: TemporaryFolder = TemporaryFolder()

    private lateinit var repo: LocaleRepositoryImpl

    @Before
    public fun setUp() {
        val file = File(tempFolder.newFolder(), "locale_prefs.preferences_pb")
        val dataStore = DataStoreFactory.create(serializer = PreferencesSerializer) { file }
        repo = LocaleRepositoryImpl(dataStore)
    }

    @Test
    public fun `currentLocale defaults to en when nothing is stored`() = runTest {
        assertThat(repo.currentLocale.first()).isEqualTo("en")
    }

    @Test
    public fun `firstLaunchPending defaults to true when nothing is stored`() = runTest {
        assertThat(repo.firstLaunchPending.first()).isTrue()
    }

    @Test
    public fun `setLocale persists the tag`() = runTest {
        repo.setLocale("hi")
        assertThat(repo.currentLocale.first()).isEqualTo("hi")
    }

    @Test
    public fun `markFirstLaunchCompleted flips firstLaunchPending to false`() = runTest {
        repo.markFirstLaunchCompleted()
        assertThat(repo.firstLaunchPending.first()).isFalse()
    }

    @Test
    public fun `setLocale does not flip firstLaunchPending on its own`() = runTest {
        repo.setLocale("hi")
        assertThat(repo.firstLaunchPending.first()).isTrue()
    }
}
```

- [ ] **Step 2: Run test — must fail with unresolved reference `LocaleRepositoryImpl`**

```bash
cd customer-app && ./gradlew :app:testDebugUnitTest --tests "*LocaleRepositoryImplTest*" --quiet
```
Expected: FAIL — `Unresolved reference: LocaleRepositoryImpl`.

- [ ] **Step 3: Write the qualifier**

```kotlin
package com.homeservices.customer.data.locale.di

import javax.inject.Qualifier

@Qualifier
@Retention(AnnotationRetention.BINARY)
public annotation class LocalePrefs
```

- [ ] **Step 4: Write the implementation**

```kotlin
package com.homeservices.customer.data.locale

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import com.homeservices.customer.domain.locale.LocaleRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class LocaleRepositoryImpl
    @Inject
    constructor(
        private val dataStore: DataStore<Preferences>,
    ) : LocaleRepository {
        private companion object {
            val KEY_LOCALE_TAG = stringPreferencesKey("locale_tag")
            val KEY_FIRST_LAUNCH_COMPLETED = booleanPreferencesKey("first_launch_completed")
            const val DEFAULT_LOCALE = "en"
        }

        override val currentLocale: Flow<String> =
            dataStore.data.map { prefs -> prefs[KEY_LOCALE_TAG] ?: DEFAULT_LOCALE }

        override val firstLaunchPending: Flow<Boolean> =
            dataStore.data.map { prefs -> !(prefs[KEY_FIRST_LAUNCH_COMPLETED] ?: false) }

        override suspend fun setLocale(tag: String) {
            dataStore.edit { prefs -> prefs[KEY_LOCALE_TAG] = tag }
        }

        override suspend fun markFirstLaunchCompleted() {
            dataStore.edit { prefs -> prefs[KEY_FIRST_LAUNCH_COMPLETED] = true }
        }
    }
```

- [ ] **Step 5: Run test — must pass**

```bash
cd customer-app && ./gradlew :app:testDebugUnitTest --tests "*LocaleRepositoryImplTest*" --quiet
```
Expected: PASS — 5 tests.

- [ ] **Step 6: Commit**

```bash
git add customer-app/app/src/main/kotlin/com/homeservices/customer/data/locale customer-app/app/src/test/kotlin/com/homeservices/customer/data/locale
git commit -m "feat(E12-S02 customer): add DataStore-backed LocaleRepositoryImpl"
```

---

### Task 6: customer-app `SetAppLocaleUseCase` (TDD) `[customer]`

**Files:**
- Test: `customer-app/app/src/test/kotlin/com/homeservices/customer/domain/locale/SetAppLocaleUseCaseTest.kt`
- Create: `customer-app/app/src/main/kotlin/com/homeservices/customer/domain/locale/SetAppLocaleUseCase.kt`

- [ ] **Step 1: Write the failing test**

```kotlin
package com.homeservices.customer.domain.locale

import io.mockk.coVerify
import io.mockk.coEvery
import io.mockk.mockk
import io.mockk.mockkStatic
import io.mockk.unmockkStatic
import io.mockk.verify
import androidx.appcompat.app.AppCompatDelegate
import androidx.core.os.LocaleListCompat
import kotlinx.coroutines.test.runTest
import org.junit.After
import org.junit.Before
import org.junit.Test

public class SetAppLocaleUseCaseTest {
    private val repo: LocaleRepository = mockk(relaxed = true)
    private lateinit var useCase: SetAppLocaleUseCase

    @Before
    public fun setUp() {
        mockkStatic(AppCompatDelegate::class)
        useCase = SetAppLocaleUseCase(repo)
    }

    @After
    public fun tearDown() {
        unmockkStatic(AppCompatDelegate::class)
    }

    @Test
    public fun `invoke applies AppCompatDelegate locale and persists tag`() = runTest {
        coEvery { AppCompatDelegate.setApplicationLocales(any()) } returns Unit

        useCase("hi")

        verify { AppCompatDelegate.setApplicationLocales(LocaleListCompat.forLanguageTags("hi")) }
        coVerify { repo.setLocale("hi") }
        coVerify { repo.markFirstLaunchCompleted() }
    }
}
```

- [ ] **Step 2: Run test — must fail with unresolved reference**

```bash
cd customer-app && ./gradlew :app:testDebugUnitTest --tests "*SetAppLocaleUseCaseTest*" --quiet
```
Expected: FAIL.

- [ ] **Step 3: Write the use case**

```kotlin
package com.homeservices.customer.domain.locale

import androidx.appcompat.app.AppCompatDelegate
import androidx.core.os.LocaleListCompat
import javax.inject.Inject

public class SetAppLocaleUseCase
    @Inject
    constructor(
        private val repo: LocaleRepository,
    ) {
        public suspend operator fun invoke(tag: String) {
            AppCompatDelegate.setApplicationLocales(LocaleListCompat.forLanguageTags(tag))
            repo.setLocale(tag)
            repo.markFirstLaunchCompleted()
        }
    }
```

- [ ] **Step 4: Run test — must pass**

```bash
cd customer-app && ./gradlew :app:testDebugUnitTest --tests "*SetAppLocaleUseCaseTest*" --quiet
```
Expected: PASS — 1 test.

- [ ] **Step 5: Commit**

```bash
git add customer-app/app/src/main/kotlin/com/homeservices/customer/domain/locale/SetAppLocaleUseCase.kt customer-app/app/src/test/kotlin/com/homeservices/customer/domain/locale/SetAppLocaleUseCaseTest.kt
git commit -m "feat(E12-S02 customer): add SetAppLocaleUseCase"
```

---

### Task 7: customer-app `GetCurrentLocaleUseCase` + `IsFirstLaunchUseCase` (TDD) `[customer]`

**Files:**
- Test: `customer-app/app/src/test/kotlin/com/homeservices/customer/domain/locale/GetCurrentLocaleUseCaseTest.kt`
- Test: `customer-app/app/src/test/kotlin/com/homeservices/customer/domain/locale/IsFirstLaunchUseCaseTest.kt`
- Create: `customer-app/app/src/main/kotlin/com/homeservices/customer/domain/locale/GetCurrentLocaleUseCase.kt`
- Create: `customer-app/app/src/main/kotlin/com/homeservices/customer/domain/locale/IsFirstLaunchUseCase.kt`

- [ ] **Step 1: Write both failing tests**

`GetCurrentLocaleUseCaseTest.kt`:

```kotlin
package com.homeservices.customer.domain.locale

import com.google.common.truth.Truth.assertThat
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import org.junit.Test

public class GetCurrentLocaleUseCaseTest {
    private val repo: LocaleRepository = mockk()

    @Test
    public fun `returns repo currentLocale flow`() = runTest {
        every { repo.currentLocale } returns flowOf("hi")
        val useCase = GetCurrentLocaleUseCase(repo)
        assertThat(useCase().first()).isEqualTo("hi")
    }
}
```

`IsFirstLaunchUseCaseTest.kt`:

```kotlin
package com.homeservices.customer.domain.locale

import com.google.common.truth.Truth.assertThat
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import org.junit.Test

public class IsFirstLaunchUseCaseTest {
    private val repo: LocaleRepository = mockk()

    @Test
    public fun `returns repo firstLaunchPending flow`() = runTest {
        every { repo.firstLaunchPending } returns flowOf(true)
        val useCase = IsFirstLaunchUseCase(repo)
        assertThat(useCase().first()).isTrue()
    }
}
```

- [ ] **Step 2: Run tests — must fail unresolved**

```bash
cd customer-app && ./gradlew :app:testDebugUnitTest --tests "*GetCurrentLocaleUseCaseTest*" --tests "*IsFirstLaunchUseCaseTest*" --quiet
```
Expected: FAIL.

- [ ] **Step 3: Write the use cases**

`GetCurrentLocaleUseCase.kt`:

```kotlin
package com.homeservices.customer.domain.locale

import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

public class GetCurrentLocaleUseCase
    @Inject
    constructor(
        private val repo: LocaleRepository,
    ) {
        public operator fun invoke(): Flow<String> = repo.currentLocale
    }
```

`IsFirstLaunchUseCase.kt`:

```kotlin
package com.homeservices.customer.domain.locale

import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

public class IsFirstLaunchUseCase
    @Inject
    constructor(
        private val repo: LocaleRepository,
    ) {
        public operator fun invoke(): Flow<Boolean> = repo.firstLaunchPending
    }
```

- [ ] **Step 4: Run tests — must pass**

```bash
cd customer-app && ./gradlew :app:testDebugUnitTest --tests "*GetCurrentLocaleUseCaseTest*" --tests "*IsFirstLaunchUseCaseTest*" --quiet
```
Expected: PASS — 2 tests.

- [ ] **Step 5: Commit**

```bash
git add customer-app/app/src/main/kotlin/com/homeservices/customer/domain/locale customer-app/app/src/test/kotlin/com/homeservices/customer/domain/locale
git commit -m "feat(E12-S02 customer): add GetCurrentLocaleUseCase + IsFirstLaunchUseCase"
```

---

### Task 8: customer-app `LocaleModule` Hilt module + manifest + Application init `[customer]`

**Files:**
- Create: `customer-app/app/src/main/kotlin/com/homeservices/customer/data/locale/di/LocaleModule.kt`
- Modify: `customer-app/app/src/main/AndroidManifest.xml`
- Modify: `customer-app/app/src/main/kotlin/com/homeservices/customer/HomeservicesCustomerApplication.kt`
- Modify: `customer-app/app/src/test/kotlin/com/homeservices/customer/HiltWiringTest.kt`

- [ ] **Step 1: Write the Hilt module**

```kotlin
package com.homeservices.customer.data.locale.di

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.preferencesDataStore
import com.homeservices.customer.data.locale.LocaleRepositoryImpl
import com.homeservices.customer.domain.locale.LocaleRepository
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

private val Context.localePreferencesDataStore: DataStore<Preferences> by preferencesDataStore(name = "locale_prefs")

@Module
@InstallIn(SingletonComponent::class)
public object LocaleModule {
    @Provides
    @Singleton
    @LocalePrefs
    public fun provideLocaleDataStore(
        @ApplicationContext context: Context,
    ): DataStore<Preferences> = context.localePreferencesDataStore
}

@Module
@InstallIn(SingletonComponent::class)
public abstract class LocaleBindings {
    @Binds
    @Singleton
    public abstract fun bindLocaleRepository(impl: LocaleRepositoryImpl): LocaleRepository
}
```

Note: `LocaleRepositoryImpl` is provided by Hilt automatically through its `@Inject` constructor. The `@Binds` re-targets the interface type. The `@LocalePrefs` qualifier is wired but unused for now — we keep it because the impl takes a `DataStore<Preferences>` parameter; if a future module adds another DataStore, this qualifier prevents ambiguity. To make the qualifier actually load, refactor `LocaleRepositoryImpl` constructor to `@LocalePrefs DataStore<Preferences>`:

Update `customer-app/app/src/main/kotlin/com/homeservices/customer/data/locale/LocaleRepositoryImpl.kt` constructor to:

```kotlin
@Singleton
public class LocaleRepositoryImpl
    @Inject
    constructor(
        @LocalePrefs private val dataStore: DataStore<Preferences>,
    ) : LocaleRepository {
```

(Add `import com.homeservices.customer.data.locale.di.LocalePrefs` at top.)

And the module's `@Provides` already returns the qualified `@LocalePrefs DataStore<Preferences>`. ✓

- [ ] **Step 2: Add the AppLocalesMetadataHolderService entry to AndroidManifest.xml**

Inside the `<application>` block, before `</application>`, add:

```xml
        <service
            android:name="androidx.appcompat.app.AppLocalesMetadataHolderService"
            android:enabled="false"
            android:exported="false">
            <meta-data
                android:name="autoStoreLocales"
                android:value="true" />
        </service>
```

This enables AppCompat's per-app locale auto-storage on API < 33. On API 33+ the system `LocaleManager` handles persistence regardless.

- [ ] **Step 3: Wire `AppCompatDelegate.setApplicationLocales` into Application.onCreate**

Open `customer-app/app/src/main/kotlin/com/homeservices/customer/HomeservicesCustomerApplication.kt`. Inject `LocaleRepository` via Hilt entry point and apply the persisted locale before any Activity is created.

Replace the existing class with:

```kotlin
package com.homeservices.customer

import android.app.Application
import androidx.appcompat.app.AppCompatDelegate
import androidx.core.os.LocaleListCompat
import com.homeservices.customer.domain.locale.LocaleRepository
import dagger.hilt.android.HiltAndroidApp
import dagger.hilt.EntryPoint
import dagger.hilt.InstallIn
import dagger.hilt.android.EntryPointAccessors
import dagger.hilt.components.SingletonComponent
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import io.sentry.android.core.SentryAndroid

@HiltAndroidApp
public class HomeservicesCustomerApplication : Application() {
    @EntryPoint
    @InstallIn(SingletonComponent::class)
    public interface LocaleEntryPoint {
        public fun localeRepository(): LocaleRepository
    }

    override fun onCreate() {
        super.onCreate()

        // Sentry init — preserve existing wiring exactly as it was. Re-paste from prior file content.
        SentryAndroid.init(this) { options ->
            options.dsn = com.homeservices.customer.BuildConfig.SENTRY_DSN
            options.environment = com.homeservices.customer.BuildConfig.SENTRY_ENVIRONMENT
        }

        // Apply persisted locale BEFORE first Activity onCreate so initial frame uses correct strings.
        val entryPoint = EntryPointAccessors.fromApplication(this, LocaleEntryPoint::class.java)
        val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
        scope.launch {
            val tag = entryPoint.localeRepository().currentLocale.first()
            AppCompatDelegate.setApplicationLocales(LocaleListCompat.forLanguageTags(tag))
        }
    }
}
```

**Note for the implementer:** the existing `HomeservicesCustomerApplication.kt` already calls Sentry init. Read it first and preserve every existing line exactly. Only add the locale-apply block. The Sentry init shown above is illustrative — the real DSN/options call may differ.

- [ ] **Step 4: Update HiltWiringTest to assert LocaleRepository is wired**

Open `customer-app/app/src/test/kotlin/com/homeservices/customer/HiltWiringTest.kt` and add a `@Test` method:

```kotlin
    @Test
    public fun localeRepository_is_provided() {
        val repo: LocaleRepository = component.localeRepository()
        assertThat(repo).isNotNull()
    }
```

(Add `import com.homeservices.customer.domain.locale.LocaleRepository` and a `localeRepository(): LocaleRepository` method to the test's Hilt entry-point interface.)

If HiltWiringTest uses a different style (e.g., `@Inject lateinit var ...`), follow that pattern.

- [ ] **Step 5: Run smoke + tests**

```bash
cd customer-app && ./gradlew :app:assembleDebug :app:testDebugUnitTest --quiet
```
Expected: BUILD SUCCESSFUL; HiltWiringTest passes.

- [ ] **Step 6: Commit**

```bash
git add customer-app/app/src/main/kotlin/com/homeservices/customer/data/locale/di/LocaleModule.kt customer-app/app/src/main/kotlin/com/homeservices/customer/data/locale/LocaleRepositoryImpl.kt customer-app/app/src/main/AndroidManifest.xml customer-app/app/src/main/kotlin/com/homeservices/customer/HomeservicesCustomerApplication.kt customer-app/app/src/test/kotlin/com/homeservices/customer/HiltWiringTest.kt
git commit -m "feat(E12-S02 customer): wire LocaleModule Hilt + apply persisted locale in Application.onCreate"
```


### Task 10: design-system shared `LanguagePickerCard` Composable `[shared]`

**Files:**
- Create: `design-system/src/main/kotlin/com/homeservices/designsystem/locale/LanguagePickerCard.kt`

This is a stateless Composable used by both apps' first-launch screen and Settings → Language screen. It does not own state — the host ViewModel holds the selected locale and pushes it down.

- [ ] **Step 1: Write the Composable**

```kotlin
package com.homeservices.designsystem.locale

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.dp

public data class LanguageOption(
    public val tag: String,
    public val displayLabel: String,
    public val nativeName: String,
)

public val DefaultLanguageOptions: List<LanguageOption> = listOf(
    LanguageOption(tag = "en", displayLabel = "English", nativeName = "English"),
    LanguageOption(tag = "hi", displayLabel = "Hindi", nativeName = "हिन्दी"),
)

@Composable
public fun LanguagePickerCard(
    options: List<LanguageOption>,
    selectedTag: String,
    onSelect: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(modifier = modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        options.forEach { option ->
            val isSelected = option.tag == selectedTag
            Surface(
                shape = RoundedCornerShape(16.dp),
                color = if (isSelected) {
                    MaterialTheme.colorScheme.primaryContainer
                } else {
                    MaterialTheme.colorScheme.surfaceVariant
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .selectable(
                        selected = isSelected,
                        onClick = { onSelect(option.tag) },
                        role = Role.RadioButton,
                    ),
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.padding(16.dp),
                ) {
                    RadioButton(selected = isSelected, onClick = null)
                    Spacer(modifier = Modifier.height(0.dp))
                    Column(modifier = Modifier.padding(start = 12.dp)) {
                        Text(
                            text = option.nativeName,
                            style = MaterialTheme.typography.titleMedium,
                            color = MaterialTheme.colorScheme.onSurface,
                        )
                        Text(
                            text = option.displayLabel,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
            }
        }
    }
}
```

- [ ] **Step 2: Write Paparazzi test**

`design-system/src/test/kotlin/com/homeservices/designsystem/locale/LanguagePickerCardPaparazziTest.kt`:

```kotlin
package com.homeservices.designsystem.locale

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Rule
import org.junit.Test

public class LanguagePickerCardPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi = Paparazzi(
        deviceConfig = DeviceConfig.PIXEL_5,
        theme = "android:Theme.Material3.DayNight.NoActionBar",
    )

    @Test
    public fun englishSelected_lightTheme() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                LanguagePickerCard(
                    options = DefaultLanguageOptions,
                    selectedTag = "en",
                    onSelect = {},
                )
            }
        }
    }

    @Test
    public fun englishSelected_darkTheme() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = true) {
                LanguagePickerCard(
                    options = DefaultLanguageOptions,
                    selectedTag = "en",
                    onSelect = {},
                )
            }
        }
    }

    @Test
    public fun hindiSelected_lightTheme() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                LanguagePickerCard(
                    options = DefaultLanguageOptions,
                    selectedTag = "hi",
                    onSelect = {},
                )
            }
        }
    }

    @Test
    public fun hindiSelected_darkTheme() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = true) {
                LanguagePickerCard(
                    options = DefaultLanguageOptions,
                    selectedTag = "hi",
                    onSelect = {},
                )
            }
        }
    }
}
```

- [ ] **Step 3: Verify compile (do NOT record goldens locally — see WS-E)**

```bash
cd design-system && ./gradlew testDebugUnitTest --quiet --tests "*LanguagePickerCardPaparazziTest*"
```
Expected: tests RUN; if no golden exists yet they will fail with `Snapshot not found` — this is expected and will be resolved on CI in WS-E. If they fail with a compile error, that is a real failure to fix.

- [ ] **Step 4: Commit**

```bash
git add design-system/src/main/kotlin/com/homeservices/designsystem/locale design-system/src/test/kotlin/com/homeservices/designsystem/locale
git commit -m "feat(E12-S02 design-system): add LanguagePickerCard Composable + Paparazzi test"
```

---

### Task 11: customer-app `FirstLaunchLanguageScreen` + ViewModel + route `[customer]`

**Files:**
- Create: `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/locale/FirstLaunchLanguageViewModel.kt`
- Create: `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/locale/FirstLaunchLanguageScreen.kt`
- Modify: `customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/AppNavigation.kt`
- Test: `customer-app/app/src/test/kotlin/com/homeservices/customer/ui/locale/FirstLaunchLanguageScreenPaparazziTest.kt`

- [ ] **Step 1: Write the ViewModel**

```kotlin
package com.homeservices.customer.ui.locale

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.customer.domain.locale.GetCurrentLocaleUseCase
import com.homeservices.customer.domain.locale.SetAppLocaleUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
public class FirstLaunchLanguageViewModel
    @Inject
    constructor(
        private val getCurrentLocale: GetCurrentLocaleUseCase,
        private val setAppLocale: SetAppLocaleUseCase,
    ) : ViewModel() {
        private val _selectedTag = MutableStateFlow("en")
        public val selectedTag: StateFlow<String> = _selectedTag.asStateFlow()

        public val confirmedFlow: MutableStateFlow<Boolean> = MutableStateFlow(false)

        init {
            viewModelScope.launch {
                _selectedTag.value = getCurrentLocale().first()
            }
        }

        public fun onSelect(tag: String) {
            _selectedTag.value = tag
        }

        public fun onConfirm() {
            viewModelScope.launch {
                setAppLocale(_selectedTag.value)
                confirmedFlow.value = true
            }
        }
    }
```

- [ ] **Step 2: Write the Screen**

```kotlin
package com.homeservices.customer.ui.locale

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.homeservices.designsystem.locale.DefaultLanguageOptions
import com.homeservices.designsystem.locale.LanguagePickerCard

@Composable
public fun FirstLaunchLanguageScreen(
    onConfirmed: () -> Unit,
    viewModel: FirstLaunchLanguageViewModel = hiltViewModel(),
) {
    val selected by viewModel.selectedTag.collectAsStateWithLifecycle()
    val confirmed by viewModel.confirmedFlow.collectAsStateWithLifecycle()

    if (confirmed) {
        onConfirmed()
    }

    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        Column(
            modifier = Modifier.fillMaxSize().padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                text = "Choose your language\nभाषा चुनें",
                style = MaterialTheme.typography.headlineSmall,
                color = MaterialTheme.colorScheme.onBackground,
            )
            LanguagePickerCard(
                options = DefaultLanguageOptions,
                selectedTag = selected,
                onSelect = viewModel::onSelect,
            )
            Button(onClick = viewModel::onConfirm, modifier = Modifier.fillMaxWidth()) {
                Text(text = "Continue / जारी रखें")
            }
        }
    }
}
```

**Note:** the Continue label is intentionally bilingual. It is shown only on the first-launch screen, so it must read in both languages before the user has chosen. After confirm, locale-aware screens take over and use `strings.xml` resources. Do NOT extract this string to `values/strings.xml` — its bilingual nature is the whole point.

- [ ] **Step 3: Wire route into AppNavigation**

Modify `customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/AppNavigation.kt`:

Add a new constant block above the function:

```kotlin
public object LocaleRoutes {
    public const val FIRST_LAUNCH: String = "first_launch_language"
    public const val SETTINGS: String = "settings"
    public const val LANGUAGE_SETTINGS: String = "language_settings"
}
```

Replace the `AppNavigation` function body so the start destination is gated on `firstLaunchPending`:

```kotlin
@Composable
internal fun AppNavigation(
    sessionManager: SessionManager,
    activity: FragmentActivity,
    priceApprovalEventBus: PriceApprovalEventBus,
    ratingPromptEventBus: RatingPromptEventBus,
    isFirstLaunch: IsFirstLaunchUseCase,
    modifier: Modifier = Modifier,
) {
    val navController = rememberNavController()
    val authState by sessionManager.authState.collectAsStateWithLifecycle()
    val firstLaunchPending by isFirstLaunch().collectAsStateWithLifecycle(initialValue = true)

    val startDestination = if (firstLaunchPending) LocaleRoutes.FIRST_LAUNCH else "auth"

    LaunchedEffect(authState, firstLaunchPending) {
        if (firstLaunchPending) return@LaunchedEffect
        val currentAuth = authState
        when (currentAuth) {
            is AuthState.Authenticated -> {
                navController.navigate("main") {
                    popUpTo("auth") { inclusive = true }
                    popUpTo(LocaleRoutes.FIRST_LAUNCH) { inclusive = true }
                    launchSingleTop = true
                }
                com.google.firebase.messaging.FirebaseMessaging.getInstance()
                    .subscribeToTopic("customer_${currentAuth.uid}")
            }
            is AuthState.Unauthenticated -> {
                com.google.firebase.messaging.FirebaseMessaging.getInstance().deleteToken()
                navController.navigate("auth") {
                    popUpTo("main") { inclusive = true }
                    popUpTo(LocaleRoutes.FIRST_LAUNCH) { inclusive = true }
                    launchSingleTop = true
                }
            }
        }
    }

    LaunchedEffect(priceApprovalEventBus) {
        priceApprovalEventBus.events.collect { bookingId ->
            navController.navigate(BookingRoutes.priceApprovalRoute(bookingId)) {
                launchSingleTop = true
            }
        }
    }

    LaunchedEffect(ratingPromptEventBus) {
        ratingPromptEventBus.events.collect { bookingId ->
            navController.navigate(RatingRoutes.route(bookingId)) { launchSingleTop = true }
        }
    }

    NavHost(
        navController = navController,
        startDestination = startDestination,
        modifier = modifier,
    ) {
        composable(LocaleRoutes.FIRST_LAUNCH) {
            FirstLaunchLanguageScreen(
                onConfirmed = {
                    navController.navigate("auth") {
                        popUpTo(LocaleRoutes.FIRST_LAUNCH) { inclusive = true }
                        launchSingleTop = true
                    }
                },
            )
        }
        authGraph(navController, activity)
        mainGraph(navController)
        settingsGraph(navController)
    }
}
```

(Add `import com.homeservices.customer.domain.locale.IsFirstLaunchUseCase`, `import com.homeservices.customer.ui.locale.FirstLaunchLanguageScreen`, `import androidx.navigation.compose.composable`. The `settingsGraph` reference is the route from Task 12 below; if Task 12 has not yet landed when you ship Task 11, comment out the `settingsGraph(navController)` call and re-enable it as part of Task 12's commit.)

- [ ] **Step 4: Inject `IsFirstLaunchUseCase` from `MainActivity`**

Modify `customer-app/app/src/main/kotlin/com/homeservices/customer/MainActivity.kt` — add an `@Inject` field for `IsFirstLaunchUseCase` and pass it to `AppNavigation(...)`:

```kotlin
    @Inject public lateinit var isFirstLaunch: com.homeservices.customer.domain.locale.IsFirstLaunchUseCase
```

And in the `setContent` block:

```kotlin
            HomeservicesTheme {
                AppNavigation(
                    sessionManager = sessionManager,
                    activity = this,
                    priceApprovalEventBus = priceApprovalEventBus,
                    ratingPromptEventBus = ratingPromptEventBus,
                    isFirstLaunch = isFirstLaunch,
                )
            }
```

- [ ] **Step 5: Write Paparazzi test for FirstLaunchLanguageScreen**

`customer-app/app/src/test/kotlin/com/homeservices/customer/ui/locale/FirstLaunchLanguageScreenPaparazziTest.kt`:

```kotlin
package com.homeservices.customer.ui.locale

import androidx.compose.runtime.mutableStateOf
import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.designsystem.locale.DefaultLanguageOptions
import com.homeservices.designsystem.locale.LanguagePickerCard
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Rule
import org.junit.Test

public class FirstLaunchLanguageScreenPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi = Paparazzi(
        deviceConfig = DeviceConfig.PIXEL_5,
        theme = "android:Theme.Material3.DayNight.NoActionBar",
    )

    // We render the static layout only — ViewModel is not exercised in Paparazzi.
    // Callers verify ViewModel logic separately via FirstLaunchLanguageViewModelTest (JVM unit).
    @Test
    public fun englishSelected_light() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                StaticFirstLaunchLayout(selectedTag = "en")
            }
        }
    }

    @Test
    public fun hindiSelected_light() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                StaticFirstLaunchLayout(selectedTag = "hi")
            }
        }
    }
}

@androidx.compose.runtime.Composable
private fun StaticFirstLaunchLayout(selectedTag: String) {
    androidx.compose.material3.Surface(
        modifier = androidx.compose.ui.Modifier.fillMaxSize(),
        color = androidx.compose.material3.MaterialTheme.colorScheme.background,
    ) {
        androidx.compose.foundation.layout.Column(
            modifier = androidx.compose.ui.Modifier.fillMaxSize().padding(24.dp),
            verticalArrangement = androidx.compose.foundation.layout.Arrangement.spacedBy(24.dp),
            horizontalAlignment = androidx.compose.ui.Alignment.CenterHorizontally,
        ) {
            androidx.compose.material3.Text(
                text = "Choose your language\nभाषा चुनें",
                style = androidx.compose.material3.MaterialTheme.typography.headlineSmall,
                color = androidx.compose.material3.MaterialTheme.colorScheme.onBackground,
            )
            LanguagePickerCard(
                options = DefaultLanguageOptions,
                selectedTag = selectedTag,
                onSelect = {},
            )
            androidx.compose.material3.Button(
                onClick = {},
                modifier = androidx.compose.ui.Modifier.fillMaxWidth(),
            ) {
                androidx.compose.material3.Text(text = "Continue / जारी रखें")
            }
        }
    }
}
```

(The static layout duplicates FirstLaunchLanguageScreen's body without the Hilt ViewModel; this is the standard project pattern for Paparazzi tests of HiltViewModel-backed screens.)

- [ ] **Step 6: Verify compile + smoke**

```bash
cd customer-app && ./gradlew :app:assembleDebug --quiet
```
Expected: BUILD SUCCESSFUL.

- [ ] **Step 7: Commit**

```bash
git add customer-app/app/src/main/kotlin/com/homeservices/customer/ui/locale customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/AppNavigation.kt customer-app/app/src/main/kotlin/com/homeservices/customer/MainActivity.kt customer-app/app/src/test/kotlin/com/homeservices/customer/ui/locale
git commit -m "feat(E12-S02 customer): first-launch language picker screen + nav gate"
```

---

### Task 12: customer-app `SettingsScreen` + `LanguageSettingsScreen` + nav graph `[customer]`

**Files:**
- Create: `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/settings/SettingsScreen.kt`
- Create: `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/settings/LanguageSettingsScreen.kt`
- Create: `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/settings/LanguageSettingsViewModel.kt`
- Create: `customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/SettingsGraph.kt`
- Modify: `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/catalogue/CatalogueHomeScreen.kt` — add a Settings icon in the top bar that navigates to `LocaleRoutes.SETTINGS`
- Test: `customer-app/app/src/test/kotlin/com/homeservices/customer/ui/settings/SettingsScreenPaparazziTest.kt`

- [ ] **Step 1: Write the SettingsScreen**

```kotlin
package com.homeservices.customer.ui.settings

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
public fun SettingsScreen(
    onLanguageClick: () -> Unit,
    onBack: () -> Unit,
) {
    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        Column(
            modifier = Modifier.fillMaxSize().padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text(
                text = "Settings",
                style = MaterialTheme.typography.headlineMedium,
            )
            Surface(
                shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp),
                color = MaterialTheme.colorScheme.surfaceVariant,
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable(onClick = onLanguageClick),
            ) {
                Text(
                    text = "Language / भाषा",
                    style = MaterialTheme.typography.titleMedium,
                    modifier = Modifier.padding(16.dp),
                )
            }
        }
    }
}
```

- [ ] **Step 2: Write the LanguageSettingsViewModel**

```kotlin
package com.homeservices.customer.ui.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.customer.domain.locale.GetCurrentLocaleUseCase
import com.homeservices.customer.domain.locale.SetAppLocaleUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
public class LanguageSettingsViewModel
    @Inject
    constructor(
        private val getCurrentLocale: GetCurrentLocaleUseCase,
        private val setAppLocale: SetAppLocaleUseCase,
    ) : ViewModel() {
        private val _selectedTag = MutableStateFlow("en")
        public val selectedTag: StateFlow<String> = _selectedTag.asStateFlow()

        public val savedFlow: MutableStateFlow<Boolean> = MutableStateFlow(false)

        init {
            viewModelScope.launch {
                _selectedTag.value = getCurrentLocale().first()
            }
        }

        public fun onSelect(tag: String) {
            _selectedTag.value = tag
        }

        public fun onSave() {
            viewModelScope.launch {
                setAppLocale(_selectedTag.value)
                savedFlow.value = true
            }
        }
    }
```

- [ ] **Step 3: Write the LanguageSettingsScreen**

```kotlin
package com.homeservices.customer.ui.settings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.homeservices.customer.R
import com.homeservices.designsystem.locale.DefaultLanguageOptions
import com.homeservices.designsystem.locale.LanguagePickerCard

@Composable
public fun LanguageSettingsScreen(
    onSaved: () -> Unit,
    viewModel: LanguageSettingsViewModel = hiltViewModel(),
) {
    val selected by viewModel.selectedTag.collectAsStateWithLifecycle()
    val saved by viewModel.savedFlow.collectAsStateWithLifecycle()

    if (saved) onSaved()

    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        Column(
            modifier = Modifier.fillMaxSize().padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Text(
                text = stringResource(R.string.settings_language_title),
                style = MaterialTheme.typography.headlineSmall,
            )
            LanguagePickerCard(
                options = DefaultLanguageOptions,
                selectedTag = selected,
                onSelect = viewModel::onSelect,
            )
            Button(onClick = viewModel::onSave, modifier = Modifier.fillMaxWidth()) {
                Text(text = stringResource(R.string.settings_language_save))
            }
        }
    }
}
```

- [ ] **Step 4: Add the new strings**

Append to `customer-app/app/src/main/res/values/strings.xml` (before `</resources>`):

```xml
    <!-- Settings -->
    <string name="settings_title">Settings</string>
    <string name="settings_language">Language</string>
    <string name="settings_language_title">Choose language</string>
    <string name="settings_language_save">Save</string>
```

(`values-hi/strings.xml` will receive Hindi translations of these in WS-D2 / Task 14.)

- [ ] **Step 5: Write SettingsGraph**

`customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/SettingsGraph.kt`:

```kotlin
package com.homeservices.customer.navigation

import androidx.navigation.NavController
import androidx.navigation.NavGraphBuilder
import androidx.navigation.compose.composable
import com.homeservices.customer.ui.settings.LanguageSettingsScreen
import com.homeservices.customer.ui.settings.SettingsScreen

internal fun NavGraphBuilder.settingsGraph(navController: NavController) {
    composable(LocaleRoutes.SETTINGS) {
        SettingsScreen(
            onLanguageClick = { navController.navigate(LocaleRoutes.LANGUAGE_SETTINGS) },
            onBack = { navController.popBackStack() },
        )
    }
    composable(LocaleRoutes.LANGUAGE_SETTINGS) {
        LanguageSettingsScreen(
            onSaved = { navController.popBackStack() },
        )
    }
}
```

- [ ] **Step 6: Add Settings entry-point button to CatalogueHomeScreen top bar**

Open `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/catalogue/CatalogueHomeScreen.kt`. Locate the row that renders the page title (around line 80-90). Add a trailing IconButton:

```kotlin
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.IconButton
import androidx.compose.material3.Icon
```

Wrap the title in a `Row` with a trailing `IconButton(onClick = onSettingsClick) { Icon(Icons.Default.Settings, contentDescription = stringResource(R.string.settings_title)) }`.

Add an `onSettingsClick: () -> Unit` parameter to `CatalogueHomeScreen` and thread it through from `MainGraph.kt`'s `composable(CatalogueRoutes.HOME)` to `navController.navigate(LocaleRoutes.SETTINGS)`.

- [ ] **Step 7: Wire SettingsGraph into AppNavigation NavHost**

In `AppNavigation.kt` NavHost block, ensure `settingsGraph(navController)` is called. (Already added stubbed in Task 11 step 3.)

- [ ] **Step 8: Write SettingsScreen Paparazzi test**

`customer-app/app/src/test/kotlin/com/homeservices/customer/ui/settings/SettingsScreenPaparazziTest.kt`:

```kotlin
package com.homeservices.customer.ui.settings

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Rule
import org.junit.Test

public class SettingsScreenPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi = Paparazzi(
        deviceConfig = DeviceConfig.PIXEL_5,
        theme = "android:Theme.Material3.DayNight.NoActionBar",
    )

    @Test
    public fun settings_light() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                SettingsScreen(onLanguageClick = {}, onBack = {})
            }
        }
    }

    @Test
    public fun settings_dark() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = true) {
                SettingsScreen(onLanguageClick = {}, onBack = {})
            }
        }
    }
}
```

- [ ] **Step 9: Verify smoke**

```bash
cd customer-app && ./gradlew :app:assembleDebug --quiet
```
Expected: BUILD SUCCESSFUL.

- [ ] **Step 10: Commit**

```bash
git add customer-app/app/src/main/kotlin/com/homeservices/customer/ui/settings customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/SettingsGraph.kt customer-app/app/src/main/res/values/strings.xml customer-app/app/src/main/kotlin/com/homeservices/customer/ui/catalogue/CatalogueHomeScreen.kt customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/MainGraph.kt customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/AppNavigation.kt customer-app/app/src/test/kotlin/com/homeservices/customer/ui/settings
git commit -m "feat(E12-S02 customer): settings screen + language settings + entry from catalogue home"
```


### Task 14: Customer-app — add 15 missing Hindi strings to values-hi/strings.xml + 4 settings strings `[customer]`

**Files:**
- Modify: `customer-app/app/src/main/res/values-hi/strings.xml`

The 15 strings missing from values-hi (verified on 2026-05-02 via `diff`): `app_name`, `slot_picker_next`, `slot_picker_title`, `trust_dossier_assigning`, `trust_dossier_badge_aadhaar`, `trust_dossier_badge_police`, `trust_dossier_certifications_label`, `trust_dossier_error`, `trust_dossier_jobs`, `trust_dossier_languages_label`, `trust_dossier_loading`, `trust_dossier_promise`, `trust_dossier_reviews_label`, `trust_dossier_trained_by`, `trust_dossier_years`. Plus 4 new settings strings from Task 12 step 4.

- [ ] **Step 1: Append the 19 strings to values-hi/strings.xml**

Insert before `</resources>`:

```xml
    <string name="app_name">होमसर्विसेज ग्राहक</string>

    <!-- Slot picker -->
    <string name="slot_picker_title">तारीख और समय चुनें</string>
    <string name="slot_picker_next">आगे</string>

    <!-- Trust dossier — Aadhaar/Police badges, certifications, languages, reviews -->
    <string name="trust_dossier_assigning">आपके स्लॉट के लिए जल्द ही तकनीशियन असाइन किया जाएगा।</string>
    <string name="trust_dossier_badge_aadhaar">आधार सत्यापित</string>
    <string name="trust_dossier_badge_police">पुलिस वेरिफिकेशन पूरा</string>
    <string name="trust_dossier_certifications_label">प्रमाणपत्र</string>
    <string name="trust_dossier_error">तकनीशियन प्रोफाइल लोड नहीं हो सका।</string>
    <string name="trust_dossier_jobs">%d जॉब</string>
    <string name="trust_dossier_languages_label">भाषाएं</string>
    <string name="trust_dossier_loading">तकनीशियन प्रोफाइल लोड हो रही है...</string>
    <string name="trust_dossier_promise">हमारे सभी तकनीशियन आधार सत्यापित और पुलिस वेरिफाइड हैं।</string>
    <string name="trust_dossier_reviews_label">हाल के रिव्यू</string>
    <string name="trust_dossier_trained_by">%s द्वारा प्रशिक्षित</string>
    <string name="trust_dossier_years">%d साल अनुभव</string>

    <!-- Settings -->
    <string name="settings_title">सेटिंग्स</string>
    <string name="settings_language">भाषा</string>
    <string name="settings_language_title">भाषा चुनें</string>
    <string name="settings_language_save">सेव करें</string>
```

**Translation notes (preserve in commit message):**
- "पुलिस वेरिफिकेशन पूरा" chosen over "बैकग्राउंड चेक हो चुका" because field testing in rural UP (Codex P2.4) will calibrate this; for now, "पुलिस वेरिफिकेशन" is the more concrete and trust-building phrase.
- "होमसर्विसेज ग्राहक" transliterates the brand placeholder; brand-name lock is a separate Phase 2 task per spec §1.

- [ ] **Step 2: Verify HI/EN string-name parity**

```bash
diff <(grep -oP '<string name="\K[^"]+' customer-app/app/src/main/res/values/strings.xml | sort) <(grep -oP '<string name="\K[^"]+' customer-app/app/src/main/res/values-hi/strings.xml | sort)
```
Expected: empty diff (after Task 12's settings strings are added to both).

- [ ] **Step 3: Run lint to catch missing translation warnings**

```bash
cd customer-app && ./gradlew :app:lintDebug --quiet 2>&1 | grep -i -E "missingtranslation|extratranslation" | head
```
Expected: no `MissingTranslation` or `ExtraTranslation` issues for the strings we added.

- [ ] **Step 4: Commit**

```bash
git add customer-app/app/src/main/res/values-hi/strings.xml
git commit -m "feat(E12-S02 customer): complete Hindi values-hi (15 missing strings + 4 settings strings)"
```


### Task 16: customer-app `HindiLocaleNames` constant + `CatalogueLocalizer` (TDD) `[customer]`

**Files:**
- Create: `customer-app/app/src/main/kotlin/com/homeservices/customer/data/catalogue/HindiLocaleNames.kt`
- Test: `customer-app/app/src/test/kotlin/com/homeservices/customer/domain/catalogue/CatalogueLocalizerTest.kt`
- Create: `customer-app/app/src/main/kotlin/com/homeservices/customer/domain/catalogue/CatalogueLocalizer.kt`

The seed catalogue (`api/src/cosmos/seeds/catalogue.ts` as of commit `aa107d7`) holds **5 active categories** and **13 active services**. The lookup tables below cover all of them. Future catalogue additions must extend these maps; missing entries fall back to the API-returned name.

- [ ] **Step 1: Write `HindiLocaleNames.kt` with both lookup maps**

```kotlin
package com.homeservices.customer.data.catalogue

/**
 * Client-side Hindi name lookup for catalogue entities returned by the API in English.
 *
 * Per umbrella spec §2.2 (2026-05-01): the API stores single-language English names in Cosmos
 * and is intentionally NOT bilingual (zero-cost infra constraint). Customer-app substitutes
 * Hindi names locally when the current locale is `hi`. Missing entries fall back to the
 * API-returned English name — never crash, never empty.
 *
 * Source of truth: api/src/cosmos/seeds/catalogue.ts. Update both maps when adding new categories
 * or services to the catalogue.
 */
public object HindiLocaleNames {
    public val categoryHindiNames: Map<String, String> = mapOf(
        "ac-repair" to "एसी मरम्मत",
        "water-pump" to "वाटर पंप / बोरवेल",
        "plumbing" to "प्लंबिंग",
        "electrical" to "इलेक्ट्रिकल",
        "water-purifier" to "आरओ / वाटर प्यूरीफायर",
    )

    public val serviceHindiNames: Map<String, String> = mapOf(
        "ac-deep-clean" to "एसी डीप क्लीन",
        "ac-gas-refill" to "एसी गैस रीफिल",
        "ac-installation" to "एसी इंस्टॉलेशन",
        "water-pump-repair" to "वाटर पंप मरम्मत",
        "borewell-servicing" to "बोरवेल सर्विसिंग",
        "plumbing-leak-fix" to "लीक मरम्मत",
        "plumbing-tap-install" to "नल / फॉसेट इंस्टॉलेशन",
        "plumbing-pipe-repair" to "पाइप मरम्मत",
        "electrical-fan-install" to "सीलिंग फैन इंस्टॉलेशन",
        "electrical-switchboard-fix" to "स्विचबोर्ड मरम्मत",
        "electrical-wiring" to "नई पॉइंट वायरिंग",
        "ro-installation" to "आरओ इंस्टॉलेशन",
        "ro-service-amc" to "आरओ सर्विस / फिल्टर बदलाव",
    )

    public val serviceShortDescriptionsHindi: Map<String, String> = mapOf(
        "ac-deep-clean" to "केमिकल वॉश, गैस चेक, फिल्टर सफाई — पूरी तरह से ₹599 में।",
        "ac-gas-refill" to "जब कूलिंग कमजोर हो, तब फुल गैस रीचार्ज।",
        "ac-installation" to "तांबे की पाइप के साथ प्रोफेशनल स्प्लिट एसी इंस्टॉलेशन।",
        "water-pump-repair" to "सरफेस + सबमर्सिबल पंप समस्या निवारण और मरम्मत — पूरी तरह से ₹699 में।",
        "borewell-servicing" to "बोरवेल पंप सर्विसिंग और रिप्लेसमेंट।",
        "plumbing-leak-fix" to "लीक का सटीक पता लगाकर रिपेयर।",
        "plumbing-tap-install" to "ब्रांडेड नल / फॉसेट का इंस्टॉलेशन।",
        "plumbing-pipe-repair" to "टूटी या लीक पाइप की मरम्मत।",
        "electrical-fan-install" to "नया सीलिंग फैन इंस्टॉल या रिप्लेसमेंट।",
        "electrical-switchboard-fix" to "स्विचबोर्ड और सॉकेट की मरम्मत।",
        "electrical-wiring" to "नए लाइट / पंखा पॉइंट के लिए वायरिंग।",
        "ro-installation" to "आरओ / वाटर प्यूरीफायर का सेटअप।",
        "ro-service-amc" to "फिल्टर बदलाव और मेंबरेन रिप्लेसमेंट।",
    )
}
```

**Translation notes:**
- Loanwords ("एसी", "स्विचबोर्ड", "इलेक्ट्रिकल", "प्लंबिंग") are deliberate — these are how rural UP customers actually refer to these services per Codex round 1 + Khatabook precedent. A more Sanskritised translation would feel formal and alienating.
- Keep prices in ₹ — Hindi formatting expectation.

- [ ] **Step 2: Write the failing localizer test**

```kotlin
package com.homeservices.customer.domain.catalogue

import com.google.common.truth.Truth.assertThat
import com.homeservices.customer.domain.catalogue.model.AddOn
import com.homeservices.customer.domain.catalogue.model.Category
import com.homeservices.customer.domain.catalogue.model.Service
import org.junit.Test

public class CatalogueLocalizerTest {
    private val localizer = CatalogueLocalizer()

    private val acCategory = Category(
        id = "ac-repair",
        name = "AC Repair",
        imageUrl = "x",
        serviceCount = 3,
    )

    private val acService = Service(
        id = "ac-deep-clean",
        categoryId = "ac-repair",
        name = "AC Deep Clean",
        description = "Chemical wash, gas check.",
        basePrice = 59900,
        durationMinutes = 90,
        imageUrl = "x",
        includes = emptyList(),
        addOns = emptyList<AddOn>(),
    )

    @Test
    public fun `category is left untouched when locale is en`() {
        val result = localizer.localizeCategory(acCategory, locale = "en")
        assertThat(result).isEqualTo(acCategory)
    }

    @Test
    public fun `category name is substituted to Hindi when locale is hi`() {
        val result = localizer.localizeCategory(acCategory, locale = "hi")
        assertThat(result.name).isEqualTo("एसी मरम्मत")
        assertThat(result.id).isEqualTo("ac-repair")
    }

    @Test
    public fun `unknown category id falls back to API name on hi`() {
        val unknown = acCategory.copy(id = "unknown-id", name = "Mystery Service")
        val result = localizer.localizeCategory(unknown, locale = "hi")
        assertThat(result.name).isEqualTo("Mystery Service")
    }

    @Test
    public fun `service name and description are substituted on hi`() {
        val result = localizer.localizeService(acService, locale = "hi")
        assertThat(result.name).isEqualTo("एसी डीप क्लीन")
        assertThat(result.description).isEqualTo("केमिकल वॉश, गैस चेक, फिल्टर सफाई — पूरी तरह से ₹599 में।")
    }

    @Test
    public fun `service is left untouched when locale is en`() {
        val result = localizer.localizeService(acService, locale = "en")
        assertThat(result).isEqualTo(acService)
    }

    @Test
    public fun `service with no Hindi description keeps API description on hi`() {
        val unknown = acService.copy(id = "unknown-svc", name = "X", description = "Original.")
        val result = localizer.localizeService(unknown, locale = "hi")
        assertThat(result.description).isEqualTo("Original.")
        assertThat(result.name).isEqualTo("X")
    }
}
```

- [ ] **Step 3: Run test — must fail unresolved**

```bash
cd customer-app && ./gradlew :app:testDebugUnitTest --tests "*CatalogueLocalizerTest*" --quiet
```
Expected: FAIL — `Unresolved reference: CatalogueLocalizer`.

- [ ] **Step 4: Write the localizer**

```kotlin
package com.homeservices.customer.domain.catalogue

import com.homeservices.customer.data.catalogue.HindiLocaleNames
import com.homeservices.customer.domain.catalogue.model.Category
import com.homeservices.customer.domain.catalogue.model.Service
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class CatalogueLocalizer
    @Inject
    constructor() {
        public fun localizeCategory(category: Category, locale: String): Category =
            if (locale == "hi") {
                val hindiName = HindiLocaleNames.categoryHindiNames[category.id]
                if (hindiName != null) category.copy(name = hindiName) else category
            } else {
                category
            }

        public fun localizeService(service: Service, locale: String): Service =
            if (locale == "hi") {
                val hindiName = HindiLocaleNames.serviceHindiNames[service.id]
                val hindiDesc = HindiLocaleNames.serviceShortDescriptionsHindi[service.id]
                service.copy(
                    name = hindiName ?: service.name,
                    description = hindiDesc ?: service.description,
                )
            } else {
                service
            }
    }
```

- [ ] **Step 5: Run test — must pass**

```bash
cd customer-app && ./gradlew :app:testDebugUnitTest --tests "*CatalogueLocalizerTest*" --quiet
```
Expected: PASS — 6 tests.

- [ ] **Step 6: Commit**

```bash
git add customer-app/app/src/main/kotlin/com/homeservices/customer/data/catalogue/HindiLocaleNames.kt customer-app/app/src/main/kotlin/com/homeservices/customer/domain/catalogue/CatalogueLocalizer.kt customer-app/app/src/test/kotlin/com/homeservices/customer/domain/catalogue/CatalogueLocalizerTest.kt
git commit -m "feat(E12-S02 customer): add HindiLocaleNames + CatalogueLocalizer for client-side name lookup"
```

---

### Task 17: customer-app — wire `CatalogueLocalizer` into the 3 catalogue ViewModels `[customer]`

**Files:**
- Modify: `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/catalogue/CatalogueHomeViewModel.kt`
- Modify: `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/catalogue/ServiceListViewModel.kt`
- Modify: `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/catalogue/ServiceDetailViewModel.kt`
- Add tests for each (follow existing test patterns; if a ViewModel test does not exist yet, add one per the Hilt-pattern guide).

For each ViewModel:
1. Inject `CatalogueLocalizer` and `GetCurrentLocaleUseCase` in the constructor (`@Inject`).
2. In the flow that emits domain models, `combine` the repo flow with `getCurrentLocale()` and apply `localizer.localizeCategory(...)` or `localizer.localizeService(...)` per item.

- [ ] **Step 1: Modify `CatalogueHomeViewModel.kt`**

Read the existing file. Locate the `init { viewModelScope.launch { ... } }` block (or wherever it collects from `getCategoriesUseCase`). Wrap with `combine`:

```kotlin
import kotlinx.coroutines.flow.combine
// ... constructor adds:
//   private val localizer: CatalogueLocalizer,
//   private val getCurrentLocale: GetCurrentLocaleUseCase,

// in init:
viewModelScope.launch {
    combine(
        getCategoriesUseCase(),
        getCurrentLocale(),
    ) { result, locale ->
        result.map { categories -> categories.map { localizer.localizeCategory(it, locale) } }
    }.collect { /* existing emission code, unchanged */ }
}
```

The exact shape depends on the existing ViewModel — preserve the current `_uiState` machinery, only inject the localizer mapping into the success path.

- [ ] **Step 2: Modify `ServiceListViewModel.kt`** — same pattern, but call `localizer.localizeService(it, locale)` over the services list, AND also `localizeCategory` if the screen exposes the category name (typically yes — see `ServiceListScreen.kt`).

- [ ] **Step 3: Modify `ServiceDetailViewModel.kt`** — same pattern but `localizeService` on the single service.

- [ ] **Step 4: Run all catalogue tests**

```bash
cd customer-app && ./gradlew :app:testDebugUnitTest --tests "*Catalogue*" --tests "*ServiceDetail*" --tests "*ServiceList*" --quiet
```
Expected: PASS. If existing tests rely on a fixed ViewModel constructor signature, update them to inject the localizer + use case (typically via `mockk()` returning an `en` flow so behavior is unchanged from prior tests).

- [ ] **Step 5: Smoke**

```bash
cd customer-app && ./gradlew :app:assembleDebug --quiet
```
Expected: BUILD SUCCESSFUL.

- [ ] **Step 6: Commit**

```bash
git add customer-app/app/src/main/kotlin/com/homeservices/customer/ui/catalogue customer-app/app/src/test/kotlin/com/homeservices/customer/ui/catalogue
git commit -m "feat(E12-S02 customer): catalogue ViewModels apply Hindi name substitution via CatalogueLocalizer"
```

---

### Task 18: Integration smoke — full pre-Codex smoke gate `[shared]`

- [ ] **Step 1: Run the smoke scripts**

```bash
bash tools/pre-codex-smoke.sh customer-app
bash tools/pre-codex-smoke.sh technician-app
```

The customer-app smoke is the primary gate for S02a. The technician-app smoke is a "no-regression" check — S02a does not change technician source, but it does push a new entry into `technician-app/gradle/libs.versions.toml`. We re-run technician smoke to catch any unexpected interaction. Each script runs `assembleDebug`, `ktlintCheck`, `testDebugUnitTest`, `koverVerify`; all must succeed.

- [ ] **Step 2: If `ktlintCheck` fails on the customer-app diff (and only the diff)**

```bash
cd customer-app && ./gradlew :app:ktlintFormat --quiet
```
Re-run smoke. If `ktlintFormat` produces changes, commit them with: `chore(E12-S02a): ktlint autofix on customer-app diff`.

Do NOT run `ktlintFormat` on technician-app — there is no S02a diff there to format.

- [ ] **Step 3: If `koverVerify` fails (coverage <80%)**

Investigate `customer-app/app/build/reports/kover/kover-report.xml`. The locale repo, use cases, and CatalogueLocalizer should already be ≥95% covered. If a ViewModel slips, add a JVM unit test that exercises the missing branch.

- [ ] **Step 4: Verify customer-app locale tests run**

```bash
cd customer-app && ./gradlew :app:testDebugUnitTest --tests "*locale*" --tests "*Locale*" --tests "*Settings*" --tests "*Localizer*"
```
Expected: locale + settings + localizer tests appear in test output (≥10 tests).

---

### Task 19: Paparazzi golden re-record on CI Linux `[customer + design-system]`

**Critical:** Adding the AppCompat dep + customer-app theme migration WILL shift Compose rendering microscopically across customer-app's existing screens (~30 of them). The fix path is on CI Linux only (per `docs/patterns/paparazzi-cross-os-goldens.md`). Never record on Windows. technician-app is NOT touched in S02a, so its goldens should stay clean — if they flag, investigate before re-recording.

- [ ] **Step 1: Verify no local goldens were created accidentally**

```bash
git status customer-app/app/src/test/snapshots/ design-system/src/test/snapshots/
```

If any files appear as modified or untracked, delete them (only the locally-generated ones):

```bash
git restore --source=HEAD --staged --worktree customer-app/app/src/test/snapshots/ 2>/dev/null || true
git clean -fd customer-app/app/src/test/snapshots/ design-system/src/test/snapshots/
```

**WARNING (per memory `feedback_paparazzi_golden_cleanup.md`):** Do NOT delete goldens that already exist on `main` for screens we did NOT change. Only delete files that `git status` shows as locally generated (untracked or modified) — never delete files that were tracked on the base branch unless we are explicitly invalidating them.

- [ ] **Step 2: Push branch**

```bash
git push -u origin feature/E12-S02a-hindi-android-customer
```

- [ ] **Step 3: Trigger paparazzi-record.yml workflow_dispatch on CI for customer-app + design-system**

```bash
gh workflow run paparazzi-record.yml -f app=customer-app -f branch=feature/E12-S02a-hindi-android-customer
gh workflow run paparazzi-record.yml -f app=design-system -f branch=feature/E12-S02a-hindi-android-customer
```

Inspect the workflow's actual `inputs` schema if names differ (`gh workflow view paparazzi-record.yml`). Wait for each run to complete and commit goldens back to the branch.

Do NOT trigger the workflow for technician-app — S02a does not change tech-app rendering. (S02b's plan handles tech-app re-record.)

- [ ] **Step 4: Pull the CI golden commits locally**

```bash
git pull --rebase
```

- [ ] **Step 5: Verify locally**

```bash
cd customer-app && ./gradlew verifyPaparazziDebug --quiet
cd ../design-system && ./gradlew verifyPaparazziDebug --quiet
cd ../technician-app && ./gradlew verifyPaparazziDebug --quiet
```
Expected: all three BUILD SUCCESSFUL with no image mismatches. (technician-app verify confirms no rendering drift bled into it.)

- [ ] **Step 6: If technician-app verifyPaparazziDebug fails**

This is unexpected for S02a. Stop. Either: (a) some shared dependency change is bleeding into tech-app rendering — investigate the diff; (b) tech-app's existing goldens were stale on main — out of S02a scope; flag in PR description and consider re-recording on CI as part of S02a only if the diff is genuinely caused by S02a's changes.

- [ ] **Step 7: If customer-app verifyPaparazziDebug shows mismatches on screens NOT touched by E12-S02a**

This is the AppCompat-theme-migration cascade — expected. Trigger the record workflow again — the workflow should re-record everything that drifted. Re-pull and re-verify.

---

### Task 20: Codex review + acceptance `[shared]`

- [ ] **Step 1: Run Codex review**

```bash
codex review --base main
```

- [ ] **Step 2: Address P1/P2 findings (if any)**

For each finding, fix the underlying issue, re-run smoke + Paparazzi verify, and commit. Do not write `.codex-review-passed` until Codex returns clean (no P1, no P2).

- [ ] **Step 3: Run `/security-review` if Codex flags any auth/storage concern**

The locale repo touches DataStore (non-sensitive); the trigger condition is auth/payment/dispatch/PII. Skip by default unless Codex flags.

- [ ] **Step 4: Write the marker and commit**

```bash
echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) E12-S02a hindi-android-customer codex-clean" > .codex-review-passed
git add .codex-review-passed
git commit -m "chore(E12-S02a): Codex review passed — customer-app locale repo + first-launch picker + values-hi + catalogue Hindi names"
git push
```

- [ ] **Step 5: Open PR**

```bash
gh pr create --title "feat(E12-S02a): Hindi i18n customer-app — in-app locale toggle + first-launch picker + values-hi + catalogue Hindi names" --body "$(cat <<'EOF'
## Summary
- customer-app ships `AppCompatDelegate.setApplicationLocales()`-based locale switching with first-launch picker (D2 flow)
- Settings → Language entry reachable from catalogue home after first launch
- customer-app values-hi: 15 missing strings completed (74 → 89), full parity with values/
- customer-app catalogue: client-side `serviceId`/`categoryId` → Hindi name lookup (HindiLocaleNames.kt) substituted at ViewModel boundary via CatalogueLocalizer; covers all 5 active categories + 13 active services
- design-system: shared `LanguagePickerCard` Composable with Paparazzi snapshots (en+hi × light+dark)
- AppCompat 1.7.0 mirrored into BOTH apps' `libs.versions.toml` (byte-identical); customer-app consumes it now, technician-app declares it for E12-S02b
- customer-app theme migrated to `Theme.AppCompat.DayNight.NoActionBar`
- Paparazzi goldens re-recorded on CI Linux for customer-app + design-system to absorb theme-migration rendering drift; technician-app goldens unchanged

## Companion
E12-S02b (technician-app Hindi i18n) ships next — see `docs/superpowers/plans/2026-05-02-E12-S02b-hindi-android-technician.md`. Both stories together fulfil umbrella spec §4.2.

## Spec
docs/superpowers/specs/2026-05-01-ayodhya-hindi-pivot-design.md §4.2

## Test plan
- [x] `bash tools/pre-codex-smoke.sh customer-app` (assemble + ktlint + tests + kover ≥80% all green)
- [x] `bash tools/pre-codex-smoke.sh technician-app` (no-regression check; tech-app source unchanged)
- [x] `verifyPaparazziDebug` clean on customer-app + design-system + technician-app (after CI re-record of customer + design-system)
- [x] `codex review --base main` clean
- [ ] Manual: `adb shell pm clear com.homeservices.customer && adb shell am start -n com.homeservices.customer/.MainActivity` on a fresh install — first-launch picker shows; selecting हिन्दी switches all values-hi-backed screens
- [ ] Manual: Settings → Language → switch back to English — Activity recreates with English strings
- [ ] Manual: catalogue home shows "एसी मरम्मत", "वाटर पंप / बोरवेल" etc. when locale is hi
- [ ] Manual: an unknown serviceId (e.g., a future seed addition not in HindiLocaleNames) falls back to API-returned English name without crashing

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 6: Verify CI green and auto-merge per project policy**

```bash
gh pr checks --watch
```

When all checks green, the PR auto-merges (project policy — solo project, no approval gate).

---

## Acceptance criteria

This S02a story is complete when:

1. **customer-app cold-starts to a first-launch language picker** on a fresh install. Selecting either option proceeds to the auth flow with the correct locale already applied.
2. **Persisted locale survives app kill + reopen** — re-opening customer-app skips the picker and goes straight to the auth/main flow in the previously-selected language.
3. **Settings → Language toggle** on customer-app recreates the Activity in the new locale within 200 ms.
4. **customer-app values-hi/strings.xml has parity** with values/strings.xml: empty `diff` of `<string name=` lists.
5. **customer-app catalogue screens** (`CatalogueHomeScreen`, `ServiceListScreen`, `ServiceDetailScreen`) render Hindi category and service names when locale is `hi`, falling back to API names for unknown ids.
6. **`bash tools/pre-codex-smoke.sh customer-app`** exits 0; **`bash tools/pre-codex-smoke.sh technician-app`** also exits 0 (no-regression).
7. **`./gradlew verifyPaparazziDebug`** clean on customer-app, technician-app, and design-system.
8. **`codex review --base main`** returns no P1/P2 findings; `.codex-review-passed` is committed.
9. **CI green on PR**, auto-merge succeeds.
10. **`customer-app/gradle/libs.versions.toml`** and **`technician-app/gradle/libs.versions.toml`** are byte-identical (Task 1's appcompat entry mirrored).
11. **technician-app Hindi i18n is OUT OF SCOPE here** — the companion E12-S02b plan ships it. Do not modify any technician-app source/themes/strings/manifest in this story (the only tech-app file touched is `technician-app/gradle/libs.versions.toml` for the byte-identity mirror).

---

## Out of scope (per umbrella spec §6)

- Awadhi or other regional dialects beyond Hindi
- RTL layout (Devanagari is LTR)
- Server-side i18n / bilingual API responses
- iOS app
- admin-web `next-intl` install (deferred to E12-S03 Phase 2)
- Tech recruitment automation (E13-S01)
- ADR-0011 errata correction (separate one-line PR)
- Migrating existing 37+ stories' Bengaluru-tinged copy beyond what E12-S01 already touched
- Hindi field-test write-up (`docs/launch-readiness/hindi-field-test-2026-XX.md`) — E10-S04 launch-readiness AC, separate work
