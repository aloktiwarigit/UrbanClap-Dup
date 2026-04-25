package com.homeservices.customer.domain.rating

import com.homeservices.customer.data.rating.RatingRepository
import com.homeservices.customer.domain.rating.model.CustomerSubScores
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

public class SubmitRatingUseCase
    @Inject
    constructor(
        private val repo: RatingRepository,
    ) {
        public operator fun invoke(
            bookingId: String,
            overall: Int,
            subScores: CustomerSubScores,
            comment: String?,
        ): Flow<Result<Unit>> = repo.submitCustomerRating(bookingId, overall, subScores, comment)
    }
