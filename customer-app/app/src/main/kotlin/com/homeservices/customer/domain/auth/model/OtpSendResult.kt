package com.homeservices.customer.domain.auth.model

import com.google.firebase.auth.PhoneAuthCredential
import com.google.firebase.auth.PhoneAuthProvider

internal sealed class OtpSendResult {
    data class CodeSent(
        val verificationId: String,
        val resendToken: PhoneAuthProvider.ForceResendingToken,
    ) : OtpSendResult()

    data class AutoVerified(val credential: PhoneAuthCredential) : OtpSendResult()

    data class Error(val cause: Throwable) : OtpSendResult()
}
