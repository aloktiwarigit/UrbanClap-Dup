package com.homeservices.customer.data.booking.remote.dto

import com.google.common.truth.Truth.assertThat
import com.homeservices.customer.domain.booking.model.BookingPaymentMethod
import org.junit.Test

public class CreateBookingResponseDtoTest {
    private fun makeDto(appliedCreditAmount: Int? = null): CreateBookingResponseDto =
        CreateBookingResponseDto(
            bookingId = "bk-1",
            razorpayOrderId = "order_1",
            amount = 50000,
            requiresPayment = true,
            paymentMethod = null,
            appliedCreditAmount = appliedCreditAmount,
        )

    @Test
    public fun `toDomain maps appliedCreditAmount when present`() {
        val domain = makeDto(appliedCreditAmount = 10000).toDomain()
        assertThat(domain.appliedCreditAmount).isEqualTo(10000)
    }

    @Test
    public fun `toDomain defaults appliedCreditAmount to 0 when null`() {
        val domain = makeDto(appliedCreditAmount = null).toDomain()
        assertThat(domain.appliedCreditAmount).isEqualTo(0)
    }

    @Test
    public fun `toDomain defaults appliedCreditAmount to 0 when field omitted`() {
        val dto =
            CreateBookingResponseDto(
                bookingId = "bk-2",
                razorpayOrderId = "order_2",
                amount = 75000,
                requiresPayment = true,
            )
        assertThat(dto.toDomain().appliedCreditAmount).isEqualTo(0)
    }

    @Test
    public fun `toDomain preserves amount alongside appliedCreditAmount`() {
        val domain = makeDto(appliedCreditAmount = 5000).toDomain()
        assertThat(domain.amount).isEqualTo(50000)
        assertThat(domain.appliedCreditAmount).isEqualTo(5000)
    }

    @Test
    public fun `toDomain maps paymentMethod correctly`() {
        val dto =
            CreateBookingResponseDto(
                bookingId = "bk-3",
                razorpayOrderId = "order_3",
                amount = 30000,
                requiresPayment = false,
                paymentMethod = "CASH_ON_SERVICE",
            )
        assertThat(dto.toDomain().paymentMethod).isEqualTo(BookingPaymentMethod.CASH_ON_SERVICE)
    }
}
