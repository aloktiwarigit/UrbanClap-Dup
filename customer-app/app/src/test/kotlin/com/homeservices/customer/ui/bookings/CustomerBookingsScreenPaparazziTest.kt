package com.homeservices.customer.ui.bookings

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.customer.domain.booking.model.BookingPaymentMethod
import com.homeservices.customer.domain.booking.model.CustomerBooking
import com.homeservices.customer.domain.booking.model.CustomerBookingStatus
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Ignore
import org.junit.Rule
import org.junit.Test

// Record goldens on CI: trigger paparazzi-record.yml workflow_dispatch after push
// Per docs/patterns/paparazzi-cross-os-goldens.md — never record on Windows.
public class CustomerBookingsScreenPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi =
        Paparazzi(
            deviceConfig = DeviceConfig.PIXEL_5,
            theme = "android:Theme.Material3.DayNight.NoActionBar",
        )

    private fun completedBooking(ratingSubmitted: Boolean = false): CustomerBooking =
        CustomerBooking(
            bookingId = "b1",
            serviceId = "s1",
            serviceName = "AC Service",
            addressText = "Ayodhya, UP",
            status = CustomerBookingStatus.COMPLETED,
            slotDate = "2026-05-15",
            slotWindow = "10:00 - 12:00",
            amountPaise = 79900L,
            paymentMethod = BookingPaymentMethod.RAZORPAY,
            createdAt = "2026-05-01T10:00:00Z",
            ratingSubmitted = ratingSubmitted,
        )

    @Ignore("Record goldens on CI via paparazzi-record.yml workflow_dispatch")
    @Test
    public fun bookingsContent_completedWithRatingPending() {
        paparazzi.snapshot {
            HomeservicesTheme {
                CustomerBookingsContent(
                    uiState = CustomerBookingsUiState.Ready(listOf(completedBooking(ratingSubmitted = false))),
                    onTrackBooking = {},
                    onRateBooking = {},
                    onComplainBooking = {},
                    onRefresh = {},
                )
            }
        }
    }

    @Ignore("Record goldens on CI via paparazzi-record.yml workflow_dispatch")
    @Test
    public fun bookingsContent_completedRatingAlreadySubmitted() {
        paparazzi.snapshot {
            HomeservicesTheme {
                CustomerBookingsContent(
                    uiState = CustomerBookingsUiState.Ready(listOf(completedBooking(ratingSubmitted = true))),
                    onTrackBooking = {},
                    onRateBooking = {},
                    onComplainBooking = {},
                    onRefresh = {},
                )
            }
        }
    }
}
