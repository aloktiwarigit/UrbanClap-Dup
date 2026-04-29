package com.homeservices.technician.ui.payoutsettings

public sealed class PayoutCadenceUiState {
    public data object Loading : PayoutCadenceUiState()

    public data class Ready(
        val selectedCadence: String,
        val savedCadence: String,
        val isSaving: Boolean = false,
    ) : PayoutCadenceUiState() {
        public val isDirty: Boolean get() = selectedCadence != savedCadence
    }

    public data class SaveSuccess(
        val nextPayoutAt: String?,
    ) : PayoutCadenceUiState()

    public data class Error(
        val message: String,
    ) : PayoutCadenceUiState()
}
