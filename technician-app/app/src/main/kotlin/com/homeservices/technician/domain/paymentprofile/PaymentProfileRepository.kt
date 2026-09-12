package com.homeservices.technician.domain.paymentprofile

public data class PaymentProfileResult(
    val upiVpa: String,
    val upiUpdatedAt: String,
)

public interface PaymentProfileRepository {
    public suspend fun updatePaymentProfile(upiVpa: String): Result<PaymentProfileResult>
}
