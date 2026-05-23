package com.homeservices.customer.data.wallet

/** Carries the credit amount and booking reference emitted when a no-show credit is issued. */
public data class NoShowCreditEvent(
    val creditAmountPaise: Long,
    val bookingId: String,
)
