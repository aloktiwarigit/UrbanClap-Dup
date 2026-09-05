package com.homeservices.customer.data.rating

import com.homeservices.customer.data.rating.remote.dto.ApiErrorDto
import com.homeservices.customer.domain.rating.RatingSubmitFailure
import com.squareup.moshi.Moshi
import retrofit2.HttpException
import java.io.IOException

private const val HTTP_FORBIDDEN = 403
private const val HTTP_NOT_FOUND = 404

/** Errors are rare, so one shared adapter is cheaper than building one per failure. */
private val errorAdapter = Moshi.Builder().build().adapter(ApiErrorDto::class.java)

/**
 * Translates a transport or API failure into the reason the customer is shown.
 *
 * Both write paths on the rating screen — `POST /v1/ratings` and
 * `POST /v1/ratings/{bookingId}/escalate` — answer with the same vocabulary of `code` values
 * (see `api/src/functions/ratings.ts` and `api/src/functions/rating-escalate.ts`), so they share
 * this mapping. Codes only one of them can return, and codes added later, fall through to
 * [RatingSubmitFailure.Unknown] rather than surfacing a raw "HTTP 409 Conflict".
 */
internal fun Throwable.toRatingSubmitFailure(): RatingSubmitFailure =
    when (this) {
        is IOException -> RatingSubmitFailure.Network
        is HttpException -> toSubmitFailure()
        else -> RatingSubmitFailure.Unknown
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
 * Reads the stable `code` the API puts in every error body. A body that is missing, truncated or
 * not JSON at all (a gateway HTML page, say) yields null rather than throwing.
 */
private fun HttpException.errorCode(): String? =
    runCatching { response()?.errorBody()?.string() }
        .getOrNull()
        ?.takeIf { it.isNotBlank() }
        ?.let { body -> runCatching { errorAdapter.fromJson(body)?.code }.getOrNull() }
        ?.takeIf { it.isNotBlank() }
