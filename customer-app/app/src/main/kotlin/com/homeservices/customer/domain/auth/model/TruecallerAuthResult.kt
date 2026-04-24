package com.homeservices.customer.domain.auth.model

public sealed class TruecallerAuthResult {
    public data class Success(
        val phoneLastFour: String,
    ) : TruecallerAuthResult()

    public data class Failure(
        val errorType: Int,
    ) : TruecallerAuthResult()

    public data object Cancelled : TruecallerAuthResult()
}
