package com.homeservices.technician.domain.auth

import android.app.Activity
import com.google.firebase.FirebaseException
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseAuthException
import com.google.firebase.auth.FirebaseAuthInvalidCredentialsException
import com.google.firebase.auth.PhoneAuthCredential
import com.google.firebase.auth.PhoneAuthOptions
import com.google.firebase.auth.PhoneAuthProvider
import com.homeservices.technician.domain.auth.model.AuthResult
import com.homeservices.technician.domain.auth.model.OtpSendResult
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class FirebaseOtpUseCase
    @Inject
    constructor(
        private val firebaseAuth: FirebaseAuth,
    ) {
        private companion object {
            const val OTP_TIMEOUT_SECONDS = 60L
        }

        public fun sendOtp(
            phoneNumber: String,
            activity: Activity,
            resendToken: PhoneAuthProvider.ForceResendingToken? = null,
        ): Flow<OtpSendResult> =
            callbackFlow {
                val callbacks =
                    object : PhoneAuthProvider.OnVerificationStateChangedCallbacks() {
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
                            // channel stays open — awaiting auto-verify or timeout
                        }

                        override fun onCodeAutoRetrievalTimeOut(verificationId: String) {
                            // Timeout fires after OTP_TIMEOUT_SECONDS — channel is still valid for manual entry.
                            // No explicit close needed; Firebase stops auto-retrieval internally.
                            close()
                        }
                    }

                val optionsBuilder =
                    PhoneAuthOptions
                        .newBuilder(firebaseAuth)
                        .setPhoneNumber(phoneNumber)
                        .setTimeout(OTP_TIMEOUT_SECONDS, TimeUnit.SECONDS)
                        .setActivity(activity)
                        .setCallbacks(callbacks)

                resendToken?.let { optionsBuilder.setForceResendingToken(it) }

                PhoneAuthProvider.verifyPhoneNumber(optionsBuilder.build())

                awaitClose {
                    // PhoneAuthProvider has no explicit cancel API.
                    // The ViewModel cancels the coroutine scope on clear() — this awaitClose fires then.
                    // The ongoing Firebase operation will complete or timeout naturally.
                }
            }

        public fun signInWithCredential(credential: PhoneAuthCredential): Flow<AuthResult> =
            callbackFlow {
                val executor = java.util.concurrent.Executor { it.run() }
                firebaseAuth
                    .signInWithCredential(credential)
                    .addOnSuccessListener(executor) { result ->
                        val user = result.user
                        if (user != null) {
                            trySend(AuthResult.Success(user))
                        } else {
                            trySend(AuthResult.Error.General(IllegalStateException("null user after sign-in")))
                        }
                        close()
                    }.addOnFailureListener(executor) { e ->
                        // Per firebase-errorcode-mapping.md: use errorCode, never message.contains()
                        val mapped =
                            when {
                                e is FirebaseAuthInvalidCredentialsException &&
                                    e.errorCode == "ERROR_INVALID_VERIFICATION_CODE" ->
                                    AuthResult.Error.WrongCode

                                e is FirebaseAuthException &&
                                    e.errorCode == "ERROR_SESSION_EXPIRED" ->
                                    AuthResult.Error.CodeExpired

                                e is FirebaseAuthException &&
                                    e.errorCode == "ERROR_TOO_MANY_REQUESTS" ->
                                    AuthResult.Error.RateLimited

                                else -> AuthResult.Error.General(e)
                            }
                        trySend(mapped)
                        close()
                    }
                awaitClose {
                    // signInWithCredential task is fire-and-forget; no explicit cancel API.
                    // Collectors cancelled before the task completes will stop receiving — this is safe.
                }
            }

        public fun verifyOtp(
            verificationId: String,
            code: String,
        ): Flow<AuthResult> {
            val credential = PhoneAuthProvider.getCredential(verificationId, code)
            return signInWithCredential(credential)
        }
    }
