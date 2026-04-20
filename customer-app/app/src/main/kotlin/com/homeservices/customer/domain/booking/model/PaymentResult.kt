package com.homeservices.customer.domain.booking.model

public sealed class PaymentResult {
    public data class Success(
        val paymentId: String,
        val orderId: String,
        val signature: String,
    ) : PaymentResult()

    public data class Failure(
        val code: Int,
        val description: String,
    ) : PaymentResult()
}
