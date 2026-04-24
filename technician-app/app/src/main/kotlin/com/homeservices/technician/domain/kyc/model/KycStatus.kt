package com.homeservices.technician.domain.kyc.model

public enum class KycStatus {
    PENDING,
    AADHAAR_DONE,
    PAN_DONE,
    COMPLETE,
    PENDING_MANUAL,
    MANUAL_REVIEW,
}
