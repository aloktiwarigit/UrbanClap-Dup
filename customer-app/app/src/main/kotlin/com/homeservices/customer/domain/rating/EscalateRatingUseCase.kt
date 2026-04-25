package com.homeservices.customer.domain.rating

import com.homeservices.customer.data.rating.remote.RatingApiService
import com.homeservices.customer.data.rating.remote.dto.EscalateRatingRequestDto
import java.time.Instant
import javax.inject.Inject

public data class EscalateRatingResult(
    val complaintId: String,
    val expiresAtMs: Long,
)

public class EscalateRatingUseCase
    @Inject
    constructor(
        private val apiService: RatingApiService,
    ) {
        public suspend fun invoke(
            bookingId: String,
            draftOverall: Int,
            draftComment: String? = null,
        ): Result<EscalateRatingResult> =
            runCatching {
                val dto = apiService.escalate(bookingId, EscalateRatingRequestDto(draftOverall, draftComment))
                EscalateRatingResult(
                    complaintId = dto.complaintId,
                    expiresAtMs = Instant.parse(dto.expiresAt).toEpochMilli(),
                )
            }
    }
