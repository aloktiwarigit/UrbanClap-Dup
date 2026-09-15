package com.homeservices.technician.data.kyc

import com.homeservices.technician.domain.kyc.model.DigiLockerResult
import com.homeservices.technician.domain.kyc.model.KycState
import com.homeservices.technician.domain.kyc.model.KycStatus
import com.homeservices.technician.domain.kyc.model.PanOcrResult
import com.squareup.moshi.JsonClass
import com.squareup.moshi.Moshi
import io.sentry.Sentry
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import javax.inject.Inject

private const val HTTP_CONFLICT = 409
private const val AADHAAR_REQUIRED_FIRST = "AADHAAR_REQUIRED_FIRST"

@JsonClass(generateAdapter = true)
internal data class ApiErrorDto(
    val code: String?,
)

internal interface KycApiService {
    @POST("v1/kyc/aadhaar")
    suspend fun submitAadhaar(
        @Body body: AadhaarRequest,
        @Header("X-Integrity-Token") integrityToken: String? = null,
    ): AadhaarResponse

    @POST("v1/kyc/pan-ocr")
    suspend fun submitPanOcr(
        @Body body: PanOcrRequest,
    ): Response<PanOcrResponse>

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
    // Default false (not omitted) so a currently-deployed API that doesn't yet return this
    // field fails closed: the technician sees an incomplete KYC state, never a false "complete".
    val panVerified: Boolean = false,
)

public class KycRepositoryImpl
    @Inject
    internal constructor(
        private val api: KycApiService,
        private val moshi: Moshi,
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
                val response = api.submitPanOcr(PanOcrRequest(firebaseStoragePath))
                if (!response.isSuccessful) {
                    mapPanOcrError(response)
                } else {
                    mapPanOcrBody(response.body())
                }
            } catch (e: Exception) {
                PanOcrResult.UploadError(e)
            }

        private fun mapPanOcrError(response: Response<PanOcrResponse>): PanOcrResult {
            val code =
                if (response.code() == HTTP_CONFLICT) {
                    runCatching {
                        moshi
                            .adapter(ApiErrorDto::class.java)
                            .fromJson(response.errorBody()?.string() ?: "")
                            ?.code
                    }.getOrNull()
                } else {
                    null
                }
            return if (code == AADHAAR_REQUIRED_FIRST) {
                PanOcrResult.AadhaarRequired
            } else {
                // Restore pre-existing behaviour: before submitPanOcr's return type became
                // Response<PanOcrResponse> (to allow reading the 409 AADHAAR_REQUIRED_FIRST body),
                // Retrofit threw HttpException for ANY non-2xx and the outer catch mapped that to
                // UploadError, which is the only PanOcrResult that gets a durable
                // PHOTO_UPLOAD_RETRY row in KycViewModel. A transport/server failure (500, 503,
                // 429, ...) here must keep producing UploadError, not OcrError, or a technician
                // whose photo already reached Firebase Storage is stranded with no retry path.
                PanOcrResult.UploadError(retrofit2.HttpException(response))
            }
        }

        private fun mapPanOcrBody(r: PanOcrResponse?): PanOcrResult {
            if (r == null) return PanOcrResult.OcrError("PAN submission succeeded with empty body")
            val pan = r.panNumber
            return when {
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
                panVerified = r.panVerified,
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
