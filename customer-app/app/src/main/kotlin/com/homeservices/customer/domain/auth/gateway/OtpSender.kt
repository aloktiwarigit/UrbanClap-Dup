package com.homeservices.customer.domain.auth.gateway

import android.app.Activity
import com.google.firebase.auth.PhoneAuthCredential
import com.google.firebase.auth.PhoneAuthProvider
import com.homeservices.customer.domain.auth.model.AuthResult
import com.homeservices.customer.domain.auth.model.OtpSendResult
import kotlinx.coroutines.flow.Flow

public interface OtpSender {
    public fun sendOtp(
        phoneNumber: String,
        activity: Activity,
        resendToken: PhoneAuthProvider.ForceResendingToken? = null,
    ): Flow<OtpSendResult>

    public fun signInWithCredential(credential: PhoneAuthCredential): Flow<AuthResult>

    public fun verifyOtp(
        verificationId: String,
        code: String,
    ): Flow<AuthResult>
}
