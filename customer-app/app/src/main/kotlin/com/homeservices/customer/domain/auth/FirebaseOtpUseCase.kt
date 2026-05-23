package com.homeservices.customer.domain.auth

import android.app.Activity
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
