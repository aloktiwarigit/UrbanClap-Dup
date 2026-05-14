package com.homeservices.customer.ui.deleteaccount

import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.customer.data.auth.SessionManager
import com.homeservices.customer.domain.auth.BiometricGateUseCase
import com.homeservices.customer.domain.auth.model.AuthState
import com.homeservices.customer.domain.auth.model.BiometricResult
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

public const val NAV_ARG_REQUEST_ID: String = "requestId"

public const val NAV_ARG_SCHEDULED_DELETION_EPOCH_MS: String = "scheduledDeletionEpochMs"

public const val EPOCH_MS_EXISTING_REQUEST_SENTINEL: Long = -1L

@HiltViewModel
public class DeleteAccountViewModel
    @Inject
    constructor(
        private val requestErasure: RequestErasureUseCase,
        private val revokeErasure: RevokeErasureUseCase,
        private val sessionManager: SessionManager,
        private val biometricGate: BiometricGateUseCase,
        savedStateHandle: SavedStateHandle,
    ) : ViewModel() {
        private val _uiState: MutableStateFlow<DeleteAccountUiState>

        init {
            val navRequestId = savedStateHandle.get<String>(NAV_ARG_REQUEST_ID)
            val navEpochMs = savedStateHandle.get<Long>(NAV_ARG_SCHEDULED_DELETION_EPOCH_MS)

            _uiState =
                if (!navRequestId.isNullOrBlank()) {
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
                            MutableStateFlow(CoolOff(requestId = navRequestId, scheduledDeletionAt = ""))
                    }
                } else {
                    MutableStateFlow(Idle)
                }
        }

        public val uiState: StateFlow<DeleteAccountUiState> = _uiState.asStateFlow()

        public var expectedPhrase: String = ""

        public fun onContinueClicked() {
            val last4 = resolvedLast4()
            _uiState.value =
                Confirming(
                    phraseExpected = expectedPhrase,
                    last4Expected = last4,
                )
        }

        public fun onBackFromConfirmation() {
            _uiState.value = Idle
        }

        public fun onPhraseChanged(value: String) {
            val current = _uiState.value as? Confirming ?: return
            _uiState.value = current.copy(typedPhrase = value)
        }

        public fun onPinChanged(value: String) {
            val current = _uiState.value as? Confirming ?: return
            _uiState.value = current.copy(typedPin = value)
        }

        /**
         * Security gate (fires EVERY invocation, no caching):
         * 1. Hardware present: require Authenticated. Cancelled/Lockout block silently.
         * 2. No hardware (canUseBiometric=false): fall through to PIN gate in isSubmitEnabled.
         * Fail-closed: null activity -> error, do NOT proceed.
         */
        public fun onSubmitClicked(activity: FragmentActivity?) {
            val current = _uiState.value as? Confirming ?: return
            if (!current.isSubmitEnabled) return

            if (activity == null) {
                _uiState.value =
                    Error(message = "Authentication context unavailable", previousState = current)
                return
            }

            viewModelScope.launch {
                if (biometricGate.canUseBiometric(activity)) {
                    val result = biometricGate.requestAuth(
                        activity,
                        "Delete Account",
                        "Authenticate to confirm account deletion",
                    )
                    if (result !is BiometricResult.Authenticated) return@launch
                }
                dispatchErasure(current)
            }
        }

        private suspend fun dispatchErasure(current: Confirming) {
            _uiState.value = Submitting
            requestErasure()
                .onSuccess { erasure ->
                    _uiState.value =
                        CoolOff(
                            requestId = erasure.requestId,
                            scheduledDeletionAt = erasure.scheduledDeletionAt,
                        )
                }.onFailure { err ->
                    if (err is ErasureAlreadyPendingException) {
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

        public fun onErrorDismissed() {
            val current = _uiState.value as? Error ?: return
            _uiState.value = current.previousState
        }

        private fun resolvedLast4(): String {
            val auth = sessionManager.authState.value
            return if (auth is AuthState.Authenticated) auth.phoneLastFour ?: "" else ""
        }
    }