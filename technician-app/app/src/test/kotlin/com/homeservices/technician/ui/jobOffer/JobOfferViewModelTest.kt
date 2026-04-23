package com.homeservices.technician.ui.jobOffer

import com.homeservices.technician.data.jobOffer.JobOfferEventBus
import com.homeservices.technician.domain.jobOffer.AcceptJobOfferUseCase
import com.homeservices.technician.domain.jobOffer.DeclineJobOfferUseCase
import com.homeservices.technician.domain.jobOffer.model.JobOffer
import com.homeservices.technician.domain.jobOffer.model.JobOfferResult
import io.mockk.coEvery
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

@OptIn(ExperimentalCoroutinesApi::class)
public class JobOfferViewModelTest {
    private lateinit var acceptUseCase: AcceptJobOfferUseCase
    private lateinit var declineUseCase: DeclineJobOfferUseCase
    private lateinit var eventBus: JobOfferEventBus
    private lateinit var viewModel: JobOfferViewModel
    private val testDispatcher = UnconfinedTestDispatcher()

    private val offerFlow = MutableSharedFlow<JobOffer>(extraBufferCapacity = 1)

    private fun aJobOffer(expiresAtMs: Long = System.currentTimeMillis() + 30_000L): JobOffer =
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
        Dispatchers.setMain(testDispatcher)
        acceptUseCase = mockk(relaxed = true)
        declineUseCase = mockk(relaxed = true)
        eventBus = mockk(relaxed = true)
        every { eventBus.events } returns offerFlow
        viewModel = JobOfferViewModel(eventBus, acceptUseCase, declineUseCase)
    }

    @AfterEach
    public fun tearDown(): Unit {
        Dispatchers.resetMain()
    }

    @Test
    public fun `initial uiState is Idle`(): Unit =
        runTest {
            assertThat(viewModel.uiState.value).isEqualTo(JobOfferUiState.Idle)
        }

    @Test
    public fun `offer arrives via bus — uiState becomes Offering with correct data and remaining seconds`(): Unit =
        runTest {
            val offer = aJobOffer(expiresAtMs = System.currentTimeMillis() + 30_000L)

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
            val offer = aJobOffer()
            offerFlow.emit(offer)
            assertThat(viewModel.uiState.value).isInstanceOf(JobOfferUiState.Offering::class.java)

            coEvery { acceptUseCase(offer.bookingId) } returns JobOfferResult.Accepted(offer.bookingId)

            viewModel.accept()

            assertThat(viewModel.uiState.value).isInstanceOf(JobOfferUiState.Accepted::class.java)
            val accepted = viewModel.uiState.value as JobOfferUiState.Accepted
            assertThat(accepted.bookingId).isEqualTo(offer.bookingId)
        }

    @Test
    public fun `accept transitions to Expired when use case reports booking already taken`(): Unit =
        runTest {
            offerFlow.emit(aJobOffer(expiresAtMs = System.currentTimeMillis() + 30_000L))
            coEvery { acceptUseCase(any()) } returns JobOfferResult.Expired("booking-123")

            viewModel.accept()

            assertThat(viewModel.uiState.value).isEqualTo(JobOfferUiState.Expired)
        }

    @Test
    public fun `decline transitions to Declined state`(): Unit =
        runTest {
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
            val expiredOffer = aJobOffer(expiresAtMs = System.currentTimeMillis() - 1_000L)

            offerFlow.emit(expiredOffer)

            assertThat(viewModel.uiState.value).isEqualTo(JobOfferUiState.Expired)
        }

    @Test
    public fun `countdown reduces remainingSeconds over time`(): Unit =
        runTest {
            val offer = aJobOffer(expiresAtMs = System.currentTimeMillis() + 30_000L)
            offerFlow.emit(offer)

            val initialState = viewModel.uiState.value as? JobOfferUiState.Offering
            assertThat(initialState).isNotNull
            val initialSeconds = initialState!!.remainingSeconds

            advanceTimeBy(5_000L)

            val laterState = viewModel.uiState.value
            assertThat(laterState).isInstanceOf(JobOfferUiState.Offering::class.java)
            val offeringState = laterState as JobOfferUiState.Offering
            assertThat(offeringState.remainingSeconds).isLessThan(initialSeconds)
        }
}
