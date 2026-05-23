package com.homeservices.customer.domain.booking.model

import org.assertj.core.api.Assertions.assertThat
import org.junit.Test

public class RazorpayErrorCodeTest {
    @Test
    public fun `resolve maps SDK code 0 to PAYMENT_CANCELLED`() {
        assertThat(RazorpayErrorCode.resolve(0, "User dismissed")).isEqualTo(RazorpayErrorCode.PAYMENT_CANCELLED)
    }

    @Test
    public fun `resolve maps SDK code 1 to BAD_REQUEST_ERROR`() {
        assertThat(RazorpayErrorCode.resolve(1, "Invalid options")).isEqualTo(RazorpayErrorCode.BAD_REQUEST_ERROR)
    }

    @Test
    public fun `resolve maps SDK code 2 to NETWORK_ERROR`() {
        assertThat(RazorpayErrorCode.resolve(2, "Network timeout")).isEqualTo(RazorpayErrorCode.NETWORK_ERROR)
    }

    @Test
    public fun `resolve maps SDK code 6 TLS error to NETWORK_ERROR`() {
        assertThat(RazorpayErrorCode.resolve(6, "TLS failure")).isEqualTo(RazorpayErrorCode.NETWORK_ERROR)
    }

    @Test
    public fun `resolve maps unknown SDK code to BAD_REQUEST_ERROR`() {
        assertThat(RazorpayErrorCode.resolve(99, "Unknown")).isEqualTo(RazorpayErrorCode.BAD_REQUEST_ERROR)
    }
}
