# Pattern: Firebase Auth Error Code Mapping
**Stack:** Android / Kotlin / Firebase Auth
**Story source:** E02-S01 (customer auth) — Codex P2 finding
**Last updated:** 2026-04-19
**Recurrence risk:** High — affects E02-S02, E03-S03 (Razorpay payment callbacks), any story using FirebaseAuthException

## The Trap

Mapping Firebase errors by inspecting `exception.message` with `contains("ERROR_INVALID_VERIFICATION_CODE")` or similar substring checks. Firebase localizes error messages in some regions (especially with older Play Services) — the message string is unreliable. Codex flagged this as P2 in E02-S01.

The correct approach is `FirebaseAuthException.errorCode`, which is a stable, non-localized string constant prefixed with `ERROR_`.

## The Solution

```kotlin
sealed class OtpSendResult {
    data class CodeSent(val verificationId: String, val token: PhoneAuthProvider.ForceResendingToken) : OtpSendResult()
    object AutoVerified : OtpSendResult()
    sealed class Error : OtpSendResult() {
        object WrongCode : Error()
        object CodeExpired : Error()
        object RateLimited : Error()
        object TooManyRequests : Error()
        data class General(val cause: Exception) : Error()
    }
}

private fun mapFirebaseException(e: Exception): OtpSendResult.Error = when {
    e is FirebaseAuthInvalidCredentialsException &&
        e.errorCode == "ERROR_INVALID_VERIFICATION_CODE" -> OtpSendResult.Error.WrongCode

    e is FirebaseAuthException &&
        e.errorCode == "ERROR_SESSION_EXPIRED"           -> OtpSendResult.Error.CodeExpired

    e is FirebaseAuthException &&
        e.errorCode == "ERROR_TOO_MANY_REQUESTS"         -> OtpSendResult.Error.RateLimited

    e is FirebaseAuthException &&
        e.errorCode == "ERROR_QUOTA_EXCEEDED"            -> OtpSendResult.Error.TooManyRequests

    else -> OtpSendResult.Error.General(e)
}
```

**Full list of stable error codes for Phone Auth:**
- `ERROR_INVALID_VERIFICATION_CODE` — user typed wrong OTP digits
- `ERROR_SESSION_EXPIRED` — OTP timed out before user entered it
- `ERROR_TOO_MANY_REQUESTS` — per-phone rate limit hit
- `ERROR_QUOTA_EXCEEDED` — project quota hit (monitoring alert required)
- `ERROR_INVALID_PHONE_NUMBER` — phone string failed E.164 validation
- `ERROR_MISSING_PHONE_NUMBER` — empty phone string passed to SDK

## The Tests

```kotlin
@Test
fun `maps ERROR_INVALID_VERIFICATION_CODE to WrongCode`() {
    val e = mockk<FirebaseAuthInvalidCredentialsException> {
        every { errorCode } returns "ERROR_INVALID_VERIFICATION_CODE"
    }
    // inject exception into callbackFlow via mock PhoneAuthProvider
    val result = runBlocking { useCase.verifyCode("bad-code", "verif-id") }
    assertThat(result).isInstanceOf(OtpSendResult.Error.WrongCode::class.java)
}

@Test
fun `maps ERROR_SESSION_EXPIRED to CodeExpired`() { /* analogous */ }

@Test
fun `unknown error code maps to General`() { /* ensure no crash on unrecognized codes */ }
```

## CI Gate

`testDebugUnitTest` — `FirebaseOtpUseCaseTest` covers the error code mapping scenarios. Use `mockk` to set `errorCode` directly — never rely on message string in tests.

## Do Not

- Do not use `exception.message?.contains(...)` for error classification.
- Do not use `FirebaseAuthException::class` catch-all without checking `errorCode` — you will swallow `ERROR_QUOTA_EXCEEDED` (a billing alert) as a generic error.
- Do not assume error codes are available on `FirebaseException` base class — they are on `FirebaseAuthException` and its subclasses only.
