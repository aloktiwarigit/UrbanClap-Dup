package com.homeservices.customer.domain.rating.model

public data class CustomerSubScores(
    val punctuality: Int,
    val skill: Int,
    val behaviour: Int,
)

public data class TechSubScores(
    val behaviour: Int,
    val communication: Int,
)

public data class CustomerRating(
    val overall: Int,
    val subScores: CustomerSubScores,
    val comment: String?,
    val submittedAt: String,
)

public data class TechRating(
    val overall: Int,
    val subScores: TechSubScores,
    val comment: String?,
    val submittedAt: String,
)

public sealed class SideState {
    public object Pending : SideState()

    public data class Submitted(
        val rating: Any,
    ) : SideState()
}

public data class RatingSnapshot(
    val bookingId: String,
    val status: Status,
    val revealedAt: String?,
    val customerSide: SideState,
    val techSide: SideState,
) {
    public enum class Status { PENDING, PARTIALLY_SUBMITTED, REVEALED }
}
