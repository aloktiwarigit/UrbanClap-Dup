package com.homeservices.technician.data.kyc

/**
 * In-process event published when an FCM message confirms the server-side KYC verdict
 * (`KYC_VERIFIED` or `KYC_REJECTED`). Consumed by `KycViewModel` to drive the UI to
 * either completion or an error state without polling the API.
 */
public data class KycStatusEvent(
    val technicianId: String,
    val verified: Boolean,
    val rejectionReason: String? = null,
)
