package com.homeservices.customer.domain.auth

import android.app.Activity
import com.google.firebase.auth.FirebaseAuthException
import com.google.firebase.auth.FirebaseAuthInvalidCredentialsException
import com.google.firebase.auth.PhoneAuthCredential
import com.google.firebase.auth.PhoneAuthProvider
import com.homeservices.customer.domain.auth.gateway.OtpSender
import com.homeservices.customer.domain.auth.model.AuthResult
import com.homeservices.customer.domain.auth.model.OtpSendResult
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class FirebaseOtpUseCase
    @Inject
    constructor(
        private val otpSender: OtpSender,
    ) {
        public fun sendOtp(
            phoneNumber: String,
            activity: Activity,
            resendToken: PhoneAuthProvider.ForceResendingToken? = null,
        ): Flow<OtpSendResult> = otpSender.sendOtp(phoneNumber, activity, resendToken)

        public fun signInWithCredential(credential: PhoneAuthCredential): Flow<AuthResult> = otpSender.signInWithCredential(credential)

        public fun verifyOtp(
            verificationId: String,
            code: String,
        ): Flow<AuthResult> = otpSender.verifyOtp(verificationId, code)
    }

public fun mapFirebaseSignInError(error: Throwable): AuthResult.Error =
    when {
        error is FirebaseAuthInvalidCredentialsException &&
            error.errorCode == "ERROR_INVALID_VERIFICATION_CODE" ->
            AuthResult.Error.WrongCode

        error is FirebaseAuthException &&
            error.errorCode == "ERROR_SESSION_EXPIRED" ->
            AuthResult.Error.CodeExpired

        error is FirebaseAuthException &&
            error.errorCode == "ERROR_TOO_MANY_REQUESTS" ->
            AuthResult.Error.RateLimited

        else -> AuthResult.Error.General(error)
    }
