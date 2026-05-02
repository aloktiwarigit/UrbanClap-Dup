package com.homeservices.customer.ui.tracking

public sealed interface SosUiState {
    public data object Idle : SosUiState

    public data object ShowConsent : SosUiState

    /** UI must launch RECORD_AUDIO permission request and call [SosViewModel.onAudioPermissionResult]. */
    public data object RequestAudioPermission : SosUiState

    public data class Countdown(
        val secondsLeft: Int,
    ) : SosUiState

    public data object SosConfirmed : SosUiState

    public data class SosError(
        val message: String,
    ) : SosUiState
}
