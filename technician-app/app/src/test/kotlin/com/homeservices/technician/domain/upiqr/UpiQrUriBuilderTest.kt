package com.homeservices.technician.domain.upiqr

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

public class UpiQrUriBuilderTest {
    @Test
    public fun `builds the exact upi pay URI template`() {
        val uri = UpiQrUriBuilder.build(
            vpa = "alok@okhdfcbank",
            payeeName = "Alok Tiwari",
            amountPaise = 65000,
            bookingId = "bk-abc123",
        )

        assertEquals(
            "upi://pay?pa=alok%40okhdfcbank&pn=Alok%20Tiwari&am=650.00&cu=INR&tn=bk-abc123",
            uri,
        )
    }

    @Test
    public fun `URL-encodes a payee name containing special characters`() {
        val uri = UpiQrUriBuilder.build(
            vpa = "a@b",
            payeeName = "Ramesh & Sons",
            amountPaise = 10000,
            bookingId = "bk-1",
        )
        assertTrue(uri.contains("pn=Ramesh%20%26%20Sons"))
    }

    @Test
    public fun `converts paise to a two-decimal rupee amount`() {
        val uri = UpiQrUriBuilder.build("a@b", "N", amountPaise = 5, bookingId = "bk-1")
        assertTrue(uri.contains("am=0.05"))
    }
}
