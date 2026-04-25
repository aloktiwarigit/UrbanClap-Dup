package com.homeservices.customer.domain.rating

import com.homeservices.customer.data.rating.RatingRepository
import com.homeservices.customer.domain.rating.model.RatingSnapshot
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

public class GetRatingUseCase
    @Inject
    constructor(
        private val repo: RatingRepository,
    ) {
        public operator fun invoke(bookingId: String): Flow<Result<RatingSnapshot>> = repo.get(bookingId)
    }
