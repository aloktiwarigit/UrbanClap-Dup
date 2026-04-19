# Pattern: Hilt DI — Correct Test Scope by Test Type
**Stack:** Android / Kotlin / Hilt / JUnit 5 / Robolectric / MockK
**Story source:** E02-S01 (customer auth)
**Last updated:** 2026-04-19
**Recurrence risk:** High — affects every Android story that introduces new Hilt-injected classes

## The Trap

There are three types of Android tests in this project, and the Hilt setup is different for each. Mixing them up causes `NullPointerException` on injected fields at runtime, or Hilt annotation processor errors at compile time.

## The Solution

### Type 1: JVM Unit Tests (fastest — no Hilt runner needed)

For pure domain/use-case logic with no Android framework dependency. **Construct the class under test manually with `mockk()`.**

```kotlin
// src/test/java/.../AuthOrchestratorTest.kt
class AuthOrchestratorTest {
    // Manual construction — NO @HiltAndroidTest, NO Hilt runner
    private val truecallerUseCase: TruecallerLoginUseCase = mockk()
    private val firebaseUseCase: FirebaseOtpUseCase = mockk()
    private val orchestrator = AuthOrchestrator(truecallerUseCase, firebaseUseCase)

    @Test
    fun `orchestrator tries Truecaller first`() { /* ... */ }
}
```

### Type 2: Robolectric Tests (for classes needing Android Context — e.g. SessionManager with SharedPreferences)

Use `ApplicationProvider` directly. **No Hilt, no @RunWith(AndroidJUnit4).**

```kotlin
// src/test/java/.../SessionManagerTest.kt
@RunWith(RobolectricTestRunner::class)
class SessionManagerTest {
    private lateinit var sessionManager: SessionManager

    @Before
    fun setUp() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val prefs = EncryptedSharedPreferences.create(
            context, "test_prefs", MasterKey.Builder(context).build(),
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
        sessionManager = SessionManager(prefs)  // manual construction
    }
}
```

### Type 3: Instrumented UI Tests (for HiltViewModel in a real Activity)

Only use `@HiltAndroidTest` + `HiltAndroidRule` for tests that must exercise the real DI graph on a device/emulator.

```kotlin
// src/androidTest/java/.../AuthFlowTest.kt
@HiltAndroidTest
@RunWith(AndroidJUnit4::class)
class AuthFlowTest {
    @get:Rule val hiltRule = HiltAndroidRule(this)

    @Inject lateinit var sessionManager: SessionManager

    @Before
    fun inject() { hiltRule.inject() }
}
```

### ViewModels in unit tests: always manual

```kotlin
class AuthViewModelTest {
    private val orchestrator: AuthOrchestrator = mockk(relaxed = true)
    private val viewModel = AuthViewModel(orchestrator)  // no Hilt

    @Test
    fun `initial state is Unauthenticated`() {
        assertThat(viewModel.authUiState.value).isInstanceOf(AuthUiState.Unauthenticated::class.java)
    }
}
```

## CI Gate

`testDebugUnitTest` — Hilt processor errors surface as compile failures. The `assembleDebug` step in `pre-codex-smoke.sh` catches annotation processor issues before tests run.

## Do Not

- Do not add `@HiltAndroidTest` to JVM unit test classes — the Hilt test runner requires an instrumented environment.
- Do not add `@UninstallModules` to unit tests that don't use `@HiltAndroidTest`.
- Do not use field injection (`@Inject lateinit var`) in JVM unit tests — inject via constructor.
- Do not use `@RunWith(AndroidJUnit4::class)` in JVM tests — use `@RunWith(RobolectricTestRunner::class)` if Android context is needed.
