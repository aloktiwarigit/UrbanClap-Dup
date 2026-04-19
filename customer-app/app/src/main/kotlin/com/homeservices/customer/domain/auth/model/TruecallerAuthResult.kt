package com.homeservices.customer.domain.auth.model

import com.truecaller.android.sdk.common.models.TrueProfile

public sealed class TruecallerAuthResult {
    public data class Success(
        val profile: TrueProfile,
    ) : TruecallerAuthResult()

    public data class Failure(
        val errorType: Int,
    ) : TruecallerAuthResult()

    public data object Cancelled : TruecallerAuthResult()
}
