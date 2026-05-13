package com.homeservices.customer.domain.deleteaccount

import com.homeservices.customer.domain.deleteaccount.model.ErasureRequest

/**
 * Contract for the delete-account / DPDP erasure data layer.
 *
 * All functions are suspend and return [Result] so callers never need to
 * catch — the impl maps all network exceptions to [Result.failure].
 *
 * NOTE: The old [getActiveErasureRequest] method that used a POST-probe strategy
 * (calling POST and intercepting the response code) has been removed.
 * That approach caused a DPDP-critical defect: viewing the delete-account entry screen
 * created an erasure request (via 201 response) before the user confirmed anything.
 * A proper server-side GET /v1/users/me/erasure-request/active endpoint is tracked
 * in the backlog. When it ships, add a new method here rather than restoring the
 * POST-probe workaround.
 */
public interface DeleteAccountRepository {
    /**
     * Submit a new erasure request.
     *
     * - Success (201): returns [ErasureRequest] with `requestId` and `scheduledDeletionAt`.
     * - Conflict (409 / `ERASURE_REQUEST_PENDING`): returns [Result.failure] wrapping
     *   [ErasureAlreadyPendingException] which includes the existing `erasureId`.
     * - Any other error: returns [Result.failure] wrapping the raw exception.
     */
    public suspend fun submitErasureRequest(reason: String? = null): Result<ErasureRequest>

    /**
     * Revoke the currently pending erasure request (DELETE).
     *
     * The API uses the same route as POST but with the DELETE method; no `{id}` path
     * param is required on the server side (it finds the pending doc by uid).
     *
     * - Success (204): returns [Result.success(Unit)].
     * - Not found (404): returns [Result.failure] wrapping [NoActiveErasureRequestException].
     * - Any other error: returns [Result.failure] wrapping the raw exception.
     */
    public suspend fun revokeErasureRequest(): Result<Unit>
}

/** Thrown when attempting to submit while a request is already pending. */
public class ErasureAlreadyPendingException(
    public val erasureId: String,
) : Exception("Erasure request already pending: $erasureId")

/** Thrown when attempting to revoke but no active request exists. */
public class NoActiveErasureRequestException : Exception("No pending erasure request to revoke")
