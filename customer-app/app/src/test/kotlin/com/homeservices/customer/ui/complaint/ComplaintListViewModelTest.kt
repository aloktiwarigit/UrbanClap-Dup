package com.homeservices.customer.ui.complaint

import com.homeservices.customer.data.complaint.remote.dto.ComplaintResponseDto
import com.homeservices.customer.domain.complaint.GetComplaintListUseCase
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
public class ComplaintListViewModelTest {
    private val getComplaintListUseCase: GetComplaintListUseCase = mockk()
    private val dispatcher = StandardTestDispatcher()
    private lateinit var viewModel: ComplaintListViewModel

    private val sampleDto =
        ComplaintResponseDto(
            id = "c-1",
            status = "NEW",
            acknowledgeDeadlineAt = null,
            slaDeadlineAt = "2026-04-26T00:00:00Z",
            reasonCode = "LATE_ARRIVAL",
            filedBy = "CUSTOMER",
            createdAt = "2026-04-25T00:00:00Z",
        )

    @BeforeEach
    public fun setUp() {
        Dispatchers.setMain(dispatcher)
    }

    @AfterEach
    public fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    public fun `initial state is Loading`() {
        every { getComplaintListUseCase() } returns flowOf(Result.success(listOf(sampleDto)))
        viewModel = ComplaintListViewModel(getComplaintListUseCase)
        // Before coroutines run, state is Loading
        assertThat(viewModel.uiState.value).isInstanceOf(ComplaintListUiState.Loading::class.java)
    }

    @Test
    public fun `state transitions to Ready when complaints exist`(): Unit =
        runTest {
            every { getComplaintListUseCase() } returns flowOf(Result.success(listOf(sampleDto)))
            viewModel = ComplaintListViewModel(getComplaintListUseCase)

            dispatcher.scheduler.advanceUntilIdle()

            val state = viewModel.uiState.value
            assertThat(state).isInstanceOf(ComplaintListUiState.Ready::class.java)
            assertThat((state as ComplaintListUiState.Ready).complaints).hasSize(1)
            assertThat(state.complaints.first().id).isEqualTo("c-1")
        }

    @Test
    public fun `state transitions to Empty when list is empty`(): Unit =
        runTest {
            every { getComplaintListUseCase() } returns flowOf(Result.success(emptyList()))
            viewModel = ComplaintListViewModel(getComplaintListUseCase)

            dispatcher.scheduler.advanceUntilIdle()

            assertThat(viewModel.uiState.value).isInstanceOf(ComplaintListUiState.Empty::class.java)
        }

    @Test
    public fun `state transitions to Error on failure`(): Unit =
        runTest {
            every { getComplaintListUseCase() } returns
                flowOf(Result.failure(RuntimeException("network error")))
            viewModel = ComplaintListViewModel(getComplaintListUseCase)

            dispatcher.scheduler.advanceUntilIdle()

            assertThat(viewModel.uiState.value).isInstanceOf(ComplaintListUiState.Error::class.java)
        }

    @Test
    public fun `retry reloads complaints from Loading state`(): Unit =
        runTest {
            every { getComplaintListUseCase() } returnsMany
                listOf(
                    flowOf(Result.failure(RuntimeException("first call fails"))),
                    flowOf(Result.success(listOf(sampleDto))),
                )
            viewModel = ComplaintListViewModel(getComplaintListUseCase)
            dispatcher.scheduler.advanceUntilIdle()
            assertThat(viewModel.uiState.value).isInstanceOf(ComplaintListUiState.Error::class.java)

            viewModel.retry()
            dispatcher.scheduler.advanceUntilIdle()

            assertThat(viewModel.uiState.value).isInstanceOf(ComplaintListUiState.Ready::class.java)
        }
}
