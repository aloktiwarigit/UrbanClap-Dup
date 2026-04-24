package com.homeservices.customer.domain.technician.model

public data class TechnicianProfile(
    val id: String,
    val displayName: String,
    val photoUrl: String?,
    val verifiedAadhaar: Boolean,
    val verifiedPoliceCheck: Boolean,
    val trainingInstitution: String?,
    val certifications: List<String>,
    val languages: List<String>,
    val yearsInService: Int,
    val totalJobsCompleted: Int,
    val lastReviews: List<TechnicianReview>,
)
