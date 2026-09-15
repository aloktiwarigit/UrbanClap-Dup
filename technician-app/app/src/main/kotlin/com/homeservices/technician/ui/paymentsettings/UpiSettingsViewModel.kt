package com.homeservices.technician.ui.paymentsettings

import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.technician.domain.auth.BiometricGateUseCase
import com.homeservices.technician.domain.auth.model.BiometricResult
import com.homeservices.technician.domain.paymentprofile.UpdatePaymentProfileUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * Mirrors the server's `isValidVpaFormat` (api/src/lib/pii/vpa-format.ts) so the technician gets
 * instant feedback rather than a round trip for an obviously malformed VPA.
 */
private fun isValidVpaFormat(vpa: String): Boolean {
    if (vpa.any { it.isWhitespace() }) return false
    val parts = vpa.split("@")
    return parts.size == 2 && parts[0].isNotEmpty() && parts[1].isNotEmpty()
}

@HiltViewModel
public class UpiSettingsViewModel
    @Inject
    constructor(
        private val updatePaymentProfileUseCase: UpdatePaymentProfileUseCase,
        private val biometricGate: BiometricGateUseCase,
    ) : ViewModel() {
        private val _uiState =
            MutableStateFlow<UpiSettingsUiState>(UpiSettingsUiState.Ready(vpaInput = ""))
        public val uiState: StateFlow<UpiSettingsUiState> = _uiState.asStateFlow()

        public fun updateVpaInput(value: String) {
            val current = _uiState.value as? UpiSettingsUiState.Ready ?: UpiSettingsUiState.Ready(vpaInput = "")
            _uiState.value = current.copy(vpaInput = value)
        }

        public fun save(activity: FragmentActivity) {
            val current = _uiState.value as? UpiSettingsUiState.Ready ?: return
            if (!isValidVpaFormat(current.vpaInput)) {
                _uiState.value = UpiSettingsUiState.Error("Enter a valid UPI ID, e.g. name@bank")
                return
            }

            viewModelScope.launch {
                // Biometric gate — best-effort: if hardware unavailable, proceed anyway.
                // This touches money-routing configuration, same gate as payout cadence.
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

                val outcome = updatePaymentProfileUseCase.invoke(current.vpaInput)
                _uiState.value =
                    outcome.fold(
                        onSuccess = { UpiSettingsUiState.SaveSuccess(it.upiVpa) },
                        onFailure = { UpiSettingsUiState.Error(it.message ?: "Unknown error") },
                    )
            }
        }
    }
