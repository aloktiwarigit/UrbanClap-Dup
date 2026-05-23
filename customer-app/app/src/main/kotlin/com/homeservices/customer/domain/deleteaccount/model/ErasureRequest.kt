package com.homeservices.customer.domain.deleteaccount.model

/**
 * Domain model for an active erasure / account-deletion request.
 *
 * Carries only the fields the UI layer needs. The full document shape
 * lives on the API side (see `api/src/schemas/erasure-request.ts`).
 */
public data class ErasureRequest(
    /** Server-assigned document id, e.g. `pending:{uid}`. */
    public val requestId: String,
    /** ISO-8601 instant at which the account will be permanently deleted. */
    public val scheduledDeletionAt: String,
    /** Normalised status string returned by the API. */
    public val status: String,
)
