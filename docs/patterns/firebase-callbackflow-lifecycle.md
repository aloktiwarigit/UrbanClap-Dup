# Pattern: Firebase callbackFlow — Lifecycle & Cancellation
**Stack:** Android / Kotlin / Firebase Phone Auth / Coroutines
**Story source:** E02-S01 (customer auth) — Codex P2 finding
**Last updated:** 2026-04-19
**Recurrence risk:** High — affects E02-S02, E05-S01/S02 (dispatch callbacks), E06-S01 (job callbacks)

## The Trap

Using `callbackFlow` to wrap Firebase `PhoneAuthProvider.verifyPhoneNumber` callbacks leaves an open channel if the ViewModel scope is cancelled (e.g., process death, screen rotation) before `onVerificationFailed` or `onVerificationCompleted` fires.

Firebase's `PhoneAuthProvider` has no explicit deregister API — the callback is held internally until the timeout fires. If `awaitClose {}` is empty and the collector is cancelled, the flow silently leaks until the OTP timeout (typically 60s).

Also: if the user triggers a resend-OTP before the previous `viewModelScope.launch` finishes, a second callbackFlow is started on top of the first — two active Firebase callbacks fighting to send to the same state.

## The Solution

```kotlin
fun sendOtp(phone: String): Flow<OtpSendResult> = callbackFlow {
    val callbacks = object : PhoneAuthProvider.OnVerificationStateChangedCallbacks() {
        override fun onVerificationCompleted(credential: PhoneAuthCredential) {
            trySend(OtpSendResult.AutoVerified(credential))
            close()
        }
        override fun onVerificationFailed(e: FirebaseException) {
            close(e)
        }
        override fun onCodeSent(verificationId: String, token: PhoneAuthProvider.ForceResendingToken) {
            trySend(OtpSendResult.CodeSent(verificationId, token))
            // Do NOT close here — wait for user to enter code
        }
        override fun onCodeAutoRetrievalTimeOut(verificationId: String) {
            // Timeout fires after OTP_TIMEOUT_SECONDS — channel is still valid for manual entry
            // No explicit close needed; Firebase stops auto-retrieval internally
        }
    }

    val options = PhoneAuthOptions.newBuilder(FirebaseAuth.getInstance())
        .setPhoneNumber(phone)
        .setTimeout(OTP_TIMEOUT_SECONDS, TimeUnit.SECONDS)
        .setActivity(/* caller must pass Activity for SMS retrieval */)
        .setCallbacks(callbacks)
        .build()

    PhoneAuthProvider.verifyPhoneNumber(options)

    awaitClose {
        // PhoneAuthProvider has no explicit cancel API.
        // The ViewModel cancels the coroutine scope on clear() — this awaitClose fires then.
        // The ongoing Firebase operation will complete or timeout naturally.
    }
}
```

**ViewModel — cancel previous job on resend:**
```kotlin
private var otpJob: Job? = null

fun resendOtp(phone: String) {
    otpJob?.cancel()  // cancel previous callbackFlow collector
    otpJob = viewModelScope.launch {
        firebaseOtpUseCase.sendOtp(phone).collect { result -> /* handle */ }
    }
}
```

## The Tests

```kotlin
@Test
fun `cancelling the collector does not throw`() = runTest {
    val job = launch { useCase.sendOtp("+919999999999").collect { } }
    advanceTimeBy(100)
    job.cancel()
    job.join()
    // No exception thrown, no hanging channel
}

@Test
fun `resend cancels previous job`() = runTest {
    viewModel.sendOtp("+919999999999")
    viewModel.resendOtp("+919999999999")  // should not throw or duplicate state
    // Assert exactly one CodeSent emission, not two
}
```

## CI Gate

`testDebugUnitTest` — `FirebaseOtpUseCaseTest` and `AuthViewModelTest` cover these scenarios. The cancellation test will fail (hanging coroutine) if `awaitClose` is missing.

## Do Not

- Do not use `GlobalScope` for OTP flows — it outlives the screen.
- Do not start a second `sendOtp` call without cancelling the first job.
- Do not close the channel inside `onCodeSent` — the channel must stay open for manual OTP entry.
