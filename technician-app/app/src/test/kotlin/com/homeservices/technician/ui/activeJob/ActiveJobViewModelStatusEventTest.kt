package com.homeservices.technician.ui.activeJob

import androidx.lifecycle.SavedStateHandle
import com.homeservices.technician.data.activeJob.BookingStatusEvent
import com.homeservices.technician.data.activeJob.BookingStatusEventBus
import com.homeservices.technician.data.activeJob.ConnectivityObserver
import com.homeservices.technician.data.auth.SessionManager
import com.homeservices.technician.data.pendingaction.PendingActionStore
import com.homeservices.technician.domain.activeJob.ActiveJobRepository
import com.homeservices.technician.domain.activeJob.CompleteJobUseCase
import com.homeservices.technician.domain.activeJob.MarkReachedUseCase
import com.homeservices.technician.domain.activeJob.StartTripUseCase
import com.homeservices.technician.domain.activeJob.StartWorkUseCase
import com.homeservices.technician.domain.activeJob.model.ActiveJob
import com.homeservices.technician.domain.activeJob.model.ActiveJobStatus
import com.homeservices.technician.domain.activeJob.model.LatLng
import com.homeservices.technician.domain.auth.model.AuthState
import com.homeservices.technician.domain.photo.UploadJobPhotoUseCase
import com.homeservices.technician.domain.shield.FileShieldReportUseCase
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.emptyFlow
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

@OptIn(ExperimentalCoroutinesApi::class)
public class ActiveJobViewModelStatusEventTest {
    private val testDispatcher = UnconfinedTestDispatcher()
    private lateinit var repository: ActiveJobRepository
    private lateinit var bookingStatusEvents: MutableSharedFlow<BookingStatusEvent>

    private fun aJob(status: ActiveJobStatus = ActiveJobStatus.IN_PROGRESS) =
        ActiveJob(
            bookingId = "bk-1",
            customerId = "c-1",
            serviceId = "svc-1",
            serviceName = "AC Repair",
            addressText = "12 Main St",
            addressLatLng = LatLng(12.9, 77.6),
            status = status,
            slotDate = "2026-05-01",
            slotWindow = "10:00-12:00",
        )

    @BeforeEach
    public fun setUp() {
        Dispatchers.setMain(testDispatcher)
        repository = mockk(relaxed = true)
        bookingStatusEvents =
            MutableSharedFlow(replay = 0, extraBufferCapacity = 1)
        every { repository.getActiveJob("bk-1") } returns flowOf(aJob())
        every { repository.hasPendingTransitions } returns flowOf(false)
    }

    @AfterEach
    public fun tearDown(): Unit {
        Dispatchers.resetMain()
    }

    private fun buildVm(): ActiveJobViewModel {
        val startTripUseCase: StartTripUseCase = mockk(relaxed = true)
        val markReachedUseCase: MarkReachedUseCase = mockk(relaxed = true)
        val startWorkUseCase: StartWorkUseCase = mockk(relaxed = true)
        val completeJobUseCase: CompleteJobUseCase = mockk(relaxed = true)
        val connectivityObserver: ConnectivityObserver = mockk()
        val uploadJobPhotoUseCase: UploadJobPhotoUseCase = mockk(relaxed = true)
        val fileShieldReportUseCase: FileShieldReportUseCase = mockk(relaxed = true)
        val bookingStatusEventBus: BookingStatusEventBus = mockk(relaxed = true)
        val pendingActionStore: PendingActionStore = mockk(relaxed = true)
        val sessionManager: SessionManager = mockk(relaxed = true)
        every { connectivityObserver.isConnected } returns emptyFlow()
        every { bookingStatusEventBus.events } returns bookingStatusEvents.asSharedFlow()
        every { sessionManager.authState } returns MutableStateFlow(AuthState.Unauthenticated)
        every { pendingActionStore.observeActive(any()) } returns flowOf(emptyList())
        val savedStateHandle = SavedStateHandle(mapOf("bookingId" to "bk-1"))
        return ActiveJobViewModel(
            savedStateHandle,
            repository,
            startTripUseCase,
            markReachedUseCase,
            startWorkUseCase,
            completeJobUseCase,
            connectivityObserver,
            uploadJobPhotoUseCase,
            fileShieldReportUseCase,
            bookingStatusEventBus,
            pendingActionStore,
            sessionManager,
        )
    }

    @Test
    public fun `PRICE_APPROVED event for matching bookingId triggers repository startObserving`(): Unit =
        runTest(testDispatcher) {
            val vm = buildVm()
            @Suppress("UNUSED_EXPRESSION")
            vm

            bookingStatusEvents.tryEmit(
                BookingStatusEvent(bookingId = "bk-1", newStatus = "PRICE_APPROVED", priceApprovedPaise = 8_000L),
            )
            advanceUntilIdle()

            // startObserving is called once on init + once on the event = 2 invocations
            coVerify(atLeast = 2) { repository.startObserving("bk-1") }
        }

    @Test
    public fun `PRICE_REJECTED event for matching bookingId triggers repository startObserving`(): Unit =
        runTest(testDispatcher) {
            val vm = buildVm()
            @Suppress("UNUSED_EXPRESSION")
            vm

            bookingStatusEvents.tryEmit(
                BookingStatusEvent(bookingId = "bk-1", newStatus = "PRICE_REJECTED"),
            )
            advanceUntilIdle()

            coVerify(atLeast = 2) { repository.startObserving("bk-1") }
        }

    @Test
    public fun `event for a different bookingId does not retrigger startObserving`(): Unit =
        runTest(testDispatcher) {
            val vm = buildVm()
            @Suppress("UNUSED_EXPRESSION")
            vm

            bookingStatusEvents.tryEmit(
                BookingStatusEvent(bookingId = "bk-other", newStatus = "PRICE_APPROVED", priceApprovedPaise = 1_000L),
            )
            advanceUntilIdle()

            // Only the init-time call; no second startObserving from the unrelated event
            coVerify(exactly = 1) { repository.startObserving("bk-1") }
        }

    @Test
    public fun `unhandled newStatus does not call startObserving again`(): Unit =
        runTest(testDispatcher) {
            val vm = buildVm()
            @Suppress("UNUSED_EXPRESSION")
            vm

            bookingStatusEvents.tryEmit(
                BookingStatusEvent(bookingId = "bk-1", newStatus = "ASSIGNED"),
            )
            advanceUntilIdle()

            coVerify(exactly = 1) { repository.startObserving("bk-1") }
        }
}
