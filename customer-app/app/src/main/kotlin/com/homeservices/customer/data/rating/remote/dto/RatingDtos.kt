package com.homeservices.customer.data.rating.remote.dto

import com.homeservices.customer.domain.rating.model.CustomerRating
import com.homeservices.customer.domain.rating.model.CustomerSubScores
import com.homeservices.customer.domain.rating.model.RatingSnapshot
import com.homeservices.customer.domain.rating.model.SideState
import com.homeservices.customer.domain.rating.model.TechRating
import com.homeservices.customer.domain.rating.model.TechSubScores
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
public data class SubmitRatingRequestDto(
    val side: String,
    val bookingId: String,
    val overall: Int,
    val subScores: Map<String, Int>,
    val comment: String?,
)

@JsonClass(generateAdapter = true)
public data class SidePayloadDto(
    val status: String,
    val overall: Int? = null,
    val subScores: Map<String, Int>? = null,
    val comment: String? = null,
    val submittedAt: String? = null,
)

@JsonClass(generateAdapter = true)
public data class GetRatingResponseDto(
    val bookingId: String,
    val status: String,
    val revealedAt: String? = null,
    val customerSide: SidePayloadDto,
    val techSide: SidePayloadDto,
) {
    public fun toDomain(): RatingSnapshot =
        RatingSnapshot(
            bookingId = bookingId,
            status = RatingSnapshot.Status.valueOf(status),
            revealedAt = revealedAt,
            customerSide = customerSide.toCustomerSide(),
            techSide = techSide.toTechSide(),
        )
}

private fun SidePayloadDto.toCustomerSide(): SideState =
    if (status == "SUBMITTED" && overall != null && subScores != null && submittedAt != null) {
        SideState.Submitted(
            CustomerRating(
                overall = overall,
                subScores =
                    CustomerSubScores(
                        punctuality = subScores["punctuality"] ?: 0,
                        skill = subScores["skill"] ?: 0,
                        behaviour = subScores["behaviour"] ?: 0,
                    ),
                comment = comment,
                submittedAt = submittedAt,
            ),
        )
    } else {
        SideState.Pending
    }

private fun SidePayloadDto.toTechSide(): SideState =
    if (status == "SUBMITTED" && overall != null && subScores != null && submittedAt != null) {
        SideState.Submitted(
            TechRating(
                overall = overall,
                subScores =
                    TechSubScores(
                        behaviour = subScores["behaviour"] ?: 0,
                        communication = subScores["communication"] ?: 0,
                    ),
                comment = comment,
                submittedAt = submittedAt,
            ),
        )
    } else {
        SideState.Pending
    }
