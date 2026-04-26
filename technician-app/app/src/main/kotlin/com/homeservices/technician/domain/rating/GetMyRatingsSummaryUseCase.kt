package com.homeservices.technician.domain.rating

import com.homeservices.technician.data.rating.RatingRepository
import com.homeservices.technician.domain.rating.model.TechRatingSummary
import javax.inject.Inject

public class GetMyRatingsSummaryUseCase
    @Inject
    constructor(
        private val repository: RatingRepository,
    ) {
        public suspend fun invoke(): Result<TechRatingSummary> = repository.getMyRatings()
    }
