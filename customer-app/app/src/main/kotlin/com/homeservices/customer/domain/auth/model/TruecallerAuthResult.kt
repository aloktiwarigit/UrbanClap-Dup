package com.homeservices.customer.domain.auth.model

import com.truecaller.android.sdk.common.models.TrueProfile

internal sealed class TruecallerAuthResult {
    data class Success(val profile: TrueProfile) : TruecallerAuthResult()
    data class Failure(val errorType: Int) : TruecallerAuthResult()
    data object Cancelled : TruecallerAuthResult()
}
