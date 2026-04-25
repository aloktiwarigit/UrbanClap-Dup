package com.homeservices.technician.ui.complaint

import com.homeservices.technician.data.complaint.remote.dto.ComplaintResponseDto
import com.homeservices.technician.domain.complaint.GetComplaintStatusUseCase
import com.homeservices.technician.domain.complaint.PhotoUploadUseCase
import com.homeservices.technician.domain.complaint.SubmitComplaintUseCase
import com.homeservices.technician.domain.complaint.TechComplaintReason
import io.mockk.coEvery
import io.mockk.every
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
        assertThat(viewModel.uiState.value).isInstanceOf(ComplaintUiState.Idle::class.java)
        assertThat((viewModel.uiState.value as ComplaintUiState.Idle).submitEnabled).isFalse()
    }

    @Test
    public fun `submitEnabled becomes true when reason and long enough description set`(): Unit =
        runTest {
            viewModel.onReasonSelected(TechComplaintReason.LATE_PAYMENT)
            viewModel.onDescriptionChanged("Customer refused to pay after job was done properly.")
            dispatcher.scheduler.advanceUntilIdle()
            val state = viewModel.uiState.value as ComplaintUiState.Idle
            assertThat(state.submitEnabled).isTrue()
            assertThat(state.selectedReason).isEqualTo(TechComplaintReason.LATE_PAYMENT)
        }

    @Test
    public fun `submitEnabled is false when description too short`(): Unit =
        runTest {
            viewModel.onReasonSelected(TechComplaintReason.SAFETY_CONCERN)
            viewModel.onDescriptionChanged("short")
            dispatcher.scheduler.advanceUntilIdle()
            assertThat((viewModel.uiState.value as ComplaintUiState.Idle).submitEnabled).isFalse()
        }

    @Test
    public fun `onSubmit transitions to Success on happy path`(): Unit =
        runTest {
            viewModel.onReasonSelected(TechComplaintReason.SAFETY_CONCERN)
            viewModel.onDescriptionChanged("Customer became verbally aggressive during the job.")
            val mockResp =
                ComplaintResponseDto(
                    "c-1",
                    "NEW",
                    "2026-04-25T02:00:00Z",
                    "2026-04-26T00:00:00Z",
                    "SAFETY_CONCERN",
                    "TECHNICIAN",
                    "2026-04-25T00:00:00Z",
                )
            coEvery {
                submitUseCase("bk-1", TechComplaintReason.SAFETY_CONCERN, any(), null)
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
            viewModel.onReasonSelected(TechComplaintReason.OTHER)
            viewModel.onDescriptionChanged("A long enough description to make it valid for test.")
            coEvery { submitUseCase(any(), any(), any(), any()) } returns
                flowOf(Result.failure(RuntimeException("network error")))

            viewModel.onSubmit("bk-1")
            dispatcher.scheduler.advanceUntilIdle()

            assertThat(viewModel.uiState.value).isInstanceOf(ComplaintUiState.Error::class.java)
        }

    @Test
    public fun `onRetry resets state to Idle from Error`(): Unit =
        runTest {
            viewModel.onReasonSelected(TechComplaintReason.OTHER)
            viewModel.onDescriptionChanged("A long enough description to make it valid for test.")
            coEvery { submitUseCase(any(), any(), any(), any()) } returns
                flowOf(Result.failure(RuntimeException("network error")))
            viewModel.onSubmit("bk-1")
            dispatcher.scheduler.advanceUntilIdle()
            assertThat(viewModel.uiState.value).isInstanceOf(ComplaintUiState.Error::class.java)

            viewModel.onRetry()
            assertThat(viewModel.uiState.value).isInstanceOf(ComplaintUiState.Idle::class.java)
        }

    @Test
    public fun `loadStatus transitions to Success when an existing complaint is found`(): Unit =
        runTest {
            val existingComplaint =
                ComplaintResponseDto(
                    "c-existing",
                    "NEW",
                    "2026-04-25T02:00:00Z",
                    "2026-04-26T00:00:00Z",
                    "LATE_PAYMENT",
                    "TECHNICIAN",
                    "2026-04-25T00:00:00Z",
                )
            every { getStatusUseCase("bk-1") } returns
                flowOf(Result.success(listOf(existingComplaint)))

            viewModel.loadStatus("bk-1")
            dispatcher.scheduler.advanceUntilIdle()

            val state = viewModel.uiState.value
            assertThat(state).isInstanceOf(ComplaintUiState.Success::class.java)
            assertThat((state as ComplaintUiState.Success).complaintId).isEqualTo("c-existing")
        }

    @Test
    public fun `loadStatus does nothing when no complaints exist`(): Unit =
        runTest {
            every { getStatusUseCase("bk-1") } returns flowOf(Result.success(emptyList()))

            viewModel.loadStatus("bk-1")
            dispatcher.scheduler.advanceUntilIdle()

            assertThat(viewModel.uiState.value).isInstanceOf(ComplaintUiState.Idle::class.java)
        }

    @Test
    public fun `onPhotoSelected transitions through PhotoUploading then back to Idle with path on success`(): Unit =
        runTest {
            viewModel.onReasonSelected(TechComplaintReason.LATE_PAYMENT)
            viewModel.onDescriptionChanged("Customer refused to pay after job was done properly.")
            coEvery { photoUploadUseCase("bk-1", "/local/evidence.jpg") } returns
                Result.success("complaints/bk-1/uid-1/1234567890.jpg")

            viewModel.onPhotoSelected("/local/evidence.jpg", "bk-1")
            // Immediately after launch, state should be PhotoUploading
            assertThat(viewModel.uiState.value).isInstanceOf(ComplaintUiState.PhotoUploading::class.java)

            dispatcher.scheduler.advanceUntilIdle()
            val state = viewModel.uiState.value as ComplaintUiState.Idle
            assertThat(state.photoStoragePath).isEqualTo("complaints/bk-1/uid-1/1234567890.jpg")
        }

    @Test
    public fun `onPhotoSelected returns to Idle with null path on upload failure`(): Unit =
        runTest {
            viewModel.onReasonSelected(TechComplaintReason.OTHER)
            viewModel.onDescriptionChanged("A long enough description to make it valid for test.")
            coEvery { photoUploadUseCase("bk-1", "/bad/photo.jpg") } returns
                Result.failure(RuntimeException("upload failed"))

            viewModel.onPhotoSelected("/bad/photo.jpg", "bk-1")
            dispatcher.scheduler.advanceUntilIdle()

            val state = viewModel.uiState.value as ComplaintUiState.Idle
            assertThat(state.photoStoragePath).isNull()
        }

    @Test
    public fun `onPhotoSelected does nothing when state is not Idle`(): Unit =
        runTest {
            viewModel.onReasonSelected(TechComplaintReason.SAFETY_CONCERN)
            viewModel.onDescriptionChanged("Customer became verbally aggressive during the job.")
            coEvery { submitUseCase(any(), any(), any(), any()) } returns
                flowOf(Result.failure(RuntimeException("pending")))
            viewModel.onSubmit("bk-1")
            assertThat(viewModel.uiState.value).isInstanceOf(ComplaintUiState.Submitting::class.java)

            viewModel.onPhotoSelected("/some/photo.jpg", "bk-1")
            dispatcher.scheduler.advanceUntilIdle()
            assertThat(viewModel.uiState.value).isNotInstanceOf(ComplaintUiState.PhotoUploading::class.java)
        }

    @Test
    public fun `onSubmit with photo path passes it through to submitUseCase`(): Unit =
        runTest {
            viewModel.onReasonSelected(TechComplaintReason.LATE_PAYMENT)
            viewModel.onDescriptionChanged("Customer refused to pay after job was done properly.")
            coEvery { photoUploadUseCase("bk-1", "/local/evidence.jpg") } returns
                Result.success("complaints/bk-1/uid-1/ts.jpg")
            viewModel.onPhotoSelected("/local/evidence.jpg", "bk-1")
            dispatcher.scheduler.advanceUntilIdle()

            val mockResp =
                ComplaintResponseDto(
                    "c-2",
                    "NEW",
                    "2026-04-25T02:00:00Z",
                    "2026-04-26T00:00:00Z",
                    "LATE_PAYMENT",
                    "TECHNICIAN",
                    "2026-04-25T00:00:00Z",
                )
            coEvery {
                submitUseCase("bk-1", TechComplaintReason.LATE_PAYMENT, any(), "complaints/bk-1/uid-1/ts.jpg")
            } returns flowOf(Result.success(mockResp))

            viewModel.onSubmit("bk-1")
            dispatcher.scheduler.advanceUntilIdle()

            val state = viewModel.uiState.value
            assertThat(state).isInstanceOf(ComplaintUiState.Success::class.java)
            assertThat((state as ComplaintUiState.Success).complaintId).isEqualTo("c-2")
        }
}
