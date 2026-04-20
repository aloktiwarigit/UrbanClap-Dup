package com.homeservices.technician.domain.kyc.model

public sealed class PanOcrResult {
    public data class Success(public val panNumber: String) : PanOcrResult()
    public data object ManualReview : PanOcrResult()
    public data class UploadError(public val cause: Throwable) : PanOcrResult()
    public data class OcrError(public val message: String) : PanOcrResult()
}
