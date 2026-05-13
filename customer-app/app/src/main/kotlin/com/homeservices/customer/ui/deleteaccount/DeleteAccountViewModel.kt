package com.homeservices.customer.ui.deleteaccount

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.customer.data.auth.SessionManager
import com.homeservices.customer.domain.auth.model.AuthState
import com.homeservices.customer.domain.deleteaccount.ErasureAlreadyPendingException
import com.homeservices.customer.domain.deleteaccount.GetActiveErasureRequestUseCase
import com.homeservices.customer.domain.deleteaccount.RequestErasureUseCase
import com.homeservices.customer.domain.deleteaccount.RevokeErasureUseCase
import com.homeservices.customer.ui.deleteaccount.DeleteAccountUiState.Confirming
import com.homeservices.customer.ui.deleteaccount.DeleteAccountUiState.CoolOff
import com.homeservices.customer.ui.deleteaccount.DeleteAccountUiState.Error
import com.homeservices.customer.ui.deleteaccount.DeleteAccountUiState.Idle
import com.homeservices.customer.ui.deleteaccount.DeleteAccountUiState.Revoked
import com.homeservices.customer.ui.deleteaccount.DeleteAccountUiState.Revoking
import com.homeservices.customer.ui.deleteaccount.DeleteAccountUiState.Submitting
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
public class DeleteAccountViewModel
    @Inject
    constructor(
        private val requestErasure: RequestErasureUseCase,
        private val revokeErasure: RevokeErasureUseCase,
        private val getActiveErasure: GetActiveErasureRequestUseCase,
        private val sessionManager: SessionManager,
    ) : ViewModel() {
        private val _uiState = MutableStateFlow<DeleteAccountUiState>(Idle)
        public val uiState: StateFlow<DeleteAccountUiState> = _uiState.asStateFlow()

        /**
         * The confirmation phrase the user must type (locale-appropriate).
         * Set externally from the Composable after resolving the string resource.
         */
        public var expectedPhrase: String = ""

        /**
         * Check whether an active erasure request exists when the flow is first opened.
         * If one is found, skip straight to the CoolOff screen.
         */
        public fun checkForActiveRequest() {
            viewModelScope.launch {
                getActiveErasure()
                    .onSuccess { active ->
                        if (active != null) {
                            _uiState.value =
                                CoolOff(
                                    requestId = active.requestId,
                                    scheduledDeletionAt = active.scheduledDeletionAt,
                                )
                        }
                        // else stay Idle — entry screen remains visible
                    }.onFailure {
                        // Non-critical: if probe fails, just show the entry screen normally.
                        _uiState.value = Idle
                    }
            }
        }

        /** Called when the user taps "Continue" on the entry screen. */
        public fun onContinueClicked() {
            val last4 = resolvedLast4()
            _uiState.value =
                Confirming(
                    phraseExpected = expectedPhrase,
                    last4Expected = last4,
                )
        }

        /** Called when the user taps "Back" from the confirmation screen. */
        public fun onBackFromConfirmation() {
            _uiState.value = Idle
        }

        /** Called on every keystroke in the phrase text field on the confirmation screen. */
        public fun onPhraseChanged(value: String) {
            val current = _uiState.value as? Confirming ?: return
            _uiState.value = current.copy(typedPhrase = value)
        }

        /** Called on every keystroke in the PIN / last4 text field on the confirmation screen. */
        public fun onPinChanged(value: String) {
            val current = _uiState.value as? Confirming ?: return
            _uiState.value = current.copy(typedPin = value)
        }

        /**
         * Called when the user taps "Submit" on the confirmation screen.
         * Guards are redundant (button should be disabled when invalid) but kept for safety.
         */
        public fun onSubmitClicked() {
            val current = _uiState.value as? Confirming ?: return
            if (!current.isSubmitEnabled) return

            _uiState.value = Submitting
            viewModelScope.launch {
                requestErasure()
                    .onSuccess { erasure ->
                        _uiState.value =
                            CoolOff(
                                requestId = erasure.requestId,
                                scheduledDeletionAt = erasure.scheduledDeletionAt,
                            )
                    }.onFailure { err ->
                        if (err is ErasureAlreadyPendingException) {
                            // A pending request already exists — navigate to cool-off.
                            _uiState.value =
                                CoolOff(
                                    requestId = err.erasureId,
                                    scheduledDeletionAt = "",
                                )
                        } else {
                            _uiState.value =
                                Error(
                                    message = err.message ?: "Unknown error",
                                    previousState = current,
                                )
                        }
                    }
            }
        }

        /** Called when the user taps "Revoke deletion" on the cool-off screen. */
        public fun onRevokeClicked() {
            val current = _uiState.value as? CoolOff ?: return
            _uiState.value = Revoking
            viewModelScope.launch {
                revokeErasure()
                    .onSuccess { _uiState.value = Revoked }
                    .onFailure { err ->
                        _uiState.value =
                            Error(
                                message = err.message ?: "Unknown error",
                                previousState = current,
                            )
                    }
            }
        }

        /** Called when the user dismisses the Error state and wants to retry. */
        public fun onErrorDismissed() {
            val current = _uiState.value as? Error ?: return
            _uiState.value = current.previousState
        }

        private fun resolvedLast4(): String {
            val auth = sessionManager.authState.value
            return if (auth is AuthState.Authenticated) auth.phoneLastFour ?: "" else ""
        }
    }
