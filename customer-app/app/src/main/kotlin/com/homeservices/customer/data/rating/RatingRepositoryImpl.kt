package com.homeservices.customer.data.rating

import com.homeservices.customer.data.rating.remote.RatingApiService
import com.homeservices.customer.data.rating.remote.dto.SubmitRatingRequestDto
import com.homeservices.customer.domain.rating.model.CustomerSubScores
import com.homeservices.customer.domain.rating.model.RatingSnapshot
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject

internal class RatingRepositoryImpl
    @Inject
    constructor(
        private val api: RatingApiService,
    ) : RatingRepository {
        override fun submitCustomerRating(
            bookingId: String,
            overall: Int,
            subScores: CustomerSubScores,
            comment: String?,
        ): Flow<Result<Unit>> =
            flow {
                emit(
                    runCatching {
                        api.submit(
                            SubmitRatingRequestDto(
                                side = "CUSTOMER_TO_TECH",
                                bookingId = bookingId,
                                overall = overall,
                                subScores =
                                    mapOf(
                                        "punctuality" to subScores.punctuality,
                                        "skill" to subScores.skill,
                                        "behaviour" to subScores.behaviour,
                                    ),
                                comment = comment,
                            ),
                        )
                    },
                )
            }

        override fun get(bookingId: String): Flow<Result<RatingSnapshot>> = flow { emit(runCatching { api.get(bookingId).toDomain() }) }
    }
