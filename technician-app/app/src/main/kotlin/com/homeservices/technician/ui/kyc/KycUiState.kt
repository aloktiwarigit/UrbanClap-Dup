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
     * The submitted PAN could not be auto-verified and a human must review it. Deliberately
     * distinct from [PanDone] and [AadhaarDone]/[Idle]: those all imply "no PAN is on file yet
     * or one more step remains", which would tell a technician whose PAN IS on file (just
     * pending manual approval) to re-upload it. `panVerified` stays false while this is
     * outstanding, so this state cannot be derived from the two-fact resolver.
     */
    public data object ManualReview : KycUiState()

    /**
     * Both KYC steps have succeeded. Reachable only when `aadhaarVerified && panVerified` —
     * never from a single step's success. Carries no status scalar: the two facts are the
     * completion contract, and a scalar here is what produced the false-complete bug.
     */
    public data object Complete : KycUiState()

    public data class Error(
        val message: String,
    ) : KycUiState()

    /**
     * The submission itself already succeeded (or an FCM verdict already confirmed it), but the
     * confirming status re-read failed — e.g. a transient network blip right after a PAN upload.
     * By the time this is reached, `submitPan()` has already cleared the pending-submission rows,
     * so there is no queued retry to fall back on: the only correct recovery is retrying the
     * status read (see `KycViewModel.retryStatusConfirmation`), never restarting KYC from
     * Aadhaar — DigiLocker has nothing new to consent to and PAN OCR has nothing new to upload.
     * Deliberately distinct from [Error]: the genuine pre-submission error cases (Aadhaar
     * cancelled, DigiLocker network error, PAN upload failure) keep their own restart/retry
     * affordance via [Error]. Carries no verified facts, so it can never resolve to [Complete] —
     * only a successful re-read, via [terminalStateFor]-style resolution, may do that.
     */
    public data object ConfirmationFailed : KycUiState()
}
