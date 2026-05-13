package com.homeservices.customer.ui.booking

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.customer.domain.booking.model.BookingSlot
import com.homeservices.customer.domain.booking.model.RazorpayErrorCode
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Ignore
import org.junit.Rule
import org.junit.Test

public class BookingSummaryScreenPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi =
        Paparazzi(
            deviceConfig = DeviceConfig.PIXEL_5,
            theme = "android:Theme.Material3.DayNight.NoActionBar",
        )

    private val readyState =
        BookingUiState.Ready(
            slot = BookingSlot("2026-05-01", "10:00-12:00"),
            addressText = "123 MG Road, Bengaluru",
            lat = 12.9716,
            lng = 77.5946,
        )

    @Test
    public fun bookingSummaryReady_lightTheme() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                BookingSummaryContent(
                    uiState = readyState,
                    onCreateBooking = {},
                    onBack = {},
                )
            }
        }
    }

    @Test
    public fun bookingSummaryReady_darkTheme() {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = true) {
                BookingSummaryContent(
                    uiState = readyState,
                    onCreateBooking = {},
                    onBack = {},
                )
            }
        }
    }

    // Goldens recorded on CI only (cross-OS font antialiasing drift — see docs/patterns/paparazzi-cross-os-goldens.md)
    @Ignore("CI-only: trigger paparazzi-record.yml workflow_dispatch to record goldens on Linux CI")
    @Test
    public fun bookingSummaryPaymentFailed_lightTheme() {
        val failedState =
            BookingUiState.PaymentFailed(
                orderId = "order_test_123",
                amount = 50000,
                reason = "Payment cancelled by user.",
                errorCode = RazorpayErrorCode.PAYMENT_CANCELLED,
                slot = BookingSlot("2026-05-01", "10:00-12:00"),
                addressText = "123 MG Road, Bengaluru",
                lat = 12.9716,
                lng = 77.5946,
            )
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                BookingSummaryContent(
                    uiState = failedState,
                    onCreateBooking = {},
                    onBack = {},
                )
            }
        }
    }

    @Ignore("CI-only: trigger paparazzi-record.yml workflow_dispatch to record goldens on Linux CI")
    @Test
    public fun bookingSummaryPaymentFailed_darkTheme() {
        val failedState =
            BookingUiState.PaymentFailed(
                orderId = "order_test_123",
                amount = 50000,
                reason = "Payment cancelled by user.",
                errorCode = RazorpayErrorCode.PAYMENT_CANCELLED,
                slot = BookingSlot("2026-05-01", "10:00-12:00"),
                addressText = "123 MG Road, Bengaluru",
                lat = 12.9716,
                lng = 77.5946,
            )
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = true) {
                BookingSummaryContent(
                    uiState = failedState,
                    onCreateBooking = {},
                    onBack = {},
                )
            }
        }
    }
}
