package com.homeservices.customer.data.dataexport

import kotlinx.coroutines.flow.Flow

/** Contract for fetching the authenticated user's full data export. */
public interface DataExportRepository {
    /**
     * Fetch the user's data export from the backend.
     *
     * Emits a single [Result] carrying the raw JSON as a [ByteArray] on success,
     * or a [Throwable] on network / auth failure.
     */
    public fun fetchExport(): Flow<Result<ByteArray>>
}
