package com.homeservices.customer.ui.complaint

import com.homeservices.customer.data.complaint.remote.dto.ComplaintResponseDto
import com.homeservices.customer.domain.complaint.ComplaintReason
import com.homeservices.customer.domain.complaint.GetComplaintStatusUseCase
import com.homeservices.customer.domain.complaint.PhotoUploadUseCase
import com.homeservices.customer.domain.complaint.SubmitComplaintUseCase
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

@OptIn(ExperimentalCoroutinesApi::class)
public class ComplaintViewModelTest {
    private val submitUseCase: SubmitComplaintUseCase = mockk()
    private val photoUploadUseCase: PhotoUploadUseCase = mockk()
    private val getStatusUseCase: GetComplaintStatusUseCase = mockk()
    private val dispatcher = StandardTestDispatcher()
    private lateinit var viewModel: ComplaintViewModel

    @BeforeEach
    public fun setUp() {
        Dispatchers.setMain(dispatcher)
        viewModel = ComplaintViewModel(submitUseCase, photoUploadUseCase, getStatusUseCase)
    }

    @AfterEach
    public fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    public fun `initial state is Idle with submitEnabled false`() {
        val state = viewModel.uiState.value
        assertThat(state).isInstanceOf(ComplaintUiState.Idle::class.java)
        assertThat((state as ComplaintUiState.Idle).submitEnabled).isFalse()
    }

    @Test
    public fun `submitEnabled becomes true when reason and long enough description set`(): Unit =
        runTest {
            viewModel.onReasonSelected(ComplaintReason.SERVICE_QUALITY)
            viewModel.onDescriptionChanged("A description that is long enough to be valid.")
            dispatcher.scheduler.advanceUntilIdle()
            val state = viewModel.uiState.value as ComplaintUiState.Idle
            assertThat(state.submitEnabled).isTrue()
            assertThat(state.selectedReason).isEqualTo(ComplaintReason.SERVICE_QUALITY)
        }

    @Test
    public fun `submitEnabled is false when description is shorter than 10 chars`(): Unit =
        runTest {
            viewModel.onReasonSelected(ComplaintReason.LATE_ARRIVAL)
            viewModel.onDescriptionChanged("short")
            dispatcher.scheduler.advanceUntilIdle()
            val state = viewModel.uiState.value as ComplaintUiState.Idle
            assertThat(state.submitEnabled).isFalse()
        }

    @Test
    public fun `submitEnabled is false when reason is not selected`(): Unit =
        runTest {
            viewModel.onDescriptionChanged("A description that is long enough to be valid.")
            dispatcher.scheduler.advanceUntilIdle()
            val state = viewModel.uiState.value as ComplaintUiState.Idle
            assertThat(state.submitEnabled).isFalse()
        }

    @Test
    public fun `onSubmit transitions to Success on happy path`(): Unit =
        runTest {
            viewModel.onReasonSelected(ComplaintReason.LATE_ARRIVAL)
            viewModel.onDescriptionChanged("Technician arrived 3 hours late with no notice given.")
            val mockResp =
                ComplaintResponseDto(
                    "c-1",
                    "NEW",
                    "2026-04-25T02:00:00Z",
                    "2026-04-26T00:00:00Z",
                    "LATE_ARRIVAL",
                    "CUSTOMER",
                    "2026-04-25T00:00:00Z",
                )
            coEvery {
                submitUseCase("bk-1", ComplaintReason.LATE_ARRIVAL, any(), null)
            } returns flowOf(Result.success(mockResp))

            viewModel.onSubmit("bk-1")
            dispatcher.scheduler.advanceUntilIdle()

            val state = viewModel.uiState.value
            assertThat(state).isInstanceOf(ComplaintUiState.Success::class.java)
            assertThat((state as ComplaintUiState.Success).complaintId).isEqualTo("c-1")
        }

    @Test
    public fun `onSubmit transitions to Error on failure`(): Unit =
        runTest {
            viewModel.onReasonSelected(ComplaintReason.OTHER)
            viewModel.onDescriptionChanged("A description that is long enough to be valid here.")
            coEvery { submitUseCase(any(), any(), any(), any()) } returns
                flowOf(Result.failure(RuntimeException("network error")))

            viewModel.onSubmit("bk-1")
            dispatcher.scheduler.advanceUntilIdle()

            assertThat(viewModel.uiState.value).isInstanceOf(ComplaintUiState.Error::class.java)
        }

    @Test
    public fun `onSubmit does nothing when reason is not selected`(): Unit =
        runTest {
            viewModel.onDescriptionChanged("A long enough description here.")
            viewModel.onSubmit("bk-1")
            dispatcher.scheduler.advanceUntilIdle()
            assertThat(viewModel.uiState.value).isInstanceOf(ComplaintUiState.Idle::class.java)
        }
}
