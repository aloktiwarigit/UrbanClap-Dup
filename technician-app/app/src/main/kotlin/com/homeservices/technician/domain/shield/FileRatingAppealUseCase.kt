package com.homeservices.technician.domain.shield

import com.homeservices.technician.domain.shield.model.RatingAppealResult
import javax.inject.Inject

public class FileRatingAppealUseCase
    @Inject
    constructor(
        private val repository: ShieldRepository,
    ) {
        public suspend fun invoke(
            bookingId: String,
            reason: String,
        ): Result<RatingAppealResult> = repository.fileRatingAppeal(bookingId, reason)
    }
