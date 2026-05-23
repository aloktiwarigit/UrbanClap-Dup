# Account Deletion — E20-S08 Design Spec

**Date:** 2026-05-22
**Story:** E20-S08 — Lane7-C2 (account deletion, Play Store mandatory)
**Tier:** Foundation (auth + PII, cross-stack, high blast radius)
**Status:** Approved — ready for plan

---

## 1. Context and scope

HomeHeroo Technician app must offer an in-app account deletion path to satisfy Play Store Data Safety policy (mandatory since May 2024) and the privacy policy commitment at https://aloktiwarigit.github.io/homeheroo-privacy/technician/ §7.

**What already exists (PR #257 — do not re-implement):**
- `api/src/schemas/erasure-request.ts` — full Zod schema, state machine, `ERASURE_CONFIRMATION_PHRASE = 'DELETE MY ACCOUNT'`, `ERASURE_GRACE_PERIOD_MS = 7 days`
- `api/src/cosmos/erasure-request-repository.ts` — full CRUD with optimistic concurrency
- `api/src/functions/users-erasure-request.ts` — POST + DELETE `v1/users/me/erasure-request` (submit + revoke)
- `api/src/functions/trigger-erasure-deadline.ts` — daily cron at 02:00 UTC, auto-executes overdue PENDING requests
- `api/src/services/erasureCascade.service.ts` — anonymizes bookings/ratings/complaints/wallet/events; hard-deletes technician doc + KYC; clears FCM + device tokens

**What this story adds:**
1. API: active-job gate in the submit handler
2. Technician-app: in-app deletion UI (Settings entry → confirmation screen → terminal screen)
3. homeheroo-privacy repo: public web form for uninstalled users

---

## 2. API change — active-job gate

**File:** `api/src/functions/users-erasure-request.ts` (`submitErasureRequestHandler`)

**Change:** After auth and role inference, before creating the erasure doc, query for any active booking for this technician:

```
query bookings WHERE technicianId = uid
  AND status IN ('ASSIGNED', 'IN_PROGRESS', 'REACHED', 'STARTED')
```

If any found → return `409 { code: 'ACTIVE_JOB_EXISTS' }`.

**Supporting change:** `api/src/cosmos/booking-repository.ts` gains:
```typescript
hasActiveBookingForTechnician(technicianId: string): Promise<boolean>
```
Uses an indexed query on `technicianId + status`. Returns `true` if any active booking exists.

**Test file (written before implementation):** `api/src/functions/users-erasure-request.test.ts`

| Case | Expected |
|---|---|
| No active job, valid phrase | 201 + erasure doc created |
| Active job exists | 409 `ACTIVE_JOB_EXISTS` |
| Duplicate PENDING request | 409 `ERASURE_REQUEST_PENDING` |
| Wrong confirmation phrase | 400 `VALIDATION_ERROR` |
| Unauthenticated | 401 `UNAUTHENTICATED` |

---

## 3. Technician-app — data + domain layer

### 3.1 ErasureApiService.kt

Ktor HTTP interface. Two methods:

```kotlin
suspend fun submitErasureRequest(
    idToken: String,
    confirmationPhrase: String = ERASURE_CONFIRMATION_PHRASE,
    reason: String? = null,
): ErasureSubmitResponse  // erasureId, scheduledDeletionAt, status

suspend fun revokeErasureRequest(idToken: String): Unit  // 204
```

`ERASURE_CONFIRMATION_PHRASE = "DELETE MY ACCOUNT"` — defined as a constant, never shown to the user as a text field. The button sends it internally.

### 3.2 ErasureRepository + ErasureRepositoryImpl

Thin wrapper around `ErasureApiService`. Injects `FirebaseTokenAuthenticator` for token retrieval.

```kotlin
interface ErasureRepository {
    suspend fun submitRequest(reason: String? = null): ErasureSubmitResult
    suspend fun revokeRequest(): Unit
}

sealed class ErasureSubmitResult {
    data class Success(val scheduledDeletionAt: String) : ErasureSubmitResult()
    object ActiveJobExists : ErasureSubmitResult()
    object DuplicatePending : ErasureSubmitResult()
    data class UnknownError(val message: String) : ErasureSubmitResult()
}
```

### 3.3 SubmitErasureRequestUseCase

Client-side active-job pre-check before hitting the network:

```kotlin
suspend operator fun invoke(): ErasureSubmitResult {
    // Fast-path hint: activeJobState is non-null only when actively observing a job.
    // Server-side check (§2) is authoritative for cases where this returns null.
    if (activeJobRepository.activeJobState.value != null) {
        return ErasureSubmitResult.ActiveJobExists
    }
    return erasureRepository.submitRequest()
}
```

Client-side check is a fast-path UX guard using `activeJobRepository.activeJobState.value != null`. This is a hint only — `activeJobState` is only populated while an active job is being observed (FCM or manual fetch). If null, the use case proceeds to the API; the server-side gate in §2 is the authoritative check and will catch any active job the client doesn't know about.

### 3.4 ErasureModule (Hilt)

`@Binds ErasureRepository → ErasureRepositoryImpl`. Scoped to `@Singleton`.

**Test file (written before implementation):** `SubmitErasureRequestUseCaseTest.kt`

| Case | Expected |
|---|---|
| `activeJobRepository.hasActiveJob()` returns true | `ActiveJobExists` (no network call) |
| No active job, repo returns Success | `Success(scheduledDeletionAt)` |
| No active job, repo returns `ActiveJobExists` (server-side) | `ActiveJobExists` |
| No active job, repo returns `UnknownError` | `UnknownError` propagated |

---

## 4. Technician-app — UI layer

### 4.1 DeleteAccountViewModel

```kotlin
sealed class DeleteAccountUiState {
    object Idle : DeleteAccountUiState()
    object ActiveJobBlocked : DeleteAccountUiState()
    object Submitting : DeleteAccountUiState()
    data class Error(val messageRes: Int) : DeleteAccountUiState()
    data class Done(val scheduledDeletionAt: String) : DeleteAccountUiState()
}
```

**Init:** calls `SubmitErasureRequestUseCase` check-only path (or directly `activeJobRepository.hasActiveJob()`). If active job → state = `ActiveJobBlocked`. If clear → state = `Idle`.

**`onConfirmDelete()`:**
1. state = `Submitting`
2. Call `SubmitErasureRequestUseCase()`
3. `Success` → state = `Done(scheduledDeletionAt)`
4. `ActiveJobExists` → state = `ActiveJobBlocked`
5. `DuplicatePending` → state = `Error(R.string.delete_account_duplicate_pending)`
6. `UnknownError` → state = `Error(R.string.delete_account_generic_error)`

**Test file (written before implementation):** `DeleteAccountViewModelTest.kt`

| Case | Expected state |
|---|---|
| Init with active job | `ActiveJobBlocked` |
| Init without active job | `Idle` |
| `onConfirmDelete()` → Success | `Done` |
| `onConfirmDelete()` → ActiveJobExists | `ActiveJobBlocked` |
| `onConfirmDelete()` → UnknownError | `Error` |

### 4.2 DeleteAccountScreen.kt

Full-screen Compose destination (nav route: `delete_account`).

**Content (state = Idle or Submitting or Error):**
- Top bar: "Delete account" / "अकाउंट हटाएं" with back arrow
- Warning card (error-container background): "This is permanent and cannot be undone"
- Section heading: "What gets deleted" / "क्या हटाया जाएगा"
- Bulleted list with ✗ prefix:
  - Profile and phone number
  - KYC documents (Aadhaar, PAN)
  - Earnings history and payout records
  - Job photos and work history
  - Ratings received from customers
- Footnote: "Data deleted within 7 days of confirmation"
- Primary button (full-width, error color): `settings_delete_account_title` / "हाँ, मेरा अकाउंट हटाएं" — disabled + spinner when `Submitting`; on tap calls `viewModel.onConfirmDelete()`
- Text button: "Cancel"

**ActiveJobBlocked state:** Non-dismissable `AlertDialog` overlay:
- Title: "Job in progress"
- Body: `delete_account_active_job_error`
- Single button: "OK" → navigates back

**Error state:** `Snackbar` with error message.

### 4.3 AccountDeletedScreen.kt

Full-screen Compose destination (nav route: `account_deleted/{scheduledAt}`). Back stack cleared on navigate — no back gesture.

**Content:**
- `DeleteForever` icon (error tint, 64dp)
- Headline: `account_deleted_title`
- Body: `account_deleted_body` with formatted date
- Revocation hint card: `account_deleted_revocation_hint` with formatted date (tells user to email support before the date to cancel — in-app revoke UI is out of scope for this story, see §9)
- Clickable text link: `account_deleted_web_form_label` → opens `deletion_request_url` in browser via `Intent.ACTION_VIEW`
- Primary button: `account_deleted_done` → calls `sessionManager.clearSession()`; `AuthState.Unauthenticated` fires and `AppNavigation` navigates to `auth` popping everything

### 4.4 Navigation wiring

**`HomeGraph.kt`** — two new composable routes:

```kotlin
composable("delete_account") {
    DeleteAccountScreen(
        onBack = { navController.popBackStack() },
        onDeleted = { scheduledAt ->
            navController.navigate("account_deleted/$scheduledAt") {
                popUpTo("home") { inclusive = false }
            }
        },
    )
}
composable(
    route = "account_deleted/{scheduledAt}",
    arguments = listOf(navArgument("scheduledAt") { type = NavType.StringType }),
) { backStackEntry ->
    AccountDeletedScreen(
        // ISO timestamp contains ':' and '+' — must be Uri.decoded here.
        scheduledAt = Uri.decode(backStackEntry.arguments?.getString("scheduledAt") ?: ""),
        sessionManager = sessionManager,
    )
}
// When navigating: navController.navigate("account_deleted/${Uri.encode(scheduledAt)}")
```

**`AppNavigation.kt`** — pass `onDeleteAccount = { navController.navigate("delete_account") }` into `homeGraph()`.

**`TechnicianHomeScreen.kt` `ProfileScreen`** — add after the sign-out `SettingCard`:

```kotlin
Spacer(Modifier.height(16.dp))
HorizontalDivider()
Spacer(Modifier.height(8.dp))
SettingCard(
    icon = Icons.Default.DeleteForever,
    title = stringResource(R.string.settings_delete_account_title),
    subtitle = stringResource(R.string.settings_delete_account_subtitle),
    iconTint = MaterialTheme.colorScheme.error,
    onClick = onDeleteAccount,
)
```

### 4.5 Paparazzi screenshot tests

Two new test files — goldens recorded on CI via `paparazzi-record.yml gradle_root=technician-app` after merge. Never recorded locally on Windows.

- `DeleteAccountScreenTest.kt` — Idle state + ActiveJobBlocked state
- `AccountDeletedScreenTest.kt` — terminal screen with sample date

---

## 5. Strings

### strings.xml (EN)

```xml
<string name="settings_delete_account_title">Delete my account</string>
<string name="settings_delete_account_subtitle">Permanently remove your profile and data</string>
<string name="delete_account_title">Delete account</string>
<string name="delete_account_warning">This is permanent and cannot be undone</string>
<string name="delete_account_what_gets_deleted">What gets deleted</string>
<string name="delete_account_item_profile">Your profile and phone number</string>
<string name="delete_account_item_kyc">KYC documents (Aadhaar, PAN)</string>
<string name="delete_account_item_earnings">Earnings history and payout records</string>
<string name="delete_account_item_photos">Job photos and work history</string>
<string name="delete_account_item_ratings">Ratings received from customers</string>
<string name="delete_account_footnote">Data deleted within 7 days of confirmation</string>
<string name="delete_account_confirm_button">Yes, delete my account</string>
<string name="delete_account_cancel_button">Cancel</string>
<string name="delete_account_active_job_title">Job in progress</string>
<string name="delete_account_active_job_error">Complete or cancel your current job before deleting your account</string>
<string name="delete_account_active_job_ok">OK</string>
<string name="delete_account_duplicate_pending">A deletion request is already pending for your account</string>
<string name="delete_account_generic_error">Something went wrong. Please try again.</string>
<string name="account_deleted_title">Deletion request submitted</string>
<string name="account_deleted_body">Your account is scheduled for deletion on %1$s.</string>
<string name="account_deleted_revocation_hint">Changed your mind? Email us at support@homeheroo.in with subject \'Cancel account deletion\' and your phone number before %1$s.</string>
<string name="account_deleted_web_form_label">Lost access to the app? Request deletion here</string>
<string name="account_deleted_done">Done</string>
<string name="deletion_request_url">https://aloktiwarigit.github.io/homeheroo-privacy/deletion-request/</string>
```

### strings-hi.xml (HI)

```xml
<string name="settings_delete_account_title">अकाउंट हटाएं</string>
<string name="settings_delete_account_subtitle">आपकी प्रोफ़ाइल और डेटा स्थायी रूप से हटाएं</string>
<string name="delete_account_title">अकाउंट हटाएं</string>
<string name="delete_account_warning">यह स्थायी है और पूर्ववत नहीं होगा</string>
<string name="delete_account_what_gets_deleted">क्या हटाया जाएगा</string>
<string name="delete_account_item_profile">आपकी प्रोफ़ाइल और फ़ोन नंबर</string>
<string name="delete_account_item_kyc">KYC दस्तावेज़ (आधार, पैन)</string>
<string name="delete_account_item_earnings">कमाई इतिहास और भुगतान रिकॉर्ड</string>
<string name="delete_account_item_photos">जॉब फ़ोटो और कार्य इतिहास</string>
<string name="delete_account_item_ratings">ग्राहकों की रेटिंग</string>
<string name="delete_account_footnote">पुष्टि के 7 दिनों के भीतर डेटा हटाया जाएगा</string>
<string name="delete_account_confirm_button">हाँ, मेरा अकाउंट हटाएं</string>
<string name="delete_account_cancel_button">रद्द करें</string>
<string name="delete_account_active_job_title">जॉब जारी है</string>
<string name="delete_account_active_job_error">अकाउंट हटाने से पहले अपनी मौजूदा जॉब पूरी करें या रद्द करें</string>
<string name="delete_account_active_job_ok">ठीक है</string>
<string name="delete_account_duplicate_pending">आपके अकाउंट के लिए पहले से एक हटाने का अनुरोध लंबित है</string>
<string name="delete_account_generic_error">कुछ गड़बड़ी हुई। कृपया पुनः प्रयास करें।</string>
<string name="account_deleted_title">हटाने का अनुरोध सबमिट हुआ</string>
<string name="account_deleted_body">आपका अकाउंट %1$s को हटाया जाएगा।</string>
<string name="account_deleted_revocation_hint">मन बदला? %1$s से पहले support@homeheroo.in पर \'Cancel account deletion\' subject से अपना फ़ोन नंबर लिखकर ईमेल करें।</string>
<string name="account_deleted_web_form_label">ऐप तक पहुंच खो गई? यहाँ हटाने का अनुरोध करें</string>
<string name="account_deleted_done">हो गया</string>
<string name="deletion_request_url">https://aloktiwarigit.github.io/homeheroo-privacy/deletion-request/</string>
```

---

## 6. Web form — homeheroo-privacy repo

**File:** `docs/legal/deletion-request.md` (committed to `aloktiwarigit/homeheroo-privacy`, NOT this repo)

**Content:**
- Title: "Delete Your HomeHeroo Technician Account"
- In-app path: "Open the app → Profile tab → Delete my account"
- Email path (for users without app access): email `aloktiwari49@gmail.com` with subject `"Delete my HomeHeroo Technician account"` and body containing your registered phone number. Requests processed within 30 days.
- The existing `publish.yml` workflow auto-deploys `docs/legal/**` to GitHub Pages → available at `https://aloktiwarigit.github.io/homeheroo-privacy/deletion-request/`

---

## 7. Work-stream summary

| WS | Scope | Agent | Depends on |
|---|---|---|---|
| WS-A | API: `hasActiveBookingForTechnician` + active-job gate in submit handler + unit tests | Sonnet | — |
| WS-B | App data/domain: `ErasureApiService`, `ErasureRepository`, `SubmitErasureRequestUseCase`, `ErasureModule`, unit tests | Sonnet | — |
| WS-C | App UI: `DeleteAccountViewModel`, `DeleteAccountScreen`, `AccountDeletedScreen`, nav wiring, Paparazzi stubs | Sonnet | WS-B types |
| WS-D | Strings (EN + HI) + `deletion_request_url` resource | Sonnet | — |
| WS-E | `docs/legal/deletion-request.md` in homeheroo-privacy repo | Sonnet | — |
| WS-F | Pre-Codex smoke gate: `tools/pre-codex-smoke.sh technician-app` + `tools/pre-codex-smoke-api.sh` | Main thread | WS-A/B/C/D complete |

WS-A, WS-B, WS-D, WS-E run in parallel (no shared state). WS-C depends on WS-B types. WS-F runs last.

---

## 8. Post-merge checklist

- [ ] Play Console → Data Safety → "Does your app allow users to request deletion?" → Yes → provide both URLs (in-app flow description + `deletion_request_url`)
- [ ] Brief pilot coordinator on the email-based manual deletion path
- [ ] Verify `erasure_requests` admin queue visible in admin-web (existing admin endpoint at `api/src/functions/admin/users/patch.ts`)
- [ ] Trigger `paparazzi-record.yml` workflow_dispatch for `technician-app` after merge to record goldens

---

## 9. Out of scope for this story

- Re-registration cooldown — allow freely at pilot; revisit if abuse observed
- Customer-app deletion flow — separate story
- Admin-web erasure queue UI improvements — existing admin endpoint is sufficient for v1
- Revoke path in-app — user can log back in within 7 days; the `revokeErasureRequest()` API method is implemented in `ErasureRepository` for a future story if needed
