package com.homeservices.technician.domain.jobOffer.model

public sealed class JobOfferResult {
    public data class Accepted(
        val bookingId: String,
    ) : JobOfferResult()

    public data class Declined(
        val bookingId: String,
    ) : JobOfferResult()

    public data class Expired(
        val bookingId: String,
    ) : JobOfferResult()
}
