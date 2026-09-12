package com.homeservices.technician.ui.kyc

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

    /** Exactly one step remains: the PAN landed but Aadhaar has not been verified. */
    public data object PanDone : KycUiState()

    /** The PAN step was attempted before Aadhaar; the technician must complete Aadhaar first. */
    public data object AadhaarRequired : KycUiState()

    /**
     * Both KYC steps have succeeded. Reachable only when `aadhaarVerified && panVerified` —
     * never from a single step's success. Carries no status scalar: the two facts are the
     * completion contract, and a scalar here is what produced the false-complete bug.
     */
    public data object Complete : KycUiState()

    public data class Error(
        val message: String,
    ) : KycUiState()
}
