package com.homeservices.customer.ui.deleteaccount

import com.google.common.truth.Truth.assertThat
import com.homeservices.customer.data.auth.SessionManager
import com.homeservices.customer.domain.auth.model.AuthState
import com.homeservices.customer.domain.deleteaccount.ErasureAlreadyPendingException
import com.homeservices.customer.domain.deleteaccount.GetActiveErasureRequestUseCase
import com.homeservices.customer.domain.deleteaccount.RequestErasureUseCase
import com.homeservices.customer.domain.deleteaccount.RevokeErasureUseCase
import com.homeservices.customer.domain.deleteaccount.model.ErasureRequest
import com.homeservices.customer.ui.deleteaccount.DeleteAccountUiState.Confirming
import com.homeservices.customer.ui.deleteaccount.DeleteAccountUiState.CoolOff
import com.homeservices.customer.ui.deleteaccount.DeleteAccountUiState.Error
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

@OptIn(ExperimentalCoroutinesApi::class)
public class DeleteAccountViewModelTest {
    private val testDispatcher = StandardTestDispatcher()

    private lateinit var requestErasure: RequestErasureUseCase
    private lateinit var revokeErasure: RevokeErasureUseCase
    private lateinit var getActiveErasure: GetActiveErasureRequestUseCase
    private lateinit var sessionManager: SessionManager
    private lateinit var viewModel: DeleteAccountViewModel

    private val authState =
        MutableStateFlow<AuthState>(
            AuthState.Authenticated(uid = "uid-test", phoneLastFour = "4321"),
        )

    @Before
    public fun setUp() {
        Dispatchers.setMain(testDispatcher)
        requestErasure = mockk()
        revokeErasure = mockk()
        getActiveErasure = mockk()
        sessionManager = mockk()
        every { sessionManager.authState } returns authState

        viewModel =
            DeleteAccountViewModel(
                requestErasure = requestErasure,
                revokeErasure = revokeErasure,
                getActiveErasure = getActiveErasure,
                sessionManager = sessionManager,
            )
        viewModel.expectedPhrase = "DELETE MY ACCOUNT"
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

    // --- checkForActiveRequest ---

    @Test
    public fun `checkForActiveRequest stays Idle when no active request`(): Unit =
        runTest {
            coEvery { getActiveErasure() } returns Result.success(null)
            viewModel.checkForActiveRequest()
            testDispatcher.scheduler.advanceUntilIdle()
            assertThat(viewModel.uiState.value).isEqualTo(Idle)
        }

    @Test
    public fun `checkForActiveRequest transitions to CoolOff when active request exists`(): Unit =
        runTest {
            val erasure = ErasureRequest("pending:uid", "2026-05-19T12:00:00Z", "PENDING")
            coEvery { getActiveErasure() } returns Result.success(erasure)
            viewModel.checkForActiveRequest()
            testDispatcher.scheduler.advanceUntilIdle()
            val state = viewModel.uiState.value as? CoolOff
            assertThat(state).isNotNull()
            assertThat(state!!.requestId).isEqualTo("pending:uid")
        }

    @Test
    public fun `checkForActiveRequest stays Idle on network failure`(): Unit =
        runTest {
            coEvery { getActiveErasure() } returns Result.failure(RuntimeException("net error"))
            viewModel.checkForActiveRequest()
            testDispatcher.scheduler.advanceUntilIdle()
            assertThat(viewModel.uiState.value).isEqualTo(Idle)
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
    public fun `phrase mismatch detection — partial match is false`() {
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
            viewModel.onSubmitClicked()

            // Before coroutine runs, state should be Submitting
            assertThat(viewModel.uiState.value).isEqualTo(Submitting)

            testDispatcher.scheduler.advanceUntilIdle()

            val state = viewModel.uiState.value as? CoolOff
            assertThat(state).isNotNull()
            assertThat(state!!.requestId).isEqualTo("pending:uid")
        }

    @Test
    public fun `onSubmitClicked goes to Error on failure`(): Unit =
        runTest {
            coEvery { requestErasure(any()) } returns Result.failure(RuntimeException("Server error"))

            viewModel.onContinueClicked()
            viewModel.onPhraseChanged("DELETE MY ACCOUNT")
            viewModel.onPinChanged("4321")
            viewModel.onSubmitClicked()
            testDispatcher.scheduler.advanceUntilIdle()

            val state = viewModel.uiState.value as? Error
            assertThat(state).isNotNull()
            assertThat(state!!.message).isEqualTo("Server error")
        }

    @Test
    public fun `onSubmitClicked goes to CoolOff on 409 conflict`(): Unit =
        runTest {
            coEvery { requestErasure(any()) } returns
                Result.failure(ErasureAlreadyPendingException("pending:uid"))

            viewModel.onContinueClicked()
            viewModel.onPhraseChanged("DELETE MY ACCOUNT")
            viewModel.onPinChanged("4321")
            viewModel.onSubmitClicked()
            testDispatcher.scheduler.advanceUntilIdle()

            val state = viewModel.uiState.value as? CoolOff
            assertThat(state).isNotNull()
            assertThat(state!!.requestId).isEqualTo("pending:uid")
        }

    @Test
    public fun `onSubmitClicked is a no-op when state is not Confirming`(): Unit =
        runTest {
            // State is Idle — submit should be ignored
            viewModel.onSubmitClicked()
            testDispatcher.scheduler.advanceUntilIdle()
            assertThat(viewModel.uiState.value).isEqualTo(Idle)
        }

    // --- onRevokeClicked ---

    @Test
    public fun `onRevokeClicked goes Revoking then Revoked on success`(): Unit =
        runTest {
            coEvery { getActiveErasure() } returns
                Result.success(ErasureRequest("pending:uid", "2026-05-19T12:00:00Z", "PENDING"))
            viewModel.checkForActiveRequest()
            testDispatcher.scheduler.advanceUntilIdle()

            coEvery { revokeErasure() } returns Result.success(Unit)
            viewModel.onRevokeClicked()

            assertThat(viewModel.uiState.value).isEqualTo(Revoking)

            testDispatcher.scheduler.advanceUntilIdle()

            assertThat(viewModel.uiState.value).isEqualTo(Revoked)
        }

    @Test
    public fun `onRevokeClicked goes to Error on failure`(): Unit =
        runTest {
            coEvery { getActiveErasure() } returns
                Result.success(ErasureRequest("pending:uid", "2026-05-19T12:00:00Z", "PENDING"))
            viewModel.checkForActiveRequest()
            testDispatcher.scheduler.advanceUntilIdle()

            coEvery { revokeErasure() } returns Result.failure(RuntimeException("Revoke failed"))
            viewModel.onRevokeClicked()
            testDispatcher.scheduler.advanceUntilIdle()

            assertThat(viewModel.uiState.value).isInstanceOf(Error::class.java)
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
    public fun `onErrorDismissed restores previousState`(): Unit =
        runTest {
            coEvery { requestErasure(any()) } returns Result.failure(RuntimeException("oops"))

            viewModel.onContinueClicked()
            viewModel.onPhraseChanged("DELETE MY ACCOUNT")
            viewModel.onPinChanged("4321")
            val confirmingState = viewModel.uiState.value
            viewModel.onSubmitClicked()
            testDispatcher.scheduler.advanceUntilIdle()

            assertThat(viewModel.uiState.value).isInstanceOf(Error::class.java)
            viewModel.onErrorDismissed()
            assertThat(viewModel.uiState.value).isEqualTo(confirmingState)
        }
}
