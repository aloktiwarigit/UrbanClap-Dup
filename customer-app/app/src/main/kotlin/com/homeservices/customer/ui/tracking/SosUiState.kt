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

    /** Evidence upload in progress (shown after SosConfirmed). */
    public data class UploadingEvidence(
        public val pct: Int,
    ) : SosUiState

    /** Evidence was encrypted and uploaded successfully. */
    public data object EvidenceSaved : SosUiState

    /** Evidence upload failed (SOS alert was still sent; help is on the way). */
    public data class EvidenceUploadError(
        public val message: String,
    ) : SosUiState
}
