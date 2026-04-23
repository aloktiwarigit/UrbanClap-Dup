package com.homeservices.customer.data.technician.remote.dto

import com.homeservices.customer.domain.technician.model.TechnicianProfile
import com.homeservices.customer.domain.technician.model.TechnicianReview
import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
public data class TechnicianReviewDto(
    @Json(name = "rating") val rating: Float,
    @Json(name = "text") val text: String,
    @Json(name = "date") val date: String,
)

@JsonClass(generateAdapter = true)
public data class TechnicianProfileDto(
    @Json(name = "id") val id: String,
    @Json(name = "displayName") val displayName: String,
    @Json(name = "photoUrl") val photoUrl: String?,
    @Json(name = "verifiedAadhaar") val verifiedAadhaar: Boolean,
    @Json(name = "verifiedPoliceCheck") val verifiedPoliceCheck: Boolean,
    @Json(name = "trainingInstitution") val trainingInstitution: String?,
    @Json(name = "certifications") val certifications: List<String>,
    @Json(name = "languages") val languages: List<String>,
    @Json(name = "yearsInService") val yearsInService: Int,
    @Json(name = "totalJobsCompleted") val totalJobsCompleted: Int,
    @Json(name = "lastReviews") val lastReviews: List<TechnicianReviewDto>,
)

public fun TechnicianProfileDto.toDomain(): TechnicianProfile =
    TechnicianProfile(
        id = id,
        displayName = displayName,
        photoUrl = photoUrl,
        verifiedAadhaar = verifiedAadhaar,
        verifiedPoliceCheck = verifiedPoliceCheck,
        trainingInstitution = trainingInstitution,
        certifications = certifications,
        languages = languages,
        yearsInService = yearsInService,
        totalJobsCompleted = totalJobsCompleted,
        lastReviews = lastReviews.map { TechnicianReview(it.rating, it.text, it.date) },
    )
