package com.homeservices.technician.domain.kyc.model

public sealed class DigiLockerResult {
    public data class AadhaarVerified(
        public val maskedNumber: String,
    ) : DigiLockerResult()

    public data object UserCancelled : DigiLockerResult()

    public data class NetworkError(
        public val cause: Throwable,
    ) : DigiLockerResult()

    public data class ApiError(
        public val message: String,
    ) : DigiLockerResult()
}
