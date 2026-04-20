package com.homeservices.technician.data.kyc

import com.homeservices.technician.domain.kyc.model.DigiLockerResult
import com.homeservices.technician.domain.kyc.model.KycState
import com.homeservices.technician.domain.kyc.model.KycStatus
import com.homeservices.technician.domain.kyc.model.PanOcrResult
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import javax.inject.Inject

internal interface KycApiService {
    @POST("v1/kyc/aadhaar")
    suspend fun submitAadhaar(
        @Body body: AadhaarRequest,
    ): AadhaarResponse

    @POST("v1/kyc/pan-ocr")
    suspend fun submitPanOcr(
        @Body body: PanOcrRequest,
    ): PanOcrResponse

    @GET("v1/kyc/status")
    suspend fun getKycStatus(): KycStatusResponse
}

internal data class AadhaarRequest(
    val authCode: String,
    val redirectUri: String,
)

internal data class AadhaarResponse(
    val kycStatus: String,
    val aadhaarMaskedNumber: String?,
    val aadhaarVerified: Boolean,
)

internal data class PanOcrRequest(
    val firebaseStoragePath: String,
)

internal data class PanOcrResponse(
    val kycStatus: String,
    val panNumber: String?,
)

internal data class KycStatusResponse(
    val technicianId: String,
    val kycStatus: String,
    val aadhaarVerified: Boolean,
    val aadhaarMaskedNumber: String?,
    val panNumber: String?,
)

public class KycRepositoryImpl
    @Inject
    internal constructor(
        private val api: KycApiService,
    ) : KycRepository {
        override suspend fun exchangeAadhaarCode(
            authCode: String,
            redirectUri: String,
        ): DigiLockerResult =
            try {
                val r = api.submitAadhaar(AadhaarRequest(authCode, redirectUri))
                if (r.aadhaarVerified && r.aadhaarMaskedNumber != null) {
                    DigiLockerResult.AadhaarVerified(r.aadhaarMaskedNumber)
                } else {
                    DigiLockerResult.ApiError("Verification returned unverified state")
                }
            } catch (e: Exception) {
                DigiLockerResult.NetworkError(e)
            }

        override suspend fun submitPanOcr(firebaseStoragePath: String): PanOcrResult =
            try {
                val r = api.submitPanOcr(PanOcrRequest(firebaseStoragePath))
                when (r.kycStatus) {
                    "MANUAL_REVIEW" -> PanOcrResult.ManualReview
                    else ->
                        if (r.panNumber != null) {
                            PanOcrResult.Success(r.panNumber)
                        } else {
                            PanOcrResult.OcrError("PAN number not extracted")
                        }
                }
            } catch (e: Exception) {
                PanOcrResult.UploadError(e)
            }

        override suspend fun getKycStatus(): KycState {
            val r = api.getKycStatus()
            return KycState(
                status = KycStatus.valueOf(r.kycStatus),
                aadhaarVerified = r.aadhaarVerified,
                aadhaarMaskedNumber = r.aadhaarMaskedNumber,
                panNumber = r.panNumber,
            )
        }
    }
