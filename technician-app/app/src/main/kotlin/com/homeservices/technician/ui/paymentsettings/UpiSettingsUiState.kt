package com.homeservices.technician.ui.paymentsettings

public sealed class UpiSettingsUiState {
    public data class Ready(
        val vpaInput: String,
        val isSaving: Boolean = false,
    ) : UpiSettingsUiState()

    public data class SaveSuccess(
        val upiVpa: String,
    ) : UpiSettingsUiState()

    public data class Error(
        val message: String,
    ) : UpiSettingsUiState()
}
