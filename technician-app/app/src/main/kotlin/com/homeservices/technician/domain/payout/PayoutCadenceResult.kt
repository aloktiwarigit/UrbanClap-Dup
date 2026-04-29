package com.homeservices.technician.domain.payout

public data class PayoutCadenceResult(
    val cadence: String,
    val nextPayoutAt: String?,
)
