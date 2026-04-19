package com.homeservices.customer.domain.auth

import android.app.Activity
import com.google.firebase.FirebaseException
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseAuthInvalidCredentialsException
import com.google.firebase.auth.PhoneAuthCredential
import com.google.firebase.auth.PhoneAuthOptions
import com.google.firebase.auth.PhoneAuthProvider
import com.homeservices.customer.domain.auth.model.AuthResult
import com.homeservices.customer.domain.auth.model.OtpSendResult
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class FirebaseOtpUseCase @Inject constructor(
    private val firebaseAuth: FirebaseAuth,
) {
    public fun sendOtp(
        phoneNumber: String,
        activity: Activity,
        resendToken: PhoneAuthProvider.ForceResendingToken? = null,
    ): Flow<OtpSendResult> = callbackFlow {
        val callbacks = object : PhoneAuthProvider.OnVerificationStateChangedCallbacks() {
            override fun onVerificationCompleted(credential: PhoneAuthCredential) {
                trySend(OtpSendResult.AutoVerified(credential))
                close()
            }

            override fun onVerificationFailed(e: FirebaseException) {
                trySend(OtpSendResult.Error(e))
                close()
            }

            override fun onCodeSent(
                verificationId: String,
                token: PhoneAuthProvider.ForceResendingToken,
            ) {
                trySend(OtpSendResult.CodeSent(verificationId, token))
                // channel stays open — awaiting auto-verify or user code submission
            }
        }

        val optionsBuilder = PhoneAuthOptions.newBuilder(firebaseAuth)
            .setPhoneNumber(phoneNumber)
            .setTimeout(60L, TimeUnit.SECONDS)
            .setActivity(activity)
            .setCallbacks(callbacks)

        resendToken?.let { optionsBuilder.setForceResendingToken(it) }

        PhoneAuthProvider.verifyPhoneNumber(optionsBuilder.build())
        awaitClose()
    }

    public fun signInWithCredential(credential: PhoneAuthCredential): Flow<AuthResult> =
        callbackFlow {
            val executor = java.util.concurrent.Executor { it.run() }
            firebaseAuth.signInWithCredential(credential)
                .addOnSuccessListener(executor) { result ->
                    val user = result.user
                    if (user != null) {
                        trySend(AuthResult.Success(user))
                    } else {
                        trySend(AuthResult.Error.General(IllegalStateException("null user after sign-in")))
                    }
                    close()
                }
                .addOnFailureListener(executor) { e ->
                    val mapped = when {
                        e is FirebaseAuthInvalidCredentialsException &&
                            e.message?.contains("ERROR_INVALID_VERIFICATION_CODE") == true ->
                            AuthResult.Error.WrongCode

                        e.message?.contains("ERROR_SESSION_EXPIRED") == true ->
                            AuthResult.Error.CodeExpired

                        e.message?.contains("ERROR_TOO_MANY_REQUESTS") == true ->
                            AuthResult.Error.RateLimited

                        else -> AuthResult.Error.General(e)
                    }
                    trySend(mapped)
                    close()
                }
            awaitClose()
        }

    public fun verifyOtp(verificationId: String, code: String): Flow<AuthResult> {
        val credential = PhoneAuthProvider.getCredential(verificationId, code)
        return signInWithCredential(credential)
    }
}
