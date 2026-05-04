# E12-S02b — Hindi i18n Android (technician-app) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Story split note:** This plan is the technician-app half of the E12-S02 Hindi i18n split (per umbrella spec §4.2). The customer-app + design-system + shared-TOML half lives in `2026-05-02-E12-S02a-hindi-android-customer.md` and **must ship before** this plan starts — S02b consumes the appcompat library entry already mirrored into `technician-app/gradle/libs.versions.toml` by S02a Task 1, and consumes the shared `LanguagePickerCard` Composable already added to `design-system/` by S02a Task 10.

**Goal:** technician-app ships in-app Hindi/English language switching via `AppCompatDelegate.setApplicationLocales()`, a first-launch language picker (D2 flow), Settings → Language entry reachable from the earnings dashboard, and a complete `values-hi/strings.xml` with all 31 existing strings + 4 settings strings translated.

**Architecture:** Mirror of customer-app's locale stack from S02a — `LocaleRepository` interface (domain), `LocaleRepositoryImpl` (DataStore Preferences-backed), three use cases (`SetAppLocaleUseCase`, `GetCurrentLocaleUseCase`, `IsFirstLaunchUseCase`), Hilt `LocaleModule`, AndroidManifest `AppLocalesMetadataHolderService` registration, Application.onCreate locale apply, AppNavigation start-destination gating on `firstLaunchPending`, FirstLaunchLanguageScreen + Settings nav graph. The shared `com.homeservices.designsystem.locale.LanguagePickerCard` (added in S02a Task 10) is consumed directly. technician-app has no catalogue rendering, so there is no equivalent of S02a's `HindiLocaleNames.kt` / `CatalogueLocalizer.kt`.

**Tech Stack:** Kotlin 2.0.21, Jetpack Compose (BOM 2024.11.00), Hilt 2.52, AndroidX AppCompat 1.7.0 (consumed via S02a's TOML mirror — already declared, just add `implementation(libs.androidx.appcompat)` to `technician-app/app/build.gradle.kts`), AndroidX DataStore Preferences 1.1.1, Material3, Paparazzi 1.3.5, JUnit 5 + MockK + Robolectric, ktlint + detekt + Kover (≥80%).

**Pattern library reads required (BEFORE writing any code):**
- `docs/patterns/paparazzi-cross-os-goldens.md` — Hindi snapshot variants must be recorded on CI Linux, never Windows
- `docs/patterns/hilt-module-android-test-scope.md` — new `LocaleModule` + DataStore qualifier; pick correct test type (Robolectric for repo, JVM unit for use cases)
- `docs/patterns/kotlin-explicit-api-public-modifier.md` — every new `public class`/`fun`/`object` MUST carry `public`; `-Xexplicit-api=strict` is enforced

**Non-negotiables across all tasks:**
- TDD: failing test committed in same step as the production code; `pre-codex-smoke.sh` is the gate
- `customer-app/gradle/libs.versions.toml` and `technician-app/gradle/libs.versions.toml` MUST stay byte-identical — this story does NOT modify the TOMLs (S02a already did the mirror).
- Paparazzi goldens NEVER recorded on Windows. Re-record runs on CI Linux via `paparazzi-record.yml workflow_dispatch` after the diff is pushed (Task 9).
- `ktlintFormat` only when smoke gate flags real ktlint violations on the diff — never speculatively.
- This story's theme migration WILL cascade ~30 unrelated technician-app Paparazzi goldens into image-mismatch state. Account for this in Task 9.

**Pre-flight check before starting:**
```bash
git checkout main && git pull
# S02a must be merged into main:
git log --oneline -5 | grep -i "E12-S02a" || echo "STOP — E12-S02a not merged yet"
# Verify TOML byte-identity:
diff customer-app/gradle/libs.versions.toml technician-app/gradle/libs.versions.toml
# Expected: empty
# Verify shared LanguagePickerCard exists:
ls design-system/src/main/kotlin/com/homeservices/designsystem/locale/LanguagePickerCard.kt
# Expected: file exists
```

---

## File Structure

### Files created — technician-app

| Path | Responsibility |
|---|---|
| `technician-app/app/src/main/kotlin/com/homeservices/technician/domain/locale/LocaleRepository.kt` | Interface: `currentLocale: Flow<String>`, `firstLaunchPending: Flow<Boolean>`, `suspend setLocale(tag: String)`, `suspend markFirstLaunchCompleted()`. |
| `technician-app/app/src/main/kotlin/com/homeservices/technician/data/locale/LocaleRepositoryImpl.kt` | DataStore-backed impl. |
| `technician-app/app/src/main/kotlin/com/homeservices/technician/data/locale/di/LocaleModule.kt` | Hilt @Module — provides DataStore + binds repo. |
| `technician-app/app/src/main/kotlin/com/homeservices/technician/data/locale/di/LocalePrefs.kt` | `@Qualifier` for `DataStore<Preferences>` named `locale_prefs`. |
| `technician-app/app/src/main/kotlin/com/homeservices/technician/domain/locale/SetAppLocaleUseCase.kt` | Calls `AppCompatDelegate.setApplicationLocales(LocaleListCompat.forLanguageTags(tag))` then `repo.setLocale(tag)` then `repo.markFirstLaunchCompleted()`. |
| `technician-app/app/src/main/kotlin/com/homeservices/technician/domain/locale/GetCurrentLocaleUseCase.kt` | Returns `Flow<String>` from repo. |
| `technician-app/app/src/main/kotlin/com/homeservices/technician/domain/locale/IsFirstLaunchUseCase.kt` | Returns `Flow<Boolean>` from repo. |
| `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/locale/FirstLaunchLanguageScreen.kt` | First-run screen wrapping `LanguagePickerCard` + Continue CTA. |
| `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/locale/FirstLaunchLanguageViewModel.kt` | Holds selected locale, calls `SetAppLocaleUseCase` on confirm. |
| `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/settings/SettingsScreen.kt` | Single-row list ("Language"); opens language picker route. |
| `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/settings/LanguageSettingsScreen.kt` | Wraps `LanguagePickerCard` with a save action. |
| `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/settings/LanguageSettingsViewModel.kt` | Same pattern as FirstLaunchLanguageViewModel; no first-launch flag flip. |
| `technician-app/app/src/main/kotlin/com/homeservices/technician/navigation/SettingsGraph.kt` | Routes `LocaleRoutes.SETTINGS` and `LocaleRoutes.LANGUAGE_SETTINGS`. Also defines `LocaleRoutes` constants object. |
| `technician-app/app/src/main/res/values-hi/strings.xml` | NEW; 31 existing strings + 4 settings strings = 35 entries. |
| `technician-app/app/src/test/kotlin/com/homeservices/technician/data/locale/LocaleRepositoryImplTest.kt` | Robolectric — DataStore round-trip. |
| `technician-app/app/src/test/kotlin/com/homeservices/technician/domain/locale/SetAppLocaleUseCaseTest.kt` | JVM unit. |
| `technician-app/app/src/test/kotlin/com/homeservices/technician/domain/locale/IsFirstLaunchUseCaseTest.kt` | JVM unit. |
| `technician-app/app/src/test/kotlin/com/homeservices/technician/domain/locale/GetCurrentLocaleUseCaseTest.kt` | JVM unit. |
| `technician-app/app/src/test/kotlin/com/homeservices/technician/ui/locale/FirstLaunchLanguageScreenPaparazziTest.kt` | Paparazzi (4 goldens, recorded on CI). |
| `technician-app/app/src/test/kotlin/com/homeservices/technician/ui/settings/SettingsScreenPaparazziTest.kt` | Paparazzi (2 goldens). |

### Files modified

| Path | Reason |
|---|---|
| `technician-app/app/build.gradle.kts` | Add `implementation(libs.androidx.appcompat)` (TOML entry already exists from S02a). |
| `technician-app/app/src/main/res/values/themes.xml` | Parent → `Theme.AppCompat.DayNight.NoActionBar`. |
| `technician-app/app/src/main/AndroidManifest.xml` | Add `<service android:name="androidx.appcompat.app.AppLocalesMetadataHolderService"…>` with `autoStoreLocales` meta-data. |
| `technician-app/app/src/main/kotlin/com/homeservices/technician/HomeservicesTechnicianApplication.kt` | `onCreate()` reads cached locale and calls `AppCompatDelegate.setApplicationLocales()` before any Activity starts. |
| `technician-app/app/src/main/kotlin/com/homeservices/technician/navigation/AppNavigation.kt` | Inject + observe `IsFirstLaunchUseCase`; gate start destination on first-launch state. Add `composable(LocaleRoutes.FIRST_LAUNCH)`. Wire `settingsGraph(navController)`. |
| `technician-app/app/src/main/kotlin/com/homeservices/technician/MainActivity.kt` | Inject `IsFirstLaunchUseCase`; pass to `AppNavigation`. |
| `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/earnings/EarningsScreen.kt` | Add Settings icon button (or row entry) that calls a new `onSettings: () -> Unit` callback. |
| `technician-app/app/src/main/kotlin/com/homeservices/technician/navigation/HomeGraph.kt` | Pass `onSettings = { navController.navigate(LocaleRoutes.SETTINGS) }` to EarningsScreen. |
| `technician-app/app/src/main/res/values/strings.xml` | + 4 settings strings (English source). |
| `technician-app/app/src/test/kotlin/com/homeservices/technician/HiltWiringTest.kt` | Assert `LocaleRepository` is wired (if HiltWiringTest exists; create following customer-app's pattern if not). |
| Paparazzi goldens (technician-app) | Re-record on CI Linux after theme migration. |

---

## Work-stream order

```
WS-A: dep + theme (Tasks 1–2)
WS-B: locale repo + use cases (Tasks 3–5; subagent fan-out per use case)
WS-C: Hilt + manifest + Application.onCreate (Task 6)
WS-D: UI + Navigation (Task 7)
WS-D2: values-hi creation (Task 8; independent — can dispatch alongside any other stream)
WS-E: smoke + Paparazzi re-record + Codex (Task 9)
```

---

## Tasks

### Task 1: Add `androidx.appcompat` implementation dep to technician-app

**Files:**
- Modify: `technician-app/app/build.gradle.kts`

The TOML entry was already added by E12-S02a Task 1 — verify before adding the implementation line.

- [ ] **Step 1: Confirm TOML entry exists**

```bash
grep -n "androidx-appcompat" technician-app/gradle/libs.versions.toml
```
Expected: shows both the version and library entries.

- [ ] **Step 2: Add dep to technician-app/app/build.gradle.kts**

Inside the `dependencies { … }` block, immediately after `implementation(libs.androidx.core.ktx)`:

```kotlin
    implementation(libs.androidx.appcompat)
```

- [ ] **Step 3: Verify build**

```bash
cd technician-app && ./gradlew :app:dependencies --configuration debugRuntimeClasspath --quiet | grep -i appcompat
```
Expected: shows `androidx.appcompat:appcompat:1.7.0`.

- [ ] **Step 4: Commit**

```bash
git add technician-app/app/build.gradle.kts
git commit -m "feat(E12-S02b): wire androidx.appcompat into technician-app"
```

---

### Task 2: Migrate technician-app theme to AppCompat parent

**Files:**
- Modify: `technician-app/app/src/main/res/values/themes.xml`

**Why:** `AppCompatDelegate.setApplicationLocales()` requires the activity's theme to descend from a `Theme.AppCompat.*` parent so the `LayoutInflater` re-applies the locale on Activity recreation.

**Paparazzi cascade warning:** This change shifts Compose rendering microscopically; technician-app's existing Paparazzi goldens (~25-30 of them) will need re-recording on CI in Task 9.

- [ ] **Step 1: Replace technician-app/app/src/main/res/values/themes.xml**

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources xmlns:tools="http://schemas.android.com/tools">
    <style name="Theme.HomeservicesTechnician" parent="Theme.AppCompat.DayNight.NoActionBar">
        <item name="android:statusBarColor">@android:color/transparent</item>
        <item name="android:windowLightStatusBar" tools:targetApi="m">true</item>
    </style>
</resources>
```

- [ ] **Step 2: Verify assemble**

```bash
cd technician-app && ./gradlew :app:assembleDebug --quiet
```
Expected: BUILD SUCCESSFUL.

- [ ] **Step 3: Commit**

```bash
git add technician-app/app/src/main/res/values/themes.xml
git commit -m "feat(E12-S02b): migrate technician-app theme to Theme.AppCompat.DayNight parent"
```

---

### Task 3: technician-app `LocaleRepository` interface + `LocalePrefs` qualifier

**Files:**
- Create: `technician-app/app/src/main/kotlin/com/homeservices/technician/domain/locale/LocaleRepository.kt`
- Create: `technician-app/app/src/main/kotlin/com/homeservices/technician/data/locale/di/LocalePrefs.kt`

- [ ] **Step 1: Write the interface**

```kotlin
package com.homeservices.technician.domain.locale

import kotlinx.coroutines.flow.Flow

public interface LocaleRepository {
    public val currentLocale: Flow<String>

    public val firstLaunchPending: Flow<Boolean>

    public suspend fun setLocale(tag: String)

    public suspend fun markFirstLaunchCompleted()
}
```

- [ ] **Step 2: Write the qualifier**

```kotlin
package com.homeservices.technician.data.locale.di

import javax.inject.Qualifier

@Qualifier
@Retention(AnnotationRetention.BINARY)
public annotation class LocalePrefs
```

- [ ] **Step 3: Verify compile**

```bash
cd technician-app && ./gradlew :app:compileDebugKotlin --quiet
```
Expected: BUILD SUCCESSFUL.

- [ ] **Step 4: Commit**

```bash
git add technician-app/app/src/main/kotlin/com/homeservices/technician/domain/locale technician-app/app/src/main/kotlin/com/homeservices/technician/data/locale/di
git commit -m "feat(E12-S02b): add LocaleRepository interface + LocalePrefs qualifier"
```

---

### Task 4: technician-app `LocaleRepositoryImpl` (TDD)

**Files:**
- Test: `technician-app/app/src/test/kotlin/com/homeservices/technician/data/locale/LocaleRepositoryImplTest.kt`
- Create: `technician-app/app/src/main/kotlin/com/homeservices/technician/data/locale/LocaleRepositoryImpl.kt`

- [ ] **Step 1: Write the failing repo test**

```kotlin
package com.homeservices.technician.data.locale

import androidx.datastore.preferences.core.PreferenceDataStoreFactory
import com.google.common.truth.Truth.assertThat
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
public class LocaleRepositoryImplTest {
    @get:Rule
    public val tempFolder: TemporaryFolder = TemporaryFolder()

    private lateinit var repo: LocaleRepositoryImpl

    @Before
    public fun setUp() {
        val dataStore = PreferenceDataStoreFactory.create {
            tempFolder.newFolder().resolve("locale_prefs.preferences_pb")
        }
        repo = LocaleRepositoryImpl(dataStore)
    }

    @Test
    public fun `currentLocale defaults to en when nothing is stored`(): Unit = runTest {
        assertThat(repo.currentLocale.first()).isEqualTo("en")
    }

    @Test
    public fun `firstLaunchPending defaults to true when nothing is stored`(): Unit = runTest {
        assertThat(repo.firstLaunchPending.first()).isTrue()
    }

    @Test
    public fun `setLocale persists the tag`(): Unit = runTest {
        repo.setLocale("hi")
        assertThat(repo.currentLocale.first()).isEqualTo("hi")
    }

    @Test
    public fun `markFirstLaunchCompleted flips firstLaunchPending to false`(): Unit = runTest {
        repo.markFirstLaunchCompleted()
        assertThat(repo.firstLaunchPending.first()).isFalse()
    }

    @Test
    public fun `setLocale does not flip firstLaunchPending on its own`(): Unit = runTest {
        repo.setLocale("hi")
        assertThat(repo.firstLaunchPending.first()).isTrue()
    }
}
```

**Note:** `PreferenceDataStoreFactory.create { … }` is the idiomatic preferences-DataStore test API; `DataStoreFactory.create(serializer = PreferencesSerializer)` does NOT compile under explicit-API strict mode. `: Unit` return-type annotations on each `@Test fun ... = runTest { … }` are required by `-Werror -Xexplicit-api=strict` (the `runTest` lambda is generic and the return type must be explicit). Pattern verified during E12-S02a customer-app implementation.

- [ ] **Step 2: Run — must fail unresolved**

```bash
cd technician-app && ./gradlew :app:testDebugUnitTest --tests "*LocaleRepositoryImplTest*" --quiet
```
Expected: FAIL — `Unresolved reference: LocaleRepositoryImpl`.

- [ ] **Step 3: Write the implementation**

```kotlin
package com.homeservices.technician.data.locale

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import com.homeservices.technician.data.locale.di.LocalePrefs
import com.homeservices.technician.domain.locale.LocaleRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class LocaleRepositoryImpl
    @Inject
    constructor(
        @LocalePrefs private val dataStore: DataStore<Preferences>,
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

- [ ] **Step 4: Run — must pass**

```bash
cd technician-app && ./gradlew :app:testDebugUnitTest --tests "*LocaleRepositoryImplTest*" --quiet
```
Expected: PASS — 5 tests.

- [ ] **Step 5: Commit**

```bash
git add technician-app/app/src/main/kotlin/com/homeservices/technician/data/locale/LocaleRepositoryImpl.kt technician-app/app/src/test/kotlin/com/homeservices/technician/data/locale
git commit -m "feat(E12-S02b): add DataStore-backed LocaleRepositoryImpl"
```

---

### Task 5: technician-app three use cases (TDD)

**Files:**
- Test + Create: `technician-app/app/src/test/kotlin/com/homeservices/technician/domain/locale/SetAppLocaleUseCaseTest.kt` + `.../SetAppLocaleUseCase.kt`
- Test + Create: `.../GetCurrentLocaleUseCaseTest.kt` + `.../GetCurrentLocaleUseCase.kt`
- Test + Create: `.../IsFirstLaunchUseCaseTest.kt` + `.../IsFirstLaunchUseCase.kt`

These can be implemented sequentially or fanned out to subagents (they are mutually independent).

- [ ] **Step 1: Write SetAppLocaleUseCaseTest (failing)**

```kotlin
package com.homeservices.technician.domain.locale

import androidx.appcompat.app.AppCompatDelegate
import androidx.core.os.LocaleListCompat
import io.mockk.coVerify
import io.mockk.mockk
import io.mockk.mockkStatic
import io.mockk.unmockkStatic
import io.mockk.verify
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
        useCase("hi")

        verify { AppCompatDelegate.setApplicationLocales(LocaleListCompat.forLanguageTags("hi")) }
        coVerify { repo.setLocale("hi") }
        coVerify { repo.markFirstLaunchCompleted() }
    }
}
```

- [ ] **Step 2: Run — must fail**

```bash
cd technician-app && ./gradlew :app:testDebugUnitTest --tests "*SetAppLocaleUseCaseTest*" --quiet
```
Expected: FAIL.

- [ ] **Step 3: Write SetAppLocaleUseCase**

```kotlin
package com.homeservices.technician.domain.locale

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

- [ ] **Step 4: Write GetCurrentLocaleUseCaseTest + GetCurrentLocaleUseCase**

`GetCurrentLocaleUseCaseTest.kt`:

```kotlin
package com.homeservices.technician.domain.locale

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
        assertThat(GetCurrentLocaleUseCase(repo)().first()).isEqualTo("hi")
    }
}
```

`GetCurrentLocaleUseCase.kt`:

```kotlin
package com.homeservices.technician.domain.locale

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

- [ ] **Step 5: Write IsFirstLaunchUseCaseTest + IsFirstLaunchUseCase**

`IsFirstLaunchUseCaseTest.kt`:

```kotlin
package com.homeservices.technician.domain.locale

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
        assertThat(IsFirstLaunchUseCase(repo)().first()).isTrue()
    }
}
```

`IsFirstLaunchUseCase.kt`:

```kotlin
package com.homeservices.technician.domain.locale

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

- [ ] **Step 6: Run all three use case tests — must pass**

```bash
cd technician-app && ./gradlew :app:testDebugUnitTest --tests "*SetAppLocaleUseCaseTest*" --tests "*GetCurrentLocaleUseCaseTest*" --tests "*IsFirstLaunchUseCaseTest*" --quiet
```
Expected: PASS — 3 tests.

- [ ] **Step 7: Commit**

```bash
git add technician-app/app/src/main/kotlin/com/homeservices/technician/domain/locale technician-app/app/src/test/kotlin/com/homeservices/technician/domain/locale
git commit -m "feat(E12-S02b): add SetAppLocaleUseCase + GetCurrentLocaleUseCase + IsFirstLaunchUseCase"
```

---

### Task 6: technician-app Hilt LocaleModule + AndroidManifest + Application init

**Files:**
- Create: `technician-app/app/src/main/kotlin/com/homeservices/technician/data/locale/di/LocaleModule.kt`
- Modify: `technician-app/app/src/main/AndroidManifest.xml`
- Modify: `technician-app/app/src/main/kotlin/com/homeservices/technician/HomeservicesTechnicianApplication.kt`
- Modify (or create): `technician-app/app/src/test/kotlin/com/homeservices/technician/HiltWiringTest.kt`

- [ ] **Step 1: Write the Hilt module**

```kotlin
package com.homeservices.technician.data.locale.di

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.preferencesDataStore
import com.homeservices.technician.data.locale.LocaleRepositoryImpl
import com.homeservices.technician.domain.locale.LocaleRepository
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

- [ ] **Step 2: Add the AppLocalesMetadataHolderService entry to AndroidManifest.xml**

Inside the `<application>` block of `technician-app/app/src/main/AndroidManifest.xml`, before `</application>`, add:

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

- [ ] **Step 3: Wire `AppCompatDelegate.setApplicationLocales` into `HomeservicesTechnicianApplication.onCreate`**

Open `technician-app/app/src/main/kotlin/com/homeservices/technician/HomeservicesTechnicianApplication.kt`. Read the existing file FIRST and preserve every existing init line (Sentry init, FCM init, etc.). Add ONLY the locale-apply block.

Pattern to add (adapting to whatever existing structure is):

```kotlin
import androidx.appcompat.app.AppCompatDelegate
import androidx.core.os.LocaleListCompat
import com.homeservices.technician.domain.locale.LocaleRepository
import dagger.hilt.EntryPoint
import dagger.hilt.InstallIn
import dagger.hilt.android.EntryPointAccessors
import dagger.hilt.components.SingletonComponent
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

// Inside the class body:

@EntryPoint
@InstallIn(SingletonComponent::class)
public interface LocaleEntryPoint {
    public fun localeRepository(): LocaleRepository
}

// Inside onCreate, AFTER Hilt's super.onCreate() and AFTER Sentry init,
// BEFORE any other init that might launch an Activity:

val entryPoint = EntryPointAccessors.fromApplication(this, LocaleEntryPoint::class.java)
val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
scope.launch {
    val tag = entryPoint.localeRepository().currentLocale.first()
    AppCompatDelegate.setApplicationLocales(LocaleListCompat.forLanguageTags(tag))
}
```

**Note for the implementer:** the existing `HomeservicesTechnicianApplication.kt` has Sentry init, possibly FCM init, possibly other singletons. Read first, preserve all of it.

- [ ] **Step 4: Update HiltWiringTest**

If `technician-app/app/src/test/kotlin/com/homeservices/technician/HiltWiringTest.kt` exists, follow its existing pattern and add:

```kotlin
    @Test
    public fun localeRepository_is_provided() {
        val repo: LocaleRepository = component.localeRepository()
        assertThat(repo).isNotNull()
    }
```

(Add the `localeRepository(): LocaleRepository` method to the test's Hilt entry-point interface, plus `import com.homeservices.technician.domain.locale.LocaleRepository` and `import com.google.common.truth.Truth.assertThat`.)

If HiltWiringTest does not exist in technician-app, create one mirroring `customer-app/app/src/test/kotlin/com/homeservices/customer/HiltWiringTest.kt`.

- [ ] **Step 5: Run smoke + tests**

```bash
cd technician-app && ./gradlew :app:assembleDebug :app:testDebugUnitTest --quiet
```
Expected: BUILD SUCCESSFUL; HiltWiringTest's locale assertion passes.

- [ ] **Step 6: Commit**

```bash
git add technician-app/app/src/main/kotlin/com/homeservices/technician/data/locale/di/LocaleModule.kt technician-app/app/src/main/AndroidManifest.xml technician-app/app/src/main/kotlin/com/homeservices/technician/HomeservicesTechnicianApplication.kt technician-app/app/src/test/kotlin/com/homeservices/technician/HiltWiringTest.kt
git commit -m "feat(E12-S02b): wire LocaleModule Hilt + apply persisted locale in Application.onCreate"
```

---

### Task 7: technician-app FirstLaunchLanguageScreen + SettingsScreen + SettingsGraph + nav gating + earnings entry

**Files:**
- Create: `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/locale/FirstLaunchLanguageViewModel.kt`
- Create: `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/locale/FirstLaunchLanguageScreen.kt`
- Create: `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/settings/SettingsScreen.kt`
- Create: `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/settings/LanguageSettingsScreen.kt`
- Create: `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/settings/LanguageSettingsViewModel.kt`
- Create: `technician-app/app/src/main/kotlin/com/homeservices/technician/navigation/SettingsGraph.kt`
- Modify: `technician-app/app/src/main/kotlin/com/homeservices/technician/navigation/AppNavigation.kt`
- Modify: `technician-app/app/src/main/kotlin/com/homeservices/technician/MainActivity.kt`
- Modify: `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/earnings/EarningsScreen.kt`
- Modify: `technician-app/app/src/main/kotlin/com/homeservices/technician/navigation/HomeGraph.kt`
- Modify: `technician-app/app/src/main/res/values/strings.xml` (+ 4 settings strings)
- Test: `technician-app/app/src/test/kotlin/com/homeservices/technician/ui/locale/FirstLaunchLanguageScreenPaparazziTest.kt`
- Test: `technician-app/app/src/test/kotlin/com/homeservices/technician/ui/settings/SettingsScreenPaparazziTest.kt`

- [ ] **Step 1: Write FirstLaunchLanguageViewModel**

```kotlin
package com.homeservices.technician.ui.locale

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.technician.domain.locale.GetCurrentLocaleUseCase
import com.homeservices.technician.domain.locale.SetAppLocaleUseCase
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

- [ ] **Step 2: Write FirstLaunchLanguageScreen**

```kotlin
package com.homeservices.technician.ui.locale

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

- [ ] **Step 3: Write LanguageSettingsViewModel**

```kotlin
package com.homeservices.technician.ui.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.technician.domain.locale.GetCurrentLocaleUseCase
import com.homeservices.technician.domain.locale.SetAppLocaleUseCase
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

- [ ] **Step 4: Write SettingsScreen + LanguageSettingsScreen**

`technician-app/app/src/main/kotlin/com/homeservices/technician/ui/settings/SettingsScreen.kt`:

```kotlin
package com.homeservices.technician.ui.settings

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
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
                shape = RoundedCornerShape(12.dp),
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

`technician-app/app/src/main/kotlin/com/homeservices/technician/ui/settings/LanguageSettingsScreen.kt`:

```kotlin
package com.homeservices.technician.ui.settings

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
import com.homeservices.designsystem.locale.DefaultLanguageOptions
import com.homeservices.designsystem.locale.LanguagePickerCard
import com.homeservices.technician.R

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

- [ ] **Step 5: Write SettingsGraph**

```kotlin
package com.homeservices.technician.navigation

import androidx.navigation.NavController
import androidx.navigation.NavGraphBuilder
import androidx.navigation.compose.composable
import com.homeservices.technician.ui.settings.LanguageSettingsScreen
import com.homeservices.technician.ui.settings.SettingsScreen

public object LocaleRoutes {
    public const val FIRST_LAUNCH: String = "first_launch_language"
    public const val SETTINGS: String = "settings"
    public const val LANGUAGE_SETTINGS: String = "language_settings"
}

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

- [ ] **Step 6: Add settings strings to values/strings.xml**

Append to `technician-app/app/src/main/res/values/strings.xml` before `</resources>`:

```xml
    <!-- Settings -->
    <string name="settings_title">Settings</string>
    <string name="settings_language">Language</string>
    <string name="settings_language_title">Choose language</string>
    <string name="settings_language_save">Save</string>
```

- [ ] **Step 7: Modify AppNavigation to gate start destination on first-launch**

Open `technician-app/app/src/main/kotlin/com/homeservices/technician/navigation/AppNavigation.kt`. Add `IsFirstLaunchUseCase` parameter, compute startDestination, add `composable(LocaleRoutes.FIRST_LAUNCH) { ... }`, and call `settingsGraph(navController)`.

The pattern (adapted from S02a customer-app):

```kotlin
import androidx.navigation.compose.composable
import com.homeservices.technician.domain.locale.IsFirstLaunchUseCase
import com.homeservices.technician.ui.locale.FirstLaunchLanguageScreen

@Composable
internal fun AppNavigation(
    sessionManager: SessionManager,
    activity: FragmentActivity,
    ratingPromptEventBus: RatingPromptEventBus,
    ratingReceivedEventBus: RatingReceivedEventBus,
    fcmTopicSubscriber: FcmTopicSubscriber,
    isFirstLaunch: IsFirstLaunchUseCase,
    modifier: Modifier = Modifier,
) {
    val navController = rememberNavController()
    val authState by sessionManager.authState.collectAsStateWithLifecycle()
    val firstLaunchPending by isFirstLaunch().collectAsStateWithLifecycle(initialValue = true)

    val startDestination = if (firstLaunchPending) LocaleRoutes.FIRST_LAUNCH else "auth"

    LaunchedEffect(authState, firstLaunchPending) {
        if (firstLaunchPending) return@LaunchedEffect
        // ... preserve existing technician-app auth/onboarding nav logic, only adding
        //     popUpTo(LocaleRoutes.FIRST_LAUNCH) { inclusive = true } in the relevant
        //     navigate { } blocks
    }

    // ... preserve other LaunchedEffect blocks (rating prompt, FCM, etc.) untouched

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
        onboardingGraph(navController)
        homeGraph(navController)
        settingsGraph(navController)
    }
}
```

**Note:** the existing technician-app `AppNavigation.kt` has an `onboardingGraph` and `homeGraph` plus various LaunchedEffect blocks for KYC callback, FCM, rating bus. Read the existing file first and preserve all of them — this task adds locale gating ONLY.

- [ ] **Step 8: Modify MainActivity to inject + pass IsFirstLaunchUseCase**

In `technician-app/app/src/main/kotlin/com/homeservices/technician/MainActivity.kt`, add:

```kotlin
    @Inject public lateinit var isFirstLaunch: com.homeservices.technician.domain.locale.IsFirstLaunchUseCase
```

In the `setContent` block:

```kotlin
            HomeservicesTheme {
                AppNavigation(
                    sessionManager = sessionManager,
                    activity = this,
                    ratingPromptEventBus = ratingPromptEventBus,
                    ratingReceivedEventBus = ratingReceivedEventBus,
                    fcmTopicSubscriber = fcmTopicSubscriber,
                    isFirstLaunch = isFirstLaunch,
                )
            }
```

- [ ] **Step 9: Add Settings entry to EarningsScreen**

Open `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/earnings/EarningsScreen.kt`. Add an `onSettings: () -> Unit` parameter. In the screen body — likely the top bar area — add an `IconButton` with `Icons.Default.Settings`:

```kotlin
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.ui.res.stringResource
import com.homeservices.technician.R

// In the existing top-bar Row (or a new one if EarningsScreen has none):
IconButton(onClick = onSettings) {
    Icon(Icons.Default.Settings, contentDescription = stringResource(R.string.settings_title))
}
```

- [ ] **Step 10: Modify HomeGraph to thread onSettings**

In `technician-app/app/src/main/kotlin/com/homeservices/technician/navigation/HomeGraph.kt`, update the `composable("home_dashboard")` block:

```kotlin
composable("home_dashboard") {
    EarningsScreen(
        onViewRatings = { navController.navigate("ratings_transparency") },
        onPayoutSettings = { navController.navigate("payout_settings") },
        onSettings = { navController.navigate(LocaleRoutes.SETTINGS) },
    )
}
```

- [ ] **Step 11: Write Paparazzi tests**

`technician-app/app/src/test/kotlin/com/homeservices/technician/ui/locale/FirstLaunchLanguageScreenPaparazziTest.kt`:

```kotlin
package com.homeservices.technician.ui.locale

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
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
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

@Composable
private fun StaticFirstLaunchLayout(selectedTag: String) {
    Surface(
        modifier = Modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background,
    ) {
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
                selectedTag = selectedTag,
                onSelect = {},
            )
            Button(onClick = {}, modifier = Modifier.fillMaxWidth()) {
                Text(text = "Continue / जारी रखें")
            }
        }
    }
}
```

`technician-app/app/src/test/kotlin/com/homeservices/technician/ui/settings/SettingsScreenPaparazziTest.kt`:

```kotlin
package com.homeservices.technician.ui.settings

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

- [ ] **Step 12: Verify smoke**

```bash
cd technician-app && ./gradlew :app:assembleDebug --quiet
```
Expected: BUILD SUCCESSFUL.

- [ ] **Step 13: Commit**

```bash
git add technician-app/app/src/main/kotlin/com/homeservices/technician/ui/locale technician-app/app/src/main/kotlin/com/homeservices/technician/ui/settings technician-app/app/src/main/kotlin/com/homeservices/technician/navigation technician-app/app/src/main/kotlin/com/homeservices/technician/MainActivity.kt technician-app/app/src/main/kotlin/com/homeservices/technician/ui/earnings/EarningsScreen.kt technician-app/app/src/main/res/values/strings.xml technician-app/app/src/test/kotlin/com/homeservices/technician/ui/locale technician-app/app/src/test/kotlin/com/homeservices/technician/ui/settings
git commit -m "feat(E12-S02b): first-launch picker + settings screens + nav gating + earnings entry point"
```

---

### Task 8: Create technician-app values-hi/strings.xml

**Files:**
- Create: `technician-app/app/src/main/res/values-hi/strings.xml`

This task is independent of all Kotlin work — it can dispatch alongside any other stream after Task 1.

- [ ] **Step 1: Create the file**

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">होमसर्विसेज तकनीशियन</string>

    <!-- Job offer -->
    <string name="job_offer_accepted">जॉब स्वीकार की गई!</string>
    <string name="job_offer_declined">जॉब अस्वीकार की गई</string>
    <string name="job_offer_expired">जॉब का समय खत्म</string>
    <string name="job_offer_new_request">नई जॉब रिक्वेस्ट</string>
    <string name="job_offer_seconds">सेक</string>
    <string name="job_offer_why_you">आपकी स्किल, दूरी और उपलब्धता के आधार पर मैच की गई।</string>
    <string name="job_offer_address">ग्राहक का पता</string>
    <string name="job_offer_slot">सर्विस स्लॉट</string>
    <string name="job_offer_distance">दूरी</string>
    <string name="job_offer_distance_km">%.1f किमी दूर</string>
    <string name="job_offer_earnings">कमाई</string>
    <string name="job_offer_accept">जॉब स्वीकार करें</string>
    <string name="job_offer_decline">अस्वीकार करें</string>

    <!-- Active job -->
    <string name="active_job_complete_title">जॉब पूरी हुई</string>
    <string name="active_job_complete_body">आपकी पूर्णता दर्ज कर ली गई है। कमाई जल्द ही अपडेट होगी।</string>
    <string name="active_job_error_title">जॉब लोड नहीं हो सकी</string>
    <string name="active_job_address">ग्राहक का पता</string>
    <string name="active_job_slot">सर्विस स्लॉट</string>
    <string name="active_job_progress_title">जॉब प्रगति</string>
    <string name="active_job_offline_sync">ऑफलाइन — कनेक्शन वापस आते ही स्टेटस सिंक होगा</string>
    <string name="active_job_start_trip">यात्रा शुरू करें</string>
    <string name="active_job_mark_arrived">मैं पहुंच गया हूं</string>
    <string name="active_job_start_work">काम शुरू करें</string>
    <string name="active_job_complete_job">जॉब पूरी करें</string>
    <string name="active_job_done">हो गया</string>
    <string name="active_job_status_assigned">असाइन</string>
    <string name="active_job_status_en_route">रास्ते में</string>
    <string name="active_job_status_arrived">पहुंच गए</string>
    <string name="active_job_status_working">काम चल रहा है</string>
    <string name="active_job_status_done">हो गया</string>

    <!-- Settings -->
    <string name="settings_title">सेटिंग्स</string>
    <string name="settings_language">भाषा</string>
    <string name="settings_language_title">भाषा चुनें</string>
    <string name="settings_language_save">सेव करें</string>
</resources>
```

**Translation notes:**
- Loanwords ("जॉब", "स्लॉट", "रिक्वेस्ट") chosen over Sanskritised tatsamas ("कार्य", "अंतराल", "अनुरोध") — gig-economy workers in rural UP use these Roman-Hindi forms in everyday speech (Khatabook/PhonePe convention).
- "%.1f किमी दूर" preserves the format placeholder.
- Field-test calibration (E10-S04 launch-readiness AC per umbrella spec §5.5): ≥3 Ayodhya technicians review these strings before public launch. Edits expected.

- [ ] **Step 2: Verify HI/EN string-name parity**

```bash
diff <(grep -oP '<string name="\K[^"]+' technician-app/app/src/main/res/values/strings.xml | sort) <(grep -oP '<string name="\K[^"]+' technician-app/app/src/main/res/values-hi/strings.xml | sort)
```
Expected: empty diff.

- [ ] **Step 3: Lint**

```bash
cd technician-app && ./gradlew :app:lintDebug --quiet 2>&1 | grep -i -E "missingtranslation|extratranslation" | head
```
Expected: no missing-translation or extra-translation issues.

- [ ] **Step 4: Commit**

```bash
git add technician-app/app/src/main/res/values-hi/strings.xml
git commit -m "feat(E12-S02b): introduce technician-app values-hi strings.xml (31 strings + 4 settings)"
```

---

### Task 9: Pre-Codex smoke + Paparazzi re-record on CI + Codex review + PR

- [ ] **Step 1: Run pre-Codex smoke gate for technician-app**

```bash
bash tools/pre-codex-smoke.sh technician-app
```

Expected: PASSED (assemble + ktlint + tests + kover ≥80% all green).

- [ ] **Step 2: If `ktlintCheck` fails on the diff**

```bash
cd technician-app && ./gradlew :app:ktlintFormat --quiet
```
Re-run smoke. Commit the autofix as `chore(E12-S02b): ktlint autofix on technician-app diff`.

- [ ] **Step 3: Run customer-app smoke as no-regression check**

```bash
bash tools/pre-codex-smoke.sh customer-app
```

Expected: PASSED. Customer-app source is not touched in S02b, but a clean smoke confirms there's no transitive issue from the shared TOML's appcompat entry now that both apps consume it.

- [ ] **Step 4: Verify no Paparazzi goldens were accidentally recorded locally**

```bash
git status technician-app/app/src/test/snapshots/
```

If any files are modified or untracked, restore + clean (only locally generated):

```bash
git restore --source=HEAD --staged --worktree technician-app/app/src/test/snapshots/ 2>/dev/null || true
git clean -fd technician-app/app/src/test/snapshots/
```

**WARNING:** Do NOT delete tracked goldens that exist on `main` for screens we did not change. Only delete what `git status` shows as locally generated.

- [ ] **Step 5: Push branch**

```bash
git push -u origin feature/E12-S02b-hindi-android-technician
```

- [ ] **Step 6: Trigger paparazzi-record.yml workflow_dispatch on CI Linux**

```bash
gh workflow run paparazzi-record.yml -f app=technician-app -f branch=feature/E12-S02b-hindi-android-technician
```

(`design-system` was re-recorded in S02a — no need to record again unless something visible changed there. customer-app is untouched in S02b.)

Wait for the run to complete; CI commits goldens back to the branch.

- [ ] **Step 7: Pull CI commit + verify locally**

```bash
git pull --rebase
cd technician-app && ./gradlew verifyPaparazziDebug --quiet
cd ../customer-app && ./gradlew verifyPaparazziDebug --quiet
cd ../design-system && ./gradlew verifyPaparazziDebug --quiet
```

Expected: all three BUILD SUCCESSFUL with no image mismatches. (customer-app + design-system verify confirms S02b did not bleed any rendering drift into them.)

- [ ] **Step 8: Run Codex review**

```bash
codex review --base main
```

- [ ] **Step 9: Address P1/P2 findings (if any)**

For each finding, fix the underlying issue, re-run smoke + Paparazzi verify, and commit. Do not write `.codex-review-passed` until Codex returns clean.

- [ ] **Step 10: Run `/security-review` only if Codex flags an auth/storage concern**

Locale repo touches DataStore (non-sensitive); skip by default.

- [ ] **Step 11: Write the Codex marker and commit**

```bash
echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) E12-S02b technician-hindi codex-clean" > .codex-review-passed
git add .codex-review-passed
git commit -m "chore(E12-S02b): Codex review passed — technician-app locale repo + first-launch picker + values-hi"
git push
```

- [ ] **Step 12: Open PR**

```bash
gh pr create --title "feat(E12-S02b): Hindi i18n technician-app — locale toggle + first-launch picker + values-hi" --body "$(cat <<'EOF'
## Summary
- technician-app ships `AppCompatDelegate.setApplicationLocales()`-based locale switching with first-launch picker (D2 flow)
- Settings → Language entry reachable from earnings dashboard top bar
- technician-app values-hi: NEW file, 31 existing strings + 4 settings strings translated (loanwords for "जॉब"/"स्लॉट"/"रिक्वेस्ट" per rural-UP convention)
- Consumes the appcompat library entry already mirrored into `technician-app/gradle/libs.versions.toml` by E12-S02a Task 1
- Consumes the shared `LanguagePickerCard` Composable already added to `design-system/` by E12-S02a Task 10
- technician-app theme migrated to `Theme.AppCompat.DayNight.NoActionBar`
- Paparazzi goldens re-recorded on CI Linux for technician-app (~25-30 screens) to absorb theme-migration rendering drift

## Companion
This is the second half of the E12-S02 split. E12-S02a (customer-app + shared) shipped on <fill in commit/PR ref>.

## Spec
docs/superpowers/specs/2026-05-01-ayodhya-hindi-pivot-design.md §4.2

## Test plan
- [x] `bash tools/pre-codex-smoke.sh technician-app` (assemble + ktlint + tests + kover ≥80% all green)
- [x] `bash tools/pre-codex-smoke.sh customer-app` (no-regression check)
- [x] `verifyPaparazziDebug` clean on technician-app, customer-app, design-system
- [x] `codex review --base main` clean
- [ ] Manual: `adb shell pm clear com.homeservices.technician && adb shell am start -n com.homeservices.technician/.MainActivity` — first-launch picker shows; selecting हिन्दी switches all values-hi-backed screens (job offer, active job)
- [ ] Manual: Settings → Language → switch back to English — Activity recreates with English strings
- [ ] Manual: kill + reopen — picker is skipped, locale persists

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 13: Verify CI green and auto-merge**

```bash
gh pr checks --watch
```

When all checks green, the PR auto-merges.

---

## Acceptance criteria

This S02b story is complete when:

1. **technician-app cold-starts to a first-launch language picker** on a fresh install. Selecting either option proceeds to the auth/onboarding flow with the correct locale already applied.
2. **Persisted locale survives app kill + reopen** — re-opening technician-app skips the picker and goes straight to home/auth in the previously-selected language.
3. **Settings → Language toggle** on technician-app recreates the Activity in the new locale within 200 ms; reachable from the earnings dashboard top bar.
4. **technician-app values-hi/strings.xml exists** with parity to values/strings.xml: empty `diff` of `<string name=` lists.
5. **`bash tools/pre-codex-smoke.sh technician-app`** exits 0; **`bash tools/pre-codex-smoke.sh customer-app`** also exits 0 (no-regression).
6. **`./gradlew verifyPaparazziDebug`** clean on technician-app, customer-app, and design-system.
7. **`codex review --base main`** returns no P1/P2 findings; `.codex-review-passed` is committed.
8. **CI green on PR**, auto-merge succeeds.
9. **`customer-app/gradle/libs.versions.toml`** and **`technician-app/gradle/libs.versions.toml`** remain byte-identical (no edits to either in S02b).

---

## Out of scope (per umbrella spec §6)

- Awadhi or other regional dialects beyond Hindi
- RTL layout (Devanagari is LTR)
- Server-side i18n / bilingual API responses
- iOS app
- admin-web `next-intl` install (deferred to E12-S03 Phase 2)
- Tech recruitment automation (E13-S01)
- ADR-0011 errata correction (separate one-line PR)
- Hindi field-test write-up (`docs/launch-readiness/hindi-field-test-2026-XX.md`) — E10-S04 launch-readiness AC, separate work
