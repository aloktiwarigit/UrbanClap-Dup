package com.homeservices.customer.domain.auth.model

import com.google.firebase.auth.PhoneAuthCredential
import com.google.firebase.auth.PhoneAuthProvider

public sealed class OtpSendResult {
    public data class CodeSent(
        val verificationId: String,
        val resendToken: PhoneAuthProvider.ForceResendingToken,
    ) : OtpSendResult()

    public data class AutoVerified(val credential: PhoneAuthCredential) : OtpSendResult()

    public data class Error(val cause: Throwable) : OtpSendResult()
}
