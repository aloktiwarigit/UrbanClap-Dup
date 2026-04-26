package com.homeservices.technician.domain.shield

import com.homeservices.technician.domain.shield.model.RatingAppealResult
import com.homeservices.technician.domain.shield.model.ShieldReportResult

public interface ShieldRepository {
    public suspend fun fileShieldReport(
        bookingId: String,
        description: String?,
    ): Result<ShieldReportResult>

    public suspend fun fileRatingAppeal(
        bookingId: String,
        reason: String,
    ): Result<RatingAppealResult>
}
