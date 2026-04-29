package com.homeservices.technician.ui.payoutsettings

import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.technician.domain.auth.BiometricGateUseCase
import com.homeservices.technician.domain.auth.model.BiometricResult
import com.homeservices.technician.domain.payout.UpdatePayoutCadenceUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
public class PayoutCadenceViewModel
    @Inject
    constructor(
        private val updatePayoutCadenceUseCase: UpdatePayoutCadenceUseCase,
        private val biometricGate: BiometricGateUseCase,
    ) : ViewModel() {
        private val _uiState =
            MutableStateFlow<PayoutCadenceUiState>(
                PayoutCadenceUiState.Ready(selectedCadence = "WEEKLY", savedCadence = "WEEKLY"),
            )
        public val uiState: StateFlow<PayoutCadenceUiState> = _uiState.asStateFlow()

        public fun selectCadence(cadence: String) {
            val current = _uiState.value as? PayoutCadenceUiState.Ready ?: return
            _uiState.value = current.copy(selectedCadence = cadence)
        }

        public fun saveCadence(activity: FragmentActivity) {
            val current = _uiState.value as? PayoutCadenceUiState.Ready ?: return
            if (!current.isDirty) return

            viewModelScope.launch {
                // Biometric gate — best-effort: if hardware unavailable, proceed anyway
                if (biometricGate.canUseBiometric(activity)) {
                    val result =
                        biometricGate.requestAuth(
                            activity = activity,
                            title = "पेमेंट सेटिंग बदलें",
                            subtitle = "पहचान सत्यापित करें",
                        )
                    if (result !is BiometricResult.Authenticated) return@launch
                }

                _uiState.value = current.copy(isSaving = true)

                val outcome = updatePayoutCadenceUseCase.invoke(current.selectedCadence)
                _uiState.value =
                    outcome.fold(
                        onSuccess = { PayoutCadenceUiState.SaveSuccess(it.nextPayoutAt) },
                        onFailure = { PayoutCadenceUiState.Error(it.message ?: "Unknown error") },
                    )
            }
        }
    }
