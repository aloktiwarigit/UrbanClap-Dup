package com.homeservices.technician.ui.activeJob

import androidx.lifecycle.SavedStateHandle
import com.homeservices.corenav.PendingAction
import com.homeservices.corenav.PendingActionPriority
import com.homeservices.corenav.PendingActionStatus
import com.homeservices.corenav.PendingActionType
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
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.emptyFlow
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

@OptIn(ExperimentalCoroutinesApi::class)
public class ActiveJobViewModelPhotoRetryTest {
    private val testDispatcher = UnconfinedTestDispatcher()
    private lateinit var repository: ActiveJobRepository
    private lateinit var startTripUseCase: StartTripUseCase
    private lateinit var markReachedUseCase: MarkReachedUseCase
    private lateinit var startWorkUseCase: StartWorkUseCase
    private lateinit var completeJobUseCase: CompleteJobUseCase
    private lateinit var connectivityObserver: ConnectivityObserver
    private lateinit var uploadJobPhotoUseCase: UploadJobPhotoUseCase
    private lateinit var fileShieldReportUseCase: FileShieldReportUseCase
    private lateinit var bookingStatusEventBus: BookingStatusEventBus
    private lateinit var pendingActionStore: PendingActionStore
    private lateinit var sessionManager: SessionManager

    private fun aJob(status: ActiveJobStatus = ActiveJobStatus.REACHED) =
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

    private fun pendingPhotoAction(bookingId: String = "bk-1") =
        PendingAction(
            id = "PHOTO_UPLOAD_PENDING:technician:t-uid:booking:$bookingId",
            userId = "t-uid",
            role = "technician",
            type = PendingActionType.PHOTO_UPLOAD_PENDING,
            entityType = "booking",
            entityId = bookingId,
            routeUri = "homeservices://action/PHOTO_UPLOAD_PENDING?bookingId=$bookingId",
            priority = PendingActionPriority.NORMAL,
            status = PendingActionStatus.ACTIVE,
            sourceStatus = null,
            version = 1L,
            createdAt = 1_000L,
            updatedAt = 1_000L,
            expiresAt = null,
            resolvedAt = null,
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
        bookingStatusEventBus = mockk(relaxed = true)
        pendingActionStore = mockk(relaxed = true)
        sessionManager = mockk(relaxed = true)
        every { connectivityObserver.isConnected } returns emptyFlow()
        every { repository.getActiveJob("bk-1") } returns flowOf(aJob())
        every { repository.hasPendingTransitions } returns flowOf(false)
        every { bookingStatusEventBus.events } returns MutableSharedFlow()
    }

    @AfterEach
    public fun tearDown(): Unit {
        Dispatchers.resetMain()
    }

    private fun buildVm(): ActiveJobViewModel {
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
    public fun `photoUploadPending is true when a matching PHOTO_UPLOAD_PENDING row exists`(): Unit =
        runTest(testDispatcher) {
            every { sessionManager.authState } returns
                MutableStateFlow(AuthState.Authenticated(uid = "t-uid", phoneLastFour = null))
            every { pendingActionStore.observeActive("t-uid") } returns
                flowOf(listOf(pendingPhotoAction("bk-1")))

            val vm = buildVm()
            val state = vm.uiState.value as ActiveJobUiState.Active

            assertThat(state.photoUploadPending).isTrue()
        }

    @Test
    public fun `photoUploadPending is false when no row matches this bookingId`(): Unit =
        runTest(testDispatcher) {
            every { sessionManager.authState } returns
                MutableStateFlow(AuthState.Authenticated(uid = "t-uid", phoneLastFour = null))
            every { pendingActionStore.observeActive("t-uid") } returns
                flowOf(listOf(pendingPhotoAction("bk-other")))

            val vm = buildVm()
            val state = vm.uiState.value as ActiveJobUiState.Active

            assertThat(state.photoUploadPending).isFalse()
        }

    @Test
    public fun `photoUploadPending is false when user is Unauthenticated`(): Unit =
        runTest(testDispatcher) {
            every { sessionManager.authState } returns MutableStateFlow(AuthState.Unauthenticated)
            every { pendingActionStore.observeActive(any()) } returns flowOf(emptyList())

            val vm = buildVm()
            val state = vm.uiState.value as ActiveJobUiState.Active

            assertThat(state.photoUploadPending).isFalse()
        }

    @Test
    public fun `onPhotoRetryRequested for REACHED job sets pendingPhotoStage to IN_PROGRESS`(): Unit =
        runTest(testDispatcher) {
            every { sessionManager.authState } returns MutableStateFlow(AuthState.Unauthenticated)
            every { pendingActionStore.observeActive(any()) } returns flowOf(emptyList())
            every { repository.getActiveJob("bk-1") } returns flowOf(aJob(ActiveJobStatus.REACHED))

            val vm = buildVm()
            vm.onPhotoRetryRequested()

            val state = vm.uiState.value as ActiveJobUiState.Active
            assertThat(state.pendingPhotoStage).isEqualTo("IN_PROGRESS")
            assertThat(state.photoUploadError).isNull()
        }

    @Test
    public fun `onPhotoRetryRequested for EN_ROUTE job sets pendingPhotoStage to REACHED`(): Unit =
        runTest(testDispatcher) {
            every { sessionManager.authState } returns MutableStateFlow(AuthState.Unauthenticated)
            every { pendingActionStore.observeActive(any()) } returns flowOf(emptyList())
            every { repository.getActiveJob("bk-1") } returns flowOf(aJob(ActiveJobStatus.EN_ROUTE))

            val vm = buildVm()
            vm.onPhotoRetryRequested()

            val state = vm.uiState.value as ActiveJobUiState.Active
            assertThat(state.pendingPhotoStage).isEqualTo("REACHED")
        }

    @Test
    public fun `onPhotoRetryRequested is a no-op when state is Loading`(): Unit =
        runTest(testDispatcher) {
            every { sessionManager.authState } returns MutableStateFlow(AuthState.Unauthenticated)
            every { pendingActionStore.observeActive(any()) } returns flowOf(emptyList())
            every { repository.getActiveJob("bk-1") } returns emptyFlow()

            val vm = buildVm()
            vm.onPhotoRetryRequested()

            assertThat(vm.uiState.value).isEqualTo(ActiveJobUiState.Loading)
        }
}
