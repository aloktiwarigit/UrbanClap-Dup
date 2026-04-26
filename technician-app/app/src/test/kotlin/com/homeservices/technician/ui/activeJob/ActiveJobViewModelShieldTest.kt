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
import com.homeservices.technician.domain.photo.UploadJobPhotoUseCase
import com.homeservices.technician.domain.shield.FileShieldReportUseCase
import com.homeservices.technician.domain.shield.model.ShieldReportResult
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
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
public class ActiveJobViewModelShieldTest {
    private val testDispatcher = UnconfinedTestDispatcher()
    private lateinit var repository: ActiveJobRepository
    private lateinit var fileShieldReportUseCase: FileShieldReportUseCase
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
        val startTripUseCase: StartTripUseCase = mockk(relaxed = true)
        val markReachedUseCase: MarkReachedUseCase = mockk(relaxed = true)
        val startWorkUseCase: StartWorkUseCase = mockk(relaxed = true)
        val completeJobUseCase: CompleteJobUseCase = mockk(relaxed = true)
        val connectivityObserver: ConnectivityObserver = mockk()
        val uploadJobPhotoUseCase: UploadJobPhotoUseCase = mockk(relaxed = true)
        fileShieldReportUseCase = mockk()
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
    public fun `onShowShieldSheet sets showShieldSheet=true`(): Unit =
        runTest {
            viewModel.onShowShieldSheet()
            val state = viewModel.uiState.value as ActiveJobUiState.Active
            assertThat(state.showShieldSheet).isTrue()
        }

    @Test
    public fun `onDismissShieldSheet clears sheet flag`(): Unit =
        runTest {
            viewModel.onShowShieldSheet()
            viewModel.onDismissShieldSheet()
            val state = viewModel.uiState.value as ActiveJobUiState.Active
            assertThat(state.showShieldSheet).isFalse()
        }

    @Test
    public fun `fileShieldReport success sets shieldReportSuccess=true and closes sheet`(): Unit =
        runTest {
            coEvery { fileShieldReportUseCase.invoke("bk-1", "abusive") } returns
                Result.success(ShieldReportResult("complaint-123"))
            viewModel.onShowShieldSheet()

            viewModel.fileShieldReport("abusive")
            advanceUntilIdle()

            val state = viewModel.uiState.value as ActiveJobUiState.Active
            assertThat(state.shieldReportSuccess).isTrue()
            assertThat(state.showShieldSheet).isFalse()
            assertThat(state.shieldReportInProgress).isFalse()
            coVerify { fileShieldReportUseCase.invoke("bk-1", "abusive") }
        }

    @Test
    public fun `fileShieldReport failure sets shieldReportError`(): Unit =
        runTest {
            coEvery { fileShieldReportUseCase.invoke(any(), any()) } returns
                Result.failure(RuntimeException("network"))

            viewModel.fileShieldReport("abusive")
            advanceUntilIdle()

            val state = viewModel.uiState.value as ActiveJobUiState.Active
            assertThat(state.shieldReportError).isNotNull()
            assertThat(state.shieldReportInProgress).isFalse()
        }

    @Test
    public fun `consumeShieldReportSuccess clears the success flag`(): Unit =
        runTest {
            coEvery { fileShieldReportUseCase.invoke(any(), any()) } returns
                Result.success(ShieldReportResult("c-1"))
            viewModel.fileShieldReport("a")
            advanceUntilIdle()
            assertThat((viewModel.uiState.value as ActiveJobUiState.Active).shieldReportSuccess).isTrue()

            viewModel.consumeShieldReportSuccess()

            assertThat((viewModel.uiState.value as ActiveJobUiState.Active).shieldReportSuccess).isFalse()
        }

    @Test
    public fun `consumeShieldReportError clears the error message`(): Unit =
        runTest {
            coEvery { fileShieldReportUseCase.invoke(any(), any()) } returns
                Result.failure(RuntimeException("network"))
            viewModel.fileShieldReport("a")
            advanceUntilIdle()

            viewModel.consumeShieldReportError()

            assertThat((viewModel.uiState.value as ActiveJobUiState.Active).shieldReportError).isNull()
        }
}
