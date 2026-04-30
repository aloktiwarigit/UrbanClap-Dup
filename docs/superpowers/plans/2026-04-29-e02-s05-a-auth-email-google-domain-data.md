# E02-S05-A — Email + Google Auth: Domain & Data Layer

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `GoogleSignInUseCase`, `EmailPasswordUseCase`, account-linking logic in `AuthOrchestrator`, and extend `SessionManager`/`AuthState` to carry email + displayName + provider — customer-app only, zero backend changes.

**Architecture:** New use cases follow the existing `callbackFlow`/`Flow<AuthResult>` pattern. `GoogleSignInUseCase` returns a `GoogleSignInResult` (credential only — no Firebase sign-in); `AuthOrchestrator` owns the `linkWithCredential` vs `signInWithCredential` decision and calls `SaveSessionUseCase` on success. `EmailPasswordUseCase` is a pure Firebase Email/Password wrapper; orchestrator handles anonymous-account upgrade for sign-up path.

**Tech Stack:** Kotlin + Hilt, Firebase Auth KTX, `androidx.credentials:credentials:1.3.0`, `com.google.android.libraries.identity.googleid:googleid:1.1.1`, JUnit 5 + MockK + `kotlinx-coroutines-test`

**Prerequisite:** `customer-app/app/google-services.json` must contain a `client_type: 3` (web) OAuth entry — download from Firebase Console → Project Settings → Your apps → google-services.json after enabling Google Sign-In in Authentication → Sign-in method.

**Pattern files to read before implementing (open each before writing any code):**
- `docs/patterns/firebase-callbackflow-lifecycle.md`
- `docs/patterns/firebase-errorcode-mapping.md`
- `docs/patterns/hilt-module-android-test-scope.md`
- `docs/patterns/kotlin-explicit-api-public-modifier.md`

**Sources of truth:**
- Spec: `docs/superpowers/specs/2026-04-29-auth-email-google-design.md`
- Story: `docs/stories/E02-S05-A-*.md` (to be created)

---

## File Map

| Path | Action | Responsibility |
|---|---|---|
| `customer-app/gradle/libs.versions.toml` | **Modify** | Add Credential Manager + Google Identity Library versions |
| `customer-app/app/build.gradle.kts` | **Modify** | Add three new implementation deps |
| `customer-app/app/proguard-rules.pro` | **Modify** | Keep rules for CredentialManager + Google Identity + Firebase Google auth |
| `customer-app/app/src/main/kotlin/…/domain/auth/model/AuthProvider.kt` | **Create** | Sealed class: `Phone`, `Google`, `Email` |
| `customer-app/app/src/main/kotlin/…/domain/auth/model/AuthResult.kt` | **Modify** | Add 5 new `Error` subtypes: `WrongCredential`, `UserNotFound`, `EmailAlreadyInUse`, `WeakPassword`, `InvalidEmail` |
| `customer-app/app/src/main/kotlin/…/domain/auth/model/AuthState.kt` | **Modify** | Extend `Authenticated` with `email`, `displayName`, `authProvider` (all nullable/defaulted for backward compat) |
| `customer-app/app/src/main/kotlin/…/data/auth/SessionManager.kt` | **Modify** | Add 3 new encrypted prefs keys; extend `saveSession()` signature |
| `customer-app/app/src/main/kotlin/…/domain/auth/model/GoogleSignInResult.kt` | **Create** | Sealed class for credential-retrieval outcome (not Firebase sign-in) |
| `customer-app/app/src/main/kotlin/…/domain/auth/GoogleSignInUseCase.kt` | **Create** | Wraps CredentialManager; returns `GoogleSignInResult` (credential only) |
| `customer-app/app/src/main/kotlin/…/domain/auth/EmailPasswordUseCase.kt` | **Create** | Wraps Firebase Email/Password; `signIn`, `signUp`, `sendPasswordReset` |
| `customer-app/app/src/main/kotlin/…/domain/auth/SaveSessionUseCase.kt` | **Modify** | Add `saveWithGoogle(FirebaseUser)` and `saveWithEmail(FirebaseUser)` |
| `customer-app/app/src/main/kotlin/…/domain/auth/AuthOrchestrator.kt` | **Modify** | Inject 3 new deps; add 4 public methods + private `linkOrSignIn()` |
| `customer-app/app/src/main/kotlin/…/data/auth/di/AuthModule.kt` | **Modify** | Add `provideCredentialManager()` |
| `customer-app/app/src/test/kotlin/…/domain/auth/GoogleSignInUseCaseTest.kt` | **Create** | JUnit 5 + MockK; 4 cases |
| `customer-app/app/src/test/kotlin/…/domain/auth/EmailPasswordUseCaseTest.kt` | **Create** | JUnit 5 + MockK; 9 cases |
| `customer-app/app/src/test/kotlin/…/domain/auth/AuthOrchestratorTest.kt` | **Modify** | Add 6 new test cases for Google + email paths + account linking |
| `customer-app/app/src/test/kotlin/…/data/auth/SessionManagerTest.kt` | **Modify** | Add 3 new cases: round-trip email/displayName/authProvider; old-session default |

Throughout: `…` = `com/homeservices/customer`.

---

## Task 1: Gradle Dependencies + ProGuard

**Files:**
- Modify: `customer-app/gradle/libs.versions.toml`
- Modify: `customer-app/app/build.gradle.kts`
- Modify: `customer-app/app/proguard-rules.pro`

- [ ] **Step 1.1 — Add version catalogue entries**

In `customer-app/gradle/libs.versions.toml`, add inside `[versions]` (keep alphabetical order):
```toml
credentials = "1.3.0"
googleIdentity = "1.1.1"
```

In the `[libraries]` section, add:
```toml
androidx-credentials = { module = "androidx.credentials:credentials", version.ref = "credentials" }
androidx-credentials-playservices = { module = "androidx.credentials:credentials-play-services-auth", version.ref = "credentials" }
google-identity-googleid = { module = "com.google.android.libraries.identity.googleid:googleid", version.ref = "googleIdentity" }
```

- [ ] **Step 1.2 — Wire dependencies into app/build.gradle.kts**

In `customer-app/app/build.gradle.kts`, inside the `dependencies { }` block add after the existing Firebase lines:
```kotlin
implementation(libs.androidx.credentials)
implementation(libs.androidx.credentials.playservices)
implementation(libs.google.identity.googleid)
```

- [ ] **Step 1.3 — Add ProGuard keep rules**

In `customer-app/app/proguard-rules.pro`, append:
```proguard
# Credential Manager + Google Identity Library
-keep class androidx.credentials.** { *; }
-keep class com.google.android.libraries.identity.googleid.** { *; }
# Firebase Google auth provider
-keep class com.google.firebase.auth.GoogleAuthProvider { *; }
-keep class com.google.firebase.auth.FirebaseAuthUserCollisionException { *; }
```

- [ ] **Step 1.4 — Verify build**
```bash
cd customer-app && ./gradlew assembleDebug --quiet
```
Expected: `BUILD SUCCESSFUL`. Fix any unresolved-dependency errors before continuing.

- [ ] **Step 1.5 — Commit**
```bash
git add customer-app/gradle/libs.versions.toml customer-app/app/build.gradle.kts customer-app/app/proguard-rules.pro
git commit -m "build(e02-s05-a): add Credential Manager + Google Identity Library deps"
```

---

## Task 2: AuthProvider Sealed Class + AuthResult Error Extensions

**Files:**
- Create: `customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/model/AuthProvider.kt`
- Modify: `customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/model/AuthResult.kt`

- [ ] **Step 2.1 — Write the failing test**

Create `customer-app/app/src/test/kotlin/com/homeservices/customer/domain/auth/model/AuthProviderTest.kt`:
```kotlin
package com.homeservices.customer.domain.auth.model

import org.junit.jupiter.api.Assertions.assertInstanceOf
import org.junit.jupiter.api.Test

internal class AuthProviderTest {
    @Test
    fun `AuthProvider Phone is a singleton data object`() {
        assertInstanceOf(AuthProvider.Phone::class.java, AuthProvider.Phone)
    }

    @Test
    fun `AuthResult Error EmailAlreadyInUse is distinct from WrongCredential`() {
        val a: AuthResult = AuthResult.Error.EmailAlreadyInUse
        val b: AuthResult = AuthResult.Error.WrongCredential
        assert(a != b)
    }
}
```

- [ ] **Step 2.2 — Run test to verify it fails**
```bash
cd customer-app && ./gradlew :app:test --tests "*.AuthProviderTest" --quiet
```
Expected: compile error — `AuthProvider` and new `AuthResult.Error` subtypes not found.

- [ ] **Step 2.3 — Create AuthProvider.kt**

Create `customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/model/AuthProvider.kt`:
```kotlin
package com.homeservices.customer.domain.auth.model

public sealed class AuthProvider {
    public data object Phone : AuthProvider()
    public data object Google : AuthProvider()
    public data object Email : AuthProvider()
}
```

- [ ] **Step 2.4 — Extend AuthResult.kt**

Open `customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/model/AuthResult.kt`.

The current `Error` sealed class ends before the closing brace. Add five new subtypes:
```kotlin
public sealed class AuthResult {
    public data class Success(
        val user: com.google.firebase.auth.FirebaseUser,
    ) : AuthResult()

    public data object Cancelled : AuthResult()

    public data object Unavailable : AuthResult()

    public sealed class Error : AuthResult() {
        public data class General(
            val cause: Throwable,
        ) : Error()

        public data object RateLimited : Error()

        public data object WrongCode : Error()

        public data object CodeExpired : Error()

        // New for E02-S05-A:
        public data object WrongCredential : Error()

        public data object UserNotFound : Error()

        public data object EmailAlreadyInUse : Error()

        public data object WeakPassword : Error()

        public data object InvalidEmail : Error()
    }
}
```

- [ ] **Step 2.5 — Run test to verify it passes**
```bash
cd customer-app && ./gradlew :app:test --tests "*.AuthProviderTest" --quiet
```
Expected: `BUILD SUCCESSFUL`, 2 tests pass.

- [ ] **Step 2.6 — Commit**
```bash
git add customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/model/AuthProvider.kt \
        customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/model/AuthResult.kt \
        customer-app/app/src/test/kotlin/com/homeservices/customer/domain/auth/model/AuthProviderTest.kt
git commit -m "feat(e02-s05-a): AuthProvider sealed class + AuthResult email error subtypes"
```

---

## Task 3: AuthState + SessionManager Extensions

**Files:**
- Modify: `customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/model/AuthState.kt`
- Modify: `customer-app/app/src/main/kotlin/com/homeservices/customer/data/auth/SessionManager.kt`
- Modify: `customer-app/app/src/test/kotlin/com/homeservices/customer/data/auth/SessionManagerTest.kt`

- [ ] **Step 3.1 — Write failing SessionManager tests**

Open `customer-app/app/src/test/kotlin/com/homeservices/customer/data/auth/SessionManagerTest.kt` and add these three test methods inside the existing test class (after the last existing test):

```kotlin
@Test
fun `saveSession with email provider — round-trips email and displayName`() = runTest {
    sut.saveSession(
        uid = "uid-email",
        email = "user@example.com",
        displayName = "Alice",
        authProvider = AuthProvider.Email,
    )
    val state = sut.authState.value as AuthState.Authenticated
    assertThat(state.uid).isEqualTo("uid-email")
    assertThat(state.email).isEqualTo("user@example.com")
    assertThat(state.displayName).isEqualTo("Alice")
    assertThat(state.authProvider).isEqualTo(AuthProvider.Email)
}

@Test
fun `saveSession with Google provider — round-trips displayName`() = runTest {
    sut.saveSession(
        uid = "uid-google",
        email = "alice@gmail.com",
        displayName = "Alice G",
        authProvider = AuthProvider.Google,
    )
    val state = sut.authState.value as AuthState.Authenticated
    assertThat(state.authProvider).isEqualTo(AuthProvider.Google)
    assertThat(state.displayName).isEqualTo("Alice G")
}

@Test
fun `old session missing new keys — defaults to Phone provider and null email`() {
    // Write a session without the new keys (simulates pre-E02-S05 data)
    prefs.edit()
        .putString("uid", "old-uid")
        .putLong("session_created_at_epoch_ms", System.currentTimeMillis())
        .apply()
    // Create fresh SessionManager to trigger readInitialState()
    val freshSut = SessionManager(prefs)
    val state = freshSut.authState.value as AuthState.Authenticated
    assertThat(state.authProvider).isEqualTo(AuthProvider.Phone)
    assertThat(state.email).isNull()
    assertThat(state.displayName).isNull()
}
```

Note: `prefs` and `sut` are the existing fields in the test class. The test uses `assertThat` from `com.google.common.truth.Truth` (already on the classpath via Firebase test deps).

- [ ] **Step 3.2 — Run tests to verify they fail**
```bash
cd customer-app && ./gradlew :app:test --tests "*.SessionManagerTest" --quiet
```
Expected: compile errors — new `saveSession` overload and new `AuthState.Authenticated` fields not found.

- [ ] **Step 3.3 — Extend AuthState.kt**

Replace the entire contents of `customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/model/AuthState.kt`:
```kotlin
package com.homeservices.customer.domain.auth.model

public sealed class AuthState {
    public data object Unauthenticated : AuthState()

    public data class Authenticated(
        public val uid: String,
        public val phoneLastFour: String? = null,
        public val email: String? = null,
        public val displayName: String? = null,
        public val authProvider: AuthProvider = AuthProvider.Phone,
    ) : AuthState()
}
```

- [ ] **Step 3.4 — Extend SessionManager.kt**

Replace the entire contents of `customer-app/app/src/main/kotlin/com/homeservices/customer/data/auth/SessionManager.kt`:
```kotlin
package com.homeservices.customer.data.auth

import android.content.SharedPreferences
import com.homeservices.customer.data.auth.di.AuthPrefs
import com.homeservices.customer.domain.auth.model.AuthProvider
import com.homeservices.customer.domain.auth.model.AuthState
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class SessionManager
    @Inject
    constructor(
        @AuthPrefs private val prefs: SharedPreferences,
    ) {
        private companion object {
            const val KEY_UID = "uid"
            const val KEY_PHONE_LAST_FOUR = "phone_last_four"
            const val KEY_SESSION_CREATED_AT = "session_created_at_epoch_ms"
            const val KEY_EMAIL = "email"
            const val KEY_DISPLAY_NAME = "display_name"
            const val KEY_AUTH_PROVIDER = "auth_provider"
            val SESSION_TTL_MS = TimeUnit.DAYS.toMillis(180)
        }

        private val _authState = MutableStateFlow(readInitialState())
        public val authState: StateFlow<AuthState> = _authState.asStateFlow()

        private fun readInitialState(): AuthState {
            val uid = prefs.getString(KEY_UID, null)
            val createdAt = prefs.getLong(KEY_SESSION_CREATED_AT, 0L)
            val sessionExpired =
                uid == null ||
                    createdAt == 0L ||
                    System.currentTimeMillis() - createdAt > SESSION_TTL_MS
            return if (sessionExpired) {
                if (uid != null) clearPrefs()
                AuthState.Unauthenticated
            } else {
                AuthState.Authenticated(
                    uid = uid!!,
                    phoneLastFour = prefs.getString(KEY_PHONE_LAST_FOUR, null),
                    email = prefs.getString(KEY_EMAIL, null),
                    displayName = prefs.getString(KEY_DISPLAY_NAME, null),
                    authProvider = parseProvider(prefs.getString(KEY_AUTH_PROVIDER, null)),
                )
            }
        }

        private fun parseProvider(raw: String?): AuthProvider = when (raw) {
            "google" -> AuthProvider.Google
            "email" -> AuthProvider.Email
            else -> AuthProvider.Phone
        }

        private fun providerKey(provider: AuthProvider): String = when (provider) {
            AuthProvider.Phone -> "phone"
            AuthProvider.Google -> "google"
            AuthProvider.Email -> "email"
        }

        public suspend fun saveSession(
            uid: String,
            phoneLastFour: String? = null,
            email: String? = null,
            displayName: String? = null,
            authProvider: AuthProvider = AuthProvider.Phone,
        ) {
            withContext(Dispatchers.IO) {
                prefs
                    .edit()
                    .putString(KEY_UID, uid)
                    .apply { if (phoneLastFour != null) putString(KEY_PHONE_LAST_FOUR, phoneLastFour) }
                    .apply { if (email != null) putString(KEY_EMAIL, email) }
                    .apply { if (displayName != null) putString(KEY_DISPLAY_NAME, displayName) }
                    .putString(KEY_AUTH_PROVIDER, providerKey(authProvider))
                    .putLong(KEY_SESSION_CREATED_AT, System.currentTimeMillis())
                    .apply()
            }
            _authState.value = AuthState.Authenticated(
                uid = uid,
                phoneLastFour = phoneLastFour,
                email = email,
                displayName = displayName,
                authProvider = authProvider,
            )
        }

        public suspend fun clearSession() {
            withContext(Dispatchers.IO) { clearPrefs() }
            _authState.value = AuthState.Unauthenticated
        }

        private fun clearPrefs() {
            prefs.edit().clear().apply()
        }
    }
```

- [ ] **Step 3.5 — Fix existing SaveSessionUseCase call sites**

Open `customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/SaveSessionUseCase.kt`.

The existing `save(user, phoneLastFour)` calls `sessionManager.saveSession(uid, phoneLastFour)`. Update it to pass named params:
```kotlin
public suspend fun save(
    user: FirebaseUser,
    phoneLastFour: String,
) {
    sessionManager.saveSession(
        uid = user.uid,
        phoneLastFour = phoneLastFour,
        authProvider = AuthProvider.Phone,
    )
}
```

Also update `saveAnonymousWithPhone`:
```kotlin
public suspend fun saveAnonymousWithPhone(phoneNumber: String): AuthResult {
    return try {
        val result = firebaseAuth.signInAnonymously().await()
        val user = result.user ?: return AuthResult.Error.General(
            IllegalStateException("null user after anonymous sign-in"),
        )
        val lastFour = phoneNumber.takeLast(PHONE_LAST_DIGITS)
        sessionManager.saveSession(
            uid = user.uid,
            phoneLastFour = lastFour,
            authProvider = AuthProvider.Phone,
        )
        AuthResult.Success(user)
    } catch (e: FirebaseException) {
        AuthResult.Error.General(e)
    }
}
```

Add required imports at the top of `SaveSessionUseCase.kt`:
```kotlin
import com.homeservices.customer.domain.auth.model.AuthProvider
```

- [ ] **Step 3.6 — Run SessionManager tests**
```bash
cd customer-app && ./gradlew :app:test --tests "*.SessionManagerTest" --quiet
```
Expected: `BUILD SUCCESSFUL`, all tests pass including the 3 new ones.

- [ ] **Step 3.7 — Run full test suite to check no regressions**
```bash
cd customer-app && ./gradlew :app:test --quiet
```
Expected: `BUILD SUCCESSFUL`.

- [ ] **Step 3.8 — Commit**
```bash
git add customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/model/AuthState.kt \
        customer-app/app/src/main/kotlin/com/homeservices/customer/data/auth/SessionManager.kt \
        customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/SaveSessionUseCase.kt \
        customer-app/app/src/test/kotlin/com/homeservices/customer/data/auth/SessionManagerTest.kt
git commit -m "feat(e02-s05-a): extend AuthState + SessionManager for email/Google provider fields"
```

---

## Task 4: SaveSessionUseCase — saveWithGoogle + saveWithEmail

**Files:**
- Modify: `customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/SaveSessionUseCase.kt`
- Modify: `customer-app/app/src/test/kotlin/com/homeservices/customer/domain/auth/SaveSessionUseCaseTest.kt`

- [ ] **Step 4.1 — Write failing tests**

Open `customer-app/app/src/test/kotlin/com/homeservices/customer/domain/auth/SaveSessionUseCaseTest.kt` and add inside the existing test class:

```kotlin
@Test
fun `saveWithGoogle — calls sessionManager with Google provider and email`() = runTest {
    val mockUser: FirebaseUser = mockk {
        every { uid } returns "google-uid"
        every { email } returns "alice@gmail.com"
        every { displayName } returns "Alice"
    }
    sut.saveWithGoogle(mockUser)
    coVerify {
        sessionManager.saveSession(
            uid = "google-uid",
            email = "alice@gmail.com",
            displayName = "Alice",
            authProvider = AuthProvider.Google,
        )
    }
}

@Test
fun `saveWithEmail — calls sessionManager with Email provider`() = runTest {
    val mockUser: FirebaseUser = mockk {
        every { uid } returns "email-uid"
        every { email } returns "user@example.com"
        every { displayName } returns null
    }
    sut.saveWithEmail(mockUser)
    coVerify {
        sessionManager.saveSession(
            uid = "email-uid",
            email = "user@example.com",
            displayName = null,
            authProvider = AuthProvider.Email,
        )
    }
}
```

Note: `sut` and `sessionManager` are the existing fields in the test class.

- [ ] **Step 4.2 — Run tests to verify they fail**
```bash
cd customer-app && ./gradlew :app:test --tests "*.SaveSessionUseCaseTest" --quiet
```
Expected: compile error — `saveWithGoogle` and `saveWithEmail` not found.

- [ ] **Step 4.3 — Add new methods to SaveSessionUseCase.kt**

Open `customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/SaveSessionUseCase.kt` and add after the existing `save()` method:
```kotlin
public suspend fun saveWithGoogle(user: FirebaseUser) {
    sessionManager.saveSession(
        uid = user.uid,
        email = user.email,
        displayName = user.displayName,
        authProvider = AuthProvider.Google,
    )
}

public suspend fun saveWithEmail(user: FirebaseUser) {
    sessionManager.saveSession(
        uid = user.uid,
        email = user.email,
        displayName = user.displayName,
        authProvider = AuthProvider.Email,
    )
}
```

- [ ] **Step 4.4 — Run tests to verify they pass**
```bash
cd customer-app && ./gradlew :app:test --tests "*.SaveSessionUseCaseTest" --quiet
```
Expected: `BUILD SUCCESSFUL`, all tests pass.

- [ ] **Step 4.5 — Commit**
```bash
git add customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/SaveSessionUseCase.kt \
        customer-app/app/src/test/kotlin/com/homeservices/customer/domain/auth/SaveSessionUseCaseTest.kt
git commit -m "feat(e02-s05-a): SaveSessionUseCase — saveWithGoogle + saveWithEmail"
```

---

## Task 5: EmailPasswordUseCase (TDD)

**Files:**
- Create: `customer-app/app/src/test/kotlin/com/homeservices/customer/domain/auth/EmailPasswordUseCaseTest.kt`
- Create: `customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/EmailPasswordUseCase.kt`

Read `docs/patterns/firebase-errorcode-mapping.md` and `docs/patterns/firebase-callbackflow-lifecycle.md` before this task.

- [ ] **Step 5.1 — Write the full test file (all cases first)**

Create `customer-app/app/src/test/kotlin/com/homeservices/customer/domain/auth/EmailPasswordUseCaseTest.kt`:
```kotlin
package com.homeservices.customer.domain.auth

import com.google.android.gms.tasks.Tasks
import com.google.firebase.auth.AuthResult
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseAuthInvalidCredentialsException
import com.google.firebase.auth.FirebaseAuthInvalidUserException
import com.google.firebase.auth.FirebaseAuthUserCollisionException
import com.google.firebase.auth.FirebaseAuthWeakPasswordException
import com.google.firebase.auth.FirebaseUser
import com.homeservices.customer.domain.auth.model.AuthResult as AppAuthResult
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.test.runTest
import org.junit.jupiter.api.Assertions.assertInstanceOf
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

internal class EmailPasswordUseCaseTest {

    private lateinit var firebaseAuth: FirebaseAuth
    private lateinit var sut: EmailPasswordUseCase

    @BeforeEach
    fun setUp() {
        firebaseAuth = mockk()
        sut = EmailPasswordUseCase(firebaseAuth)
    }

    // ── signIn ──────────────────────────────────────────────────────────────

    @Test
    fun `signIn — success — emits Success with FirebaseUser`() = runTest {
        val mockUser: FirebaseUser = mockk(relaxed = true)
        val mockAuthResult: AuthResult = mockk { every { user } returns mockUser }
        every { firebaseAuth.signInWithEmailAndPassword(any(), any()) } returns
            Tasks.forResult(mockAuthResult)

        val results = sut.signIn("a@b.com", "pass1234").toList()

        assertInstanceOf(AppAuthResult.Success::class.java, results.single())
    }

    @Test
    fun `signIn — FirebaseAuthInvalidCredentialsException — emits WrongCredential`() = runTest {
        val ex: FirebaseAuthInvalidCredentialsException = mockk(relaxed = true) {
            every { errorCode } returns "ERROR_WRONG_PASSWORD"
        }
        every { firebaseAuth.signInWithEmailAndPassword(any(), any()) } returns Tasks.forException(ex)

        val results = sut.signIn("a@b.com", "wrong").toList()

        assertInstanceOf(AppAuthResult.Error.WrongCredential::class.java, results.single())
    }

    @Test
    fun `signIn — FirebaseAuthInvalidUserException USER_NOT_FOUND — emits UserNotFound`() = runTest {
        val ex: FirebaseAuthInvalidUserException = mockk(relaxed = true) {
            every { errorCode } returns "ERROR_USER_NOT_FOUND"
        }
        every { firebaseAuth.signInWithEmailAndPassword(any(), any()) } returns Tasks.forException(ex)

        val results = sut.signIn("nobody@b.com", "pass").toList()

        assertInstanceOf(AppAuthResult.Error.UserNotFound::class.java, results.single())
    }

    @Test
    fun `signIn — FirebaseAuthInvalidCredentialsException INVALID_EMAIL — emits InvalidEmail`() = runTest {
        val ex: FirebaseAuthInvalidCredentialsException = mockk(relaxed = true) {
            every { errorCode } returns "ERROR_INVALID_EMAIL"
        }
        every { firebaseAuth.signInWithEmailAndPassword(any(), any()) } returns Tasks.forException(ex)

        val results = sut.signIn("not-an-email", "pass").toList()

        assertInstanceOf(AppAuthResult.Error.InvalidEmail::class.java, results.single())
    }

    // ── signUp ──────────────────────────────────────────────────────────────

    @Test
    fun `signUp — success — emits Success`() = runTest {
        val mockUser: FirebaseUser = mockk(relaxed = true)
        val mockAuthResult: AuthResult = mockk { every { user } returns mockUser }
        every { firebaseAuth.createUserWithEmailAndPassword(any(), any()) } returns
            Tasks.forResult(mockAuthResult)

        val results = sut.signUp("new@b.com", "pass1234").toList()

        assertInstanceOf(AppAuthResult.Success::class.java, results.single())
    }

    @Test
    fun `signUp — FirebaseAuthUserCollisionException — emits EmailAlreadyInUse`() = runTest {
        val ex: FirebaseAuthUserCollisionException = mockk(relaxed = true) {
            every { errorCode } returns "ERROR_EMAIL_ALREADY_IN_USE"
        }
        every { firebaseAuth.createUserWithEmailAndPassword(any(), any()) } returns
            Tasks.forException(ex)

        val results = sut.signUp("exists@b.com", "pass1234").toList()

        assertInstanceOf(AppAuthResult.Error.EmailAlreadyInUse::class.java, results.single())
    }

    @Test
    fun `signUp — FirebaseAuthWeakPasswordException — emits WeakPassword`() = runTest {
        val ex: FirebaseAuthWeakPasswordException = mockk(relaxed = true) {
            every { errorCode } returns "ERROR_WEAK_PASSWORD"
        }
        every { firebaseAuth.createUserWithEmailAndPassword(any(), any()) } returns
            Tasks.forException(ex)

        val results = sut.signUp("a@b.com", "12").toList()

        assertInstanceOf(AppAuthResult.Error.WeakPassword::class.java, results.single())
    }

    // ── sendPasswordReset ────────────────────────────────────────────────────

    @Test
    fun `sendPasswordReset — success — emits Result success`() = runTest {
        every { firebaseAuth.sendPasswordResetEmail(any()) } returns Tasks.forResult(null)

        val results = sut.sendPasswordReset("a@b.com").toList()

        assert(results.single().isSuccess)
    }

    @Test
    fun `sendPasswordReset — failure — emits Result failure`() = runTest {
        every { firebaseAuth.sendPasswordResetEmail(any()) } returns
            Tasks.forException(RuntimeException("network"))

        val results = sut.sendPasswordReset("a@b.com").toList()

        assert(results.single().isFailure)
    }
}
```

- [ ] **Step 5.2 — Run tests to verify they fail**
```bash
cd customer-app && ./gradlew :app:test --tests "*.EmailPasswordUseCaseTest" --quiet
```
Expected: compile error — `EmailPasswordUseCase` not found.

- [ ] **Step 5.3 — Implement EmailPasswordUseCase.kt**

Create `customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/EmailPasswordUseCase.kt`:
```kotlin
package com.homeservices.customer.domain.auth

import com.google.firebase.FirebaseException
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseAuthInvalidCredentialsException
import com.google.firebase.auth.FirebaseAuthInvalidUserException
import com.google.firebase.auth.FirebaseAuthUserCollisionException
import com.google.firebase.auth.FirebaseAuthWeakPasswordException
import com.homeservices.customer.domain.auth.model.AuthResult
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class EmailPasswordUseCase
    @Inject
    constructor(
        private val firebaseAuth: FirebaseAuth,
    ) {
        public fun signIn(
            email: String,
            password: String,
        ): Flow<AuthResult> = flow {
            emit(
                try {
                    val result = firebaseAuth.signInWithEmailAndPassword(email, password).await()
                    AuthResult.Success(result.user!!)
                } catch (e: FirebaseAuthInvalidCredentialsException) {
                    if (e.errorCode == "ERROR_INVALID_EMAIL") AuthResult.Error.InvalidEmail
                    else AuthResult.Error.WrongCredential
                } catch (e: FirebaseAuthInvalidUserException) {
                    AuthResult.Error.UserNotFound
                } catch (e: FirebaseException) {
                    AuthResult.Error.General(e)
                }
            )
        }

        public fun signUp(
            email: String,
            password: String,
        ): Flow<AuthResult> = flow {
            emit(
                try {
                    val result = firebaseAuth.createUserWithEmailAndPassword(email, password).await()
                    AuthResult.Success(result.user!!)
                } catch (e: FirebaseAuthUserCollisionException) {
                    AuthResult.Error.EmailAlreadyInUse
                } catch (e: FirebaseAuthWeakPasswordException) {
                    AuthResult.Error.WeakPassword
                } catch (e: FirebaseAuthInvalidCredentialsException) {
                    AuthResult.Error.InvalidEmail
                } catch (e: FirebaseException) {
                    AuthResult.Error.General(e)
                }
            )
        }

        public fun sendPasswordReset(email: String): Flow<Result<Unit>> = flow {
            emit(
                try {
                    firebaseAuth.sendPasswordResetEmail(email).await()
                    Result.success(Unit)
                } catch (e: Exception) {
                    Result.failure(e)
                }
            )
        }
    }
```

- [ ] **Step 5.4 — Run tests to verify they pass**
```bash
cd customer-app && ./gradlew :app:test --tests "*.EmailPasswordUseCaseTest" --quiet
```
Expected: `BUILD SUCCESSFUL`, 9 tests pass.

- [ ] **Step 5.5 — Commit**
```bash
git add customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/EmailPasswordUseCase.kt \
        customer-app/app/src/test/kotlin/com/homeservices/customer/domain/auth/EmailPasswordUseCaseTest.kt
git commit -m "feat(e02-s05-a): EmailPasswordUseCase — signIn, signUp, sendPasswordReset (TDD)"
```

---

## Task 6: GoogleSignInResult + GoogleSignInUseCase (TDD)

**Files:**
- Create: `customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/model/GoogleSignInResult.kt`
- Create: `customer-app/app/src/test/kotlin/com/homeservices/customer/domain/auth/GoogleSignInUseCaseTest.kt`
- Create: `customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/GoogleSignInUseCase.kt`

- [ ] **Step 6.1 — Create GoogleSignInResult.kt first**

Create `customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/model/GoogleSignInResult.kt`:
```kotlin
package com.homeservices.customer.domain.auth.model

import com.google.firebase.auth.AuthCredential

public sealed class GoogleSignInResult {
    public data class CredentialObtained(
        public val credential: AuthCredential,
    ) : GoogleSignInResult()

    public data object Cancelled : GoogleSignInResult()

    public data object Unavailable : GoogleSignInResult()

    public data class Error(
        public val cause: Throwable,
    ) : GoogleSignInResult()
}
```

- [ ] **Step 6.2 — Write the test file**

Create `customer-app/app/src/test/kotlin/com/homeservices/customer/domain/auth/GoogleSignInUseCaseTest.kt`:
```kotlin
package com.homeservices.customer.domain.auth

import android.content.Context
import androidx.credentials.CredentialManager
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.NoCredentialException
import androidx.fragment.app.FragmentActivity
import com.homeservices.customer.domain.auth.model.GoogleSignInResult
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.jupiter.api.Assertions.assertInstanceOf
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

internal class GoogleSignInUseCaseTest {

    private lateinit var credentialManager: CredentialManager
    private lateinit var context: Context
    private lateinit var activity: FragmentActivity
    private lateinit var sut: GoogleSignInUseCase

    @BeforeEach
    fun setUp() {
        credentialManager = mockk()
        context = mockk(relaxed = true) {
            // default_web_client_id is auto-generated; return a dummy string in tests
            io.mockk.every { getString(any()) } returns "fake-web-client-id"
        }
        activity = mockk(relaxed = true)
        sut = GoogleSignInUseCase(credentialManager, context)
    }

    @Test
    fun `getCredential — GetCredentialCancellationException — returns Cancelled`() = runTest {
        coEvery { credentialManager.getCredential(any<Context>(), any()) } throws
            GetCredentialCancellationException()

        val result = sut.getCredential(activity)

        assertInstanceOf(GoogleSignInResult.Cancelled::class.java, result)
    }

    @Test
    fun `getCredential — NoCredentialException — returns Unavailable`() = runTest {
        coEvery { credentialManager.getCredential(any<Context>(), any()) } throws
            NoCredentialException()

        val result = sut.getCredential(activity)

        assertInstanceOf(GoogleSignInResult.Unavailable::class.java, result)
    }

    @Test
    fun `getCredential — unexpected exception — returns Error`() = runTest {
        coEvery { credentialManager.getCredential(any<Context>(), any()) } throws
            RuntimeException("unexpected")

        val result = sut.getCredential(activity)

        assertInstanceOf(GoogleSignInResult.Error::class.java, result)
        assert((result as GoogleSignInResult.Error).cause.message == "unexpected")
    }

    // Note: Testing CredentialObtained requires a real GoogleIdTokenCredential which is a
    // final class — covered by E2E / manual testing after google-services.json is populated.
}
```

- [ ] **Step 6.3 — Run tests to verify they fail**
```bash
cd customer-app && ./gradlew :app:test --tests "*.GoogleSignInUseCaseTest" --quiet
```
Expected: compile error — `GoogleSignInUseCase` not found.

- [ ] **Step 6.4 — Implement GoogleSignInUseCase.kt**

Create `customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/GoogleSignInUseCase.kt`:
```kotlin
package com.homeservices.customer.domain.auth

import android.content.Context
import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.NoCredentialException
import androidx.fragment.app.FragmentActivity
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.firebase.auth.GoogleAuthProvider
import com.homeservices.customer.domain.auth.model.GoogleSignInResult
import dagger.hilt.android.qualifiers.ApplicationContext
import java.security.SecureRandom
import java.util.Base64
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class GoogleSignInUseCase
    @Inject
    constructor(
        private val credentialManager: CredentialManager,
        @ApplicationContext private val context: Context,
    ) {
        @Suppress("TooGenericExceptionCaught")
        public suspend fun getCredential(activity: FragmentActivity): GoogleSignInResult {
            return try {
                val nonce = generateNonce()
                val googleIdOption = GetGoogleIdOption.Builder()
                    .setFilterByAuthorizedAccounts(false)
                    .setServerClientId(context.getString(com.homeservices.customer.R.string.default_web_client_id))
                    .setNonce(nonce)
                    .build()
                val request = GetCredentialRequest.Builder()
                    .addCredentialOption(googleIdOption)
                    .build()
                val response = credentialManager.getCredential(context = activity, request = request)
                val googleIdTokenCredential = GoogleIdTokenCredential.createFrom(response.credential.data)
                val firebaseCredential = GoogleAuthProvider.getCredential(googleIdTokenCredential.idToken, null)
                GoogleSignInResult.CredentialObtained(firebaseCredential)
            } catch (e: GetCredentialCancellationException) {
                GoogleSignInResult.Cancelled
            } catch (e: NoCredentialException) {
                GoogleSignInResult.Unavailable
            } catch (e: Exception) {
                GoogleSignInResult.Error(e)
            }
        }

        private fun generateNonce(): String {
            val bytes = ByteArray(16)
            SecureRandom().nextBytes(bytes)
            return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes)
        }
    }
```

- [ ] **Step 6.5 — Run tests to verify they pass**
```bash
cd customer-app && ./gradlew :app:test --tests "*.GoogleSignInUseCaseTest" --quiet
```
Expected: `BUILD SUCCESSFUL`, 3 tests pass.

- [ ] **Step 6.6 — Commit**
```bash
git add customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/model/GoogleSignInResult.kt \
        customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/GoogleSignInUseCase.kt \
        customer-app/app/src/test/kotlin/com/homeservices/customer/domain/auth/GoogleSignInUseCaseTest.kt
git commit -m "feat(e02-s05-a): GoogleSignInUseCase + GoogleSignInResult (TDD)"
```

---

## Task 7: AuthOrchestrator Extension + Account Linking (TDD)

**Files:**
- Modify: `customer-app/app/src/test/kotlin/com/homeservices/customer/domain/auth/AuthOrchestratorTest.kt`
- Modify: `customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/AuthOrchestrator.kt`

- [ ] **Step 7.1 — Write failing tests**

Open `customer-app/app/src/test/kotlin/com/homeservices/customer/domain/auth/AuthOrchestratorTest.kt`.

Add these new test methods inside the existing test class (add mock fields alongside existing ones):

```kotlin
// New mock fields — add to existing field declarations:
private val googleSignInUseCase: GoogleSignInUseCase = mockk()
private val emailPasswordUseCase: EmailPasswordUseCase = mockk()
private val firebaseAuth: FirebaseAuth = mockk()
```

Then in the `setUp()` / `@BeforeEach`, recreate `sut` with the new signature. Replace the existing `sut` instantiation with:
```kotlin
sut = AuthOrchestrator(
    truecallerUseCase = truecallerUseCase,
    firebaseOtpUseCase = firebaseOtpUseCase,
    saveSessionUseCase = saveSessionUseCase,
    googleSignInUseCase = googleSignInUseCase,
    emailPasswordUseCase = emailPasswordUseCase,
    firebaseAuth = firebaseAuth,
)
```

Add new test methods:
```kotlin
@Test
fun `startGoogleSignIn — CredentialObtained, no anonymous user — calls signInWithCredential and saveWithGoogle`() = runTest {
    val mockCredential: AuthCredential = mockk()
    val mockUser: FirebaseUser = mockk(relaxed = true)
    val mockAuthResult: com.google.firebase.auth.AuthResult = mockk { every { user } returns mockUser }
    val mockTask = Tasks.forResult(mockAuthResult)

    coEvery { googleSignInUseCase.getCredential(any()) } returns GoogleSignInResult.CredentialObtained(mockCredential)
    every { firebaseAuth.currentUser } returns null
    every { firebaseAuth.signInWithCredential(mockCredential) } returns mockTask
    coEvery { saveSessionUseCase.saveWithGoogle(mockUser) } returns Unit

    val results = sut.startGoogleSignIn(mockActivity).toList()

    assertInstanceOf(com.homeservices.customer.domain.auth.model.AuthResult.Success::class.java, results.single())
    coVerify { saveSessionUseCase.saveWithGoogle(mockUser) }
}

@Test
fun `startGoogleSignIn — CredentialObtained, anonymous user — calls linkWithCredential instead`() = runTest {
    val mockCredential: AuthCredential = mockk()
    val mockAnonymousUser: FirebaseUser = mockk {
        every { isAnonymous } returns true
        io.mockk.every { linkWithCredential(mockCredential) } returns Tasks.forResult(mockk { every { user } returns mockk(relaxed = true) })
    }
    val mockUser: FirebaseUser = mockk(relaxed = true)

    coEvery { googleSignInUseCase.getCredential(any()) } returns GoogleSignInResult.CredentialObtained(mockCredential)
    every { firebaseAuth.currentUser } returns mockAnonymousUser
    coEvery { saveSessionUseCase.saveWithGoogle(any()) } returns Unit

    val results = sut.startGoogleSignIn(mockActivity).toList()

    assertInstanceOf(com.homeservices.customer.domain.auth.model.AuthResult.Success::class.java, results.single())
    verify { mockAnonymousUser.linkWithCredential(mockCredential) }
}

@Test
fun `startGoogleSignIn — Cancelled — emits Cancelled`() = runTest {
    coEvery { googleSignInUseCase.getCredential(any()) } returns GoogleSignInResult.Cancelled

    val results = sut.startGoogleSignIn(mockActivity).toList()

    assertInstanceOf(com.homeservices.customer.domain.auth.model.AuthResult.Cancelled::class.java, results.single())
}

@Test
fun `startEmailSignIn — delegates to emailPasswordUseCase and returns result`() = runTest {
    val mockUser: FirebaseUser = mockk(relaxed = true)
    every { emailPasswordUseCase.signIn(any(), any()) } returns flowOf(
        com.homeservices.customer.domain.auth.model.AuthResult.Success(mockUser)
    )
    coEvery { saveSessionUseCase.saveWithEmail(mockUser) } returns Unit

    val results = sut.startEmailSignIn("a@b.com", "pass").toList()

    assertInstanceOf(com.homeservices.customer.domain.auth.model.AuthResult.Success::class.java, results.single())
    coVerify { saveSessionUseCase.saveWithEmail(mockUser) }
}

@Test
fun `startEmailSignUp — no anonymous user — delegates to emailPasswordUseCase signUp`() = runTest {
    val mockUser: FirebaseUser = mockk(relaxed = true)
    every { emailPasswordUseCase.signUp(any(), any()) } returns flowOf(
        com.homeservices.customer.domain.auth.model.AuthResult.Success(mockUser)
    )
    every { firebaseAuth.currentUser } returns null
    coEvery { saveSessionUseCase.saveWithEmail(mockUser) } returns Unit

    val results = sut.startEmailSignUp("a@b.com", "pass1234").toList()

    assertInstanceOf(com.homeservices.customer.domain.auth.model.AuthResult.Success::class.java, results.single())
}

@Test
fun `sendPasswordReset — delegates to emailPasswordUseCase`() = runTest {
    every { emailPasswordUseCase.sendPasswordReset(any()) } returns flowOf(Result.success(Unit))

    val results = sut.sendPasswordReset("a@b.com").toList()

    assert(results.single().isSuccess)
}
```

Add missing imports at the top of the test file:
```kotlin
import com.google.android.gms.tasks.Tasks
import com.google.firebase.auth.AuthCredential
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.homeservices.customer.domain.auth.model.GoogleSignInResult
import kotlinx.coroutines.flow.flowOf
```

- [ ] **Step 7.2 — Run tests to verify they fail**
```bash
cd customer-app && ./gradlew :app:test --tests "*.AuthOrchestratorTest" --quiet
```
Expected: compile error — `AuthOrchestrator` missing new constructor params.

- [ ] **Step 7.3 — Extend AuthOrchestrator.kt**

Replace the entire contents of `customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/AuthOrchestrator.kt`:
```kotlin
package com.homeservices.customer.domain.auth

import androidx.fragment.app.FragmentActivity
import com.google.firebase.FirebaseException
import com.google.firebase.auth.AuthCredential
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseAuthUserCollisionException
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.PhoneAuthCredential
import com.homeservices.customer.domain.auth.model.AuthResult
import com.homeservices.customer.domain.auth.model.GoogleSignInResult
import com.homeservices.customer.domain.auth.model.OtpSendResult
import com.homeservices.customer.domain.auth.model.TruecallerAuthResult
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class AuthOrchestrator
    @Inject
    constructor(
        private val truecallerUseCase: TruecallerLoginUseCase,
        private val firebaseOtpUseCase: FirebaseOtpUseCase,
        private val saveSessionUseCase: SaveSessionUseCase,
        private val googleSignInUseCase: GoogleSignInUseCase,
        private val emailPasswordUseCase: EmailPasswordUseCase,
        private val firebaseAuth: FirebaseAuth,
    ) {
        public sealed class StartResult {
            public data object TruecallerLaunched : StartResult()

            public data object FallbackToOtp : StartResult()
        }

        public fun start(
            context: android.content.Context,
            activity: FragmentActivity,
        ): StartResult {
            truecallerUseCase.init(context)
            return if (truecallerUseCase.isAvailable()) {
                truecallerUseCase.launch(activity)
                StartResult.TruecallerLaunched
            } else {
                StartResult.FallbackToOtp
            }
        }

        public fun observeTruecallerResults(): SharedFlow<TruecallerAuthResult> =
            truecallerUseCase.resultFlow

        public fun sendOtp(
            phoneNumber: String,
            activity: FragmentActivity,
            resendToken: com.google.firebase.auth.PhoneAuthProvider.ForceResendingToken? = null,
        ): Flow<OtpSendResult> = firebaseOtpUseCase.sendOtp(phoneNumber, activity, resendToken)

        public fun verifyOtp(
            verificationId: String,
            code: String,
        ): Flow<AuthResult> = firebaseOtpUseCase.verifyOtp(verificationId, code)

        public fun signInWithCredential(credential: PhoneAuthCredential): Flow<AuthResult> =
            firebaseOtpUseCase.signInWithCredential(credential)

        public suspend fun completeWithTruecaller(phoneNumber: String): AuthResult =
            saveSessionUseCase.saveAnonymousWithPhone(phoneNumber)

        public suspend fun completeWithFirebase(
            user: FirebaseUser,
            phoneLastFour: String,
        ) {
            saveSessionUseCase.save(user, phoneLastFour)
        }

        // ── New for E02-S05-A ──────────────────────────────────────────────

        public fun startGoogleSignIn(activity: FragmentActivity): Flow<AuthResult> = flow {
            when (val credResult = googleSignInUseCase.getCredential(activity)) {
                is GoogleSignInResult.CredentialObtained -> {
                    val authResult = linkOrSignIn(credResult.credential)
                    if (authResult is AuthResult.Success) {
                        saveSessionUseCase.saveWithGoogle(authResult.user)
                    }
                    emit(authResult)
                }
                GoogleSignInResult.Cancelled -> emit(AuthResult.Cancelled)
                GoogleSignInResult.Unavailable -> emit(AuthResult.Unavailable)
                is GoogleSignInResult.Error -> emit(AuthResult.Error.General(credResult.cause))
            }
        }

        public fun startEmailSignIn(
            email: String,
            password: String,
        ): Flow<AuthResult> = flow {
            emailPasswordUseCase.signIn(email, password).collect { result ->
                if (result is AuthResult.Success) {
                    saveSessionUseCase.saveWithEmail(result.user)
                }
                emit(result)
            }
        }

        public fun startEmailSignUp(
            email: String,
            password: String,
        ): Flow<AuthResult> = flow {
            val currentUser = firebaseAuth.currentUser
            if (currentUser != null && currentUser.isAnonymous) {
                // Upgrade anonymous account to email/password
                emit(linkAnonymousToEmail(currentUser, email, password))
            } else {
                emailPasswordUseCase.signUp(email, password).collect { result ->
                    if (result is AuthResult.Success) {
                        saveSessionUseCase.saveWithEmail(result.user)
                    }
                    emit(result)
                }
            }
        }

        public fun sendPasswordReset(email: String): Flow<Result<Unit>> =
            emailPasswordUseCase.sendPasswordReset(email)

        @Suppress("TooGenericExceptionCaught")
        private suspend fun linkOrSignIn(credential: AuthCredential): AuthResult {
            val currentUser = firebaseAuth.currentUser
            return try {
                if (currentUser != null && currentUser.isAnonymous) {
                    val result = currentUser.linkWithCredential(credential).await()
                    AuthResult.Success(result.user!!)
                } else {
                    val result = firebaseAuth.signInWithCredential(credential).await()
                    AuthResult.Success(result.user!!)
                }
            } catch (e: FirebaseAuthUserCollisionException) {
                // Email already tied to another account — sign in with that account instead
                try {
                    val result = firebaseAuth.signInWithCredential(credential).await()
                    AuthResult.Success(result.user!!)
                } catch (e2: Exception) {
                    AuthResult.Error.General(e2)
                }
            } catch (e: FirebaseException) {
                AuthResult.Error.General(e)
            }
        }

        @Suppress("TooGenericExceptionCaught")
        private suspend fun linkAnonymousToEmail(
            anonymousUser: FirebaseUser,
            email: String,
            password: String,
        ): AuthResult {
            return try {
                val emailCredential =
                    com.google.firebase.auth.EmailAuthProvider.getCredential(email, password)
                val result = anonymousUser.linkWithCredential(emailCredential).await()
                val user = result.user!!
                user.sendEmailVerification().await()
                saveSessionUseCase.saveWithEmail(user)
                AuthResult.Success(user)
            } catch (e: FirebaseAuthUserCollisionException) {
                AuthResult.Error.EmailAlreadyInUse
            } catch (e: com.google.firebase.auth.FirebaseAuthWeakPasswordException) {
                AuthResult.Error.WeakPassword
            } catch (e: FirebaseException) {
                AuthResult.Error.General(e)
            }
        }
    }
```

- [ ] **Step 7.4 — Run all auth tests**
```bash
cd customer-app && ./gradlew :app:test --tests "*.AuthOrchestratorTest" --quiet
```
Expected: `BUILD SUCCESSFUL`, all tests (existing + 6 new) pass.

- [ ] **Step 7.5 — Run full test suite**
```bash
cd customer-app && ./gradlew :app:test --quiet
```
Expected: `BUILD SUCCESSFUL`.

- [ ] **Step 7.6 — Commit**
```bash
git add customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/AuthOrchestrator.kt \
        customer-app/app/src/test/kotlin/com/homeservices/customer/domain/auth/AuthOrchestratorTest.kt
git commit -m "feat(e02-s05-a): AuthOrchestrator — Google + email paths + anonymous account linking"
```

---

## Task 8: AuthModule — CredentialManager Provider

**Files:**
- Modify: `customer-app/app/src/main/kotlin/com/homeservices/customer/data/auth/di/AuthModule.kt`

Read `docs/patterns/hilt-module-android-test-scope.md` before this task.

- [ ] **Step 8.1 — Add CredentialManager provider**

Open `customer-app/app/src/main/kotlin/com/homeservices/customer/data/auth/di/AuthModule.kt`.

Add one new `@Provides` method inside `object AuthModule`:
```kotlin
import androidx.credentials.CredentialManager
// (add to existing imports)

@Provides
@Singleton
public fun provideCredentialManager(
    @ApplicationContext context: Context,
): CredentialManager = CredentialManager.create(context)
```

Full file after edit:
```kotlin
package com.homeservices.customer.data.auth.di

import android.content.Context
import android.content.SharedPreferences
import androidx.credentials.CredentialManager
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKeys
import com.google.firebase.auth.FirebaseAuth
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
public object AuthModule {
    @Provides
    @Singleton
    public fun provideFirebaseAuth(): FirebaseAuth = FirebaseAuth.getInstance()

    @Provides
    @Singleton
    @AuthPrefs
    public fun provideAuthPrefs(
        @ApplicationContext context: Context,
    ): SharedPreferences {
        val masterKeyAlias = MasterKeys.getOrCreate(MasterKeys.AES256_GCM_SPEC)
        return EncryptedSharedPreferences.create(
            "auth_session",
            masterKeyAlias,
            context,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
        )
    }

    @Provides
    @Singleton
    public fun provideCredentialManager(
        @ApplicationContext context: Context,
    ): CredentialManager = CredentialManager.create(context)
}
```

- [ ] **Step 8.2 — Verify Hilt graph compiles**
```bash
cd customer-app && ./gradlew :app:kaptDebugKotlin --quiet
```
Expected: `BUILD SUCCESSFUL` (no missing binding errors).

- [ ] **Step 8.3 — Commit**
```bash
git add customer-app/app/src/main/kotlin/com/homeservices/customer/data/auth/di/AuthModule.kt
git commit -m "feat(e02-s05-a): AuthModule — provideCredentialManager Hilt binding"
```

---

## Task 9: Pre-Codex Smoke Gate

- [ ] **Step 9.1 — Run smoke gate**
```bash
bash tools/pre-codex-smoke.sh customer-app
```
Expected: exit code 0. If non-zero, fix each reported issue before proceeding.

- [ ] **Step 9.2 — Run Codex review**
```bash
codex review --base main
```
Review all findings. Fix any P0/P1 issues and commit fixes before pushing.

- [ ] **Step 9.3 — Push branch**
```bash
git push
```
CI runs lint + tests + Semgrep. Merge after CI green.
