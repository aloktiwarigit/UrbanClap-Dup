package com.homeservices.technician.domain.erasure

public sealed class ErasureSubmitResult {
    public data class Success(
        val scheduledDeletionAt: String,
    ) : ErasureSubmitResult()

    public object ActiveJobExists : ErasureSubmitResult()

    public object DuplicatePending : ErasureSubmitResult()

    public data class UnknownError(
        val message: String,
    ) : ErasureSubmitResult()
}

public interface ErasureRepository {
    public suspend fun submitRequest(reason: String? = null): ErasureSubmitResult

    public suspend fun revokeRequest(): Result<Unit>
}
