package com.homeservices.customer.domain.deleteaccount

import com.homeservices.customer.domain.deleteaccount.model.ErasureRequest

/**
 * Contract for the delete-account / DPDP erasure data layer.
 *
 * All functions are suspend and return [Result] so callers never need to
 * catch — the impl maps all network exceptions to [Result.failure].
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

    /**
     * Fetch the active erasure request for the signed-in user.
     *
     * NOTE: The API does NOT expose a dedicated `GET /erasure-request/active` endpoint
     * in this milestone. This method uses a POST-and-intercept strategy: it calls POST
     * and if it receives `409 ERASURE_REQUEST_PENDING`, it returns the embedded
     * `erasureId` + a synthetic [ErasureRequest] with `scheduledDeletionAt` unknown
     * (the UI must handle an empty `scheduledDeletionAt` gracefully).
     *
     * If a dedicated GET endpoint is added in a later sprint, replace this impl
     * without changing callers.
     *
     * - Returns `null` when there is no active request.
     * - Returns [ErasureRequest] when a PENDING request exists.
     */
    public suspend fun getActiveErasureRequest(): Result<ErasureRequest?>
}

/** Thrown when attempting to submit while a request is already pending. */
public class ErasureAlreadyPendingException(
    public val erasureId: String,
) : Exception("Erasure request already pending: $erasureId")

/** Thrown when attempting to revoke but no active request exists. */
public class NoActiveErasureRequestException : Exception("No pending erasure request to revoke")
