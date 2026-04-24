package com.homeservices.technician.ui.kyc

import com.homeservices.technician.domain.kyc.model.KycStatus

public sealed class KycUiState {
    public data object Idle : KycUiState()

    public data object Loading : KycUiState()

    public data class AadhaarPending(
        val consentUrl: String,
    ) : KycUiState()

    public data object AadhaarDone : KycUiState()

    public data class PanReady(
        val uploadUri: String,
    ) : KycUiState()

    public data object PanUploading : KycUiState()

    public data class Complete(
        val status: KycStatus,
    ) : KycUiState()

    public data class Error(
        val message: String,
    ) : KycUiState()
}
