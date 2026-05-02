package com.homeservices.technician.domain.shield.model

public data class ShieldReportResult(
    val complaintId: String,
)

/**
 * Outcome of a rating-appeal API call. Note: a [Result.success] with [quotaExceeded] = true
 * represents the API's 409 APPEAL_QUOTA_EXCEEDED response — i.e. the *call* succeeded in
 * reaching the server, but the appeal was *not* filed. Callers must inspect [quotaExceeded]
 * before assuming the appeal is recorded.
 */
public data class RatingAppealResult(
    val appealId: String? = null,
    val quotaExceeded: Boolean = false,
    val nextAvailableAt: String? = null,
)
