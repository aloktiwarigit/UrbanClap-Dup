package com.homeservices.customer.ui.deleteaccount

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.customer.data.auth.SessionManager
import com.homeservices.customer.domain.auth.model.AuthState
import com.homeservices.customer.domain.deleteaccount.ErasureAlreadyPendingException
import com.homeservices.customer.domain.deleteaccount.RequestErasureUseCase
import com.homeservices.customer.domain.deleteaccount.RevokeErasureUseCase
import com.homeservices.customer.ui.deleteaccount.DeleteAccountUiState.Confirming
import com.homeservices.customer.ui.deleteaccount.DeleteAccountUiState.CoolOff
import com.homeservices.customer.ui.deleteaccount.DeleteAccountUiState.Error
import com.homeservices.customer.ui.deleteaccount.DeleteAccountUiState.ExistingRequestDetected
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

/**
 * Key for the requestId nav argument passed to the cool-off destination.
 * Matches the argument declared in [com.homeservices.customer.navigation.SettingsGraph].
 */
public const val NAV_ARG_REQUEST_ID: String = "requestId"

/**
 * Key for the scheduledDeletionAt nav argument passed to the cool-off destination.
 * Stored as epoch-millis long.
 *
 * Sentinel values:
 *  -1L = ExistingRequestDetected (409-conflict path; no scheduled date available from server)
 *   0L = CoolOff with empty scheduledDeletionAt (legacy / unknown; treated same as no date)
 *  >0L = CoolOff with a valid epoch-millis timestamp
 *
 * Matches the argument declared in [com.homeservices.customer.navigation.SettingsGraph].
 */
public const val NAV_ARG_SCHEDULED_DELETION_EPOCH_MS: String = "scheduledDeletionEpochMs"

/**
 * Sentinel value for [NAV_ARG_SCHEDULED_DELETION_EPOCH_MS] that signals the
 * "no scheduled date" case from a 409 conflict response.
 * The ViewModel init reads this and emits [DeleteAccountUiState.ExistingRequestDetected]
 * rather than [DeleteAccountUiState.CoolOff].
 */
public const val EPOCH_MS_EXISTING_REQUEST_SENTINEL: Long = -1L

@HiltViewModel
public class DeleteAccountViewModel
    @Inject
    constructor(
        private val requestErasure: RequestErasureUseCase,
        private val revokeErasure: RevokeErasureUseCase,
        private val sessionManager: SessionManager,
        savedStateHandle: SavedStateHandle,
    ) : ViewModel() {
        private val _uiState: MutableStateFlow<DeleteAccountUiState>

        init {
            // FIX 2 (P1 — cool-off state preservation):
            // When navigated directly to the cool-off destination, the nav graph passes
            // requestId and scheduledDeletionEpochMs as arguments. We restore CoolOff state
            // from these arguments so the ViewModel is immediately in the right state even
            // though the parent DELETE_ACCOUNT back-stack entry was popped (popInclusive = true).
            val navRequestId = savedStateHandle.get<String>(NAV_ARG_REQUEST_ID)
            val navEpochMs = savedStateHandle.get<Long>(NAV_ARG_SCHEDULED_DELETION_EPOCH_MS)

            _uiState =
                if (!navRequestId.isNullOrBlank()) {
                    // Navigated to cool-off screen; restore state from nav args.
                    //
                    // FIX 2 (P2 — cool-off blank state on existing-request 409):
                    // epochMs == -1L is the sentinel for "no date available" (409-detected path).
                    // In this case we emit ExistingRequestDetected so the CoolOffScreen renders
                    // the "pending — exact date unavailable" message instead of a blank countdown.
                    when {
                        navEpochMs == EPOCH_MS_EXISTING_REQUEST_SENTINEL ->
                            MutableStateFlow(ExistingRequestDetected(requestId = navRequestId))
                        navEpochMs != null && navEpochMs > 0L -> {
                            val scheduledAt =
                                java.time.Instant
                                    .ofEpochMilli(navEpochMs)
                                    .toString()
                            MutableStateFlow(CoolOff(requestId = navRequestId, scheduledDeletionAt = scheduledAt))
                        }
                        else ->
                            // epochMs == 0 or null: legacy / unknown date, show CoolOff with empty scheduledAt.
                            MutableStateFlow(CoolOff(requestId = navRequestId, scheduledDeletionAt = ""))
                    }
                } else {
                    // Normal entry screen — always start Idle.
                    // DPDP-CRITICAL FIX (P1): The old POST-probe checkForActiveRequest() call
                    // was removed. It caused a 201 response (new erasure request created) whenever
                    // the user opened the delete-account entry screen, before any confirmation.
                    // Screen now always starts Idle; 409 handling below covers the pre-existing
                    // request case when the user actually submits.
                    // TODO(follow-up): add GET /v1/users/me/erasure-request/active on the server
                    // and restore a proper active-check on screen entry without side-effects.
                    MutableStateFlow(Idle)
                }
        }

        public val uiState: StateFlow<DeleteAccountUiState> = _uiState.asStateFlow()

        /**
         * The confirmation phrase the user must type (locale-appropriate).
         * Set externally from the Composable after resolving the string resource.
         */
        public var expectedPhrase: String = ""

        /** Called when the user taps "Continue" on the entry screen. */
        public fun onContinueClicked() {
            val last4 = resolvedLast4()
            _uiState.value =
                Confirming(
                    phraseExpected = expectedPhrase,
                    last4Expected = last4,
                )
        }

        /**
         * Called when the user taps "Back" from the confirmation screen.
         *
         * FIX 3 (P2 — confirmation back-trap): resets state to Idle so the
         * LaunchedEffect in [DeleteAccountScreen] doesn't re-fire the navigation
         * to confirmation when the entry screen becomes visible again.
         */
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
         *
         * On 409 conflict (ErasureAlreadyPendingException), transitions to
         * [ExistingRequestDetected] rather than [CoolOff] because the 409 body does not
         * include scheduledDeletionAt. The cool-off countdown is unavailable.
         * See UX limitation note in [ExistingRequestDetected].
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
                            // 409: a pending request already exists.
                            // The 409 body does not include scheduledDeletionAt.
                            // Surface ExistingRequestDetected so the UI can show a
                            // "pending deletion" message without a countdown.
                            // The revoke CTA still works (server finds the request by uid).
                            _uiState.value = ExistingRequestDetected(requestId = err.erasureId)
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
            val current = _uiState.value
            if (current !is CoolOff && current !is ExistingRequestDetected) return
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
