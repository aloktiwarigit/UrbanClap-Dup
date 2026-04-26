package com.homeservices.customer.ui.tracking

import android.content.Context
import androidx.lifecycle.SavedStateHandle
import com.google.common.truth.Truth.assertThat
import com.homeservices.customer.data.sos.SosConsentStore
import com.homeservices.customer.domain.sos.SosUseCase
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

@OptIn(ExperimentalCoroutinesApi::class)
public class SosViewModelTest {
    private val testDispatcher = StandardTestDispatcher()
    private val sosUseCase: SosUseCase = mockk()
    private val consentStore: SosConsentStore = mockk()
    private val mockContext: Context = mockk(relaxed = true)
    private val savedStateHandle = SavedStateHandle(mapOf("bookingId" to "bk-1"))

    private fun buildVm() = SosViewModel(savedStateHandle, sosUseCase, consentStore, mockContext)

    @BeforeEach
    public fun setUp() {
        Dispatchers.setMain(testDispatcher)
    }

    @AfterEach
    public fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    public fun `initial state is Idle`(): Unit {
        val vm = buildVm()
        assertThat(vm.sosUiState.value).isInstanceOf(SosUiState.Idle::class.java)
    }

    @Test
    public fun `onSosTapped emits ShowConsent when consent not yet answered`(): Unit =
        runTest(testDispatcher) {
            coEvery { consentStore.getAudioConsent() } returns null
            val vm = buildVm()
            vm.onSosTapped()
            advanceUntilIdle()
            assertThat(vm.sosUiState.value).isInstanceOf(SosUiState.ShowConsent::class.java)
        }

    @Test
    public fun `onSosTapped skips consent and emits Countdown on first tick`(): Unit =
        runTest(testDispatcher) {
            coEvery { consentStore.getAudioConsent() } returns false
            val vm = buildVm()
            vm.onSosTapped()
            advanceTimeBy(1L)  // processes launch + Countdown(30) emit, stops at delay(1s)
            assertThat(vm.sosUiState.value).isInstanceOf(SosUiState.Countdown::class.java)
            assertThat((vm.sosUiState.value as SosUiState.Countdown).secondsLeft).isEqualTo(30)
            // Cancel before test-scope cleanup to avoid mock-missing fireSos call
            vm.onCancelCountdown()
        }

    @Test
    public fun `onConsentResolved stores preference and starts countdown`(): Unit =
        runTest(testDispatcher) {
            coEvery { consentStore.getAudioConsent() } returns null
            coEvery { consentStore.setAudioConsent(false) } returns Unit
            val vm = buildVm()
            vm.onSosTapped()
            advanceUntilIdle()
            vm.onConsentResolved(false)
            advanceTimeBy(1L)
            coVerify { consentStore.setAudioConsent(false) }
            assertThat(vm.sosUiState.value).isInstanceOf(SosUiState.Countdown::class.java)
            vm.onCancelCountdown()
        }

    @Test
    public fun `onCancelCountdown resets to Idle`(): Unit =
        runTest(testDispatcher) {
            coEvery { consentStore.getAudioConsent() } returns false
            val vm = buildVm()
            vm.onSosTapped()
            advanceTimeBy(1L)
            vm.onCancelCountdown()
            assertThat(vm.sosUiState.value).isInstanceOf(SosUiState.Idle::class.java)
        }

    @Test
    public fun `countdown completes and calls SOS use case`(): Unit =
        runTest(testDispatcher) {
            coEvery { consentStore.getAudioConsent() } returns false
            coEvery { sosUseCase.execute("bk-1") } returns Result.success(Unit)
            val vm = buildVm()
            vm.onSosTapped()
            advanceTimeBy(31_000L)
            advanceUntilIdle()
            assertThat(vm.sosUiState.value).isInstanceOf(SosUiState.SosConfirmed::class.java)
            coVerify { sosUseCase.execute("bk-1") }
        }

    @Test
    public fun `failed SOS call emits SosError`(): Unit =
        runTest(testDispatcher) {
            coEvery { consentStore.getAudioConsent() } returns false
            coEvery { sosUseCase.execute("bk-1") } returns Result.failure(RuntimeException("network"))
            val vm = buildVm()
            vm.onSosTapped()
            advanceTimeBy(31_000L)
            advanceUntilIdle()
            assertThat(vm.sosUiState.value).isInstanceOf(SosUiState.SosError::class.java)
        }
}
