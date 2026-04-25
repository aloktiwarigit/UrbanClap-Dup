package com.homeservices.customer.data.rating

import com.homeservices.customer.domain.rating.model.CustomerSubScores
import com.homeservices.customer.domain.rating.model.RatingSnapshot
import kotlinx.coroutines.flow.Flow

public interface RatingRepository {
    public fun submitCustomerRating(
        bookingId: String,
        overall: Int,
        subScores: CustomerSubScores,
        comment: String?,
    ): Flow<Result<Unit>>

    public fun get(bookingId: String): Flow<Result<RatingSnapshot>>
}
