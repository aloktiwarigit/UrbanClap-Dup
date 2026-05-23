package com.homeservices.technician.ui.deleteaccount

import com.homeservices.technician.domain.erasure.ErasureSubmitResult
import com.homeservices.technician.domain.erasure.SubmitErasureRequestUseCase
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

@OptIn(ExperimentalCoroutinesApi::class)
public class DeleteAccountViewModelTest {
    private val dispatcher = StandardTestDispatcher()
    private val submitUseCase: SubmitErasureRequestUseCase = mockk()

    @BeforeEach
    public fun setUp() {
        Dispatchers.setMain(dispatcher)
    }

    @AfterEach
    public fun tearDown() {
        Dispatchers.resetMain()
    }

    private fun vm() = DeleteAccountViewModel(submitUseCase)

    @Test
    public fun `initial state is Idle`(): Unit =
        runTest {
            val vm = vm()
            assertThat(vm.uiState.value).isEqualTo(DeleteAccountUiState.Idle)
        }

    @Test
    public fun `onConfirmDelete transitions through Submitting to Done on success`(): Unit =
        runTest {
            val scheduled = "2026-05-29T02:00:00.000Z"
            coEvery { submitUseCase() } returns ErasureSubmitResult.Success(scheduled)
            val vm = vm()

            vm.onConfirmDelete()
            assertThat(vm.uiState.value).isEqualTo(DeleteAccountUiState.Submitting)

            advanceUntilIdle()
            assertThat(vm.uiState.value).isEqualTo(DeleteAccountUiState.Done(scheduled))
        }

    @Test
    public fun `onConfirmDelete sets ActiveJobBlocked when use case returns ActiveJobExists`(): Unit =
        runTest {
            coEvery { submitUseCase() } returns ErasureSubmitResult.ActiveJobExists
            val vm = vm()

            vm.onConfirmDelete()
            advanceUntilIdle()

            assertThat(vm.uiState.value).isEqualTo(DeleteAccountUiState.ActiveJobBlocked)
        }

    @Test
    public fun `onConfirmDelete sets Error on DuplicatePending`(): Unit =
        runTest {
            coEvery { submitUseCase() } returns ErasureSubmitResult.DuplicatePending
            val vm = vm()

            vm.onConfirmDelete()
            advanceUntilIdle()

            assertThat(vm.uiState.value).isInstanceOf(DeleteAccountUiState.Error::class.java)
        }

    @Test
    public fun `onConfirmDelete sets Error on UnknownError`(): Unit =
        runTest {
            coEvery { submitUseCase() } returns ErasureSubmitResult.UnknownError("HTTP 500")
            val vm = vm()

            vm.onConfirmDelete()
            advanceUntilIdle()

            assertThat(vm.uiState.value).isInstanceOf(DeleteAccountUiState.Error::class.java)
        }

    @Test
    public fun `onDismissError resets to Idle`(): Unit =
        runTest {
            coEvery { submitUseCase() } returns ErasureSubmitResult.UnknownError("oops")
            val vm = vm()
            vm.onConfirmDelete()
            advanceUntilIdle()

            vm.onDismissError()

            assertThat(vm.uiState.value).isEqualTo(DeleteAccountUiState.Idle)
        }
}
