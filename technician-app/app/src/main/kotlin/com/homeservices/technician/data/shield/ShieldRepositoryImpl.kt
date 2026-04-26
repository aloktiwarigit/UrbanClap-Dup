package com.homeservices.technician.data.shield

import com.homeservices.technician.data.shield.remote.ShieldApiService
import com.homeservices.technician.data.shield.remote.dto.AppealQuotaErrorDto
import com.homeservices.technician.data.shield.remote.dto.RatingAppealRequestDto
import com.homeservices.technician.data.shield.remote.dto.ShieldReportRequestDto
import com.homeservices.technician.domain.shield.ShieldRepository
import com.homeservices.technician.domain.shield.model.RatingAppealResult
import com.homeservices.technician.domain.shield.model.ShieldReportResult
import com.squareup.moshi.Moshi
import javax.inject.Inject

public class ShieldRepositoryImpl
    @Inject
    constructor(
        private val api: ShieldApiService,
        private val moshi: Moshi,
    ) : ShieldRepository {
        public override suspend fun fileShieldReport(
            bookingId: String,
            description: String?,
        ): Result<ShieldReportResult> =
            runCatching {
                val resp = api.fileShieldReport(ShieldReportRequestDto(bookingId, description))
                if (!resp.isSuccessful) error("shield report failed: ${resp.code()}")
                ShieldReportResult(resp.body()!!.complaintId)
            }

        public override suspend fun fileRatingAppeal(
            bookingId: String,
            reason: String,
        ): Result<RatingAppealResult> =
            try {
                val resp = api.fileRatingAppeal(RatingAppealRequestDto(bookingId, reason))
                when {
                    resp.code() == 409 -> {
                        val errorBody = resp.errorBody()?.string() ?: ""
                        val err =
                            try {
                                moshi.adapter(AppealQuotaErrorDto::class.java).fromJson(errorBody)
                            } catch (_: Exception) {
                                null
                            }
                        Result.success(
                            RatingAppealResult(quotaExceeded = true, nextAvailableAt = err?.nextAvailableAt),
                        )
                    }
                    !resp.isSuccessful ->
                        Result.failure(IllegalStateException("rating appeal failed: ${resp.code()}"))
                    else ->
                        Result.success(RatingAppealResult(appealId = resp.body()!!.appealId))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
    }
