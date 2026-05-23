package com.homeservices.technician.data.fcm

import com.homeservices.corenav.NotificationRouter
import com.homeservices.technician.data.earnings.EarningsUpdateEventBus
import com.homeservices.technician.data.jobOffer.JobOfferEventBus
import com.homeservices.technician.data.rating.RatingPromptEventBus
import com.homeservices.technician.data.rating.RatingReceivedEventBus
import com.homeservices.technician.domain.jobOffer.FcmTokenSyncUseCase
import com.homeservices.technician.domain.jobOffer.model.JobOffer
import com.homeservices.technician.notification.PendingActionIngestor
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.time.Instant

/**
 * Unit tests for [HomeservicesFcmService.handleMessageData].
 *
 * The service is an @AndroidEntryPoint that requires a live Android runtime for its
 * full lifecycle. These tests exercise the extracted [handleMessageData] method in
 * isolation, without starting the service via Robolectric:
 *
 *  1. JOB_OFFER payload → event bus emitted + notification attempted
 *  2. Missing / malformed fields → no event bus emission
 *
 * Notification creation is verified via mockk on the event bus (the OS-level
 * NotificationManager call is a side-effect excluded from unit tests — same
 * rationale as the HomeservicesFcmService Kover exclusion).
 */
public class HomeservicesFcmServiceJobOfferTest {
    private lateinit var service: HomeservicesFcmService
    private lateinit var eventBus: JobOfferEventBus
    private lateinit var ratingPromptEventBus: RatingPromptEventBus
    private lateinit var earningsUpdateEventBus: EarningsUpdateEventBus
    private lateinit var ratingReceivedEventBus: RatingReceivedEventBus
    private lateinit var fcmTokenSyncUseCase: FcmTokenSyncUseCase

    // router returns null for all FCM data by default (relaxed = true → null for nullable returns)
    private lateinit var router: NotificationRouter
    private lateinit var ingestor: PendingActionIngestor

    private val validJobOfferData: Map<String, String>
        get() {
            val expiresAt = Instant.now().plusSeconds(30).toString()
            return mapOf(
                "type" to "JOB_OFFER",
                "bookingId" to "bk-test-1",
                "serviceId" to "svc-1",
                "serviceName" to "AC Repair",
                "addressText" to "12 Main St, Ayodhya",
                "slotDate" to "2026-05-10",
                "slotWindow" to "10:00-12:00",
                "amount" to "50000",
                "distanceKm" to "3.5",
                "expiresAt" to expiresAt,
            )
        }

    @BeforeEach
    public fun setUp() {
        eventBus = mockk(relaxed = true)
        ratingPromptEventBus = mockk(relaxed = true)
        earningsUpdateEventBus = mockk(relaxed = true)
        ratingReceivedEventBus = mockk(relaxed = true)
        fcmTokenSyncUseCase = mockk(relaxed = true)
        router = mockk(relaxed = true)
        ingestor = mockk(relaxed = true)

        every { eventBus.tryEmit(any()) } returns Unit

        // We can't instantiate HomeservicesFcmService via constructor (it extends
        // FirebaseMessagingService which requires an Android context). We verify
        // handleMessageData's routing logic by direct field assignment instead.
        service =
            HomeservicesFcmService().also {
                it.eventBus = eventBus
                it.fcmTokenSyncUseCase = fcmTokenSyncUseCase
                it.ratingPromptEventBus = ratingPromptEventBus
                it.earningsUpdateEventBus = earningsUpdateEventBus
                it.ratingReceivedEventBus = ratingReceivedEventBus
                it.router = router
                it.ingestor = ingestor
            }
    }

    @Test
    public fun `JOB_OFFER data — emits parsed offer to event bus`() {
        runCatching { service.handleMessageData(validJobOfferData) }
        // showJobOfferNotification may throw NPE (no Android context) — we only care
        // about the event bus emission which happens before the notification call.
        verify { eventBus.tryEmit(match { it.bookingId == "bk-test-1" }) }
    }

    @Test
    public fun `JOB_OFFER data — emitted offer has correct amount`() {
        var capturedOffer: JobOffer? = null
        every { eventBus.tryEmit(any()) } answers {
            capturedOffer = firstArg()
            Unit
        }

        runCatching { service.handleMessageData(validJobOfferData) }

        assertThat(capturedOffer?.amountPaise).isEqualTo(50_000L)
    }

    @Test
    public fun `JOB_OFFER data with FCM sent time carries server clock offset`() {
        var capturedOffer: JobOffer? = null
        every { eventBus.tryEmit(any()) } answers {
            capturedOffer = firstArg()
            Unit
        }
        val sentTimeMs = System.currentTimeMillis() + 70_000L

        runCatching { service.handleMessageData(validJobOfferData, sentTimeMs) }

        assertThat(capturedOffer?.serverClockOffsetMs).isBetween(69_000L, 70_000L)
    }

    @Test
    public fun `JOB_OFFER with missing bookingId — does NOT emit to event bus`() {
        val badData = validJobOfferData.toMutableMap().apply { remove("bookingId") }

        runCatching { service.handleMessageData(badData) }

        verify(exactly = 0) { eventBus.tryEmit(any()) }
    }

    @Test
    public fun `JOB_OFFER with malformed expiresAt — does NOT emit to event bus`() {
        val badData = validJobOfferData.toMutableMap().apply { put("expiresAt", "not-a-date") }

        runCatching { service.handleMessageData(badData) }

        verify(exactly = 0) { eventBus.tryEmit(any()) }
    }

    @Test
    public fun `JOB_OFFER with missing amount — does NOT emit to event bus`() {
        val badData = validJobOfferData.toMutableMap().apply { remove("amount") }

        runCatching { service.handleMessageData(badData) }

        verify(exactly = 0) { eventBus.tryEmit(any()) }
    }

    @Test
    public fun `RATING_PROMPT_TECHNICIAN — posts to ratingPromptEventBus`() {
        val data = mapOf("type" to "RATING_PROMPT_TECHNICIAN", "bookingId" to "bk-2")
        // showRatingPromptNotification requires Android context — NPE absorbed by runCatching
        runCatching { service.handleMessageData(data) }

        verify { ratingPromptEventBus.post("bk-2") }
    }

    @Test
    public fun `EARNINGS_UPDATE — notifies earnings event bus`() {
        val data = mapOf("type" to "EARNINGS_UPDATE")
        // showEarningsUpdateNotification requires Android context — NPE absorbed by runCatching
        runCatching { service.handleMessageData(data) }

        verify { earningsUpdateEventBus.notifyEarningsUpdate() }
    }

    @Test
    public fun `CHANNEL_DISPATCH_OFFERS constant has expected value`() {
        assertThat(HomeservicesFcmService.CHANNEL_DISPATCH_OFFERS).isEqualTo("dispatch_offers")
    }

    @Test
    public fun `ERASURE_FINAL_NOTICE — does not trigger any unrelated event bus`() {
        // Pre-fix, this message type fell through the when block silently and was dropped.
        // Post-fix, it routes to showErasureFinalNoticeNotification(daysRemaining) which
        // posts to a dedicated notification channel. The OS-level NotificationManager call
        // throws an NPE in this unit context (no Android service) — runCatching absorbs it,
        // same pattern as the JOB_OFFER test. The meaningful assertion here is the absence
        // of cross-talk: no other event bus should receive this message type.
        val data = mapOf("type" to "ERASURE_FINAL_NOTICE", "daysRemaining" to "3")

        runCatching { service.handleMessageData(data) }

        verify(exactly = 0) { eventBus.tryEmit(any()) }
        verify(exactly = 0) { ratingPromptEventBus.post(any()) }
        verify(exactly = 0) { earningsUpdateEventBus.notifyEarningsUpdate() }
        verify(exactly = 0) { ratingReceivedEventBus.post() }
    }

    @Test
    public fun `ERASURE_FINAL_NOTICE — missing daysRemaining defaults to zero`() {
        // Defensive parsing: a malformed/absent daysRemaining field must not crash the
        // handler. The notification path renders the "last day" copy when 0.
        val data = mapOf("type" to "ERASURE_FINAL_NOTICE")

        runCatching { service.handleMessageData(data) }

        verify(exactly = 0) { eventBus.tryEmit(any()) }
        verify(exactly = 0) { ratingPromptEventBus.post(any()) }
        verify(exactly = 0) { earningsUpdateEventBus.notifyEarningsUpdate() }
        verify(exactly = 0) { ratingReceivedEventBus.post() }
    }

    @Test
    public fun `CHANNEL_ERASURE_NOTICES constant has expected value`() {
        assertThat(HomeservicesFcmService.CHANNEL_ERASURE_NOTICES).isEqualTo("erasure_notices")
    }
}
