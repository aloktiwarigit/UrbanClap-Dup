package com.homeservices.technician.data.rating

import com.homeservices.technician.domain.rating.model.RatingSnapshot
import com.homeservices.technician.domain.rating.model.TechRatingSummary
import com.homeservices.technician.domain.rating.model.TechSubScores
import kotlinx.coroutines.flow.Flow

public interface RatingRepository {
    public fun submitTechRating(
        bookingId: String,
        overall: Int,
        subScores: TechSubScores,
        comment: String?,
    ): Flow<Result<Unit>>

    public fun get(bookingId: String): Flow<Result<RatingSnapshot>>

    public suspend fun getMyRatings(): Result<TechRatingSummary>
}
