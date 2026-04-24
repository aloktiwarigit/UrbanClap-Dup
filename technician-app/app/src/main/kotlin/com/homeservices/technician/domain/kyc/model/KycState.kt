package com.homeservices.technician.domain.kyc.model

public data class KycState(
    public val status: KycStatus,
    public val aadhaarVerified: Boolean,
    public val aadhaarMaskedNumber: String?,
    public val panNumber: String?,
)
