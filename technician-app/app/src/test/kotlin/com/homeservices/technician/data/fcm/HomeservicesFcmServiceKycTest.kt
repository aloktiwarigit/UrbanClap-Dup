package com.homeservices.technician.data.fcm

import com.homeservices.corenav.NotificationRouter
import com.homeservices.technician.data.activeJob.BookingStatusEventBus
import com.homeservices.technician.data.earnings.EarningsUpdateEventBus
import com.homeservices.technician.data.jobOffer.JobOfferEventBus
import com.homeservices.technician.data.kyc.KycStatusEvent
import com.homeservices.technician.data.kyc.KycStatusEventBus
import com.homeservices.technician.data.pendingaction.PendingActionStore
import com.homeservices.technician.data.rating.RatingPromptEventBus
import com.homeservices.technician.data.rating.RatingReceivedEventBus
import com.homeservices.technician.domain.jobOffer.FcmTokenSyncUseCase
import com.homeservices.technician.notification.PendingActionIngestor
import io.mockk.coVerify
import io.mockk.mockk
import io.mockk.verify
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

/**
 * TDD — KYC + onboarding-reminder FCM branches (E11-S05c WS-B).
 *
 * Verifies that:
 *   - `KYC_VERIFIED` and `KYC_REJECTED` post a [KycStatusEvent] on [KycStatusEventBus]
 *     with the right `verified` flag and rejection reason.
 *   - Both branches short-circuit when `techId` is missing.
 *   - `ONBOARDING_REMINDER` does not touch the KYC event bus.
 *
 * `showKycStatusNotification` / `showOnboardingReminderNotification` touch the Android
 * [android.app.NotificationManager], which NPEs in a JVM test. The established pattern
 * (see `HomeservicesFcmServiceBookingStatusTest`) is to wrap the call in `runCatching`.
 */
@OptIn(ExperimentalCoroutinesApi::class)
public class HomeservicesFcmServiceKycTest {
    private lateinit var service: HomeservicesFcmService
    private lateinit var kycStatusEventBus: KycStatusEventBus
    private lateinit var pendingActionStore: PendingActionStore
    private val testDispatcher = UnconfinedTestDispatcher()

    @BeforeEach
    public fun setUp() {
        Dispatchers.setMain(testDispatcher)
        val eventBus: JobOfferEventBus = mockk(relaxed = true)
        val ratingPromptEventBus: RatingPromptEventBus = mockk(relaxed = true)
        val earningsUpdateEventBus: EarningsUpdateEventBus = mockk(relaxed = true)
        val ratingReceivedEventBus: RatingReceivedEventBus = mockk(relaxed = true)
        val fcmTokenSyncUseCase: FcmTokenSyncUseCase = mockk(relaxed = true)
        val router: NotificationRouter = mockk(relaxed = true)
        val ingestor: PendingActionIngestor = mockk(relaxed = true)
        val bookingStatusEventBus: BookingStatusEventBus = mockk(relaxed = true)
        kycStatusEventBus = mockk(relaxed = true)
        pendingActionStore = mockk(relaxed = true)

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
                it.kycStatusEventBus = kycStatusEventBus
                it.pendingActionStore = pendingActionStore
            }
    }

    @AfterEach
    public fun tearDown() {
        Dispatchers.resetMain()
    }

    // ── KYC_VERIFIED ──────────────────────────────────────────────────────────

    @Test
    public fun `KYC_VERIFIED — posts KycStatusEvent with verified true`() {
        val data = mapOf("type" to "KYC_VERIFIED", "techId" to "tech-1")

        runCatching { service.handleMessageData(data) }

        verify {
            kycStatusEventBus.post(
                KycStatusEvent(technicianId = "tech-1", verified = true, rejectionReason = null),
            )
        }
    }

    @Test
    public fun `KYC_VERIFIED — missing techId returns early and does not post`() {
        val data = mapOf("type" to "KYC_VERIFIED")

        service.handleMessageData(data)

        verify(exactly = 0) { kycStatusEventBus.post(any()) }
    }

    // ── KYC_REJECTED ──────────────────────────────────────────────────────────

    @Test
    public fun `KYC_REJECTED — posts KycStatusEvent with verified false and reason`() {
        val data =
            mapOf(
                "type" to "KYC_REJECTED",
                "techId" to "tech-2",
                "reason" to "PAN photo unreadable",
            )

        runCatching { service.handleMessageData(data) }

        verify {
            kycStatusEventBus.post(
                KycStatusEvent(
                    technicianId = "tech-2",
                    verified = false,
                    rejectionReason = "PAN photo unreadable",
                ),
            )
        }
    }

    @Test
    public fun `KYC_REJECTED — propagates null reason when key is absent`() {
        val data = mapOf("type" to "KYC_REJECTED", "techId" to "tech-2")

        runCatching { service.handleMessageData(data) }

        verify {
            kycStatusEventBus.post(
                KycStatusEvent(technicianId = "tech-2", verified = false, rejectionReason = null),
            )
        }
    }

    @Test
    public fun `KYC_REJECTED — missing techId returns early and does not post`() {
        val data = mapOf("type" to "KYC_REJECTED", "reason" to "anything")

        service.handleMessageData(data)

        verify(exactly = 0) { kycStatusEventBus.post(any()) }
    }

    // ── ONBOARDING_REMINDER ───────────────────────────────────────────────────

    @Test
    public fun `ONBOARDING_REMINDER — does not touch the KYC status event bus`() {
        val data =
            mapOf(
                "type" to "ONBOARDING_REMINDER",
                "title" to "Finish onboarding",
                "body" to "Your KYC is still pending.",
            )

        runCatching { service.handleMessageData(data) }

        verify(exactly = 0) { kycStatusEventBus.post(any()) }
    }

    // ── Durable Room cleanup on final verdict (P2/P3 from Codex round 2) ──────
    //
    // The launched coroutine runs in `serviceScope` on `Dispatchers.IO`, which the
    // `Dispatchers.setMain` swap above does not redirect. `coVerify(timeout = ...)`
    // waits up to the given budget for the suspended call to land — avoids both
    // races and flakes without forcing a thread sleep.

    @Test
    public fun `KYC_VERIFIED — tombstones retry, submit-pending, and resume rows in serviceScope`(): Unit =
        runTest {
            val data = mapOf("type" to "KYC_VERIFIED", "techId" to "tech-1")

            runCatching { service.handleMessageData(data) }

            coVerify(timeout = TOMBSTONE_TIMEOUT_MS) {
                pendingActionStore.clearPhotoRetry(techId = "tech-1", now = any())
            }
            coVerify(timeout = TOMBSTONE_TIMEOUT_MS) {
                pendingActionStore.clearKycSubmitPending(techId = "tech-1", now = any())
            }
            coVerify(timeout = TOMBSTONE_TIMEOUT_MS) {
                pendingActionStore.clearKycResume(techId = "tech-1", now = any())
            }
        }

    @Test
    public fun `KYC_REJECTED — tombstones retry, submit-pending, and resume rows in serviceScope`(): Unit =
        runTest {
            val data =
                mapOf(
                    "type" to "KYC_REJECTED",
                    "techId" to "tech-2",
                    "reason" to "PAN unreadable",
                )

            runCatching { service.handleMessageData(data) }

            coVerify(timeout = TOMBSTONE_TIMEOUT_MS) {
                pendingActionStore.clearPhotoRetry(techId = "tech-2", now = any())
            }
            coVerify(timeout = TOMBSTONE_TIMEOUT_MS) {
                pendingActionStore.clearKycSubmitPending(techId = "tech-2", now = any())
            }
            coVerify(timeout = TOMBSTONE_TIMEOUT_MS) {
                pendingActionStore.clearKycResume(techId = "tech-2", now = any())
            }
        }

    private companion object {
        private const val TOMBSTONE_TIMEOUT_MS = 2_000L
    }
}
