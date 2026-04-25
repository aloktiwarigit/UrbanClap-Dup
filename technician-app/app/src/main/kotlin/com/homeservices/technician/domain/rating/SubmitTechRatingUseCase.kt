package com.homeservices.technician.domain.rating

import com.homeservices.technician.data.rating.RatingRepository
import com.homeservices.technician.domain.rating.model.TechSubScores
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

public class SubmitTechRatingUseCase
    @Inject
    constructor(
        private val repo: RatingRepository,
    ) {
        public operator fun invoke(
            bookingId: String,
            overall: Int,
            subScores: TechSubScores,
            comment: String?,
        ): Flow<Result<Unit>> = repo.submitTechRating(bookingId, overall, subScores, comment)
    }
