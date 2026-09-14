package com.homeservices.technician.domain.kyc.model

public sealed class PanOcrResult {
    public data class Success(
        public val panNumber: String,
    ) : PanOcrResult()

    public data object ManualReview : PanOcrResult()

    public data class UploadError(
        public val cause: Throwable,
    ) : PanOcrResult()

    public data class OcrError(
        public val message: String,
    ) : PanOcrResult()

    /**
     * The server refused the PAN submission because Aadhaar is not verified yet
     * (409 AADHAAR_REQUIRED_FIRST). The UI must send the technician back to step 1;
     * retrying the PAN upload cannot succeed.
     */
    public data object AadhaarRequired : PanOcrResult()
}
