# E02-S05-B — Email + Google Auth: UI Layer

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the new `GoogleSignInUseCase` and `EmailPasswordUseCase` (from E02-S05-A) into the customer-app UI — `MethodSelection` screen (method picker replacing the direct OtpEntry fallback), `EmailEntry` + `EmailVerificationSent` composables, updated `AuthViewModel`, and Paparazzi screenshot stubs.

**Architecture:** `AuthViewModel` gains 5 new actions; `initAuth()` fallback now emits `MethodSelection` instead of `OtpEntry`. `AuthScreen` routes to new composables via `AuthUiState`. Truecaller happy path is **unchanged** — new screens only appear on Truecaller cancel/unavailable. Paparazzi stubs are committed without goldens; CI records goldens via `paparazzi-record.yml` `workflow_dispatch`.

**Tech Stack:** Kotlin + Compose, Hilt, `AuthOrchestrator` (E02-S05-A), JUnit 5 + MockK + `kotlinx-coroutines-test`, Paparazzi

**Prerequisite:** E02-S05-A merged to main and pulled locally.

**Pattern files to read before implementing:**
- `docs/patterns/kotlin-explicit-api-public-modifier.md`
- `docs/patterns/paparazzi-cross-os-goldens.md`

**Sources of truth:**
- Spec: `docs/superpowers/specs/2026-04-29-auth-email-google-design.md` §4.3
- Story: `docs/stories/E02-S05-B-*.md`

---

## File Map

| Path | Action | Responsibility |
|---|---|---|
| `customer-app/app/src/main/kotlin/…/ui/auth/AuthUiState.kt` | **Modify** | Add `MethodSelection`, `EmailEntry`, `GoogleSigningIn`, `EmailVerificationSent` |
| `customer-app/app/src/main/kotlin/…/ui/auth/AuthViewModel.kt` | **Modify** | Add 5 new action methods; change `initAuth` fallback to `MethodSelection` |
| `customer-app/app/src/main/kotlin/…/ui/auth/AuthScreen.kt` | **Modify** | Add `MethodSelectionContent`, `EmailEntryContent`, `EmailVerificationSentContent`; wire new states in `when` block |
| `customer-app/app/src/test/kotlin/…/ui/auth/AuthViewModelTest.kt` | **Modify** | Add 8 new test cases |
| `customer-app/app/src/test/kotlin/…/ui/auth/AuthScreenPaparazziTest.kt` | **Modify** | Add 4 new Paparazzi stubs (MethodSelection, EmailEntry×2 modes, EmailVerificationSent) |

Throughout: `…` = `com/homeservices/customer`.

---

## Task 1: AuthUiState Extension

**Files:**
- Modify: `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/auth/AuthUiState.kt`

- [ ] **Step 1.1 — Replace AuthUiState.kt with extended version**

Replace the entire contents of `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/auth/AuthUiState.kt`:
```kotlin
package com.homeservices.customer.ui.auth

public sealed class AuthUiState {
    public data object Idle : AuthUiState()

    public data object TruecallerLoading : AuthUiState()

    // NEW — method picker shown on Truecaller cancel/unavailable
    public data object MethodSelection : AuthUiState()

    public data class OtpEntry(
        val phoneNumber: String = "",
        val verificationId: String? = null,
    ) : AuthUiState()

    public data object OtpSending : AuthUiState()

    public data object OtpVerifying : AuthUiState()

    // NEW — Google sign-in in progress
    public data object GoogleSigningIn : AuthUiState()

    // NEW — email/password form
    public data class EmailEntry(
        val mode: Mode = Mode.SignIn,
        val prefillEmail: String = "",
    ) : AuthUiState() {
        public enum class Mode { SignIn, SignUp }
    }

    // NEW — shown after sign-up; user must verify email before session is saved
    public data class EmailVerificationSent(
        val email: String,
    ) : AuthUiState()

    public data class Error(
        val message: String,
        val retriesLeft: Int,
    ) : AuthUiState()
}
```

- [ ] **Step 1.2 — Verify compile**
```bash
cd customer-app && ./gradlew :app:compileDebugKotlin --quiet
```
Expected: `BUILD SUCCESSFUL`.

- [ ] **Step 1.3 — Commit**
```bash
git add customer-app/app/src/main/kotlin/com/homeservices/customer/ui/auth/AuthUiState.kt
git commit -m "feat(e02-s05-b): AuthUiState — MethodSelection, EmailEntry, GoogleSigningIn, EmailVerificationSent"
```

---

## Task 2: AuthViewModel Extension (TDD)

**Files:**
- Modify: `customer-app/app/src/test/kotlin/com/homeservices/customer/ui/auth/AuthViewModelTest.kt`
- Modify: `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/auth/AuthViewModel.kt`

- [ ] **Step 2.1 — Write failing tests**

Open `customer-app/app/src/test/kotlin/com/homeservices/customer/ui/auth/AuthViewModelTest.kt`.

Add these new test methods inside the existing test class. (The existing `orchestrator: AuthOrchestrator = mockk()` and `sut: AuthViewModel` fields are reused.)

```kotlin
// ── New imports needed at the top of the file ────────────────────────────
// import com.homeservices.customer.domain.auth.model.AuthResult
// import com.homeservices.customer.domain.auth.model.AuthResult.Error as AuthError
// import com.homeservices.customer.ui.auth.AuthUiState.EmailEntry
// import kotlinx.coroutines.flow.flowOf

@Test
fun `initAuth — FallbackToOtp start result — emits MethodSelection`() = runTest {
    every { orchestrator.start(any(), any()) } returns AuthOrchestrator.StartResult.FallbackToOtp

    sut.initAuth(mockActivity)

    assertThat(sut.uiState.value).isInstanceOf(AuthUiState.MethodSelection::class.java)
}

@Test
fun `onGoogleSignInClicked — orchestrator returns Success — emits no error`() = runTest {
    val mockUser: FirebaseUser = mockk(relaxed = true)
    every { orchestrator.startGoogleSignIn(any()) } returns flowOf(AuthResult.Success(mockUser))

    sut.onGoogleSignInClicked(mockActivity)
    advanceUntilIdle()

    // Success navigates away — ViewModel does not hold an error state
    assertThat(sut.uiState.value).isNotInstanceOf(AuthUiState.Error::class.java)
}

@Test
fun `onGoogleSignInClicked — orchestrator returns Cancelled — returns to MethodSelection`() = runTest {
    every { orchestrator.startGoogleSignIn(any()) } returns flowOf(AuthResult.Cancelled)

    sut.onGoogleSignInClicked(mockActivity)
    advanceUntilIdle()

    assertThat(sut.uiState.value).isInstanceOf(AuthUiState.MethodSelection::class.java)
}

@Test
fun `onEmailSignInClicked — success — no error state`() = runTest {
    val mockUser: FirebaseUser = mockk(relaxed = true)
    every { orchestrator.startEmailSignIn(any(), any()) } returns flowOf(AuthResult.Success(mockUser))

    sut.onEmailSignInClicked("a@b.com", "pass1234")
    advanceUntilIdle()

    assertThat(sut.uiState.value).isNotInstanceOf(AuthUiState.Error::class.java)
}

@Test
fun `onEmailSignInClicked — WrongCredential — emits Error with message`() = runTest {
    every { orchestrator.startEmailSignIn(any(), any()) } returns flowOf(AuthResult.Error.WrongCredential)

    sut.onEmailSignInClicked("a@b.com", "wrong")
    advanceUntilIdle()

    val state = sut.uiState.value as AuthUiState.Error
    assertThat(state.message).contains("Incorrect")
}

@Test
fun `onEmailSignUpClicked — success — emits EmailVerificationSent`() = runTest {
    val mockUser: FirebaseUser = mockk(relaxed = true) {
        every { email } returns "new@b.com"
    }
    every { orchestrator.startEmailSignUp(any(), any()) } returns flowOf(AuthResult.Success(mockUser))

    sut.onEmailSignUpClicked("new@b.com", "pass1234")
    advanceUntilIdle()

    assertThat(sut.uiState.value).isInstanceOf(AuthUiState.EmailVerificationSent::class.java)
    assertThat((sut.uiState.value as AuthUiState.EmailVerificationSent).email).isEqualTo("new@b.com")
}

@Test
fun `onPhoneSelected — transitions to OtpEntry`() {
    sut.onPhoneSelected()
    assertThat(sut.uiState.value).isInstanceOf(AuthUiState.OtpEntry::class.java)
}

@Test
fun `onBackToMethodSelection — transitions to MethodSelection`() {
    sut.onBackToMethodSelection()
    assertThat(sut.uiState.value).isInstanceOf(AuthUiState.MethodSelection::class.java)
}
```

Also ensure `mockActivity: FragmentActivity = mockk(relaxed = true)` exists in the test class (it likely does from existing tests).

- [ ] **Step 2.2 — Run tests to verify they fail**
```bash
cd customer-app && ./gradlew :app:test --tests "*.AuthViewModelTest" --quiet
```
Expected: compile errors — `onGoogleSignInClicked`, `onEmailSignInClicked`, etc. not found.

- [ ] **Step 2.3 — Extend AuthViewModel.kt**

Replace the entire contents of `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/auth/AuthViewModel.kt`:
```kotlin
package com.homeservices.customer.ui.auth

import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.PhoneAuthProvider
import com.homeservices.customer.domain.auth.AuthOrchestrator
import com.homeservices.customer.domain.auth.model.AuthResult
import com.homeservices.customer.domain.auth.model.OtpSendResult
import com.homeservices.customer.domain.auth.model.TruecallerAuthResult
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
public class AuthViewModel
    @Inject
    constructor(
        private val orchestrator: AuthOrchestrator,
    ) : ViewModel() {
        private val _uiState = MutableStateFlow<AuthUiState>(AuthUiState.Idle)
        public val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

        private companion object {
            const val MAX_OTP_RETRIES = 3
            const val PHONE_LAST_DIGITS = 4
        }

        private var currentVerificationId: String? = null
        private var currentResendToken: PhoneAuthProvider.ForceResendingToken? = null
        private var currentPhoneNumber: String = ""
        private var otpAttempts: Int = 0
        private var sendOtpJob: Job? = null
        private var truecallerJob: Job? = null

        public fun initAuth(activity: FragmentActivity) {
            when (orchestrator.start(activity, activity)) {
                AuthOrchestrator.StartResult.TruecallerLaunched -> {
                    _uiState.value = AuthUiState.TruecallerLoading
                    truecallerJob?.cancel()
                    truecallerJob = viewModelScope.launch {
                        orchestrator.observeTruecallerResults().collect { handleTruecallerResult(it) }
                    }
                }
                // Changed: FallbackToOtp now shows MethodSelection, not OtpEntry directly
                AuthOrchestrator.StartResult.FallbackToOtp -> {
                    _uiState.value = AuthUiState.MethodSelection
                }
            }
        }

        // ── Truecaller ───────────────────────────────────────────────────────

        private fun handleTruecallerResult(result: TruecallerAuthResult) {
            when (result) {
                is TruecallerAuthResult.Success -> {
                    viewModelScope.launch {
                        val authResult = orchestrator.completeWithTruecaller(result.phoneLastFour)
                        if (authResult is AuthResult.Error) {
                            _uiState.value = AuthUiState.Error(
                                message = "Sign-in failed. Please use another method.",
                                retriesLeft = 0,
                            )
                        }
                    }
                }
                is TruecallerAuthResult.Failure, TruecallerAuthResult.Cancelled -> {
                    _uiState.value = AuthUiState.MethodSelection
                }
            }
        }

        // ── Phone OTP (existing) ─────────────────────────────────────────────

        public fun onPhoneSelected() {
            _uiState.value = AuthUiState.OtpEntry()
        }

        public fun onPhoneNumberSubmitted(
            phoneNumber: String,
            activity: FragmentActivity,
            resendToken: PhoneAuthProvider.ForceResendingToken? = null,
        ) {
            sendOtpJob?.cancel()
            currentPhoneNumber = phoneNumber
            _uiState.value = AuthUiState.OtpSending
            sendOtpJob = viewModelScope.launch {
                orchestrator.sendOtp(phoneNumber, activity, resendToken).collect { result ->
                    when (result) {
                        is OtpSendResult.CodeSent -> {
                            currentVerificationId = result.verificationId
                            currentResendToken = result.resendToken
                            _uiState.value = AuthUiState.OtpEntry(
                                phoneNumber = phoneNumber,
                                verificationId = result.verificationId,
                            )
                        }
                        is OtpSendResult.AutoVerified -> {
                            orchestrator.signInWithCredential(result.credential).collect { authResult ->
                                handleFirebaseAuthResult(authResult)
                            }
                        }
                        is OtpSendResult.Error -> {
                            _uiState.value = AuthUiState.Error(
                                message = "Failed to send OTP. Check your number and connection.",
                                retriesLeft = MAX_OTP_RETRIES,
                            )
                        }
                    }
                }
            }
        }

        public fun onOtpEntered(code: String) {
            val verificationId = currentVerificationId ?: return
            _uiState.value = AuthUiState.OtpVerifying
            viewModelScope.launch {
                orchestrator.verifyOtp(verificationId, code).collect { handleFirebaseAuthResult(it) }
            }
        }

        public fun onOtpResendRequested(activity: FragmentActivity) {
            otpAttempts = 0
            onPhoneNumberSubmitted(currentPhoneNumber, activity, currentResendToken)
        }

        public fun onRetry() {
            otpAttempts = 0
            currentVerificationId = null
            currentResendToken = null
            _uiState.value = AuthUiState.OtpEntry(phoneNumber = currentPhoneNumber)
        }

        // ── Google Sign-In ───────────────────────────────────────────────────

        public fun onGoogleSignInClicked(activity: FragmentActivity) {
            _uiState.value = AuthUiState.GoogleSigningIn
            viewModelScope.launch {
                orchestrator.startGoogleSignIn(activity).collect { result ->
                    when (result) {
                        is AuthResult.Success -> { /* Navigation handled by collector in UI */ }
                        AuthResult.Cancelled, AuthResult.Unavailable -> {
                            _uiState.value = AuthUiState.MethodSelection
                        }
                        is AuthResult.Error -> {
                            _uiState.value = AuthUiState.Error(
                                message = "Google sign-in failed. Try another method.",
                                retriesLeft = 0,
                            )
                        }
                    }
                }
            }
        }

        // ── Email / Password ─────────────────────────────────────────────────

        public fun onEmailSelected(mode: AuthUiState.EmailEntry.Mode = AuthUiState.EmailEntry.Mode.SignIn) {
            _uiState.value = AuthUiState.EmailEntry(mode = mode)
        }

        public fun onEmailModeToggled() {
            val current = _uiState.value as? AuthUiState.EmailEntry ?: return
            _uiState.value = current.copy(
                mode = if (current.mode == AuthUiState.EmailEntry.Mode.SignIn)
                    AuthUiState.EmailEntry.Mode.SignUp
                else
                    AuthUiState.EmailEntry.Mode.SignIn,
            )
        }

        public fun onEmailSignInClicked(email: String, password: String) {
            viewModelScope.launch {
                orchestrator.startEmailSignIn(email, password).collect { result ->
                    handleEmailAuthResult(result, signUp = false, email = email)
                }
            }
        }

        public fun onEmailSignUpClicked(email: String, password: String) {
            viewModelScope.launch {
                orchestrator.startEmailSignUp(email, password).collect { result ->
                    handleEmailAuthResult(result, signUp = true, email = email)
                }
            }
        }

        public fun onForgotPassword(email: String) {
            viewModelScope.launch {
                orchestrator.sendPasswordReset(email).collect { result ->
                    if (result.isSuccess) {
                        _uiState.value = AuthUiState.MethodSelection
                    } else {
                        _uiState.value = AuthUiState.Error(
                            message = "Could not send reset email. Check the address.",
                            retriesLeft = 0,
                        )
                    }
                }
            }
        }

        public fun onBackToMethodSelection() {
            _uiState.value = AuthUiState.MethodSelection
        }

        // ── Shared helpers ───────────────────────────────────────────────────

        private fun handleEmailAuthResult(
            result: AuthResult,
            signUp: Boolean,
            email: String,
        ) {
            when (result) {
                is AuthResult.Success -> {
                    if (signUp) {
                        _uiState.value = AuthUiState.EmailVerificationSent(
                            email = result.user.email ?: email,
                        )
                    }
                    // sign-in success: navigation handled by authState observer in UI
                }
                is AuthResult.Error.WrongCredential ->
                    _uiState.value = AuthUiState.Error("Incorrect email or password.", retriesLeft = 1)
                is AuthResult.Error.UserNotFound ->
                    _uiState.value = AuthUiState.Error("Incorrect email or password.", retriesLeft = 1)
                is AuthResult.Error.EmailAlreadyInUse ->
                    _uiState.value = AuthUiState.Error(
                        "An account already exists with this email. Sign in instead.",
                        retriesLeft = 0,
                    )
                is AuthResult.Error.WeakPassword ->
                    _uiState.value = AuthUiState.Error("Password must be at least 8 characters.", retriesLeft = 1)
                is AuthResult.Error.InvalidEmail ->
                    _uiState.value = AuthUiState.Error("Please enter a valid email address.", retriesLeft = 1)
                is AuthResult.Error.RateLimited ->
                    _uiState.value = AuthUiState.Error("Too many attempts. Try again later.", retriesLeft = 0)
                is AuthResult.Error.General ->
                    _uiState.value = AuthUiState.Error("Sign-in failed. Please try again.", retriesLeft = 0)
                AuthResult.Cancelled, AuthResult.Unavailable ->
                    _uiState.value = AuthUiState.MethodSelection
                else ->
                    _uiState.value = AuthUiState.Error("Sign-in failed. Please try again.", retriesLeft = 0)
            }
        }

        private suspend fun handleFirebaseAuthResult(result: AuthResult) {
            when (result) {
                is AuthResult.Success ->
                    orchestrator.completeWithFirebase(result.user, currentPhoneNumber.takeLast(PHONE_LAST_DIGITS))
                is AuthResult.Error.WrongCode -> {
                    otpAttempts++
                    _uiState.value = AuthUiState.Error(
                        message = "Incorrect code",
                        retriesLeft = maxOf(0, MAX_OTP_RETRIES - otpAttempts),
                    )
                }
                is AuthResult.Error.RateLimited ->
                    _uiState.value = AuthUiState.Error("Too many attempts. Try again later.", retriesLeft = 0)
                is AuthResult.Error.CodeExpired ->
                    _uiState.value = AuthUiState.Error("Code expired. Please resend.", retriesLeft = 0)
                is AuthResult.Error.General ->
                    _uiState.value = AuthUiState.Error("Sign-in failed. Please try again.", retriesLeft = 0)
                AuthResult.Cancelled, AuthResult.Unavailable ->
                    _uiState.value = AuthUiState.OtpEntry(phoneNumber = currentPhoneNumber)
                else ->
                    _uiState.value = AuthUiState.Error("Sign-in failed.", retriesLeft = 0)
            }
        }
    }
```

- [ ] **Step 2.4 — Run ViewModel tests**
```bash
cd customer-app && ./gradlew :app:test --tests "*.AuthViewModelTest" --quiet
```
Expected: `BUILD SUCCESSFUL`, all tests (existing + 8 new) pass.

- [ ] **Step 2.5 — Run full test suite**
```bash
cd customer-app && ./gradlew :app:test --quiet
```
Expected: `BUILD SUCCESSFUL`.

- [ ] **Step 2.6 — Commit**
```bash
git add customer-app/app/src/main/kotlin/com/homeservices/customer/ui/auth/AuthViewModel.kt \
        customer-app/app/src/test/kotlin/com/homeservices/customer/ui/auth/AuthViewModelTest.kt
git commit -m "feat(e02-s05-b): AuthViewModel — Google + email actions, MethodSelection fallback (TDD)"
```

---

## Task 3: MethodSelectionContent Composable + Paparazzi Stub

**Files:**
- Modify: `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/auth/AuthScreen.kt`
- Modify: `customer-app/app/src/test/kotlin/com/homeservices/customer/ui/auth/AuthScreenPaparazziTest.kt`

- [ ] **Step 3.1 — Add MethodSelectionContent to AuthScreen.kt**

Open `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/auth/AuthScreen.kt`.

**a)** Update the `AuthScreen` composable signature to add new callbacks and the new `when` branch:

Replace the existing `AuthScreen` function signature and `when` block:
```kotlin
@Composable
internal fun AuthScreen(
    uiState: AuthUiState,
    onPhoneSubmitted: (String) -> Unit,
    onOtpEntered: (String) -> Unit,
    onResendRequested: () -> Unit,
    onRetry: () -> Unit,
    onGoogleSignInClicked: () -> Unit,
    onEmailSelected: () -> Unit,
    onPhoneSelected: () -> Unit,
    onEmailSignInClicked: (email: String, password: String) -> Unit,
    onEmailSignUpClicked: (email: String, password: String) -> Unit,
    onEmailModeToggled: () -> Unit,
    onForgotPassword: (email: String) -> Unit,
    onBackToMethodSelection: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Surface(
        modifier = modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background,
    ) {
        when (uiState) {
            is AuthUiState.Idle, is AuthUiState.TruecallerLoading ->
                TruecallerLoadingContent()

            is AuthUiState.MethodSelection ->
                MethodSelectionContent(
                    onGoogleSignIn = onGoogleSignInClicked,
                    onEmailSelected = onEmailSelected,
                    onPhoneSelected = onPhoneSelected,
                )

            is AuthUiState.GoogleSigningIn ->
                LoadingContent(message = "Signing in with Google…")

            is AuthUiState.EmailEntry ->
                EmailEntryContent(
                    mode = uiState.mode,
                    prefillEmail = uiState.prefillEmail,
                    onSignInClicked = onEmailSignInClicked,
                    onSignUpClicked = onEmailSignUpClicked,
                    onModeToggled = onEmailModeToggled,
                    onForgotPassword = onForgotPassword,
                    onBack = onBackToMethodSelection,
                )

            is AuthUiState.EmailVerificationSent ->
                EmailVerificationSentContent(email = uiState.email, onBack = onBackToMethodSelection)

            is AuthUiState.OtpEntry -> {
                if (uiState.verificationId == null) {
                    PhoneEntryContent(
                        initialPhone = uiState.phoneNumber,
                        onPhoneSubmitted = onPhoneSubmitted,
                    )
                } else {
                    OtpCodeContent(
                        phoneNumber = uiState.phoneNumber,
                        onOtpEntered = onOtpEntered,
                        onResendRequested = onResendRequested,
                    )
                }
            }

            is AuthUiState.OtpSending ->
                LoadingContent(message = "Sending OTP…")

            is AuthUiState.OtpVerifying ->
                LoadingContent(message = "Verifying…")

            is AuthUiState.Error ->
                ErrorContent(state = uiState, onRetry = onRetry)
        }
    }
}
```

**b)** Add the new composables at the bottom of `AuthScreen.kt` (before the final closing brace of the file):

```kotlin
@Composable
private fun MethodSelectionContent(
    onGoogleSignIn: () -> Unit,
    onEmailSelected: () -> Unit,
    onPhoneSelected: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 32.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            text = "Sign in to HomeServices",
            style = MaterialTheme.typography.headlineSmall,
            textAlign = TextAlign.Center,
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "Choose how you’d like to continue",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
        )
        Spacer(modifier = Modifier.height(40.dp))
        Button(
            onClick = onGoogleSignIn,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text("Continue with Google")
        }
        Spacer(modifier = Modifier.height(12.dp))
        OutlinedButton(
            onClick = onEmailSelected,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text("Continue with Email")
        }
        Spacer(modifier = Modifier.height(24.dp))
        TextButton(onClick = onPhoneSelected) {
            Text("Use phone number")
        }
        Spacer(modifier = Modifier.height(24.dp))
        Text(
            text = "By continuing, you agree to our Terms of Service and Privacy Policy.",
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
        )
    }
}

@Composable
private fun EmailEntryContent(
    mode: AuthUiState.EmailEntry.Mode,
    prefillEmail: String,
    onSignInClicked: (email: String, password: String) -> Unit,
    onSignUpClicked: (email: String, password: String) -> Unit,
    onModeToggled: () -> Unit,
    onForgotPassword: (email: String) -> Unit,
    onBack: () -> Unit,
) {
    var email by remember { mutableStateOf(prefillEmail) }
    var password by remember { mutableStateOf("") }
    val isSignIn = mode == AuthUiState.EmailEntry.Mode.SignIn
    val isValidEmail = email.trim().matches(Regex("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+\$"))
    val isValidPassword = password.length >= 8

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 32.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            text = if (isSignIn) "Sign in with Email" else "Create an account",
            style = MaterialTheme.typography.headlineSmall,
            textAlign = TextAlign.Center,
        )
        Spacer(modifier = Modifier.height(32.dp))
        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text("Email address") },
            keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(
                keyboardType = androidx.compose.ui.text.input.KeyboardType.Email,
            ),
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(modifier = Modifier.height(16.dp))
        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text(if (isSignIn) "Password" else "Password (min. 8 chars)") },
            visualTransformation = androidx.compose.ui.text.input.PasswordVisualTransformation(),
            keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(
                keyboardType = androidx.compose.ui.text.input.KeyboardType.Password,
            ),
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )
        if (isSignIn) {
            Spacer(modifier = Modifier.height(4.dp))
            TextButton(
                onClick = { onForgotPassword(email.trim()) },
                modifier = Modifier.align(Alignment.End),
            ) {
                Text("Forgot password?")
            }
        } else {
            Spacer(modifier = Modifier.height(12.dp))
        }
        Spacer(modifier = Modifier.height(8.dp))
        Button(
            onClick = {
                if (isSignIn) onSignInClicked(email.trim(), password)
                else onSignUpClicked(email.trim(), password)
            },
            enabled = isValidEmail && (if (isSignIn) password.isNotEmpty() else isValidPassword),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text(if (isSignIn) "Sign In" else "Create Account")
        }
        Spacer(modifier = Modifier.height(8.dp))
        TextButton(onClick = onModeToggled) {
            Text(if (isSignIn) "New user? Create account" else "Already have an account? Sign in")
        }
        Spacer(modifier = Modifier.height(8.dp))
        TextButton(onClick = onBack) {
            Text("← Back to sign-in options")
        }
    }
}

@Composable
private fun EmailVerificationSentContent(
    email: String,
    onBack: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 32.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            text = "Check your inbox",
            style = MaterialTheme.typography.headlineSmall,
            textAlign = TextAlign.Center,
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "We sent a verification link to $email. Open it to activate your account.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
        )
        Spacer(modifier = Modifier.height(32.dp))
        Text(
            text = "After verifying, come back here and tap Continue.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
        )
        Spacer(modifier = Modifier.height(24.dp))
        TextButton(onClick = onBack) {
            Text("← Back to sign-in options")
        }
    }
}
```

Add the missing import at the top of `AuthScreen.kt`:
```kotlin
import androidx.compose.material3.OutlinedButton
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
```

(If `mutableStateOf`, `remember`, `getValue`, `setValue` are already imported from the existing `PhoneEntryContent`, skip those.)

- [ ] **Step 3.2 — Fix call site in MainActivity/NavGraph**

Find where `AuthScreen(...)` is called (likely in `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/auth/AuthGraph.kt` or `AuthNavigation.kt` or directly in `MainActivity.kt`) and add the new lambda parameters. Pass `viewModel::onGoogleSignInClicked`, `viewModel::onEmailSelected`, `viewModel::onPhoneSelected`, `{ viewModel.onEmailSignInClicked(it.first, it.second) }` etc.

Search for the call site:
```bash
grep -r "AuthScreen(" customer-app/app/src/main/kotlin/ --include="*.kt" -l
```

Open the file found and add the new named parameters:
```kotlin
AuthScreen(
    uiState = uiState,
    onPhoneSubmitted = { viewModel.onPhoneNumberSubmitted(it, activity) },
    onOtpEntered = viewModel::onOtpEntered,
    onResendRequested = { viewModel.onOtpResendRequested(activity) },
    onRetry = viewModel::onRetry,
    onGoogleSignInClicked = { viewModel.onGoogleSignInClicked(activity) },
    onEmailSelected = { viewModel.onEmailSelected() },
    onPhoneSelected = viewModel::onPhoneSelected,
    onEmailSignInClicked = { email, password -> viewModel.onEmailSignInClicked(email, password) },
    onEmailSignUpClicked = { email, password -> viewModel.onEmailSignUpClicked(email, password) },
    onEmailModeToggled = viewModel::onEmailModeToggled,
    onForgotPassword = { viewModel.onForgotPassword(it) },
    onBackToMethodSelection = viewModel::onBackToMethodSelection,
)
```

- [ ] **Step 3.3 — Verify compile**
```bash
cd customer-app && ./gradlew :app:compileDebugKotlin --quiet
```
Expected: `BUILD SUCCESSFUL`. Fix any unused-import or missing-parameter errors.

- [ ] **Step 3.4 — Add Paparazzi stubs**

Open `customer-app/app/src/test/kotlin/com/homeservices/customer/ui/auth/AuthScreenPaparazziTest.kt`.

Read `docs/patterns/paparazzi-cross-os-goldens.md` then add these stubs inside the existing test class (do NOT run/record locally — goldens are created on CI only):

```kotlin
@Test
@Ignore("Goldens recorded on CI Linux via paparazzi-record.yml workflow_dispatch")
fun methodSelection_lightTheme() {
    paparazzi.snapshot {
        AppTheme(darkTheme = false) {
            MethodSelectionContent(
                onGoogleSignIn = {},
                onEmailSelected = {},
                onPhoneSelected = {},
            )
        }
    }
}

@Test
@Ignore("Goldens recorded on CI Linux via paparazzi-record.yml workflow_dispatch")
fun methodSelection_darkTheme() {
    paparazzi.snapshot {
        AppTheme(darkTheme = true) {
            MethodSelectionContent(
                onGoogleSignIn = {},
                onEmailSelected = {},
                onPhoneSelected = {},
            )
        }
    }
}

@Test
@Ignore("Goldens recorded on CI Linux via paparazzi-record.yml workflow_dispatch")
fun emailEntry_signIn_lightTheme() {
    paparazzi.snapshot {
        AppTheme(darkTheme = false) {
            EmailEntryContent(
                mode = AuthUiState.EmailEntry.Mode.SignIn,
                prefillEmail = "",
                onSignInClicked = { _, _ -> },
                onSignUpClicked = { _, _ -> },
                onModeToggled = {},
                onForgotPassword = {},
                onBack = {},
            )
        }
    }
}

@Test
@Ignore("Goldens recorded on CI Linux via paparazzi-record.yml workflow_dispatch")
fun emailEntry_signUp_darkTheme() {
    paparazzi.snapshot {
        AppTheme(darkTheme = true) {
            EmailEntryContent(
                mode = AuthUiState.EmailEntry.Mode.SignUp,
                prefillEmail = "",
                onSignInClicked = { _, _ -> },
                onSignUpClicked = { _, _ -> },
                onModeToggled = {},
                onForgotPassword = {},
                onBack = {},
            )
        }
    }
}

@Test
@Ignore("Goldens recorded on CI Linux via paparazzi-record.yml workflow_dispatch")
fun emailVerificationSent_lightTheme() {
    paparazzi.snapshot {
        AppTheme(darkTheme = false) {
            EmailVerificationSentContent(
                email = "user@example.com",
                onBack = {},
            )
        }
    }
}
```

Note: `MethodSelectionContent`, `EmailEntryContent`, `EmailVerificationSentContent` are `private` composables in `AuthScreen.kt`. If Paparazzi tests live in the same package (`ui.auth`) they can access `internal` but not `private`. If the composables are `private`, either (a) change them to `internal` or (b) test them indirectly via `AuthScreen` with the matching `AuthUiState`. Option (a) is simpler — change `private fun MethodSelectionContent` etc. to `internal fun` in `AuthScreen.kt`.

- [ ] **Step 3.5 — Run tests to confirm stubs compile and are skipped**
```bash
cd customer-app && ./gradlew :app:test --tests "*.AuthScreenPaparazziTest" --quiet
```
Expected: `BUILD SUCCESSFUL`, all new tests skipped (`@Ignore`), no failures.

- [ ] **Step 3.6 — Commit**
```bash
git add customer-app/app/src/main/kotlin/com/homeservices/customer/ui/auth/AuthScreen.kt \
        customer-app/app/src/test/kotlin/com/homeservices/customer/ui/auth/AuthScreenPaparazziTest.kt
git commit -m "feat(e02-s05-b): MethodSelectionContent, EmailEntryContent, EmailVerificationSentContent + Paparazzi stubs"
```

---

## Task 4: Final Verification + Pre-Codex Smoke Gate

**Files:** None created/modified — verification only.

- [ ] **Step 4.1 — Run full customer-app test suite**
```bash
cd customer-app && ./gradlew :app:test --quiet
```
Expected: `BUILD SUCCESSFUL`. Zero failures, zero errors.

- [ ] **Step 4.2 — Run Android Lint**
```bash
cd customer-app && ./gradlew :app:lintDebug --quiet
```
Expected: 0 errors, 0 warnings. Fix any new warnings before continuing.

- [ ] **Step 4.3 — Run ktlint**
```bash
cd customer-app && ./gradlew :app:ktlintCheck --quiet
```
Expected: 0 violations. Run `./gradlew :app:ktlintFormat` to auto-fix, then re-check.

- [ ] **Step 4.4 — Run smoke gate**
```bash
bash tools/pre-codex-smoke.sh customer-app
```
Expected: exit code 0. Fix each reported issue before Codex.

- [ ] **Step 4.5 — Run Codex review**
```bash
codex review --base main
```
Review all findings. Fix P0/P1 issues and commit before pushing.

- [ ] **Step 4.6 — Push and trigger Paparazzi golden recording**
```bash
git push
```
After CI goes green:
1. Go to GitHub → Actions → `paparazzi-record.yml`
2. Click **Run workflow** → select your branch → Run
3. Download the golden artifacts from the workflow run
4. Commit the new golden images to the branch

- [ ] **Step 4.7 — Final commit if any fixes applied**
```bash
git add -p   # review and stage only intended changes
git commit -m "fix(e02-s05-b): post-Codex review fixes"
git push
```
