package com.homeservices.customer.domain.rating

/**
 * Why a rating submission was rejected.
 *
 * The API answers a failed `POST /v1/ratings` with a stable `code` in the body (see
 * `api/src/functions/ratings.ts`). Mapping those codes to this enum at the data layer keeps
 * HTTP details out of the UI and lets the screen say what actually went wrong instead of
 * surfacing a raw "HTTP 409 Conflict".
 *
 * [retryable] answers a single question the UI needs: does pressing the button again have any
 * chance of a different outcome? Transport failures can recover; a booking with no technician
 * never will.
 */
public enum class RatingSubmitFailure(
    public val retryable: Boolean,
) {
    /** Booking closed without a technician ever being assigned — nothing to rate. */
    NoTechnician(retryable = false),

    /** This side of the rating is already recorded. Not really an error; the screen moves on. */
    AlreadySubmitted(retryable = false),

    /** Job is not finished yet, so it cannot be rated. */
    BookingNotClosed(retryable = false),

    /**
     * A private review is already open for this booking — usually the first escalate request
     * committed and its response was lost. Sending it again can only conflict.
     */
    ShieldAlreadyEscalated(retryable = false),

    /** Booking is missing, or belongs to somebody else. */
    NotAvailable(retryable = false),

    /** Request never reached the server, or the server never answered. */
    Network(retryable = true),

    /** Anything else — a 5xx, a malformed body, an unrecognised code. */
    Unknown(retryable = true),
}

/**
 * Failure carried out of [com.homeservices.customer.data.rating.RatingRepository.submitCustomerRating].
 */
public class RatingSubmitException(
    public val failure: RatingSubmitFailure,
    cause: Throwable? = null,
) : Exception("Rating submit failed: $failure", cause)
