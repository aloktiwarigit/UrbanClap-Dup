package com.homeservices.technician.data.rating

import com.homeservices.technician.data.rating.remote.RatingApiService
import com.homeservices.technician.data.rating.remote.dto.SubmitRatingRequestDto
import com.homeservices.technician.domain.rating.model.RatingSnapshot
import com.homeservices.technician.domain.rating.model.TechSubScores
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject

internal class RatingRepositoryImpl
    @Inject
    constructor(
        private val api: RatingApiService,
    ) : RatingRepository {
        override fun submitTechRating(
            bookingId: String,
            overall: Int,
            subScores: TechSubScores,
            comment: String?,
        ): Flow<Result<Unit>> =
            flow {
                emit(
                    runCatching {
                        api.submit(
                            SubmitRatingRequestDto(
                                side = "TECH_TO_CUSTOMER",
                                bookingId = bookingId,
                                overall = overall,
                                subScores =
                                    mapOf(
                                        "behaviour" to subScores.behaviour,
                                        "communication" to subScores.communication,
                                    ),
                                comment = comment,
                            ),
                        )
                    },
                )
            }

        override fun get(bookingId: String): Flow<Result<RatingSnapshot>> = flow { emit(runCatching { api.get(bookingId).toDomain() }) }
    }
