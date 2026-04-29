# Design: Email + Google Sign-In for Customer App

**Date:** 2026-04-29
**Story:** E02-S05 (split into E02-S05-A and E02-S05-B)
**Epic:** E02 — Authentication & Onboarding
**Sub-project:** `customer-app/` only
**Ceremony tier:** Foundation (auth-sensitive; 2 new SDK integrations; domain + data + UI all touched)
**Status:** Approved by Alok — ready for implementation plan

---

## 1. Problem Statement

The customer app currently supports only phone-based authentication (Truecaller one-tap + Firebase Phone OTP fallback). Customers without Truecaller, or who prefer not to share their phone number as a primary identifier, have no alternative sign-in path. Adding Email/Password and Google Sign-In broadens accessibility and aligns with standard consumer-app expectations.

---

## 2. Scope

### In scope
- `customer-app/` — all auth layers (domain, data, UI)
- New story files: `docs/stories/E02-S05-A-*.md` and `E02-S05-B-*.md`

### Out of scope
- `technician-app/` — technicians are invite-only + KYC-gated; phone auth is sufficient; adding self-service email/password increases attack surface without user value
- `api/` — `requireCustomer.ts` calls `verifyFirebaseIdToken()` which is already provider-agnostic; zero API changes needed
- `admin-web/` — covered by E02-S04

---

## 3. Auth Flow State Machine

```
App Launch
  ├─ Truecaller available
  │   └─ TruecallerLoading
  │       ├─ Success → ✓ Authenticated (anonymous Firebase UID, phone last-4)
  │       └─ Cancelled / Failure → MethodSelection  ← NEW (was: OtpEntry)
  └─ Truecaller unavailable → MethodSelection        ← NEW

MethodSelection
  ├─ "Continue with Google" → GoogleSigningIn
  │   ├─ Success → account-linking logic → ✓ Authenticated (Google UID, email, displayName)
  │   └─ Error → MethodSelection (error shown)
  ├─ "Continue with Email" → EmailEntry(mode=SignIn)
  │   ├─ Sign In  → ✓ Authenticated (email UID, email)
  │   ├─ Sign Up  → EmailVerificationSent
  │   │   └─ "Continue" tapped → user.reload() → isEmailVerified?
  │   │       ├─ true  → saveWithEmail() → ✓ Authenticated
  │   │       └─ false → toast "Please check your inbox first" → stay
  │   └─ "Forgot password" → password-reset email sent → back to MethodSelection
  └─ "Use phone number" → OtpEntry (existing flow, unchanged)
```

**Truecaller happy path is preserved.** `MethodSelection` is a fallback — not the initial screen. ~85% of Indian Android users have Truecaller; auto-launching it on app start remains the fastest path for the majority.

---

## 4. Architecture

### 4.1 Domain layer — new classes

#### `GoogleSignInUseCase`
```kotlin
@Singleton
class GoogleSignInUseCase @Inject constructor(
    private val firebaseAuth: FirebaseAuth,
    @ApplicationContext private val context: Context,
) {
    fun signIn(activity: FragmentActivity): Flow<AuthResult>
    // Internal: CredentialManager (API 34+) → GetGoogleIdOption with nonce
    //           Legacy GoogleSignInClient fallback (API 21–33)
    //           Firebase: GoogleAuthProvider.getCredential(idToken, null)
}
```

#### `EmailPasswordUseCase`
```kotlin
@Singleton
class EmailPasswordUseCase @Inject constructor(
    private val firebaseAuth: FirebaseAuth,
) {
    fun signIn(email: String, password: String): Flow<AuthResult>
    fun signUp(email: String, password: String): Flow<AuthResult>
    fun sendPasswordReset(email: String): Flow<Result<Unit>>
    // Error mapping: FirebaseAuthException.errorCode strings (never message.contains)
    //   WRONG_PASSWORD / INVALID_CREDENTIAL → AuthResult.Error.WrongCredential
    //   USER_NOT_FOUND → AuthResult.Error.UserNotFound
    //   EMAIL_ALREADY_IN_USE → AuthResult.Error.EmailAlreadyInUse
    //   WEAK_PASSWORD → AuthResult.Error.WeakPassword
    //   INVALID_EMAIL → AuthResult.Error.InvalidEmail
    //   TOO_MANY_REQUESTS → AuthResult.Error.RateLimited
    //   * → AuthResult.Error.General
}
```

#### `AuthProvider` (new sealed class)
```kotlin
sealed class AuthProvider {
    data object Phone : AuthProvider()
    data object Google : AuthProvider()
    data object Email : AuthProvider()
}
```

#### `AuthResult` — new error subtypes added
```kotlin
// Additions to existing AuthResult.Error sealed class:
data object WrongCredential : Error()
data object UserNotFound : Error()
data object EmailAlreadyInUse : Error()
data object WeakPassword : Error()
data object InvalidEmail : Error()
```

#### `AuthOrchestrator` — 3 new public methods
```kotlin
fun startGoogleSignIn(activity: FragmentActivity): Flow<AuthResult>
fun startEmailSignIn(email: String, password: String): Flow<AuthResult>
fun startEmailSignUp(email: String, password: String): Flow<AuthResult>
suspend fun sendPasswordReset(email: String): Result<Unit>
```

**Account-linking logic** (inside orchestrator, applied to Google and email paths):
```
val currentUser = firebaseAuth.currentUser
if (currentUser != null && currentUser.isAnonymous) {
    currentUser.linkWithCredential(credential).await()
    // → preserves UID; anonymous account upgraded to permanent
} catch EMAIL_ALREADY_IN_USE {
    firebaseAuth.signInWithCredential(credential).await()
    // → existing account wins; anonymous UID is abandoned
} else {
    firebaseAuth.signInWithCredential(credential).await()
    // → fresh sign-in (returning user, no anonymous session)
}
```

### 4.2 Data layer — extensions

#### `AuthState.Authenticated` (extended)
```kotlin
data class Authenticated(
    val uid: String,
    val phoneLastFour: String?,   // null for Google/email paths
    val email: String?,           // null for phone paths
    val displayName: String?,     // from Google profile or Firebase user
    val authProvider: AuthProvider,
) : AuthState()
```

#### `SessionManager` — 3 new encrypted prefs keys
```kotlin
// New constants alongside existing KEY_UID / KEY_PHONE_LAST_FOUR:
const val KEY_EMAIL = "email"
const val KEY_DISPLAY_NAME = "display_name"
const val KEY_AUTH_PROVIDER = "auth_provider"  // "phone" | "google" | "email"

// Extended saveSession():
suspend fun saveSession(
    uid: String,
    phoneLastFour: String? = null,
    email: String? = null,
    displayName: String? = null,
    authProvider: AuthProvider,
)
```

All new keys stored in the same `EncryptedSharedPreferences` file (`auth_session`, AES256-GCM). No migration needed — old sessions missing new keys default to `AuthProvider.Phone` on read.

#### `SaveSessionUseCase` — 2 new methods
```kotlin
suspend fun saveWithGoogle(user: FirebaseUser)
// → sessionManager.saveSession(uid=user.uid, email=user.email, displayName=user.displayName, authProvider=Google)

suspend fun saveWithEmail(user: FirebaseUser)
// → sessionManager.saveSession(uid=user.uid, email=user.email, authProvider=Email)
```

#### `AuthModule` — CredentialManager provider
```kotlin
@Provides @Singleton
fun provideCredentialManager(@ApplicationContext ctx: Context): CredentialManager =
    CredentialManager.create(ctx)
```

### 4.3 UI layer — extensions

#### `AuthUiState` — new states
```kotlin
sealed class AuthUiState {
    // Existing: Idle, TruecallerLoading, OtpEntry, OtpSending, OtpVerifying, Error
    data object MethodSelection : AuthUiState()        // NEW — method picker
    data class EmailEntry(
        val mode: Mode = Mode.SignIn,
        val prefillEmail: String = "",
    ) : AuthUiState() {
        enum class Mode { SignIn, SignUp }
    }
    data object GoogleSigningIn : AuthUiState()        // NEW — Google loading
    data class EmailVerificationSent(
        val email: String,
    ) : AuthUiState()                                   // NEW — post-signup holding state
}
```

#### `AuthViewModel` — new actions
```kotlin
fun onGoogleSignInClicked(activity: FragmentActivity)
fun onEmailSignInClicked(email: String, password: String)
fun onEmailSignUpClicked(email: String, password: String)
fun onEmailModeToggled()       // toggles SignIn ↔ SignUp in EmailEntry state
fun onPhoneSelected()          // transitions to OtpEntry()
fun onForgotPassword(email: String)
fun onBackToMethodSelection()  // from EmailEntry back to MethodSelection
```

**`initAuth()` change:** on `StartResult.FallbackToOtp` → now emits `MethodSelection` (not `OtpEntry`).

#### `AuthScreen` — new composables
- `MethodSelectionContent()` — Google button (primary), Email button (secondary), "Use phone number" tertiary text link, ToS footnote
- `EmailEntryContent(mode, prefillEmail)` — email + password fields, Sign In / Create Account toggle, Forgot password link, back arrow to MethodSelection
- `GoogleSigningInContent()` — spinner (reuses `LoadingContent("Signing in with Google…")`)
- `EmailVerificationSentContent(email)` — confirmation message, "Resend email" button, "Continue" button (checks `isEmailVerified`)

### 4.4 New Gradle dependencies (customer-app only)

```toml
# gradle/libs.versions.toml additions
credentials = "1.3.0"
googleIdentity = "1.1.1"

[libraries]
androidx-credentials = { module = "androidx.credentials:credentials", version.ref = "credentials" }
androidx-credentials-playservices = { module = "androidx.credentials:credentials-play-services-auth", version.ref = "credentials" }
google-identity-googleid = { module = "com.google.android.libraries.identity.googleid:googleid", version.ref = "googleIdentity" }
```

```kotlin
// app/build.gradle.kts additions
implementation(libs.androidx.credentials)
implementation(libs.androidx.credentials.playservices)
implementation(libs.google.identity.googleid)
```

### 4.5 AndroidManifest additions
```xml
<!-- Web client ID for Google Sign-In (from google-services.json) -->
<meta-data
    android:name="com.google.android.gms.wallet.api.enabled"
    android:value="true" />
```
The Web OAuth Client ID is read at runtime from `BuildConfig.GOOGLE_WEB_CLIENT_ID` (injected from `local.properties` / CI secret, not hardcoded).

### 4.6 ProGuard keep rules (additions to existing `proguard-rules.pro`)
```proguard
# Credential Manager
-keep class androidx.credentials.** { *; }
-keep class com.google.android.libraries.identity.googleid.** { *; }
# Firebase Google Auth provider
-keep class com.google.firebase.auth.GoogleAuthProvider { *; }
```

---

## 5. Security Properties

| Concern | Decision |
|---|---|
| Password strength | Min 8 chars enforced client-side; Firebase enforces server-side bcrypt |
| Google nonce | `GetGoogleIdOption` includes a random nonce; Firebase verifies it — prevents replay |
| Anonymous-to-linked upgrade | Atomic in Firebase — no window where UID changes mid-upgrade |
| Credential storage | `EncryptedSharedPreferences` (AES256-GCM) — same as existing phone session |
| Email verification | Required before full booking access for email sign-up path; `isEmailVerified` checked in `AuthOrchestrator.startEmailSignUp` before calling `saveWithEmail` |
| Error messages | Never leak whether an email is registered (show generic "Incorrect email or password" on `WRONG_PASSWORD` + `USER_NOT_FOUND`) |
| ProGuard | New keep rules ensure no credential class is stripped in release build |

---

## 6. Error Handling

| Firebase error code | User-facing message |
|---|---|
| `WRONG_PASSWORD` / `INVALID_CREDENTIAL` | "Incorrect email or password" |
| `USER_NOT_FOUND` | "Incorrect email or password" (same — don't enumerate) |
| `EMAIL_ALREADY_IN_USE` | "An account already exists with this email. Sign in instead." |
| `WEAK_PASSWORD` | "Password must be at least 8 characters" |
| `INVALID_EMAIL` | "Please enter a valid email address" |
| `TOO_MANY_REQUESTS` | "Too many attempts. Try again later." |
| Google `NO_CREDENTIAL` | Fall back to `MethodSelection` silently (user has no Google account on device) |
| Google `GetCredentialCancellationException` | Return to `MethodSelection` (user dismissed the sheet) |

---

## 7. Testing Plan

### Unit tests (MockK)
| Test class | Coverage |
|---|---|
| `GoogleSignInUseCaseTest` | Success, `NO_CREDENTIAL`, `GetCredentialCancellationException`, unknown error |
| `EmailPasswordUseCaseTest` | Sign-in success, sign-up success, all 6 error codes, password-reset success/failure |
| `AuthOrchestratorTest` | Account-linking: anonymous → Google upgrade, anonymous → email upgrade, `EMAIL_ALREADY_IN_USE` fallback to `signInWithCredential`, fresh sign-in (non-anonymous) |
| `SaveSessionUseCaseTest` | `saveWithGoogle` writes correct prefs keys; `saveWithEmail` writes correct prefs keys |
| `SessionManagerTest` | Old session (missing new keys) defaults to `AuthProvider.Phone`; new keys round-trip correctly |
| `AuthViewModelTest` | All new state transitions (MethodSelection, GoogleSigningIn, EmailEntry, EmailVerificationSent, Error); `initAuth` fallback → MethodSelection |

### Paparazzi screenshot tests (stubs only — goldens recorded on CI Linux)
- `MethodSelectionContent` (light + dark)
- `EmailEntryContent(mode=SignIn)` (light + dark)
- `EmailEntryContent(mode=SignUp)` (light + dark)
- `EmailVerificationSentContent` (light + dark)

Follow `docs/patterns/paparazzi-cross-os-goldens.md` — delete any locally generated goldens before push; trigger `paparazzi-record.yml` `workflow_dispatch` on CI.

---

## 8. Pattern Library References

Plans for E02-S05-A and E02-S05-B must cite these at the top:

| Pattern file | Reason |
|---|---|
| `docs/patterns/firebase-callbackflow-lifecycle.md` | `GoogleSignInUseCase` and `EmailPasswordUseCase` use `callbackFlow` |
| `docs/patterns/firebase-errorcode-mapping.md` | All new error-code string mappings |
| `docs/patterns/hilt-module-android-test-scope.md` | `AuthModule` adds `CredentialManager` provider |
| `docs/patterns/kotlin-explicit-api-public-modifier.md` | All new public Kotlin classes need `public` modifier |
| `docs/patterns/paparazzi-cross-os-goldens.md` | New Compose screens need Paparazzi stubs |

---

## 9. Story Split

### E02-S05-A — Domain + Data (run first)
**Work streams:** WS-A (models + data layer) → WS-B fan-out (4 parallel use-case subagents) → WS-C (DI + ProGuard) → WS-E (smoke gate + Codex)

### E02-S05-B — UI (depends on E02-S05-A merged)
**Work streams:** WS-D (AuthUiState + AuthViewModel + AuthScreen composables + Paparazzi stubs) → WS-E (smoke gate + Codex)

**Size check (estimated):**
- E02-S05-A: ~15 new/modified files, ~450 lines → within Feature-tier limit (no split needed per-story)
- E02-S05-B: ~8 new/modified files, ~350 lines → within Feature-tier limit

Both are **Foundation-tier ceremony** (auth-sensitive) regardless of line count.

---

## 10. What Does NOT Change

- `FirebaseOtpUseCase` — unchanged
- `BiometricGateUseCase` — unchanged
- `TruecallerLoginUseCase` — unchanged
- `technician-app/` — zero changes
- `api/` — zero changes
- `admin-web/` — zero changes
- Session TTL (180 days) — unchanged, applies to all providers
