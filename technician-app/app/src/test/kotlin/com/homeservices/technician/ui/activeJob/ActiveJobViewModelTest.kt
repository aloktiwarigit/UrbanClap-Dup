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
import com.homeservices.technician.domain.photo.UploadJobPhotoUseCase
import com.homeservices.technician.domain.shield.FileShieldReportUseCase
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
    private lateinit var uploadJobPhotoUseCase: UploadJobPhotoUseCase
    private lateinit var fileShieldReportUseCase: FileShieldReportUseCase
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
        uploadJobPhotoUseCase = mockk(relaxed = true)
        fileShieldReportUseCase = mockk(relaxed = true)
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
                uploadJobPhotoUseCase,
                fileShieldReportUseCase,
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
                    uploadJobPhotoUseCase,
                    fileShieldReportUseCase,
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
                    uploadJobPhotoUseCase,
                    fileShieldReportUseCase,
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
                    uploadJobPhotoUseCase,
                    fileShieldReportUseCase,
                )
            assertThat(vm.uiState.value).isInstanceOf(ActiveJobUiState.Completed::class.java)
        }

    @Test
    public fun `onPhotoConfirmed shows transition error when upload succeeds but transition fails`(): Unit =
        runTest(testDispatcher) {
            coEvery { uploadJobPhotoUseCase.execute("bk-1", "IN_PROGRESS", "/cache/p.jpg") } returns
                Result.success("bookings/bk-1/photos/uid/IN_PROGRESS/123.jpg")
            coEvery { startWorkUseCase("bk-1") } returns Result.failure(RuntimeException("API 500"))

            viewModel.onTransitionRequested("IN_PROGRESS")
            viewModel.onPhotoConfirmed("/cache/p.jpg")
            advanceUntilIdle()

            val state = viewModel.uiState.value as ActiveJobUiState.Active
            // Photo is uploaded — pendingPhotoStage and uploadedStoragePath remain so user can retry
            assertThat(state.pendingPhotoStage).isEqualTo("IN_PROGRESS")
            assertThat(state.uploadedStoragePath).isNotNull()
            assertThat(state.photoUploadError).contains("API 500")
        }

    @Test
    public fun `photo state preserved when polling refresh emits a new job`(): Unit =
        runTest {
            val jobFlow = MutableStateFlow(aJob(ActiveJobStatus.REACHED))
            every { repository.getActiveJob("bk-1") } returns jobFlow
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
                    uploadJobPhotoUseCase,
                    fileShieldReportUseCase,
                )
            // Request transition (sets pendingPhotoStage)
            vm.onTransitionRequested("REACHED")
            // Polling fires again with the same job — photo state must survive
            jobFlow.value = aJob(ActiveJobStatus.REACHED)

            val state = vm.uiState.value as ActiveJobUiState.Active
            assertThat(state.pendingPhotoStage).isEqualTo("REACHED")
        }

    @Test
    public fun `onPhotoConfirmed skips upload and fires transition when photo already uploaded`(): Unit =
        runTest(testDispatcher) {
            // Simulate state where photo is uploaded but transition hasn't fired yet
            coEvery { startWorkUseCase("bk-1") } returns Result.success(aJob(ActiveJobStatus.IN_PROGRESS))

            // Pre-set the uploadedStoragePath in state
            viewModel.onTransitionRequested("IN_PROGRESS")
            val activeState = viewModel.uiState.value as ActiveJobUiState.Active
            // Manually inject uploadedStoragePath (mimics prior upload success)
            every { repository.getActiveJob("bk-1") } returns flowOf(activeState.job)
            // Rebuild VM with pre-set uploaded path via state update
            viewModel.uiState.value.let { } // ensure state is current

            // Force state to have uploadedStoragePath set
            val stateWithPath =
                (viewModel.uiState.value as? ActiveJobUiState.Active)
                    ?.copy(uploadedStoragePath = "bookings/bk-1/photos/uid/IN_PROGRESS/123.jpg") ?: return@runTest
            // Use reflection-free approach: directly call onPhotoConfirmed while state has path
            // The simplest way is to trigger an upload success first, then check retry path
            coEvery { uploadJobPhotoUseCase.execute("bk-1", "IN_PROGRESS", "/cache/p.jpg") } returns
                Result.success("bookings/bk-1/photos/uid/IN_PROGRESS/123.jpg")
            coEvery { startWorkUseCase("bk-1") } returns Result.failure(RuntimeException("timeout"))

            viewModel.onPhotoConfirmed("/cache/p.jpg")
            advanceUntilIdle()

            // uploadedStoragePath is now set; call again to exercise the skip-upload path
            coEvery { startWorkUseCase("bk-1") } returns Result.success(aJob(ActiveJobStatus.IN_PROGRESS))
            viewModel.onPhotoConfirmed("/cache/p.jpg")
            advanceUntilIdle()

            // Upload use case should only have been called once (second call skipped it)
            coVerify(exactly = 1) { uploadJobPhotoUseCase.execute(any(), any(), any()) }
        }

    @Test
    public fun `onPhotoRetake clears photoUploadError but preserves pendingPhotoStage`(): Unit =
        runTest {
            // Simulate failed upload that set an error
            coEvery { uploadJobPhotoUseCase.execute(any(), any(), any()) } returns
                Result.failure(RuntimeException("timeout"))
            viewModel.onTransitionRequested("REACHED")
            viewModel.onPhotoConfirmed("/cache/p.jpg")
            advanceUntilIdle()
            val stateWithError = viewModel.uiState.value as ActiveJobUiState.Active
            assertThat(stateWithError.photoUploadError).isNotNull()

            // Retake — error should clear, stage should remain
            viewModel.onPhotoRetake()
            val stateAfterRetake = viewModel.uiState.value as ActiveJobUiState.Active
            assertThat(stateAfterRetake.photoUploadError).isNull()
            assertThat(stateAfterRetake.pendingPhotoStage).isEqualTo("REACHED")
        }

    @Test
    public fun `onPhotoRetake is no-op when state is Loading`(): Unit =
        runTest {
            every { repository.getActiveJob("bk-1") } returns emptyFlow()
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
                    uploadJobPhotoUseCase,
                    fileShieldReportUseCase,
                )
            vm.onPhotoRetake()
            assertThat(vm.uiState.value).isInstanceOf(ActiveJobUiState.Loading::class.java)
        }

    @Test
    public fun `onPhotoConfirmed is no-op when pendingPhotoStage is null`(): Unit =
        runTest {
            // pendingPhotoStage is null by default — onPhotoConfirmed should return early
            viewModel.onPhotoConfirmed("/cache/p.jpg")
            val state = viewModel.uiState.value as ActiveJobUiState.Active
            assertThat(state.photoUploadInProgress).isFalse()
        }

    @Test
    public fun `onTransitionRequested sets pendingPhotoStage`(): Unit =
        runTest {
            viewModel.onTransitionRequested("EN_ROUTE")
            val state = viewModel.uiState.value as ActiveJobUiState.Active
            assertThat(state.pendingPhotoStage).isEqualTo("EN_ROUTE")
            assertThat(state.photoUploadInProgress).isFalse()
        }

    @Test
    public fun `onPhotoCancelled clears pendingPhotoStage`(): Unit =
        runTest {
            viewModel.onTransitionRequested("REACHED")
            viewModel.onPhotoCancelled()
            val state = viewModel.uiState.value as ActiveJobUiState.Active
            assertThat(state.pendingPhotoStage).isNull()
            assertThat(state.photoUploadError).isNull()
        }

    @Test
    public fun `onPhotoConfirmed fires startWork and clears pending state on success`(): Unit =
        runTest(testDispatcher) {
            coEvery { uploadJobPhotoUseCase.execute("bk-1", "IN_PROGRESS", "/cache/p.jpg") } returns
                Result.success("https://storage/photo.jpg")
            coEvery { startWorkUseCase("bk-1") } returns Result.success(aJob(ActiveJobStatus.IN_PROGRESS))

            viewModel.onTransitionRequested("IN_PROGRESS")
            viewModel.onPhotoConfirmed("/cache/p.jpg")
            advanceUntilIdle()

            val state = viewModel.uiState.value as ActiveJobUiState.Active
            assertThat(state.pendingPhotoStage).isNull()
            assertThat(state.photoUploadInProgress).isFalse()
            assertThat(state.photoUploadError).isNull()
            coVerify(exactly = 1) { startWorkUseCase("bk-1") }
        }

    @Test
    public fun `onPhotoConfirmed sets photoUploadError on upload failure`(): Unit =
        runTest(testDispatcher) {
            coEvery { uploadJobPhotoUseCase.execute(any(), any(), any()) } returns
                Result.failure(RuntimeException("Network timeout"))

            viewModel.onTransitionRequested("REACHED")
            viewModel.onPhotoConfirmed("/cache/p.jpg")
            advanceUntilIdle()

            val state = viewModel.uiState.value as ActiveJobUiState.Active
            assertThat(state.photoUploadInProgress).isFalse()
            assertThat(state.photoUploadError).isEqualTo("Network timeout")
            assertThat(state.pendingPhotoStage).isEqualTo("REACHED")
        }

    @Test
    public fun `onPhotoConfirmed EN_ROUTE fires startTrip and emits navigation event`(): Unit =
        runTest(testDispatcher) {
            coEvery { uploadJobPhotoUseCase.execute("bk-1", "EN_ROUTE", "/cache/p.jpg") } returns
                Result.success("https://storage/photo.jpg")
            coEvery { startTripUseCase("bk-1") } returns
                Pair(
                    Result.success(aJob(ActiveJobStatus.EN_ROUTE)),
                    NavigationEvent.Maps("google.navigation:q=12.9,77.6"),
                )

            val events = mutableListOf<NavigationEvent>()
            val job = launch { viewModel.navigationEvents.collect { events.add(it) } }

            viewModel.onTransitionRequested("EN_ROUTE")
            viewModel.onPhotoConfirmed("/cache/p.jpg")
            advanceUntilIdle()
            job.cancel()

            assertThat(events).hasSize(1)
            assertThat(events[0]).isEqualTo(NavigationEvent.Maps("google.navigation:q=12.9,77.6"))
            coVerify(exactly = 1) { startTripUseCase("bk-1") }
        }

    @Test
    public fun `onPhotoConfirmed REACHED fires markReachedUseCase`(): Unit =
        runTest(testDispatcher) {
            coEvery { uploadJobPhotoUseCase.execute("bk-1", "REACHED", "/cache/p.jpg") } returns
                Result.success("https://storage/photo.jpg")
            coEvery { markReachedUseCase("bk-1") } returns Result.success(aJob(ActiveJobStatus.REACHED))

            viewModel.onTransitionRequested("REACHED")
            viewModel.onPhotoConfirmed("/cache/p.jpg")
            advanceUntilIdle()

            coVerify(exactly = 1) { markReachedUseCase("bk-1") }
        }

    @Test
    public fun `onPhotoConfirmed COMPLETED fires completeJobUseCase`(): Unit =
        runTest(testDispatcher) {
            coEvery { uploadJobPhotoUseCase.execute("bk-1", "COMPLETED", "/cache/p.jpg") } returns
                Result.success("https://storage/photo.jpg")
            coEvery { completeJobUseCase("bk-1") } returns Result.success(aJob(ActiveJobStatus.COMPLETED))

            viewModel.onTransitionRequested("COMPLETED")
            viewModel.onPhotoConfirmed("/cache/p.jpg")
            advanceUntilIdle()

            coVerify(exactly = 1) { completeJobUseCase("bk-1") }
        }

    @Test
    public fun `onPhotoConfirmed EN_ROUTE with null navEvent — no navigation emitted`(): Unit =
        runTest(testDispatcher) {
            coEvery { uploadJobPhotoUseCase.execute("bk-1", "EN_ROUTE", "/cache/p.jpg") } returns
                Result.success("https://storage/photo.jpg")
            coEvery { startTripUseCase("bk-1") } returns Pair(Result.success(aJob(ActiveJobStatus.EN_ROUTE)), null)

            val events = mutableListOf<NavigationEvent>()
            val job = launch { viewModel.navigationEvents.collect { events.add(it) } }

            viewModel.onTransitionRequested("EN_ROUTE")
            viewModel.onPhotoConfirmed("/cache/p.jpg")
            advanceUntilIdle()
            job.cancel()

            assertThat(events).isEmpty()
        }
}
