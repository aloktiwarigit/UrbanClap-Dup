package com.homeservices.technician.data.kyc

import com.homeservices.technician.domain.kyc.model.DigiLockerResult
import com.homeservices.technician.domain.kyc.model.KycState
import com.homeservices.technician.domain.kyc.model.PanOcrResult

public interface KycRepository {
    public suspend fun exchangeAadhaarCode(
        authCode: String,
        redirectUri: String,
    ): DigiLockerResult

    public suspend fun submitPanOcr(
        firebaseStoragePath: String,
    ): PanOcrResult

    public suspend fun getKycStatus(): KycState
}
