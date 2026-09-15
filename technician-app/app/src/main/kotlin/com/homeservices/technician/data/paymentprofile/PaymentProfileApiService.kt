package com.homeservices.technician.data.paymentprofile

import com.squareup.moshi.JsonClass
import retrofit2.http.Body
import retrofit2.http.PATCH

internal interface PaymentProfileApiService {
    @PATCH("v1/technicians/me/payment-profile")
    suspend fun updatePaymentProfile(
        @Body body: UpdatePaymentProfileRequestDto,
    ): UpdatePaymentProfileResponseDto
}

@JsonClass(generateAdapter = true)
internal data class UpdatePaymentProfileRequestDto(
    val upiVpa: String,
)

@JsonClass(generateAdapter = true)
internal data class UpdatePaymentProfileResponseDto(
    val upiVpa: String,
    val upiUpdatedAt: String,
)
