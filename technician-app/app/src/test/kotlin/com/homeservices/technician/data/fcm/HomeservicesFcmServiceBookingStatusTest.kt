package com.homeservices.technician.data.fcm

import com.homeservices.corenav.NotificationRouter
import com.homeservices.technician.data.activeJob.BookingStatusEvent
import com.homeservices.technician.data.activeJob.BookingStatusEventBus
import com.homeservices.technician.data.earnings.EarningsUpdateEventBus
import com.homeservices.technician.data.jobOffer.JobOfferEventBus
import com.homeservices.technician.data.rating.RatingPromptEventBus
import com.homeservices.technician.data.rating.RatingReceivedEventBus
import com.homeservices.technician.domain.jobOffer.FcmTokenSyncUseCase
import com.homeservices.technician.notification.PendingActionIngestor
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

/**
 * TDD — booking-status FCM branches (E11-S05a WS-B).
 *
 * Verifies that BOOKING_STATUS_UPDATE / CUSTOMER_PRICE_APPROVED / CUSTOMER_PRICE_REJECTED
 * FCM messages post the expected [BookingStatusEvent] on the [BookingStatusEventBus]
 * and short-circuit when [bookingId] is missing. Tray-notification side-effects need
 * an Android context (NPE in a JVM test) so we wrap in runCatching, matching the
 * established pattern from [HomeservicesFcmServiceDashboardTest].
 */
public class HomeservicesFcmServiceBookingStatusTest {
    private lateinit var service: HomeservicesFcmService
    private lateinit var bookingStatusEventBus: BookingStatusEventBus

    @BeforeEach
    public fun setUp() {
        val eventBus: JobOfferEventBus = mockk(relaxed = true)
        val ratingPromptEventBus: RatingPromptEventBus = mockk(relaxed = true)
        val earningsUpdateEventBus: EarningsUpdateEventBus = mockk(relaxed = true)
        val ratingReceivedEventBus: RatingReceivedEventBus = mockk(relaxed = true)
        val fcmTokenSyncUseCase: FcmTokenSyncUseCase = mockk(relaxed = true)
        val router: NotificationRouter = mockk(relaxed = true)
        val ingestor: PendingActionIngestor = mockk(relaxed = true)
        bookingStatusEventBus = mockk(relaxed = true)

        service =
            HomeservicesFcmService().also {
                it.eventBus = eventBus
                it.fcmTokenSyncUseCase = fcmTokenSyncUseCase
                it.ratingPromptEventBus = ratingPromptEventBus
                it.earningsUpdateEventBus = earningsUpdateEventBus
                it.ratingReceivedEventBus = ratingReceivedEventBus
                it.router = router
                it.ingestor = ingestor
                it.bookingStatusEventBus = bookingStatusEventBus
            }
    }

    // ── BOOKING_STATUS_UPDATE ─────────────────────────────────────────────────

    @Test
    public fun `BOOKING_STATUS_UPDATE — posts BookingStatusEvent with bookingId and newStatus`() {
        val data =
            mapOf(
                "type" to "BOOKING_STATUS_UPDATE",
                "bookingId" to "bk-1",
                "newStatus" to "ASSIGNED",
            )
        // showBookingStatusNotification touches Android OS — NPE absorbed
        runCatching { service.handleMessageData(data) }

        verify {
            bookingStatusEventBus.post(
                BookingStatusEvent(bookingId = "bk-1", newStatus = "ASSIGNED", priceApprovedPaise = null),
            )
        }
    }

    @Test
    public fun `BOOKING_STATUS_UPDATE — passes through priceApprovedPaise when present`() {
        val data =
            mapOf(
                "type" to "BOOKING_STATUS_UPDATE",
                "bookingId" to "bk-2",
                "newStatus" to "PRICE_APPROVED",
                "priceApprovedPaise" to "12500",
            )
        runCatching { service.handleMessageData(data) }

        verify {
            bookingStatusEventBus.post(
                BookingStatusEvent(bookingId = "bk-2", newStatus = "PRICE_APPROVED", priceApprovedPaise = 12_500L),
            )
        }
    }

    @Test
    public fun `BOOKING_STATUS_UPDATE — missing bookingId returns early and does not post`() {
        val data = mapOf("type" to "BOOKING_STATUS_UPDATE", "newStatus" to "ASSIGNED")

        service.handleMessageData(data)

        verify(exactly = 0) { bookingStatusEventBus.post(any()) }
    }

    @Test
    public fun `BOOKING_STATUS_UPDATE — missing newStatus returns early and does not post`() {
        val data = mapOf("type" to "BOOKING_STATUS_UPDATE", "bookingId" to "bk-1")

        service.handleMessageData(data)

        verify(exactly = 0) { bookingStatusEventBus.post(any()) }
    }

    // ── CUSTOMER_PRICE_APPROVED ──────────────────────────────────────────────

    @Test
    public fun `CUSTOMER_PRICE_APPROVED — posts PRICE_APPROVED event with parsed amountPaise`() {
        val data =
            mapOf(
                "type" to "CUSTOMER_PRICE_APPROVED",
                "bookingId" to "bk-3",
                "amountPaise" to "5000",
            )
        runCatching { service.handleMessageData(data) }

        verify {
            bookingStatusEventBus.post(
                BookingStatusEvent(bookingId = "bk-3", newStatus = "PRICE_APPROVED", priceApprovedPaise = 5_000L),
            )
        }
    }

    @Test
    public fun `CUSTOMER_PRICE_APPROVED — non-numeric amountPaise falls back to zero`() {
        val data =
            mapOf(
                "type" to "CUSTOMER_PRICE_APPROVED",
                "bookingId" to "bk-3",
                "amountPaise" to "not-a-number",
            )
        runCatching { service.handleMessageData(data) }

        verify {
            bookingStatusEventBus.post(
                BookingStatusEvent(bookingId = "bk-3", newStatus = "PRICE_APPROVED", priceApprovedPaise = 0L),
            )
        }
    }

    @Test
    public fun `CUSTOMER_PRICE_APPROVED — missing bookingId returns early`() {
        val data = mapOf("type" to "CUSTOMER_PRICE_APPROVED", "amountPaise" to "5000")

        service.handleMessageData(data)

        verify(exactly = 0) { bookingStatusEventBus.post(any()) }
    }

    // ── CUSTOMER_PRICE_REJECTED ──────────────────────────────────────────────

    @Test
    public fun `CUSTOMER_PRICE_REJECTED — posts PRICE_REJECTED event without paise`() {
        val data = mapOf("type" to "CUSTOMER_PRICE_REJECTED", "bookingId" to "bk-4")
        runCatching { service.handleMessageData(data) }

        verify {
            bookingStatusEventBus.post(
                BookingStatusEvent(bookingId = "bk-4", newStatus = "PRICE_REJECTED", priceApprovedPaise = null),
            )
        }
    }

    @Test
    public fun `CUSTOMER_PRICE_REJECTED — missing bookingId returns early`() {
        val data = mapOf("type" to "CUSTOMER_PRICE_REJECTED")

        service.handleMessageData(data)

        verify(exactly = 0) { bookingStatusEventBus.post(any()) }
    }
}
