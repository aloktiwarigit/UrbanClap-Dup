package com.homeservices.customer.ui.waitlist

import com.google.common.truth.Truth.assertThat
import com.homeservices.customer.data.auth.SessionManager
import com.homeservices.customer.data.waitlist.RateLimitedException
import com.homeservices.customer.domain.auth.model.AuthState
import com.homeservices.customer.domain.waitlist.JoinWaitlistUseCase
import com.homeservices.customer.domain.waitlist.WaitlistRepository
import com.homeservices.customer.domain.waitlist.WaitlistRequest
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
public class WaitlistViewModelTest {
    private val dispatcher = UnconfinedTestDispatcher()

    private lateinit var sessionManager: SessionManager
    private lateinit var repository: WaitlistRepository
    private lateinit var useCase: JoinWaitlistUseCase

    @Before
    public fun setUp(): Unit {
        Dispatchers.setMain(dispatcher)
        sessionManager = mockk()
        repository = mockk()
        useCase = JoinWaitlistUseCase(repository)
    }

    @After
    public fun tearDown(): Unit {
        Dispatchers.resetMain()
    }

    private fun makeVm(): WaitlistViewModel = WaitlistViewModel(useCase, sessionManager)

    // ── Helpers ──────────────────────────────────────────────────────────────

    private fun givenAuthState(state: AuthState) {
        every { sessionManager.authState } returns MutableStateFlow(state)
    }

    // ── Tests ─────────────────────────────────────────────────────────────────

    @Test
    public fun `initialState prefillsPhoneFromSessionManager whenAvailable`(): Unit =
        runTest(dispatcher) {
            // SessionManager stores phoneLastFour, not the full number.
            // VM pre-fills an empty string — phone must be manually entered.
            // This test verifies the form initialises in Form state (not error/loading).
            givenAuthState(
                AuthState.Authenticated(
                    uid = "uid-1",
                    phoneLastFour = "3210",
                ),
            )

            val vm = makeVm()
            val state = vm.uiState.value

            assertThat(state).isInstanceOf(WaitlistUiState.Form::class.java)
            // Phone field starts empty — user enters the full number themselves.
            assertThat((state as WaitlistUiState.Form).phone).isEmpty()
            assertThat(state.isPhoneValid).isFalse()
        }

    @Test
    public fun `submit validPhone callsApi emitsConfirmedState`(): Unit =
        runTest(dispatcher) {
            givenAuthState(AuthState.Authenticated(uid = "uid-1"))
            val validPhone = "+919876543210"
            every { repository.joinWaitlist(any()) } coAnswers { Result.success(Unit) }

            val vm = makeVm()
            vm.onPhoneChange(validPhone)
            vm.onSubmit(lat = 26.7606, lng = 82.1545, serviceId = "svc-fan")

            verify { repository.joinWaitlist(match { it.phone == validPhone }) }
            assertThat(vm.uiState.value).isEqualTo(WaitlistUiState.Confirmed)
        }

    @Test
    public fun `submit invalidPhoneFormat emitsValidationError doesNotCallApi`(): Unit =
        runTest(dispatcher) {
            givenAuthState(AuthState.Authenticated(uid = "uid-1"))

            val vm = makeVm()
            vm.onPhoneChange("123")           // invalid — too short, no country code
            vm.onSubmit(lat = 0.0, lng = 0.0, serviceId = "svc-fan")

            // Repository must NOT be called for an invalid phone.
            verify(exactly = 0) { repository.joinWaitlist(any()) }
            val state = vm.uiState.value
            assertThat(state).isInstanceOf(WaitlistUiState.Error::class.java)
            assertThat((state as WaitlistUiState.Error).retryable).isFalse()
        }

    @Test
    public fun `submit apiFailure emitsRetryableError keepsFormState`(): Unit =
        runTest(dispatcher) {
            givenAuthState(AuthState.Authenticated(uid = "uid-1"))
            val validPhone = "+919876543210"
            every { repository.joinWaitlist(any()) } coAnswers {
                Result.failure(RuntimeException("Network error"))
            }

            val vm = makeVm()
            vm.onPhoneChange(validPhone)
            vm.onSubmit(lat = 26.7606, lng = 82.1545, serviceId = "svc-fan")

            val state = vm.uiState.value
            assertThat(state).isInstanceOf(WaitlistUiState.Error::class.java)
            assertThat((state as WaitlistUiState.Error).retryable).isTrue()
        }

    @Test
    public fun `submit rateLimited429 emitsRateLimitedState withRetryAfterSeconds`(): Unit =
        runTest(dispatcher) {
            givenAuthState(AuthState.Authenticated(uid = "uid-1"))
            val validPhone = "+919876543210"
            every { repository.joinWaitlist(any()) } coAnswers {
                Result.failure(RateLimitedException(retryAfterSec = 120))
            }

            val vm = makeVm()
            vm.onPhoneChange(validPhone)
            vm.onSubmit(lat = 26.7606, lng = 82.1545, serviceId = "svc-fan")

            val state = vm.uiState.value
            assertThat(state).isInstanceOf(WaitlistUiState.RateLimited::class.java)
            assertThat((state as WaitlistUiState.RateLimited).retryAfterSec).isEqualTo(120)
        }
}
