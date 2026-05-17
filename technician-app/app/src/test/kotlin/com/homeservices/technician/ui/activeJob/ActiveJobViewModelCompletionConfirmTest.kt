package com.homeservices.technician.ui.activeJob

import androidx.lifecycle.SavedStateHandle
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
import kotlinx.coroutines.flow.emptyFlow
import kotlinx.coroutines.flow.flowOf
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
public class ActiveJobViewModelCompletionConfirmTest {
    private val testDispatcher = UnconfinedTestDispatcher()
    private lateinit var repository: ActiveJobRepository
    private lateinit var completeJobUseCase: CompleteJobUseCase
    private lateinit var viewModel: ActiveJobViewModel

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
        completeJobUseCase = mockk(relaxed = true)
        val startTripUseCase: StartTripUseCase = mockk(relaxed = true)
        val markReachedUseCase: MarkReachedUseCase = mockk(relaxed = true)
        val startWorkUseCase: StartWorkUseCase = mockk(relaxed = true)
        val connectivityObserver: ConnectivityObserver = mockk()
        val uploadJobPhotoUseCase: UploadJobPhotoUseCase = mockk(relaxed = true)
        val fileShieldReportUseCase: FileShieldReportUseCase = mockk(relaxed = true)
        val bookingStatusEventBus: BookingStatusEventBus = mockk(relaxed = true)
        val pendingActionStore: PendingActionStore = mockk(relaxed = true)
        val sessionManager: SessionManager = mockk(relaxed = true)
        every { connectivityObserver.isConnected } returns emptyFlow()
        every { repository.getActiveJob("bk-1") } returns flowOf(aJob())
        every { repository.hasPendingTransitions } returns flowOf(false)
        every { bookingStatusEventBus.events } returns MutableSharedFlow()
        every { sessionManager.authState } returns MutableStateFlow(AuthState.Unauthenticated)
        every { pendingActionStore.observeActive(any()) } returns flowOf(emptyList())
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
                bookingStatusEventBus,
                pendingActionStore,
                sessionManager,
            )
    }

    @AfterEach
    public fun tearDown(): Unit {
        Dispatchers.resetMain()
    }

    @Test
    public fun `requestCompletionConfirm sets awaitingCompletionConfirm to true`(): Unit =
        runTest(testDispatcher) {
            viewModel.requestCompletionConfirm()

            val state = viewModel.uiState.value as ActiveJobUiState.Active
            assertThat(state.awaitingCompletionConfirm).isTrue()
        }

    @Test
    public fun `cancelCompletionConfirm clears the awaitingCompletionConfirm flag`(): Unit =
        runTest(testDispatcher) {
            viewModel.requestCompletionConfirm()
            viewModel.cancelCompletionConfirm()

            val state = viewModel.uiState.value as ActiveJobUiState.Active
            assertThat(state.awaitingCompletionConfirm).isFalse()
        }

    @Test
    public fun `confirmCompletion clears flag and routes through photo capture for COMPLETED`(): Unit =
        runTest(testDispatcher) {
            viewModel.requestCompletionConfirm()
            viewModel.confirmCompletion()
            advanceUntilIdle()

            val state = viewModel.uiState.value as ActiveJobUiState.Active
            assertThat(state.awaitingCompletionConfirm).isFalse()
            // FR-5.4: completion must go through PhotoCaptureScreen, so pendingPhotoStage is set
            // and completeJobUseCase is only triggered later via onPhotoConfirmed → fireTransition.
            assertThat(state.pendingPhotoStage).isEqualTo("COMPLETED")
            coVerify(exactly = 0) { completeJobUseCase("bk-1") }
        }

    @Test
    public fun `requestCompletionConfirm is a no-op when state is Loading`(): Unit =
        runTest(testDispatcher) {
            every { repository.getActiveJob("bk-1") } returns emptyFlow()
            val savedStateHandle = SavedStateHandle(mapOf("bookingId" to "bk-1"))
            val vm =
                ActiveJobViewModel(
                    savedStateHandle,
                    repository,
                    mockk(relaxed = true),
                    mockk(relaxed = true),
                    mockk(relaxed = true),
                    completeJobUseCase,
                    mockk<ConnectivityObserver>().also { every { it.isConnected } returns emptyFlow() },
                    mockk(relaxed = true),
                    mockk(relaxed = true),
                    mockk<BookingStatusEventBus>().also { every { it.events } returns MutableSharedFlow() },
                    mockk<PendingActionStore>().also { every { it.observeActive(any()) } returns flowOf(emptyList()) },
                    mockk<SessionManager>().also { every { it.authState } returns MutableStateFlow(AuthState.Unauthenticated) },
                )

            vm.requestCompletionConfirm()
            assertThat(vm.uiState.value).isEqualTo(ActiveJobUiState.Loading)
        }
}
