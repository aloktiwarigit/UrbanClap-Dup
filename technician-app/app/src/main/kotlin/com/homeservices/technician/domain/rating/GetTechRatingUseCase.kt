package com.homeservices.technician.domain.rating

import com.homeservices.technician.data.rating.RatingRepository
import com.homeservices.technician.domain.rating.model.RatingSnapshot
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

public class GetTechRatingUseCase
    @Inject
    constructor(
        private val repo: RatingRepository,
    ) {
        public operator fun invoke(bookingId: String): Flow<Result<RatingSnapshot>> = repo.get(bookingId)
    }
