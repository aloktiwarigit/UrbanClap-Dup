package com.homeservices.technician.ui.jobOffer

import com.homeservices.technician.data.jobOffer.JobOfferEventBus
import com.homeservices.technician.domain.jobOffer.AcceptJobOfferUseCase
import com.homeservices.technician.domain.jobOffer.DeclineJobOfferUseCase
import com.homeservices.technician.domain.jobOffer.model.JobOffer
import com.homeservices.technician.domain.jobOffer.model.JobOfferResult
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.test.TestCoroutineScheduler
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.time.Clock
import java.time.Instant
import java.time.ZoneId

@OptIn(ExperimentalCoroutinesApi::class)
public class JobOfferViewModelTest {
    private lateinit var acceptUseCase: AcceptJobOfferUseCase
    private lateinit var declineUseCase: DeclineJobOfferUseCase
    private lateinit var eventBus: JobOfferEventBus
    private lateinit var viewModel: JobOfferViewModel
    private lateinit var clock: SchedulerClock

    private lateinit var offerFlow: MutableSharedFlow<JobOffer>

    private fun aJobOffer(expiresAtMs: Long = clock.millis() + 30_000L): JobOffer =
        JobOffer(
            bookingId = "booking-123",
            serviceId = "svc-1",
            serviceName = "AC Repair",
            addressText = "12 Main Street, Bengaluru",
            slotDate = "2026-05-01",
            slotWindow = "10:00–12:00",
            amountPaise = 50000L,
            distanceKm = 2.5,
            expiresAtMs = expiresAtMs,
        )

    @BeforeEach
    public fun setUp(): Unit {
        acceptUseCase = mockk(relaxed = true)
        declineUseCase = mockk(relaxed = true)
        eventBus = mockk(relaxed = true)
        offerFlow = MutableSharedFlow(extraBufferCapacity = 1)
        every { eventBus.events } returns offerFlow
    }

    @AfterEach
    public fun tearDown(): Unit {
        Dispatchers.resetMain()
    }

    @Test
    public fun `initial uiState is Idle`(): Unit =
        runTest {
            createViewModel()

            assertThat(viewModel.uiState.value).isEqualTo(JobOfferUiState.Idle)
        }

    @Test
    public fun `offer arrives via bus — uiState becomes Offering with correct data and remaining seconds`(): Unit =
        runTest {
            createViewModel()
            val offer = aJobOffer(expiresAtMs = clock.millis() + 30_000L)

            offerFlow.emit(offer)

            val state = viewModel.uiState.value
            assertThat(state).isInstanceOf(JobOfferUiState.Offering::class.java)
            val offering = state as JobOfferUiState.Offering
            assertThat(offering.offer).isEqualTo(offer)
            assertThat(offering.remainingSeconds).isGreaterThan(0)
        }

    @Test
    public fun `accept transitions to Accepted state`(): Unit =
        runTest {
            createViewModel()
            val offer = aJobOffer()
            offerFlow.emit(offer)
            assertThat(viewModel.uiState.value).isInstanceOf(JobOfferUiState.Offering::class.java)

            coEvery { acceptUseCase(offer.bookingId) } returns JobOfferResult.Accepted(offer.bookingId)

            viewModel.accept()

            assertThat(viewModel.uiState.value).isInstanceOf(JobOfferUiState.Accepted::class.java)
            val accepted = viewModel.uiState.value as JobOfferUiState.Accepted
            assertThat(accepted.bookingId).isEqualTo(offer.bookingId)
        }

    /**
     * Codex review MAJOR-1 — decline must be inert while an accept is in flight.
     *
     * `accept()` leaves the state as `Offering(isAccepting = true)` until the use case returns.
     * `decline()` previously only checked for `Offering`, so a decline arriving in that window —
     * most easily via system back on the lock-screen Activity, which now declines — would fire a
     * decline request for a booking the technician had already chosen to accept, and whichever
     * request resolved last would win.
     */
    @Test
    public fun `decline is ignored while an accept is still in flight`(): Unit =
        runTest {
            createViewModel()
            val offer = aJobOffer()
            offerFlow.emit(offer)

            // Park the accept use case so the ViewModel stays in Offering(isAccepting = true) —
            // the window this guard protects. Without the delay the coroutine runs to completion
            // eagerly and the mid-flight state is never observable.
            coEvery { acceptUseCase(offer.bookingId) } coAnswers {
                delay(10_000L)
                JobOfferResult.Accepted(offer.bookingId)
            }

            viewModel.accept()
            val midAccept = viewModel.uiState.value
            assertThat(midAccept).isInstanceOf(JobOfferUiState.Offering::class.java)
            assertThat((midAccept as JobOfferUiState.Offering).isAccepting).isTrue()

            viewModel.decline()

            coVerify(exactly = 0) { declineUseCase(any()) }
            assertThat(viewModel.uiState.value).isNotEqualTo(JobOfferUiState.Declined)
        }

    @Test
    public fun `accept transitions to Expired when use case reports booking already taken`(): Unit =
        runTest {
            createViewModel()
            offerFlow.emit(aJobOffer(expiresAtMs = clock.millis() + 30_000L))
            coEvery { acceptUseCase(any()) } returns JobOfferResult.Expired("booking-123")

            viewModel.accept()

            assertThat(viewModel.uiState.value).isEqualTo(JobOfferUiState.Expired)
        }

    @Test
    public fun `accept failure keeps offer active while timer remains`(): Unit =
        runTest {
            createViewModel()
            val offer = aJobOffer(expiresAtMs = clock.millis() + 30_000L)
            offerFlow.emit(offer)
            coEvery { acceptUseCase(offer.bookingId) } throws RuntimeException("network")

            viewModel.accept()

            val state = viewModel.uiState.value
            assertThat(state).isInstanceOf(JobOfferUiState.Offering::class.java)
            val offering = state as JobOfferUiState.Offering
            assertThat(offering.offer).isEqualTo(offer)
            assertThat(offering.errorMessage).contains("Could not accept")
        }

    @Test
    public fun `offer countdown uses server clock offset`(): Unit =
        runTest {
            createViewModel()
            val deviceNow = clock.millis()
            val offer =
                aJobOffer(expiresAtMs = deviceNow + 100_000L)
                    .copy(serverClockOffsetMs = 70_000L)

            offerFlow.emit(offer)

            val state = viewModel.uiState.value as JobOfferUiState.Offering
            assertThat(state.remainingSeconds).isBetween(29, 30)
        }

    @Test
    public fun `negative server clock offset does not extend countdown`(): Unit =
        runTest {
            createViewModel()
            val offer =
                aJobOffer(expiresAtMs = clock.millis() + 30_000L)
                    .copy(serverClockOffsetMs = -10_000L)

            offerFlow.emit(offer)

            val state = viewModel.uiState.value as JobOfferUiState.Offering
            assertThat(state.remainingSeconds).isLessThanOrEqualTo(30)
        }

    @Test
    public fun `decline transitions to Declined state`(): Unit =
        runTest {
            createViewModel()
            val offer = aJobOffer()
            offerFlow.emit(offer)
            assertThat(viewModel.uiState.value).isInstanceOf(JobOfferUiState.Offering::class.java)

            coEvery { declineUseCase(offer.bookingId) } returns JobOfferResult.Declined(offer.bookingId)

            viewModel.decline()

            assertThat(viewModel.uiState.value).isEqualTo(JobOfferUiState.Declined)
        }

    @Test
    public fun `offer expires when remainingSeconds reaches zero`(): Unit =
        runTest {
            createViewModel()
            val expiredOffer = aJobOffer(expiresAtMs = clock.millis() - 1_000L)

            offerFlow.emit(expiredOffer)

            assertThat(viewModel.uiState.value).isEqualTo(JobOfferUiState.Expired)
        }

    @Test
    public fun `countdown reduces remainingSeconds over time`(): Unit =
        runTest {
            createViewModel()
            val offer = aJobOffer(expiresAtMs = clock.millis() + 30_000L)
            offerFlow.emit(offer)

            val initialState = viewModel.uiState.value as? JobOfferUiState.Offering
            assertThat(initialState).isNotNull
            val initialSeconds = initialState!!.remainingSeconds

            advanceTimeBy(5_000L)
            runCurrent()

            val laterState = viewModel.uiState.value
            assertThat(laterState).isInstanceOf(JobOfferUiState.Offering::class.java)
            val offeringState = laterState as JobOfferUiState.Offering
            assertThat(offeringState.remainingSeconds).isLessThan(initialSeconds)
        }

    private fun TestScope.createViewModel(): Unit {
        Dispatchers.setMain(UnconfinedTestDispatcher(testScheduler))
        clock = SchedulerClock(testScheduler)
        viewModel = JobOfferViewModel(eventBus, acceptUseCase, declineUseCase, clock)
    }

    private class SchedulerClock(
        private val scheduler: TestCoroutineScheduler,
        private val baseMs: Long = Instant.parse("2026-05-23T00:00:00Z").toEpochMilli(),
        private val zoneId: ZoneId = ZoneId.of("UTC"),
    ) : Clock() {
        override fun getZone(): ZoneId = zoneId

        override fun withZone(zone: ZoneId): Clock = SchedulerClock(scheduler, baseMs, zone)

        override fun instant(): Instant = Instant.ofEpochMilli(millis())

        override fun millis(): Long = baseMs + scheduler.currentTime
    }
}
