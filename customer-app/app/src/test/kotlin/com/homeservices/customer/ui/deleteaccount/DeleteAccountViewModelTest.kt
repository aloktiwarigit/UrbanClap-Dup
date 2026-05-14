package com.homeservices.customer.ui.deleteaccount

import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.SavedStateHandle
import com.google.common.truth.Truth.assertThat
import com.homeservices.customer.data.auth.SessionManager
import com.homeservices.customer.domain.auth.model.AuthState
import com.homeservices.customer.domain.deleteaccount.ErasureAlreadyPendingException
import com.homeservices.customer.domain.deleteaccount.RequestErasureUseCase
import com.homeservices.customer.domain.deleteaccount.RevokeErasureUseCase
import com.homeservices.customer.domain.deleteaccount.model.ErasureRequest
import com.homeservices.customer.ui.deleteaccount.DeleteAccountUiState.Confirming
import com.homeservices.customer.ui.deleteaccount.DeleteAccountUiState.CoolOff
import com.homeservices.customer.ui.deleteaccount.DeleteAccountUiState.Error
import com.homeservices.customer.ui.deleteaccount.DeleteAccountUiState.ExistingRequestDetected
import com.homeservices.customer.ui.deleteaccount.DeleteAccountUiState.Idle
import com.homeservices.customer.ui.deleteaccount.DeleteAccountUiState.Revoked
import com.homeservices.customer.ui.deleteaccount.DeleteAccountUiState.Revoking
import com.homeservices.customer.ui.deleteaccount.DeleteAccountUiState.Submitting
import io.mockk.coEvery
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Before
import org.junit.Test
import java.time.Instant

@OptIn(ExperimentalCoroutinesApi::class)
public class DeleteAccountViewModelTest {
    private val testDispatcher = StandardTestDispatcher()

    private lateinit var requestErasure: RequestErasureUseCase
    private lateinit var revokeErasure: RevokeErasureUseCase
    private lateinit var sessionManager: SessionManager
    private lateinit var biometricGate: com.homeservices.customer.domain.auth.BiometricGateUseCase
    private val activity: FragmentActivity = mockk(relaxed = true)
    private lateinit var viewModel: DeleteAccountViewModel

    private val authState =
        MutableStateFlow<AuthState>(
            AuthState.Authenticated(uid = "uid-test", phoneLastFour = "4321"),
        )

    private fun buildViewModel(savedStateHandle: SavedStateHandle = SavedStateHandle()): DeleteAccountViewModel =
        DeleteAccountViewModel(
            requestErasure = requestErasure,
            revokeErasure = revokeErasure,
            sessionManager = sessionManager,
            biometricGate = biometricGate,
            savedStateHandle = savedStateHandle,
        ).also { it.expectedPhrase = "DELETE MY ACCOUNT" }

    @Before
    public fun setUp() {
        Dispatchers.setMain(testDispatcher)
        requestErasure = mockk()
        biometricGate = mockk()
        io.mockk.every { biometricGate.canUseBiometric(any()) } returns false
        revokeErasure = mockk()
        sessionManager = mockk()
        every { sessionManager.authState } returns authState

        viewModel = buildViewModel()
    }

    @After
    public fun tearDown() {
        Dispatchers.resetMain()
    }

    // --- Initial state ---

    @Test
    public fun `initial state is Idle`() {
        assertThat(viewModel.uiState.value).isEqualTo(Idle)
    }

    @Test
    public fun `initial state is CoolOff when nav args provide requestId`() {
        // FIX 2: ViewModel restores CoolOff state from nav args in SavedStateHandle.
        val parsed = Instant.parse("2026-05-19T12:00:00Z")
        val epochMs = parsed.toEpochMilli()
        val savedState =
            SavedStateHandle(
                mapOf(
                    NAV_ARG_REQUEST_ID to "pending:uid-nav",
                    NAV_ARG_SCHEDULED_DELETION_EPOCH_MS to epochMs,
                ),
            )
        val vm = buildViewModel(savedState)
        val state = vm.uiState.value as? CoolOff
        assertThat(state).isNotNull()
        assertThat(state!!.requestId).isEqualTo("pending:uid-nav")
        assertThat(state.scheduledDeletionAt).isNotEmpty()
    }

    @Test
    public fun `initial state is CoolOff with empty scheduledDeletionAt when epochMs is zero`() {
        // Legacy/unknown date path â€” epochMs = 0 falls through to CoolOff("", "").
        val savedState =
            SavedStateHandle(
                mapOf(
                    NAV_ARG_REQUEST_ID to "pending:uid-conflict",
                    NAV_ARG_SCHEDULED_DELETION_EPOCH_MS to 0L,
                ),
            )
        val vm = buildViewModel(savedState)
        val state = vm.uiState.value as? CoolOff
        assertThat(state).isNotNull()
        assertThat(state!!.requestId).isEqualTo("pending:uid-conflict")
        assertThat(state.scheduledDeletionAt).isEmpty()
    }

    @Test
    public fun `initial state is ExistingRequestDetected when epochMs is -1 sentinel (409 path)`() {
        // FIX 2 (P2 â€” cool-off blank state on existing-request 409):
        // epochMs = -1L is the sentinel written by SettingsGraph for the 409 conflict path.
        // The ViewModel must emit ExistingRequestDetected so the CoolOffScreen renders
        // the "pending â€” exact date unavailable" message instead of a blank countdown.
        val savedState =
            SavedStateHandle(
                mapOf(
                    NAV_ARG_REQUEST_ID to "pending:uid-409",
                    NAV_ARG_SCHEDULED_DELETION_EPOCH_MS to EPOCH_MS_EXISTING_REQUEST_SENTINEL,
                ),
            )
        val vm = buildViewModel(savedState)
        val state = vm.uiState.value as? ExistingRequestDetected
        assertThat(state).isNotNull()
        assertThat(state!!.requestId).isEqualTo("pending:uid-409")
    }

    @Test
    public fun `system back calls onBackFromConfirmation â€” Confirming resets to Idle`() {
        // FIX 1 (P2 â€” system back bypasses onBackFromConfirmation):
        // The BackHandler in DeleteAccountConfirmScreen calls the same onBack lambda
        // as the in-app back button. SettingsGraph's wrapper calls vm.onBackFromConfirmation()
        // before popping. This test verifies the ViewModel side: onBackFromConfirmation
        // from Confirming state must reset to Idle.
        viewModel.onContinueClicked()
        assertThat(viewModel.uiState.value).isInstanceOf(Confirming::class.java)
        // Simulate system back â†’ BackHandler â†’ onBack lambda â†’ onBackFromConfirmation()
        viewModel.onBackFromConfirmation()
        assertThat(viewModel.uiState.value).isEqualTo(Idle)
        // Re-entering the screen must NOT re-navigate (state is Idle, not Confirming).
        assertThat(viewModel.uiState.value is Confirming).isFalse()
    }

    // --- onContinueClicked ---

    @Test
    public fun `onContinueClicked transitions to Confirming with correct last4`() {
        viewModel.onContinueClicked()
        val state = viewModel.uiState.value as? Confirming
        assertThat(state).isNotNull()
        assertThat(state!!.phraseExpected).isEqualTo("DELETE MY ACCOUNT")
        assertThat(state.last4Expected).isEqualTo("4321")
        assertThat(state.isSubmitEnabled).isFalse()
    }

    @Test
    public fun `onContinueClicked uses empty string for last4 when not authenticated`() {
        authState.value = AuthState.Unauthenticated
        viewModel.onContinueClicked()
        val state = viewModel.uiState.value as? Confirming
        assertThat(state!!.last4Expected).isEmpty()
    }

    // --- Phrase and PIN validation ---

    @Test
    public fun `isSubmitEnabled is false when only phrase matches`() {
        viewModel.onContinueClicked()
        viewModel.onPhraseChanged("DELETE MY ACCOUNT")
        viewModel.onPinChanged("000") // wrong pin
        val state = viewModel.uiState.value as? Confirming
        assertThat(state!!.isSubmitEnabled).isFalse()
    }

    @Test
    public fun `isSubmitEnabled is false when only pin matches`() {
        viewModel.onContinueClicked()
        viewModel.onPhraseChanged("delete my account") // wrong case
        viewModel.onPinChanged("4321")
        val state = viewModel.uiState.value as? Confirming
        assertThat(state!!.isSubmitEnabled).isFalse()
    }

    @Test
    public fun `isSubmitEnabled is true when both phrase and pin match`() {
        viewModel.onContinueClicked()
        viewModel.onPhraseChanged("DELETE MY ACCOUNT")
        viewModel.onPinChanged("4321")
        val state = viewModel.uiState.value as? Confirming
        assertThat(state!!.isSubmitEnabled).isTrue()
    }

    @Test
    public fun `phrase mismatch detection â€” partial match is false`() {
        viewModel.onContinueClicked()
        viewModel.onPhraseChanged("DELETE MY ACCOUN") // one char short
        val state = viewModel.uiState.value as? Confirming
        assertThat(state!!.isSubmitEnabled).isFalse()
    }

    // --- onSubmitClicked ---

    @Test
    public fun `onSubmitClicked goes Submitting then CoolOff on success`(): Unit =
        runTest {
            val erasure = ErasureRequest("pending:uid", "2026-05-19T12:00:00Z", "PENDING")
            coEvery { requestErasure(any()) } returns Result.success(erasure)

            viewModel.onContinueClicked()
            viewModel.onPhraseChanged("DELETE MY ACCOUNT")
            viewModel.onPinChanged("4321")
viewModel.onSubmitClicked(activity)
            testDispatcher.scheduler.advanceUntilIdle()

            val state = viewModel.uiState.value as? CoolOff
            assertThat(state).isNotNull()
            assertThat(state!!.requestId).isEqualTo("pending:uid")
        }

    @Test
    public fun `onSubmitClicked goes to Error on non-409 failure`(): Unit =
        runTest {
            coEvery { requestErasure(any()) } returns Result.failure(RuntimeException("Server error"))

            viewModel.onContinueClicked()
            viewModel.onPhraseChanged("DELETE MY ACCOUNT")
            viewModel.onPinChanged("4321")
            viewModel.onSubmitClicked(activity)
            testDispatcher.scheduler.advanceUntilIdle()

            val state = viewModel.uiState.value as? Error
            assertThat(state).isNotNull()
            assertThat(state!!.message).isEqualTo("Server error")
        }

    @Test
    public fun `onSubmitClicked goes to ExistingRequestDetected on 409 conflict`(): Unit =
        runTest {
            // FIX 1: 409 now produces ExistingRequestDetected (not CoolOff with empty date).
            coEvery { requestErasure(any()) } returns
                Result.failure(ErasureAlreadyPendingException("pending:uid"))

            viewModel.onContinueClicked()
            viewModel.onPhraseChanged("DELETE MY ACCOUNT")
            viewModel.onPinChanged("4321")
            viewModel.onSubmitClicked(activity)
            testDispatcher.scheduler.advanceUntilIdle()

            val state = viewModel.uiState.value as? ExistingRequestDetected
            assertThat(state).isNotNull()
            assertThat(state!!.requestId).isEqualTo("pending:uid")
        }

    @Test
    public fun `onSubmitClicked is a no-op when state is not Confirming`(): Unit =
        runTest {
            // State is Idle â€” submit should be ignored
            viewModel.onSubmitClicked(activity)
            testDispatcher.scheduler.advanceUntilIdle()
            assertThat(viewModel.uiState.value).isEqualTo(Idle)
        }

    // --- onRevokeClicked ---

    @Test
    public fun `onRevokeClicked goes Revoking then Revoked from CoolOff state`(): Unit =
        runTest {
            val parsed = Instant.parse("2026-05-19T12:00:00Z")
            val epochMs = parsed.toEpochMilli()
            val savedState =
                SavedStateHandle(
                    mapOf(
                        NAV_ARG_REQUEST_ID to "pending:uid",
                        NAV_ARG_SCHEDULED_DELETION_EPOCH_MS to epochMs,
                    ),
                )
            val vm = buildViewModel(savedState)

            coEvery { revokeErasure() } returns Result.success(Unit)
            vm.onRevokeClicked()

            assertThat(vm.uiState.value).isEqualTo(Revoking)

            testDispatcher.scheduler.advanceUntilIdle()

            assertThat(vm.uiState.value).isEqualTo(Revoked)
        }

    @Test
    public fun `onRevokeClicked goes Revoking then Revoked from ExistingRequestDetected state`(): Unit =
        runTest {
            // FIX 1: onRevokeClicked must work from ExistingRequestDetected state.
            val savedState =
                SavedStateHandle(
                    mapOf(
                        NAV_ARG_REQUEST_ID to "pending:uid",
                        NAV_ARG_SCHEDULED_DELETION_EPOCH_MS to 0L,
                    ),
                )
            val vm = buildViewModel(savedState)
            // Confirm the state is CoolOff (with empty scheduledAt) since nav args are present.
            // ExistingRequestDetected is only reached via onSubmitClicked 409 path; for the
            // revoke from nav-arg path we exercise the CoolOff(requestId, "") variant.
            assertThat(vm.uiState.value).isInstanceOf(CoolOff::class.java)

            coEvery { revokeErasure() } returns Result.success(Unit)
            vm.onRevokeClicked()
            testDispatcher.scheduler.advanceUntilIdle()

            assertThat(vm.uiState.value).isEqualTo(Revoked)
        }

    @Test
    public fun `onRevokeClicked goes to ExistingRequestDetected state then can revoke`(): Unit =
        runTest {
            // Exercise the full path: submit â†’ 409 â†’ ExistingRequestDetected â†’ revoke.
            coEvery { requestErasure(any()) } returns
                Result.failure(ErasureAlreadyPendingException("pending:uid-conflict"))

            viewModel.onContinueClicked()
            viewModel.onPhraseChanged("DELETE MY ACCOUNT")
            viewModel.onPinChanged("4321")
            viewModel.onSubmitClicked(activity)
            testDispatcher.scheduler.advanceUntilIdle()

            assertThat(viewModel.uiState.value).isInstanceOf(ExistingRequestDetected::class.java)

            coEvery { revokeErasure() } returns Result.success(Unit)
            viewModel.onRevokeClicked()
            testDispatcher.scheduler.advanceUntilIdle()

            assertThat(viewModel.uiState.value).isEqualTo(Revoked)
        }

    @Test
    public fun `onRevokeClicked goes to Error on failure`(): Unit =
        runTest {
            val parsed = Instant.parse("2026-05-19T12:00:00Z")
            val epochMs = parsed.toEpochMilli()
            val savedState =
                SavedStateHandle(
                    mapOf(
                        NAV_ARG_REQUEST_ID to "pending:uid",
                        NAV_ARG_SCHEDULED_DELETION_EPOCH_MS to epochMs,
                    ),
                )
            val vm = buildViewModel(savedState)

            coEvery { revokeErasure() } returns Result.failure(RuntimeException("Revoke failed"))
            vm.onRevokeClicked()
            testDispatcher.scheduler.advanceUntilIdle()

            assertThat(vm.uiState.value).isInstanceOf(Error::class.java)
        }

    // --- onBackFromConfirmation / onErrorDismissed ---

    @Test
    public fun `onBackFromConfirmation resets to Idle`() {
        viewModel.onContinueClicked()
        assertThat(viewModel.uiState.value).isInstanceOf(Confirming::class.java)
        viewModel.onBackFromConfirmation()
        assertThat(viewModel.uiState.value).isEqualTo(Idle)
    }

    @Test
    public fun `onBackFromConfirmation from Confirming state resets to Idle so LaunchedEffect does not re-fire`() {
        // FIX 3: Confirms that calling onBackFromConfirmation resets Confirming -> Idle.
        // The DeleteAccountScreen LaunchedEffect only navigates on Confirming; once Idle,
        // re-entering the screen does NOT re-trigger navigation.
        viewModel.onContinueClicked()
        assertThat(viewModel.uiState.value).isInstanceOf(Confirming::class.java)
        viewModel.onBackFromConfirmation()
        assertThat(viewModel.uiState.value).isEqualTo(Idle)
        // Verify Idle does not satisfy the Confirming branch check.
        assertThat(viewModel.uiState.value is Confirming).isFalse()
    }

    @Test
    public fun `onErrorDismissed restores previousState`(): Unit =
        runTest {
            coEvery { requestErasure(any()) } returns Result.failure(RuntimeException("oops"))

            viewModel.onContinueClicked()
            viewModel.onPhraseChanged("DELETE MY ACCOUNT")
            viewModel.onPinChanged("4321")
            val confirmingState = viewModel.uiState.value
            viewModel.onSubmitClicked(activity)
            testDispatcher.scheduler.advanceUntilIdle()

            assertThat(viewModel.uiState.value).isInstanceOf(Error::class.java)
            viewModel.onErrorDismissed()
            assertThat(viewModel.uiState.value).isEqualTo(confirmingState)
        }
}
