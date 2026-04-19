package com.homeservices.customer.ui.auth

import androidx.fragment.app.FragmentActivity
import com.homeservices.customer.domain.auth.AuthOrchestrator
import com.homeservices.customer.domain.auth.model.AuthResult
import com.homeservices.customer.domain.auth.model.OtpSendResult
import com.homeservices.customer.domain.auth.model.TruecallerAuthResult
import com.google.firebase.auth.PhoneAuthProvider
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableSharedFlow
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
public class AuthViewModelTest {

    private lateinit var orchestrator: AuthOrchestrator
    private lateinit var viewModel: AuthViewModel
    private val truecallerResultFlow = MutableSharedFlow<TruecallerAuthResult>(extraBufferCapacity = 1)
    private val testDispatcher = UnconfinedTestDispatcher()

    @BeforeEach
    public fun setUp() {
        Dispatchers.setMain(testDispatcher)
        orchestrator = mockk(relaxed = true)
        every { orchestrator.observeTruecallerResults() } returns truecallerResultFlow
        viewModel = AuthViewModel(orchestrator)
    }

    @AfterEach
    public fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    public fun `initial uiState is Idle`() {
        assertThat(viewModel.uiState.value).isEqualTo(AuthUiState.Idle)
    }

    @Test
    public fun `initAuth transitions to TruecallerLoading when Truecaller is available`(): Unit = runTest {
        val activity = mockk<FragmentActivity>()
        every { orchestrator.start(activity, activity) } returns AuthOrchestrator.StartResult.TruecallerLaunched

        viewModel.initAuth(activity)

        assertThat(viewModel.uiState.value).isEqualTo(AuthUiState.TruecallerLoading)
    }

    @Test
    public fun `initAuth transitions to OtpEntry when Truecaller is unavailable`(): Unit = runTest {
        val activity = mockk<FragmentActivity>()
        every { orchestrator.start(activity, activity) } returns AuthOrchestrator.StartResult.FallbackToOtp

        viewModel.initAuth(activity)

        assertThat(viewModel.uiState.value).isInstanceOf(AuthUiState.OtpEntry::class.java)
    }

    @Test
    public fun `Truecaller Cancelled result transitions to OtpEntry`(): Unit = runTest(testDispatcher) {
        val activity = mockk<FragmentActivity>()
        every { orchestrator.start(activity, activity) } returns AuthOrchestrator.StartResult.TruecallerLaunched

        viewModel.initAuth(activity)
        truecallerResultFlow.emit(TruecallerAuthResult.Cancelled)

        assertThat(viewModel.uiState.value).isInstanceOf(AuthUiState.OtpEntry::class.java)
    }

    @Test
    public fun `onPhoneNumberSubmitted transitions to OtpEntry on CodeSent`(): Unit =
        runTest(testDispatcher) {
            val activity = mockk<FragmentActivity>()
            val resendToken = mockk<PhoneAuthProvider.ForceResendingToken>()
            every {
                orchestrator.sendOtp("+919876543210", activity, null)
            } returns flowOf(OtpSendResult.CodeSent("verId", resendToken))

            viewModel.onPhoneNumberSubmitted("+919876543210", activity)

            assertThat(viewModel.uiState.value).isInstanceOf(AuthUiState.OtpEntry::class.java)
            assertThat((viewModel.uiState.value as AuthUiState.OtpEntry).verificationId)
                .isEqualTo("verId")
        }

    @Test
    public fun `onOtpEntered transitions to Error with WrongCode`(): Unit =
        runTest(testDispatcher) {
            val activity = mockk<FragmentActivity>()
            val resendToken = mockk<PhoneAuthProvider.ForceResendingToken>()
            every {
                orchestrator.sendOtp("+919876543210", activity, null)
            } returns flowOf(OtpSendResult.CodeSent("verId", resendToken))
            every {
                orchestrator.verifyOtp("verId", "000000")
            } returns flowOf(AuthResult.Error.WrongCode)

            viewModel.onPhoneNumberSubmitted("+919876543210", activity)
            viewModel.onOtpEntered("000000")

            val state = viewModel.uiState.value
            assertThat(state).isInstanceOf(AuthUiState.Error::class.java)
            assertThat((state as AuthUiState.Error).retriesLeft).isEqualTo(2)
        }

    @Test
    public fun `onRetry resets state to OtpEntry`(): Unit = runTest {
        viewModel.onRetry()

        assertThat(viewModel.uiState.value).isInstanceOf(AuthUiState.OtpEntry::class.java)
    }
}
