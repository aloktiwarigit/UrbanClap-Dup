package com.homeservices.customer.data.rating

import com.homeservices.customer.data.rating.remote.RatingApiService
import com.homeservices.customer.data.rating.remote.dto.ApiErrorDto
import com.homeservices.customer.data.rating.remote.dto.SubmitRatingRequestDto
import com.homeservices.customer.domain.rating.RatingSubmitException
import com.homeservices.customer.domain.rating.RatingSubmitFailure
import com.homeservices.customer.domain.rating.model.CustomerSubScores
import com.homeservices.customer.domain.rating.model.RatingSnapshot
import com.squareup.moshi.Moshi
import io.sentry.Sentry
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import retrofit2.HttpException
import java.io.IOException
import javax.inject.Inject

private const val HTTP_FORBIDDEN = 403
private const val HTTP_NOT_FOUND = 404

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
         * Translates a transport or API failure into a [RatingSubmitException] the UI can phrase.
         *
         * Only [RatingSubmitFailure.Unknown] reaches Sentry: the other cases are rules the API is
         * meant to enforce (no technician, already rated, job not finished) or an offline phone,
         * none of which are defects worth an alert.
         */
        private fun Throwable.toSubmitException(): RatingSubmitException {
            val failure =
                when (this) {
                    is IOException -> RatingSubmitFailure.Network
                    is HttpException -> toSubmitFailure()
                    else -> RatingSubmitFailure.Unknown
                }
            if (failure == RatingSubmitFailure.Unknown) Sentry.captureException(this)
            return RatingSubmitException(failure, this)
        }

        private fun HttpException.toSubmitFailure(): RatingSubmitFailure =
            when (code()) {
                HTTP_FORBIDDEN, HTTP_NOT_FOUND -> RatingSubmitFailure.NotAvailable
                else ->
                    when (errorCode()) {
                        "NO_TECHNICIAN" -> RatingSubmitFailure.NoTechnician
                        "RATING_ALREADY_SUBMITTED" -> RatingSubmitFailure.AlreadySubmitted
                        "BOOKING_NOT_CLOSED" -> RatingSubmitFailure.BookingNotClosed
                        "BOOKING_NOT_FOUND", "FORBIDDEN" -> RatingSubmitFailure.NotAvailable
                        else -> RatingSubmitFailure.Unknown
                    }
            }

        /**
         * Reads the stable `code` the API puts in every error body. A body that is missing,
         * truncated or not JSON at all (a gateway HTML page, say) yields null rather than throwing.
         */
        private fun HttpException.errorCode(): String? =
            runCatching { response()?.errorBody()?.string() }
                .getOrNull()
                ?.takeIf { it.isNotBlank() }
                ?.let { body -> runCatching { errorAdapter.fromJson(body)?.code }.getOrNull() }
                ?.takeIf { it.isNotBlank() }

        private companion object {
            /** Errors are rare, so one shared adapter costs nothing and keeps the constructor unchanged. */
            private val errorAdapter = Moshi.Builder().build().adapter(ApiErrorDto::class.java)
        }
    }
