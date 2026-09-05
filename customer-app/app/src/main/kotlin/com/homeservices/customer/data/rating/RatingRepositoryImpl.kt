package com.homeservices.customer.data.rating

import com.homeservices.customer.data.rating.remote.RatingApiService
import com.homeservices.customer.data.rating.remote.dto.SubmitRatingRequestDto
import com.homeservices.customer.domain.rating.RatingSubmitException
import com.homeservices.customer.domain.rating.RatingSubmitFailure
import com.homeservices.customer.domain.rating.model.CustomerSubScores
import com.homeservices.customer.domain.rating.model.RatingSnapshot
import io.sentry.Sentry
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
            idempotencyKey: String,
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
                            idempotencyKey = idempotencyKey,
                        )
                    }.recoverCatching { throw it.toSubmitException() },
                )
            }

        override fun get(bookingId: String): Flow<Result<RatingSnapshot>> =
            flow {
                emit(
                    runCatching { api.get(bookingId).toDomain() }
                        .onFailure { Sentry.captureException(it) },
                )
            }

        /**
         * Only [RatingSubmitFailure.Unknown] reaches Sentry: the other cases are rules the API is
         * meant to enforce (no technician, already rated, job not finished) or an offline phone,
         * none of which are defects worth an alert.
         */
        private fun Throwable.toSubmitException(): RatingSubmitException {
            val failure = toRatingSubmitFailure()
            if (failure == RatingSubmitFailure.Unknown) Sentry.captureException(this)
            return RatingSubmitException(failure, this)
        }
    }
