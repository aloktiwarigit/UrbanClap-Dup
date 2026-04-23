package com.homeservices.technician.ui.activeJob

import androidx.lifecycle.SavedStateHandle
import com.homeservices.technician.data.activeJob.ConnectivityObserver
import com.homeservices.technician.domain.activeJob.ActiveJobRepository
import com.homeservices.technician.domain.activeJob.CompleteJobUseCase
import com.homeservices.technician.domain.activeJob.MarkReachedUseCase
import com.homeservices.technician.domain.activeJob.StartTripUseCase
import com.homeservices.technician.domain.activeJob.StartWorkUseCase
import com.homeservices.technician.domain.activeJob.model.ActiveJob
import com.homeservices.technician.domain.activeJob.model.ActiveJobStatus
import com.homeservices.technician.domain.activeJob.model.LatLng
import com.homeservices.technician.domain.activeJob.model.NavigationEvent
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.emptyFlow
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

@OptIn(ExperimentalCoroutinesApi::class)
public class ActiveJobViewModelTest {
    private val testDispatcher = UnconfinedTestDispatcher()
    private lateinit var repository: ActiveJobRepository
    private lateinit var startTripUseCase: StartTripUseCase
    private lateinit var markReachedUseCase: MarkReachedUseCase
    private lateinit var startWorkUseCase: StartWorkUseCase
    private lateinit var completeJobUseCase: CompleteJobUseCase
    private lateinit var connectivityObserver: ConnectivityObserver
    private lateinit var viewModel: ActiveJobViewModel

    private fun aJob(status: ActiveJobStatus = ActiveJobStatus.ASSIGNED) =
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
        startTripUseCase = mockk(relaxed = true)
        markReachedUseCase = mockk(relaxed = true)
        startWorkUseCase = mockk(relaxed = true)
        completeJobUseCase = mockk(relaxed = true)
        connectivityObserver = mockk()
        every { connectivityObserver.isConnected } returns emptyFlow()
        every { repository.getActiveJob("bk-1") } returns flowOf(aJob())
        every { repository.hasPendingTransitions } returns flowOf(false)
        val savedStateHandle = SavedStateHandle(mapOf("bookingId" to "bk-1"))
        viewModel =
            ActiveJobViewModel(
                savedStateHandle,
                repository,
                startTripUseCase,
                markReachedUseCase,
                startWorkUseCase,
                completeJobUseCase,
                connectivityObserver,
            )
    }

    @AfterEach
    public fun tearDown(): Unit {
        Dispatchers.resetMain()
    }

    @Test
    public fun `initial state collects job and shows Active with START_TRIP action`(): Unit =
        runTest {
            val state = viewModel.uiState.value
            assertThat(state).isInstanceOf(ActiveJobUiState.Active::class.java)
            val active = state as ActiveJobUiState.Active
            assertThat(active.availableAction).isEqualTo(ActiveJobAction.START_TRIP)
        }

    @Test
    public fun `startTrip success — emits Maps NavigationEvent`(): Unit =
        runTest(testDispatcher) {
            coEvery { startTripUseCase("bk-1") } returns
                Pair(
                    Result.success(aJob(ActiveJobStatus.EN_ROUTE)),
                    NavigationEvent.Maps("google.navigation:q=12.9,77.6"),
                )

            val events = mutableListOf<NavigationEvent>()
            val job = launch { viewModel.navigationEvents.collect { events.add(it) } }

            viewModel.startTrip()
            advanceUntilIdle()
            job.cancel()

            assertThat(events).hasSize(1)
            assertThat(events[0]).isEqualTo(NavigationEvent.Maps("google.navigation:q=12.9,77.6"))
        }

    @Test
    public fun `startTrip failure — does NOT emit NavigationEvent`(): Unit =
        runTest(testDispatcher) {
            coEvery { startTripUseCase("bk-1") } returns
                Pair(Result.failure(RuntimeException("offline")), null)

            val events = mutableListOf<NavigationEvent>()
            val job = launch { viewModel.navigationEvents.collect { events.add(it) } }

            viewModel.startTrip()
            advanceUntilIdle()
            job.cancel()

            assertThat(events).isEmpty()
        }

    @Test
    public fun `connectivity reconnect triggers syncPendingTransitions`(): Unit =
        runTest {
            val connectFlow = MutableStateFlow(false)
            every { connectivityObserver.isConnected } returns connectFlow
            val savedStateHandle = SavedStateHandle(mapOf("bookingId" to "bk-1"))
            val vm =
                ActiveJobViewModel(
                    savedStateHandle,
                    repository,
                    startTripUseCase,
                    markReachedUseCase,
                    startWorkUseCase,
                    completeJobUseCase,
                    connectivityObserver,
                )

            connectFlow.value = true

            coVerify(atLeast = 1) { repository.syncPendingTransitions() }
            @Suppress("UNUSED_EXPRESSION")
            vm
        }

    @Test
    public fun `markReached delegates to markReachedUseCase`(): Unit =
        runTest {
            viewModel.markReached()
            coVerify(exactly = 1) { markReachedUseCase("bk-1") }
        }

    @Test
    public fun `startWork delegates to startWorkUseCase`(): Unit =
        runTest {
            viewModel.startWork()
            coVerify(exactly = 1) { startWorkUseCase("bk-1") }
        }

    @Test
    public fun `completeJob delegates to completeJobUseCase`(): Unit =
        runTest {
            viewModel.completeJob()
            coVerify(exactly = 1) { completeJobUseCase("bk-1") }
        }

    @Test
    public fun `hasPendingTransitions update is a no-op when state is Loading`(): Unit =
        runTest {
            every { repository.getActiveJob("bk-1") } returns emptyFlow()
            every { repository.hasPendingTransitions } returns flowOf(true)
            val savedStateHandle = SavedStateHandle(mapOf("bookingId" to "bk-1"))
            val vm =
                ActiveJobViewModel(
                    savedStateHandle,
                    repository,
                    startTripUseCase,
                    markReachedUseCase,
                    startWorkUseCase,
                    completeJobUseCase,
                    connectivityObserver,
                )
            assertThat(vm.uiState.value).isEqualTo(ActiveJobUiState.Loading)
        }

    @Test
    public fun `COMPLETED job status transitions uiState to Completed`(): Unit =
        runTest {
            every { repository.getActiveJob("bk-1") } returns flowOf(aJob(ActiveJobStatus.COMPLETED))
            val savedStateHandle = SavedStateHandle(mapOf("bookingId" to "bk-1"))
            val vm =
                ActiveJobViewModel(
                    savedStateHandle,
                    repository,
                    startTripUseCase,
                    markReachedUseCase,
                    startWorkUseCase,
                    completeJobUseCase,
                    connectivityObserver,
                )
            assertThat(vm.uiState.value).isEqualTo(ActiveJobUiState.Completed)
        }
}
