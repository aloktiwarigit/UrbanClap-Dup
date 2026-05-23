# W4 — Technician-app Hindi i18n Parity (E12-S03c) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a runtime locale switcher (English ↔ Hindi) to the technician-app Profile tab and replace all ~50 hardcoded English UI literals with string resources backed by `values-hi/strings.xml`.

**Architecture:** Port the customer-app's `data/locale` + `domain/locale` layer verbatim (DataStore persistence, `AppCompatDelegate.setApplicationLocales`, `EntryPoint`-based Application.onCreate apply). The shared `design-system` module already ships `LanguagePickerCard` + `DefaultLanguageOptions` — use them directly. Literal sweep runs as 6 parallel Haiku subagents (one per UI feature dir) writing sidecar XML files; a Sonnet consolidation step merges them into `strings.xml` / `strings-hi.xml`.

**Tech Stack:** Kotlin + Compose, Hilt, DataStore Preferences, AppCompat 1.7.0, MockK, JUnit 5, design-system `LanguagePickerCard`

---

## STOP — Read These Before Coding

| Pattern file | Required before... |
|---|---|
| `docs/patterns/paparazzi-cross-os-goldens.md` | Adding/changing any Compose screen |
| `docs/patterns/kotlin-explicit-api-public-modifier.md` | Every new public file |
| `docs/patterns/hilt-module-android-test-scope.md` | Every new Hilt-injected class |

**Reference impl (already shipped in customer-app — read before each WS):**
- `customer-app/app/src/main/kotlin/com/homeservices/customer/data/locale/`
- `customer-app/app/src/main/kotlin/com/homeservices/customer/domain/locale/`
- `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/settings/Language*`
- `customer-app/app/src/main/kotlin/com/homeservices/customer/HomeservicesCustomerApplication.kt`

**W3-3D risk:** PR #205 (`hotfix/w3-3d-photo-fcm`) also modifies `HomeservicesTechnicianApplication.kt`. If it merges into `main` while you're on your WS-A task, run `git pull origin main --rebase` and merge-resolve the `onCreate()` delta (3-4 lines) before continuing.

---

## File Map

**Create (new):**
```
technician-app/app/src/main/kotlin/com/homeservices/technician/
  data/locale/LocaleRepositoryImpl.kt
  data/locale/di/LocalePrefs.kt
  data/locale/di/LocaleModule.kt
  domain/locale/LocaleRepository.kt
  domain/locale/GetCurrentLocaleUseCase.kt
  domain/locale/SetAppLocaleUseCase.kt
  ui/settings/LanguageSettingsScreen.kt
  ui/settings/LanguageSettingsViewModel.kt

technician-app/app/src/test/kotlin/com/homeservices/technician/
  data/locale/LocaleRepositoryImplTest.kt
  data/locale/StringsParityTest.kt
  domain/locale/SetAppLocaleUseCaseTest.kt
  ui/settings/LanguageSettingsViewModelTest.kt
```

**Modify (existing):**
```
technician-app/app/src/main/kotlin/com/homeservices/technician/HomeservicesTechnicianApplication.kt
technician-app/app/src/main/kotlin/com/homeservices/technician/navigation/HomeGraph.kt
technician-app/app/src/main/kotlin/com/homeservices/technician/ui/home/TechnicianHomeScreen.kt
technician-app/app/src/main/res/values/strings.xml          (+~53 keys)
technician-app/app/src/main/res/values-hi/strings.xml       (+~53 keys)
technician-app/app/src/main/kotlin/com/homeservices/technician/ui/auth/AuthScreen.kt
technician-app/app/src/main/kotlin/com/homeservices/technician/ui/activeJob/PhotoCaptureScreen.kt
technician-app/app/src/main/kotlin/com/homeservices/technician/ui/activeJob/ActiveJobScreen.kt
technician-app/app/src/main/kotlin/com/homeservices/technician/ui/myratings/MyRatingsScreen.kt
technician-app/app/src/main/kotlin/com/homeservices/technician/ui/rating/RatingScreen.kt
technician-app/app/src/main/kotlin/com/homeservices/technician/ui/complaint/ComplaintScreen.kt
technician-app/app/src/main/kotlin/com/homeservices/technician/ui/earnings/EarningsScreen.kt
technician-app/app/src/main/kotlin/com/homeservices/technician/ui/home/TechnicianHomeScreen.kt  (literal sweep)
technician-app/app/src/main/kotlin/com/homeservices/technician/ui/kyc/KycScreen.kt
technician-app/app/src/main/kotlin/com/homeservices/technician/ui/onboarding/OnboardingScreen.kt
customer-app/gradle/libs.versions.toml                      (mirror byte-identity check)
```

---

## Task 1: Create branch + worktree

**Files:** none

- [ ] **Step 1: Create worktree from origin/main**

  ```bash
  git fetch origin main
  git worktree add ../urbanclap-w4-hindi origin/main -b feat/w4-technician-hindi-i18n
  cd ../urbanclap-w4-hindi
  ```

- [ ] **Step 2: Copy gitignored local config files (required for Gradle)**

  ```bash
  cp ../Urbanclap-dup/local.properties .
  cp ../Urbanclap-dup/design-system/local.properties design-system/ 2>/dev/null || true
  cp ../Urbanclap-dup/release-upload.jks . 2>/dev/null || true
  ```

- [ ] **Step 3: Verify branch is clean off main**

  ```bash
  git log --oneline -5
  # Should show same commits as origin/main
  ```

---

## Task 2: WS-A — Domain + data locale layer (TDD)

**Files:**
- Create: `technician-app/app/src/main/kotlin/com/homeservices/technician/domain/locale/LocaleRepository.kt`
- Create: `technician-app/app/src/main/kotlin/com/homeservices/technician/domain/locale/GetCurrentLocaleUseCase.kt`
- Create: `technician-app/app/src/main/kotlin/com/homeservices/technician/domain/locale/SetAppLocaleUseCase.kt`
- Create: `technician-app/app/src/main/kotlin/com/homeservices/technician/data/locale/di/LocalePrefs.kt`
- Create: `technician-app/app/src/main/kotlin/com/homeservices/technician/data/locale/LocaleRepositoryImpl.kt`
- Create: `technician-app/app/src/main/kotlin/com/homeservices/technician/data/locale/di/LocaleModule.kt`
- Test: `technician-app/app/src/test/kotlin/com/homeservices/technician/data/locale/LocaleRepositoryImplTest.kt`
- Test: `technician-app/app/src/test/kotlin/com/homeservices/technician/domain/locale/SetAppLocaleUseCaseTest.kt`

- [ ] **Step 1: Write the failing tests first**

  `technician-app/app/src/test/kotlin/com/homeservices/technician/data/locale/LocaleRepositoryImplTest.kt`:
  ```kotlin
  package com.homeservices.technician.data.locale

  import androidx.datastore.preferences.core.PreferenceDataStoreFactory
  import kotlinx.coroutines.ExperimentalCoroutinesApi
  import kotlinx.coroutines.flow.first
  import kotlinx.coroutines.test.TestScope
  import kotlinx.coroutines.test.UnconfinedTestDispatcher
  import kotlinx.coroutines.test.runTest
  import org.junit.jupiter.api.Assertions.assertEquals
  import org.junit.jupiter.api.Test
  import org.junit.jupiter.api.io.TempDir
  import java.io.File

  @OptIn(ExperimentalCoroutinesApi::class)
  class LocaleRepositoryImplTest {
      private val testScope = TestScope(UnconfinedTestDispatcher())

      private fun repo(dir: File, name: String) = LocaleRepositoryImpl(
          PreferenceDataStoreFactory.create(scope = testScope) { File(dir, name) }
      )

      @Test
      fun `currentLocale emits stored tag`(@TempDir dir: File) = testScope.runTest {
          val r = repo(dir, "a.preferences_pb")
          r.setLocale("hi")
          assertEquals("hi", r.currentLocale.first())
      }

      @Test
      fun `currentLocale defaults to en or hi based on device`(@TempDir dir: File) = testScope.runTest {
          val r = repo(dir, "b.preferences_pb")
          val result = r.currentLocale.first()
          assert(result == "en" || result == "hi") { "Expected 'en' or 'hi', got '$result'" }
      }

      @Test
      fun `setLocale persists across repo instances`(@TempDir dir: File) = testScope.runTest {
          val file = File(dir, "c.preferences_pb")
          repo(dir, "c.preferences_pb").setLocale("hi")
          assertEquals("hi", LocaleRepositoryImpl(
              PreferenceDataStoreFactory.create(scope = testScope) { file }
          ).currentLocale.first())
      }
  }
  ```

  `technician-app/app/src/test/kotlin/com/homeservices/technician/domain/locale/SetAppLocaleUseCaseTest.kt`:
  ```kotlin
  package com.homeservices.technician.domain.locale

  import androidx.appcompat.app.AppCompatDelegate
  import io.mockk.coEvery
  import io.mockk.coVerifyOrder
  import io.mockk.every
  import io.mockk.mockk
  import io.mockk.mockkStatic
  import io.mockk.unmockkAll
  import kotlinx.coroutines.test.runTest
  import org.junit.jupiter.api.AfterEach
  import org.junit.jupiter.api.BeforeEach
  import org.junit.jupiter.api.Test

  class SetAppLocaleUseCaseTest {
      private val repo: LocaleRepository = mockk()
      private val useCase = SetAppLocaleUseCase(repo)

      @BeforeEach fun setUp() { mockkStatic(AppCompatDelegate::class) }
      @AfterEach fun tearDown() { unmockkAll() }

      @Test
      fun `persist is called before setApplicationLocales`() = runTest {
          coEvery { repo.setLocale(any()) } returns Unit
          every { AppCompatDelegate.setApplicationLocales(any()) } returns Unit
          useCase("hi")
          coVerifyOrder {
              repo.setLocale("hi")
              AppCompatDelegate.setApplicationLocales(any())
          }
      }
  }
  ```

- [ ] **Step 2: Run tests — expect red (classes not found)**

  ```bash
  cd technician-app
  ./gradlew testDebugUnitTest --tests "*.LocaleRepositoryImplTest" --tests "*.SetAppLocaleUseCaseTest" 2>&1 | tail -20
  # Expected: FAILED — unresolved reference: LocaleRepositoryImpl / SetAppLocaleUseCase
  ```

- [ ] **Step 3: Create domain layer**

  `LocaleRepository.kt`:
  ```kotlin
  package com.homeservices.technician.domain.locale

  import kotlinx.coroutines.flow.Flow

  public interface LocaleRepository {
      public val currentLocale: Flow<String>
      public suspend fun setLocale(tag: String)
  }
  ```

  `GetCurrentLocaleUseCase.kt`:
  ```kotlin
  package com.homeservices.technician.domain.locale

  import kotlinx.coroutines.flow.Flow
  import javax.inject.Inject

  public class GetCurrentLocaleUseCase
      @Inject
      constructor(private val repo: LocaleRepository) {
          public operator fun invoke(): Flow<String> = repo.currentLocale
      }
  ```

  `SetAppLocaleUseCase.kt`:
  ```kotlin
  package com.homeservices.technician.domain.locale

  import androidx.appcompat.app.AppCompatDelegate
  import androidx.core.os.LocaleListCompat
  import javax.inject.Inject

  public class SetAppLocaleUseCase
      @Inject
      constructor(private val repo: LocaleRepository) {
          public suspend operator fun invoke(tag: String) {
              // Persist before applying — setApplicationLocales() triggers Activity recreation on
              // API <33, which would cancel viewModelScope and leave DataStore writes incomplete.
              repo.setLocale(tag)
              AppCompatDelegate.setApplicationLocales(LocaleListCompat.forLanguageTags(tag))
          }
      }
  ```

- [ ] **Step 4: Create data layer**

  `LocalePrefs.kt`:
  ```kotlin
  package com.homeservices.technician.data.locale.di

  import javax.inject.Qualifier

  @Qualifier
  @Retention(AnnotationRetention.BINARY)
  public annotation class LocalePrefs
  ```

  `LocaleRepositoryImpl.kt`:
  ```kotlin
  package com.homeservices.technician.data.locale

  import androidx.datastore.core.DataStore
  import androidx.datastore.preferences.core.Preferences
  import androidx.datastore.preferences.core.edit
  import androidx.datastore.preferences.core.stringPreferencesKey
  import com.homeservices.technician.data.locale.di.LocalePrefs
  import com.homeservices.technician.domain.locale.LocaleRepository
  import kotlinx.coroutines.flow.Flow
  import kotlinx.coroutines.flow.map
  import java.util.Locale
  import javax.inject.Inject
  import javax.inject.Singleton

  @Singleton
  public class LocaleRepositoryImpl
      @Inject
      constructor(@LocalePrefs private val dataStore: DataStore<Preferences>) : LocaleRepository {
          private companion object {
              val KEY_LOCALE_TAG = stringPreferencesKey("locale_tag")
          }

          override val currentLocale: Flow<String> =
              dataStore.data.map { prefs -> prefs[KEY_LOCALE_TAG] ?: deviceSupportedLocale() }

          override suspend fun setLocale(tag: String) {
              dataStore.edit { prefs -> prefs[KEY_LOCALE_TAG] = tag }
          }

          private fun deviceSupportedLocale(): String =
              when (Locale.getDefault().language) {
                  "hi" -> "hi"
                  else -> "en"
              }
      }
  ```

  `LocaleModule.kt`:
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

  private val Context.localePreferencesDataStore: DataStore<Preferences>
      by preferencesDataStore(name = "locale_prefs")

  @Module
  @InstallIn(SingletonComponent::class)
  public object LocaleModule {
      @Provides @Singleton @LocalePrefs
      public fun provideLocaleDataStore(
          @ApplicationContext context: Context,
      ): DataStore<Preferences> = context.localePreferencesDataStore
  }

  @Module
  @InstallIn(SingletonComponent::class)
  public abstract class LocaleBindings {
      @Binds @Singleton
      public abstract fun bindLocaleRepository(impl: LocaleRepositoryImpl): LocaleRepository
  }
  ```

- [ ] **Step 5: Run tests — expect green**

  ```bash
  ./gradlew testDebugUnitTest --tests "*.LocaleRepositoryImplTest" --tests "*.SetAppLocaleUseCaseTest" 2>&1 | tail -10
  # Expected: BUILD SUCCESSFUL, 4 tests passing
  ```

- [ ] **Step 6: Commit**

  ```bash
  git add technician-app/app/src/main/kotlin/com/homeservices/technician/domain/locale/ \
          technician-app/app/src/main/kotlin/com/homeservices/technician/data/locale/ \
          technician-app/app/src/test/kotlin/com/homeservices/technician/data/locale/LocaleRepositoryImplTest.kt \
          technician-app/app/src/test/kotlin/com/homeservices/technician/domain/locale/SetAppLocaleUseCaseTest.kt
  git commit -m "feat(W4): locale domain + data layer — LocaleRepository, SetAppLocaleUseCase, DataStore"
  ```

---

## Task 3: WS-A — Apply persisted locale in Application.onCreate

**Files:**
- Modify: `technician-app/app/src/main/kotlin/com/homeservices/technician/HomeservicesTechnicianApplication.kt`

- [ ] **Step 1: Add imports and LocaleEntryPoint to Application class**

  Add after the existing `FeatureFlagsEntryPoint` interface and add new imports:
  ```kotlin
  // New imports to add at top of file:
  import androidx.appcompat.app.AppCompatDelegate
  import androidx.core.os.LocaleListCompat
  import com.homeservices.technician.domain.locale.LocaleRepository
  import kotlinx.coroutines.flow.first

  // Add inside HomeservicesTechnicianApplication class, after FeatureFlagsEntryPoint:
  @EntryPoint
  @InstallIn(SingletonComponent::class)
  public interface LocaleEntryPoint {
      public fun localeRepository(): LocaleRepository
  }
  ```

- [ ] **Step 2: Apply locale in onCreate()**

  Add at the end of `onCreate()`, after the GrowthBook launch block:
  ```kotlin
  // Apply persisted locale BEFORE first Activity onCreate so the initial frame uses correct strings.
  val localeEp = EntryPointAccessors.fromApplication(this, LocaleEntryPoint::class.java)
  CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate).launch {
      val tag = localeEp.localeRepository().currentLocale.first()
      AppCompatDelegate.setApplicationLocales(LocaleListCompat.forLanguageTags(tag))
  }
  ```

- [ ] **Step 3: assembleDebug to verify DI wiring compiles**

  ```bash
  cd technician-app
  ./gradlew assembleDebug --quiet 2>&1 | tail -15
  # Expected: BUILD SUCCESSFUL
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add technician-app/app/src/main/kotlin/com/homeservices/technician/HomeservicesTechnicianApplication.kt
  git commit -m "feat(W4): apply persisted locale in Application.onCreate via LocaleEntryPoint"
  ```

---

## Task 4: WS-B — LanguageSettingsViewModel (TDD) + frontend-design checkpoint

**Files:**
- Create: `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/settings/LanguageSettingsViewModel.kt`
- Test: `technician-app/app/src/test/kotlin/com/homeservices/technician/ui/settings/LanguageSettingsViewModelTest.kt`

- [ ] **Step 1: Write the failing ViewModel tests**

  `LanguageSettingsViewModelTest.kt`:
  ```kotlin
  package com.homeservices.technician.ui.settings

  import com.homeservices.technician.domain.locale.GetCurrentLocaleUseCase
  import com.homeservices.technician.domain.locale.SetAppLocaleUseCase
  import io.mockk.coVerify
  import io.mockk.every
  import io.mockk.mockk
  import kotlinx.coroutines.Dispatchers
  import kotlinx.coroutines.ExperimentalCoroutinesApi
  import kotlinx.coroutines.flow.flowOf
  import kotlinx.coroutines.test.StandardTestDispatcher
  import kotlinx.coroutines.test.advanceUntilIdle
  import kotlinx.coroutines.test.resetMain
  import kotlinx.coroutines.test.runTest
  import kotlinx.coroutines.test.setMain
  import org.junit.jupiter.api.AfterEach
  import org.junit.jupiter.api.Assertions.assertEquals
  import org.junit.jupiter.api.Assertions.assertTrue
  import org.junit.jupiter.api.BeforeEach
  import org.junit.jupiter.api.Test

  @OptIn(ExperimentalCoroutinesApi::class)
  class LanguageSettingsViewModelTest {
      private val dispatcher = StandardTestDispatcher()
      private val getCurrentLocale: GetCurrentLocaleUseCase = mockk()
      private val setAppLocale: SetAppLocaleUseCase = mockk(relaxed = true)

      @BeforeEach fun setUp() {
          Dispatchers.setMain(dispatcher)
          every { getCurrentLocale() } returns flowOf("en")
      }
      @AfterEach fun tearDown() { Dispatchers.resetMain() }

      private fun vm() = LanguageSettingsViewModel(getCurrentLocale, setAppLocale)

      @Test fun `init loads current locale`() = runTest {
          val vm = vm(); advanceUntilIdle()
          assertEquals("en", vm.selectedTag.value)
      }

      @Test fun `onSelect updates selectedTag`() = runTest {
          val vm = vm(); advanceUntilIdle()
          vm.onSelect("hi")
          assertEquals("hi", vm.selectedTag.value)
      }

      @Test fun `onSave calls setAppLocale with selected tag`() = runTest {
          val vm = vm(); advanceUntilIdle()
          vm.onSelect("hi"); vm.onSave(); advanceUntilIdle()
          coVerify { setAppLocale("hi") }
      }

      @Test fun `onSave sets savedFlow true`() = runTest {
          val vm = vm(); advanceUntilIdle()
          vm.onSave(); advanceUntilIdle()
          assertTrue(vm.savedFlow.value)
      }
  }
  ```

- [ ] **Step 2: Run — expect red**

  ```bash
  ./gradlew testDebugUnitTest --tests "*.LanguageSettingsViewModelTest" 2>&1 | tail -10
  # Expected: FAILED — LanguageSettingsViewModel not found
  ```

- [ ] **Step 3: Implement LanguageSettingsViewModel**

  `LanguageSettingsViewModel.kt`:
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
              viewModelScope.launch { _selectedTag.value = getCurrentLocale().first() }
          }

          public fun onSelect(tag: String) { _selectedTag.value = tag }

          public fun onSave() {
              viewModelScope.launch {
                  setAppLocale(_selectedTag.value)
                  savedFlow.value = true
              }
          }
      }
  ```

- [ ] **Step 4: Run — expect green**

  ```bash
  ./gradlew testDebugUnitTest --tests "*.LanguageSettingsViewModelTest" 2>&1 | tail -5
  # Expected: BUILD SUCCESSFUL, 4 tests passing
  ```

- [ ] **Step 5: CHECKPOINT — Invoke frontend-design skill before writing the screen**

  ```
  Invoke: frontend-design:frontend-design
  Context: LanguageSettingsScreen for the technician-app (partner/vendor-facing).
  Existing pattern: customer-app's LanguageSettingsScreen uses LanguagePickerCard from
  design-system (com.homeservices.designsystem.locale). The technician-app uses HomeservicesTheme.
  Screen purpose: let a technician switch between English and Hindi. One-screen; back-nav saves.
  Design cues: WorkBackground color scheme, SettingCard pattern used in ProfileScreen,
  consistent with the technician dashboard's earthy/professional aesthetic.
  Request: produce the LanguageSettingsScreen composable code adapted for technician visual language.
  ```

  Use the design output for Step 6 below.

- [ ] **Step 6: Commit ViewModel**

  ```bash
  git add technician-app/app/src/main/kotlin/com/homeservices/technician/ui/settings/LanguageSettingsViewModel.kt \
          technician-app/app/src/test/kotlin/com/homeservices/technician/ui/settings/LanguageSettingsViewModelTest.kt
  git commit -m "feat(W4): LanguageSettingsViewModel + tests — locale state flip, persist-on-save"
  ```

---

## Task 5: WS-B — LanguageSettingsScreen + nav wiring

**Files:**
- Create: `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/settings/LanguageSettingsScreen.kt`
- Modify: `technician-app/app/src/main/kotlin/com/homeservices/technician/navigation/HomeGraph.kt`
- Modify: `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/home/TechnicianHomeScreen.kt`
- Modify: `technician-app/app/src/main/res/values/strings.xml` (+3 locale-switcher keys)
- Modify: `technician-app/app/src/main/res/values-hi/strings.xml` (+3 locale-switcher keys)

- [ ] **Step 1: Add 3 locale-switcher string keys**

  Append to `res/values/strings.xml` before `</resources>`:
  ```xml
      <!-- Language settings -->
      <string name="settings_language_title">App language</string>
      <string name="settings_language_subtitle">Switch between English and Hindi</string>
      <string name="settings_language_save">Save language</string>
  ```

  Append to `res/values-hi/strings.xml` before `</resources>`:
  ```xml
      <!-- Language settings -->
      <string name="settings_language_title">ऐप भाषा</string>
      <string name="settings_language_subtitle">अंग्रेज़ी और हिंदी के बीच बदलें</string>
      <string name="settings_language_save">भाषा सहेजें</string>
  ```

- [ ] **Step 2: Create LanguageSettingsScreen using frontend-design output**

  Use the code from the frontend-design checkpoint (Task 4, Step 5). Skeleton if frontend-design output isn't available yet — replace with its output:
  ```kotlin
  package com.homeservices.technician.ui.settings

  import androidx.compose.foundation.layout.Arrangement
  import androidx.compose.foundation.layout.Column
  import androidx.compose.foundation.layout.fillMaxSize
  import androidx.compose.foundation.layout.fillMaxWidth
  import androidx.compose.foundation.layout.padding
  import androidx.compose.foundation.layout.statusBarsPadding
  import androidx.compose.material3.Button
  import androidx.compose.material3.MaterialTheme
  import androidx.compose.material3.Surface
  import androidx.compose.material3.Text
  import androidx.compose.runtime.Composable
  import androidx.compose.runtime.LaunchedEffect
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

      LaunchedEffect(saved) {
          if (saved) {
              viewModel.savedFlow.value = false
              onSaved()
          }
      }

      Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
          Column(
              modifier = Modifier.fillMaxSize().statusBarsPadding().padding(24.dp),
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
                  Text(stringResource(R.string.settings_language_save))
              }
          }
      }
  }
  ```

- [ ] **Step 3: Add `language_settings` route to HomeGraph.kt**

  Add import at top of HomeGraph.kt:
  ```kotlin
  import com.homeservices.technician.ui.settings.LanguageSettingsScreen
  ```

  Add composable inside the `navigation(...)` block after `"payout_settings"`:
  ```kotlin
  composable("language_settings") {
      LanguageSettingsScreen(onSaved = { navController.popBackStack() })
  }
  ```

  In `HomeDashboardRoute`, add `onLanguageSettings` to `TechnicianHomeScreen(...)`:
  ```kotlin
  TechnicianHomeScreen(
      authState = authState,
      onOpenJob = { bookingId -> navController.navigate("activeJob/$bookingId") },
      onViewRatings = { navController.navigate("ratings_transparency") },
      onPayoutSettings = { navController.navigate("payout_settings") },
      onLanguageSettings = { navController.navigate("language_settings") },
      onEditServices = { navController.navigate("edit_services") },
      onSignOut = onSignOut,
      viewModel = viewModel,
  )
  ```

- [ ] **Step 4: Add `onLanguageSettings` param + Profile tab SettingCard to TechnicianHomeScreen.kt**

  Add `onLanguageSettings: () -> Unit` to both `TechnicianHomeScreen` signature and `ProfileScreen` signature (thread it through like `onPayoutSettings`):
  ```kotlin
  // TechnicianHomeScreen params — add after onPayoutSettings:
  onLanguageSettings: () -> Unit,

  // Pass it into ProfileScreen (in the when(selectedTab) block):
  TechTab.Profile ->
      ProfileScreen(
          authState = authState,
          onViewRatings = onViewRatings,
          onPayoutSettings = onPayoutSettings,
          onLanguageSettings = onLanguageSettings,
          onEditServices = onEditServices,
          onSignOut = onSignOut,
      )
  ```

  Add `SettingCard` in `ProfileScreen` LazyColumn after the Payout settings item:
  ```kotlin
  item {
      SettingCard(
          icon = Icons.Default.Translate,
          title = stringResource(R.string.settings_language_title),
          subtitle = stringResource(R.string.settings_language_subtitle),
          onClick = onLanguageSettings,
      )
  }
  ```

- [ ] **Step 5: assembleDebug**

  ```bash
  ./gradlew assembleDebug --quiet 2>&1 | tail -10
  # Expected: BUILD SUCCESSFUL
  ```

- [ ] **Step 6: UI/UX visual-audit checkpoint**

  Per `memory/feedback_uiux_review_gate.md`: visual audit is mandatory before Codex. Do a quick self-review:
  - Language settings screen renders correctly with `LanguagePickerCard` showing EN + हिन्दी options.
  - "App language" entry appears in Profile tab below Payout settings.
  - Selecting Hindi and saving pops back to the dashboard (which then recreates with Hindi strings).

- [ ] **Step 7: Commit**

  ```bash
  git add technician-app/app/src/main/kotlin/com/homeservices/technician/ui/settings/LanguageSettingsScreen.kt \
          technician-app/app/src/main/kotlin/com/homeservices/technician/navigation/HomeGraph.kt \
          technician-app/app/src/main/kotlin/com/homeservices/technician/ui/home/TechnicianHomeScreen.kt \
          technician-app/app/src/main/res/values/strings.xml \
          technician-app/app/src/main/res/values-hi/strings.xml
  git commit -m "feat(W4): LanguageSettingsScreen + Profile tab entry + nav wiring"
  ```

---

## Task 6: WS-C — Parallel literal sweep (6 Haiku agents)

**Files:** All `ui/` Kotlin files + `values/strings.xml` + `values-hi/strings.xml`

Dispatch 6 parallel Haiku subagents using `superpowers:dispatching-parallel-agents`. Each agent:
1. Greps `Text("` in its assigned directory.
2. Classifies each hit as **translatable** (English prose → move to strings.xml) or **non-translatable** (format patterns `"%.1f"`, Unicode glyphs `"★"`, empty strings → leave as `Text(...)`).
3. Writes proposed string entries to a temp sidecar: `/tmp/strings-wsc-<N>.xml` (en) and `/tmp/strings-hi-wsc-<N>.xml` (hi translations).
4. Replaces `Text("Foo")` → `Text(stringResource(R.string.foo_bar))` in the source file.
5. Reports back the list of modified files + keys added.

**Agent assignments:**

| Agent | Dir(s) | Key literals (representative) |
|---|---|---|
| 1 | `ui/auth/` | "Back to sign-in options", "Forgot password?", "Mobile number", "6-digit code", "Resend code", "Email" |
| 2 | `ui/activeJob/` | "Camera permission required", "No back camera available on this device", "Grant Permission", "Capture", "Retake", "Retake Photo", "Retry Upload", "Confirm & Upload", "Upload failed: …", "Continue job" |
| 3 | `ui/myratings/` + `ui/rating/` | "My ratings", "No ratings yet", "Could not load ratings", "Overall: …", "Behaviour: …", "Skill: …", "Communication: …", "Punctuality: …" |
| 4 | `ui/complaint/` | "Describe the issue", "Issue type", "Issue received", "Submitting issue", "Report an issue" |
| 5 | `ui/earnings/` | Remaining literals + fix `Locale.ENGLISH` → `Locale.getDefault()` at `EarningsScreen.kt:359` |
| 6 | `ui/home/` + `ui/kyc/` + `ui/onboarding/` | "Something went wrong", "Retry", "Cancel", "Go back", "Comment (optional, <=500 chars)", "Availability synced: online for new jobs", "Availability synced: offline" |

- [ ] **Step 1: Dispatch all 6 Haiku agents in parallel**

  Use `superpowers:dispatching-parallel-agents`. Prompt for each agent (example for Agent 1):
  > "You are a Haiku codemod agent. In `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/auth/`, find every `Text("...")` call with a hardcoded English string. For each: (a) if translatable, write `<string name="auth_back_to_sign_in">Back to sign-in options</string>` to `/tmp/strings-wsc-1.xml` and the Hindi translation to `/tmp/strings-hi-wsc-1.xml`, (b) replace the source line with `Text(stringResource(R.string.auth_back_to_sign_in))`. Skip format patterns (%.1f), Unicode glyphs (★), and empty strings. Use snake_case key names prefixed with the screen name. Report: list of (key, file, line) changes made."

  **Key naming convention:**
  - `auth_*` — auth/ strings
  - `photo_*`, `active_job_*` — activeJob/ strings (use existing `active_job_*` prefix if key already exists)
  - `ratings_*`, `my_ratings_*` — myratings/ + rating/
  - `complaint_*` — complaint/
  - (earnings already has `earnings_*` keys — only add new ones)
  - `home_*`, `kyc_*`, `onboarding_*` — home/ + kyc/ + onboarding/

  **Agent 5 additional task (formatter fix):**
  > Also fix `EarningsScreen.kt:359`: change `Locale.ENGLISH` → `Locale.getDefault()` in the `dayOfWeek.getDisplayName(TextStyle.SHORT, ...)` call. And fix `MyRatingsScreen.kt:182`: change `DateTimeFormatter.ofPattern("dd MMM yyyy", Locale.ENGLISH)` → `DateTimeFormatter.ofPattern("dd MMM yyyy", Locale.getDefault())`.

- [ ] **Step 2: Wait for all 6 agents to complete, then consolidate sidecar files**

  ```bash
  # Merge all en sidecar entries into strings.xml (before </resources>):
  for n in 1 2 3 4 5 6; do
    if [ -f /tmp/strings-wsc-$n.xml ]; then
      # Extract <string ...> lines from sidecar and append to strings.xml
      grep '<string ' /tmp/strings-wsc-$n.xml >> /tmp/new-en-strings.txt
    fi
  done

  # Edit strings.xml: insert /tmp/new-en-strings.txt content before </resources>
  # (Do this manually in the editor — insert the block)

  # Same for Hindi:
  for n in 1 2 3 4 5 6; do
    if [ -f /tmp/strings-hi-wsc-$n.xml ]; then
      grep '<string ' /tmp/strings-hi-wsc-$n.xml >> /tmp/new-hi-strings.txt
    fi
  done
  # Insert into values-hi/strings.xml before </resources>
  ```

- [ ] **Step 3: Verify zero `Text("` literals remain in ui/ (except non-translatable)**

  ```bash
  cd technician-app
  grep -rn 'Text("' app/src/main/kotlin/com/homeservices/technician/ui/ | grep -v '//\|%.1f\|\\u\|""\|" "' | grep -v 'test\|Test'
  # Expected: 0 results (or only non-translatable format strings/glyphs)
  ```

- [ ] **Step 4: assembleDebug**

  ```bash
  ./gradlew assembleDebug --quiet 2>&1 | tail -10
  # Expected: BUILD SUCCESSFUL
  ```

- [ ] **Step 5: Commit sweep**

  ```bash
  git add technician-app/app/src/main/kotlin/com/homeservices/technician/ui/ \
          technician-app/app/src/main/res/values/strings.xml \
          technician-app/app/src/main/res/values-hi/strings.xml
  git commit -m "feat(W4): replace ~50 hardcoded UI literals with stringResource; fix Locale.ENGLISH formatters"
  ```

---

## Task 7: WS-C — StringsParityTest + CI grep gate

**Files:**
- Create: `technician-app/app/src/test/kotlin/com/homeservices/technician/data/locale/StringsParityTest.kt`
- Modify: `.github/workflows/technician-ship.yml` (+1 grep-gate step)

- [ ] **Step 1: Write StringsParityTest**

  ```kotlin
  package com.homeservices.technician.data.locale

  import org.junit.jupiter.api.Assertions.assertTrue
  import org.junit.jupiter.api.Test
  import java.io.File
  import javax.xml.parsers.DocumentBuilderFactory

  class StringsParityTest {
      private fun keys(path: String): Set<String> {
          val file = File(path)
          if (!file.exists()) return emptySet()
          val doc = DocumentBuilderFactory.newInstance().newDocumentBuilder().parse(file)
          val nodes = doc.getElementsByTagName("string")
          return (0 until nodes.length).map { nodes.item(it).attributes.getNamedItem("name").nodeValue }.toSet()
      }

      @Test
      fun `values-hi strings has all keys from values strings`() {
          val en = keys("src/main/res/values/strings.xml")
          val hi = keys("src/main/res/values-hi/strings.xml")
          val missing = en - hi
          assertTrue(missing.isEmpty()) {
              "Keys in values/strings.xml missing from values-hi/strings.xml:\n${missing.sorted().joinToString("\n")}"
          }
      }
  }
  ```

- [ ] **Step 2: Run — expect green (or fix missing hi translations)**

  ```bash
  cd technician-app
  ./gradlew testDebugUnitTest --tests "*.StringsParityTest" 2>&1 | tail -15
  # If FAILED: the output lists the missing hi keys. Add them to values-hi/strings.xml and re-run.
  ```

- [ ] **Step 3: Add CI grep gate to technician-ship.yml**

  Find the lint/ktlint step in `.github/workflows/technician-ship.yml` and add after it:
  ```yaml
  - name: Zero hardcoded Text literals
    run: |
      count=$(grep -r 'Text("' technician-app/app/src/main/kotlin/com/homeservices/technician/ui/ \
        | grep -v '//\|%.1f\|\\\\u\|""\|" "' | wc -l)
      if [ "$count" -gt 0 ]; then
        echo "❌ Found $count hardcoded Text() literals in ui/ — use stringResource()"
        grep -r 'Text("' technician-app/app/src/main/kotlin/com/homeservices/technician/ui/ \
          | grep -v '//\|%.1f\|\\\\u\|""\|" "'
        exit 1
      fi
      echo "✅ No hardcoded Text() literals"
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add technician-app/app/src/test/kotlin/com/homeservices/technician/data/locale/StringsParityTest.kt \
          .github/workflows/technician-ship.yml
  git commit -m "test(W4): StringsParityTest + CI grep gate for zero hardcoded Text() literals"
  ```

---

## Task 8: WS-D — libs.versions.toml mirror check

**Files:** `customer-app/gradle/libs.versions.toml`

- [ ] **Step 1: Byte-identity check between the two toml files**

  ```bash
  diff customer-app/gradle/libs.versions.toml technician-app/gradle/libs.versions.toml
  # Expected: no output (files are identical)
  # If there is a diff, merge the delta — technician-app's version is the source of truth for
  # any technician-specific additions; customer-app is the source of truth for shared libs.
  ```

- [ ] **Step 2: If diff — sync and commit**

  If the files diverged:
  ```bash
  cp technician-app/gradle/libs.versions.toml customer-app/gradle/libs.versions.toml
  git add customer-app/gradle/libs.versions.toml
  git commit -m "chore(W4): sync customer-app libs.versions.toml with technician-app"
  ```

---

## Task 9: WS-E — ktlintFormat, smoke gate, Codex review, PR

**Files:** none created; all checks on existing changes

- [ ] **Step 1: ktlintFormat (fix formatting before Codex sees it)**

  ```bash
  cd technician-app
  ./gradlew ktlintFormat 2>&1 | tail -10
  # Expected: BUILD SUCCESSFUL
  git add -p  # stage any formatting changes
  git diff --cached --stat
  ```

  If ktlintFormat made changes:
  ```bash
  git commit -m "style(W4): ktlintFormat sweep — locale + settings files"
  ```

- [ ] **Step 2: Full smoke gate**

  ```bash
  cd ..  # back to repo root
  bash tools/pre-codex-smoke.sh technician-app
  # Runs: assembleDebug → ktlintCheck → testDebugUnitTest → koverVerify
  # Expected: "=== Smoke gate PASSED — safe to invoke /codex-review-gate ==="
  # If FAILED: fix the reported issue before continuing. Do NOT invoke Codex on a failing build.
  ```

- [ ] **Step 3: Invoke Codex review (round 1)**

  ```bash
  codex review --base main
  # Creates .codex-review-passed if no P0/P1 issues
  ```

  If P0/P1 issues found: fix them in Claude, run smoke gate again, then:
  ```bash
  codex review --base main  # round 2 (maximum — do not do a round 3)
  ```

- [ ] **Step 4: Open PR**

  ```bash
  git push -u origin feat/w4-technician-hindi-i18n
  gh pr create \
    --title "feat(W4): technician-app Hindi i18n parity — locale switcher + 50-literal sweep (E12-S03c)" \
    --body "$(cat <<'EOF'
  ## Summary
  - Adds runtime locale switcher (EN ↔ हिंदी) to Profile tab via `LanguageSettingsScreen`
  - Ports `data/locale` + `domain/locale` layer from customer-app (DataStore persistence, `AppCompatDelegate.setApplicationLocales`)
  - Replaces ~50 hardcoded `Text("...")` English literals across 6 UI feature dirs with `stringResource()`
  - Fixes `Locale.ENGLISH` hardcodings in `EarningsScreen` (day-of-week) and `MyRatingsScreen` (date formatter)
  - Adds `StringsParityTest` + CI grep gate to enforce zero-literal invariant going forward

  ## Test plan
  - [ ] `LocaleRepositoryImplTest` (3 cases)
  - [ ] `SetAppLocaleUseCaseTest` (persist-before-apply order)
  - [ ] `LanguageSettingsViewModelTest` (4 cases)
  - [ ] `StringsParityTest` (all hi keys present)
  - [ ] CI grep gate: zero `Text("...")` literals in `ui/`
  - [ ] Manual: install APK, switch to Hindi from Profile tab, verify dashboard relabels in Hindi without app restart

  🤖 Generated with [Claude Code](https://claude.com/claude-code)
  EOF
  )"
  ```

---

## Self-Review Checklist

After writing this plan, verified against spec (`docs/superpowers/specs/2026-05-13-w4-technician-hindi-i18n-design.md`):

- [x] §1 Goal — covered by Tasks 2-7
- [x] §3.1 New files — all accounted for in File Map
- [x] §3.2 Modified files — all listed
- [x] §3.3 Application.onCreate — Task 3
- [x] §3.3 SetAppLocaleUseCase persist-before-apply — Task 2, Step 3
- [x] §3.3 LanguageSettingsScreen entry point in Profile tab — Task 5, Step 4
- [x] §3.3 Formatter residuals — Task 6, Step 1, Agent 5
- [x] §4 WS-A/B/C/D/E — Tasks 2-9 correspond
- [x] §5 Non-translatable exclusions — documented in Task 6, Step 3 grep filter
- [x] §6 Testing plan — all 4 test classes present; CI grep gate in Task 7
- [x] §7 Out of scope — no Paparazzi goldens, no first-launch screen, no Noto Sans
- [x] Type consistency — `LocaleRepository`, `GetCurrentLocaleUseCase`, `SetAppLocaleUseCase`, `LanguageSettingsViewModel`, `LanguageSettingsScreen` names consistent across all tasks
