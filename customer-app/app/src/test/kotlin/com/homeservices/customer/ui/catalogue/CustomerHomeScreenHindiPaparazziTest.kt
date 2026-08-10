package com.homeservices.customer.ui.catalogue

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.corenav.PendingAction
import com.homeservices.corenav.PendingActionPriority
import com.homeservices.corenav.PendingActionStatus
import com.homeservices.corenav.PendingActionType
import com.homeservices.customer.domain.booking.model.BookingPaymentMethod
import com.homeservices.customer.domain.booking.model.CustomerBooking
import com.homeservices.customer.domain.booking.model.CustomerBookingStatus
import org.junit.Rule
import org.junit.Test

/**
 * HI-light companion to [CustomerHomeScreenPaparazziTest] (Codex F2, owner ruling 2026-08-09:
 * HI-light only, dark deferred). Mirrors its three states; locale switch via
 * `DeviceConfig.copy(locale = "hi")` per [com.homeservices.customer.ui.rating.RatingShieldHindiPaparazziTest].
 * Intentionally not wrapped in `HomeservicesTheme`, matching the base class it mirrors.
 */
public class CustomerHomeScreenHindiPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi =
        Paparazzi(
            deviceConfig = DeviceConfig.PIXEL_6.copy(locale = "hi"),
            theme = "android:Theme.Material3.Light.NoActionBar",
        )

    private fun makeAction(id: String): PendingAction =
        PendingAction(
            id = id,
            userId = "user1",
            role = "customer",
            type = PendingActionType.RATING_PROMPT_CUSTOMER,
            entityType = "booking",
            entityId = "bk-$id",
            routeUri = "homeservices://action/RATING_PROMPT_CUSTOMER?bookingId=bk-$id",
            priority = PendingActionPriority.NORMAL,
            status = PendingActionStatus.ACTIVE,
            sourceStatus = null,
            version = 1L,
            createdAt = 1_000L,
            updatedAt = 1_000L,
            expiresAt = null,
            resolvedAt = null,
        )

    private fun makeBooking(
        bookingId: String,
        status: CustomerBookingStatus,
    ): CustomerBooking =
        CustomerBooking(
            bookingId = bookingId,
            serviceId = "svc1",
            serviceName = "एसी मरम्मत",
            addressText = "123 मेन स्ट्रीट, अयोध्या",
            status = status,
            slotDate = "2026-05-10",
            slotWindow = "10:00–12:00",
            amountPaise = 59900,
            paymentMethod = BookingPaymentMethod.RAZORPAY,
            createdAt = "2026-05-01T10:00:00Z",
        )

    @Test
    public fun `snapshot_customer_home_empty_state_hindiLight`() {
        paparazzi.snapshot {
            CustomerHomeTabContent(
                homeState =
                    CustomerHomeUiState.Ready(
                        pendingActions = emptyList(),
                        activeBooking = null,
                        recentBookings = emptyList(),
                    ),
                onPendingActionClick = {},
                onTrackBooking = {},
                onPriceApproval = {},
                onRateBooking = {},
                onComplainBooking = {},
            )
        }
    }

    @Test
    public fun `snapshot_customer_home_pending_actions_state_hindiLight`() {
        paparazzi.snapshot {
            CustomerHomeTabContent(
                homeState =
                    CustomerHomeUiState.Ready(
                        pendingActions = listOf(makeAction("a1"), makeAction("a2")),
                        activeBooking = null,
                        recentBookings = emptyList(),
                    ),
                onPendingActionClick = {},
                onTrackBooking = {},
                onPriceApproval = {},
                onRateBooking = {},
                onComplainBooking = {},
            )
        }
    }

    @Test
    public fun `snapshot_customer_home_active_booking_state_hindiLight`() {
        paparazzi.snapshot {
            CustomerHomeTabContent(
                homeState =
                    CustomerHomeUiState.Ready(
                        pendingActions = emptyList(),
                        activeBooking = makeBooking("bk1", CustomerBookingStatus.IN_PROGRESS),
                        recentBookings = emptyList(),
                    ),
                onPendingActionClick = {},
                onTrackBooking = {},
                onPriceApproval = {},
                onRateBooking = {},
                onComplainBooking = {},
            )
        }
    }
}
