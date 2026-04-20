package com.homeservices.technician.domain.kyc

import com.homeservices.technician.data.kyc.KycRepository
import com.homeservices.technician.domain.kyc.model.DigiLockerResult
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject

public class DigiLockerConsentUseCase @Inject constructor(
    private val repository: KycRepository,
) {
    public operator fun invoke(
        authCode: String,
        redirectUri: String,
    ): Flow<DigiLockerResult> = flow {
        emit(repository.exchangeAadhaarCode(authCode, redirectUri))
    }
}
