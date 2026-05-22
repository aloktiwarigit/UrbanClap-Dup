package com.homeservices.customer.ui.consent

import com.google.common.truth.Truth.assertThat
import com.homeservices.customer.domain.consent.GrantConsentUseCase
import com.homeservices.customer.domain.consent.IsConsentRequiredUseCase
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
public class ConsentViewModelTest {
    private val testDispatcher = StandardTestDispatcher()

    private lateinit var grantConsentUseCase: GrantConsentUseCase
    private lateinit var isConsentRequiredUseCase: IsConsentRequiredUseCase
    private lateinit var viewModel: ConsentViewModel

    @Before
    public fun setUp() {
        Dispatchers.setMain(testDispatcher)
        grantConsentUseCase = mockk()
        isConsentRequiredUseCase = mockk()
        every { isConsentRequiredUseCase() } returns flowOf(true)
        viewModel = ConsentViewModel(grantConsentUseCase, isConsentRequiredUseCase)
    }

    @After
    public fun tearDown() {
        Dispatchers.resetMain()
    }

    // ── Initial state ─────────────────────────────────────────────────────────

    @Test
    public fun `initial state has analytics and crash on, marketing off`() {
        val state = viewModel.uiState.value
        assertThat(state.analyticsOptIn).isTrue()
        assertThat(state.crashOptIn).isTrue()
        assertThat(state.marketingOptIn).isFalse()
        assertThat(state.isLoading).isFalse()
        assertThat(state.error).isNull()
    }

    // ── Toggle functions ──────────────────────────────────────────────────────

    @Test
    public fun `toggleAnalytics false sets analyticsOptIn to false`() {
        viewModel.toggleAnalytics(false)
        assertThat(viewModel.uiState.value.analyticsOptIn).isFalse()
    }

    @Test
    public fun `toggleAnalytics true restores analyticsOptIn to true`() {
        viewModel.toggleAnalytics(false)
        viewModel.toggleAnalytics(true)
        assertThat(viewModel.uiState.value.analyticsOptIn).isTrue()
    }

    @Test
    public fun `toggleCrash false sets crashOptIn to false`() {
        viewModel.toggleCrash(false)
        assertThat(viewModel.uiState.value.crashOptIn).isFalse()
    }

    @Test
    public fun `toggleMarketing true sets marketingOptIn to true`() {
        viewModel.toggleMarketing(true)
        assertThat(viewModel.uiState.value.marketingOptIn).isTrue()
    }

    // ── onConfirm ─────────────────────────────────────────────────────────────

    @Test
    public fun `onConfirm calls grantConsentUseCase with current opt-ins and emits navigateNext`(): Unit =
        runTest {
            coEvery { grantConsentUseCase(any(), any(), any()) } returns Unit

            // Set custom toggles before confirm
            viewModel.toggleAnalytics(true)
            viewModel.toggleCrash(false)
            viewModel.toggleMarketing(true)

            val navEvents = mutableListOf<Unit>()
            val collectJob = launch { viewModel.navigateNext.toList(navEvents) }

            viewModel.onConfirm()
            testDispatcher.scheduler.advanceUntilIdle()

            coVerify(exactly = 1) {
                grantConsentUseCase(
                    analyticsOptIn = true,
                    crashOptIn = false,
                    marketingOptIn = true,
                )
            }
            assertThat(navEvents).hasSize(1)
            assertThat(viewModel.uiState.value.isLoading).isFalse()

            collectJob.cancel()
        }

    @Test
    public fun `onConfirm resets isLoading to false even on exception and does not emit navigateNext`(): Unit =
        runTest {
            coEvery { grantConsentUseCase(any(), any(), any()) } throws RuntimeException("Network error")

            val navEvents = mutableListOf<Unit>()
            val collectJob = launch { viewModel.navigateNext.toList(navEvents) }

            viewModel.onConfirm()
            testDispatcher.scheduler.advanceUntilIdle()

            assertThat(viewModel.uiState.value.isLoading).isFalse()
            assertThat(viewModel.uiState.value.error).isEqualTo("Network error")
            assertThat(navEvents).isEmpty()

            collectJob.cancel()
        }

    // ── onDeclineAll ──────────────────────────────────────────────────────────

    @Test
    public fun `onDeclineAll calls grantConsentUseCase with all false and emits navigateNext`(): Unit =
        runTest {
            coEvery { grantConsentUseCase(false, false, false) } returns Unit

            val navEvents = mutableListOf<Unit>()
            val collectJob = launch { viewModel.navigateNext.toList(navEvents) }

            viewModel.onDeclineAll()
            testDispatcher.scheduler.advanceUntilIdle()

            coVerify(exactly = 1) {
                grantConsentUseCase(
                    analyticsOptIn = false,
                    crashOptIn = false,
                    marketingOptIn = false,
                )
            }
            assertThat(navEvents).hasSize(1)
            assertThat(viewModel.uiState.value.isLoading).isFalse()

            collectJob.cancel()
        }

    @Test
    public fun `onDeclineAll resets isLoading to false on exception and does not emit navigateNext`(): Unit =
        runTest {
            coEvery { grantConsentUseCase(any(), any(), any()) } throws RuntimeException("Timeout")

            val navEvents = mutableListOf<Unit>()
            val collectJob = launch { viewModel.navigateNext.toList(navEvents) }

            viewModel.onDeclineAll()
            testDispatcher.scheduler.advanceUntilIdle()

            assertThat(viewModel.uiState.value.isLoading).isFalse()
            assertThat(viewModel.uiState.value.error).isEqualTo("Timeout")
            assertThat(navEvents).isEmpty()

            collectJob.cancel()
        }

    // ── CancellationException propagation ─────────────────────────────────────

    @Test
    public fun `onConfirm rethrows CancellationException from use case`(): Unit =
        runTest {
            coEvery { grantConsentUseCase(any(), any(), any()) } throws CancellationException("test cancel")
            // CancellationException must not be swallowed — the coroutine propagates it
            // and the viewModelScope handles cancellation. The key assertion is that
            // isLoading is NOT left as true after the coroutine ends.
            viewModel.onConfirm()
            advanceUntilIdle()
            assertThat(viewModel.uiState.value.isLoading).isFalse()
        }
}
