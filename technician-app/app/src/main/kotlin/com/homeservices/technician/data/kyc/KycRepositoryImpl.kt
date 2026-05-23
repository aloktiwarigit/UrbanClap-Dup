package com.homeservices.technician.data.kyc

import com.homeservices.technician.domain.kyc.model.DigiLockerResult
import com.homeservices.technician.domain.kyc.model.KycState
import com.homeservices.technician.domain.kyc.model.KycStatus
import com.homeservices.technician.domain.kyc.model.PanOcrResult
import com.squareup.moshi.JsonClass
import io.sentry.Sentry
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import javax.inject.Inject

internal interface KycApiService {
    @POST("v1/kyc/aadhaar")
    suspend fun submitAadhaar(
        @Body body: AadhaarRequest,
        @Header("X-Integrity-Token") integrityToken: String? = null,
    ): AadhaarResponse

    @POST("v1/kyc/pan-ocr")
    suspend fun submitPanOcr(
        @Body body: PanOcrRequest,
    ): PanOcrResponse

    @GET("v1/kyc/status")
    suspend fun getKycStatus(): KycStatusResponse
}

@JsonClass(generateAdapter = true)
internal data class AadhaarRequest(
    val authCode: String,
    val redirectUri: String,
)

@JsonClass(generateAdapter = true)
internal data class AadhaarResponse(
    val kycStatus: String,
    val aadhaarMaskedNumber: String?,
    val aadhaarVerified: Boolean,
)

@JsonClass(generateAdapter = true)
internal data class PanOcrRequest(
    val firebaseStoragePath: String,
)

@JsonClass(generateAdapter = true)
internal data class PanOcrResponse(
    val kycStatus: String,
    val panNumber: String?,
)

@JsonClass(generateAdapter = true)
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
            integrityToken: String?,
        ): DigiLockerResult =
            try {
                val r = api.submitAadhaar(AadhaarRequest(authCode, redirectUri), integrityToken)
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
                val pan = r.panNumber
                when {
                    r.kycStatus == "MANUAL_REVIEW" -> PanOcrResult.ManualReview
                    pan == null -> PanOcrResult.OcrError("PAN number not extracted")
                    RAW_PAN_PATTERN.matches(pan) -> {
                        Sentry.addBreadcrumb(
                            io.sentry.Breadcrumb().apply {
                                category = "kyc.security"
                                message = "received unmasked PAN from server"
                            },
                        )
                        PanOcrResult.ManualReview
                    }
                    else -> PanOcrResult.Success(pan)
                }
            } catch (e: Exception) {
                PanOcrResult.UploadError(e)
            }

        override suspend fun getKycStatus(): KycState {
            val r = api.getKycStatus()
            val rawPanReceived = r.panNumber != null && RAW_PAN_PATTERN.matches(r.panNumber)
            if (rawPanReceived) {
                Sentry.addBreadcrumb(
                    io.sentry.Breadcrumb().apply {
                        category = "kyc.security"
                        message = "received unmasked PAN from server"
                    },
                )
            }
            return KycState(
                status = if (rawPanReceived) KycStatus.MANUAL_REVIEW else KycStatus.valueOf(r.kycStatus),
                aadhaarVerified = r.aadhaarVerified,
                aadhaarMaskedNumber = r.aadhaarMaskedNumber,
                panNumber = if (rawPanReceived) null else r.panNumber,
            )
        }

        private companion object {
            // Matches a raw canonical PAN (e.g. ABCDE1234F) but NOT our masked form (XXXXX1234F).
            // Belt-and-suspenders guard: if the server regresses and returns a plaintext PAN,
            // the client catches it before storing in KycState.
            val RAW_PAN_PATTERN: Regex = Regex("""^(?!XXXXX)[A-Z]{5}\d{4}[A-Z]$""")
        }
    }
