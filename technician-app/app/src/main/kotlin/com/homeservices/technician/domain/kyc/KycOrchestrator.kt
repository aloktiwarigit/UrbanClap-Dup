package com.homeservices.technician.domain.kyc

import android.net.Uri
import com.homeservices.technician.data.kyc.KycRepository
import com.homeservices.technician.domain.kyc.model.DigiLockerResult
import com.homeservices.technician.domain.kyc.model.KycState
import com.homeservices.technician.domain.kyc.model.PanOcrResult
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

public class KycOrchestrator
    @Inject
    constructor(
        private val digiLockerConsentUseCase: DigiLockerConsentUseCase,
        private val panOcrUseCase: PanOcrUseCase,
        private val repository: KycRepository,
    ) {
        public fun startAadhaarConsent(
            authCode: String,
            redirectUri: String,
        ): Flow<DigiLockerResult> = digiLockerConsentUseCase(authCode, redirectUri)

        public fun submitPan(
            imageUri: Uri,
            technicianId: String,
        ): Flow<PanOcrResult> = panOcrUseCase(imageUri, technicianId)

        public suspend fun fetchCurrentStatus(): KycState = repository.getKycStatus()
    }
