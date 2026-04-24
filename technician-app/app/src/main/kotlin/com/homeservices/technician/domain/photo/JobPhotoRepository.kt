package com.homeservices.technician.domain.photo

public interface JobPhotoRepository {
    /**
     * Compress image at [localFilePath] to 1024x1024 JPEG 80% and upload to
     * Firebase Storage at bookings/{bookingId}/photos/{technicianUid}/{stage}/{timestamp}.jpg.
     * Returns the **storage path** (not a download URL) on success. Callers
     * record this path in Cosmos; non-technician access uses server-side signed URLs.
     */
    public suspend fun uploadPhoto(
        bookingId: String,
        stage: String,
        localFilePath: String,
    ): Result<String>

    /**
     * Record [storagePath] in the Cosmos booking document via
     * POST /v1/technicians/active-job/{bookingId}/photos.
     */
    public suspend fun recordPhotoPath(
        bookingId: String,
        stage: String,
        storagePath: String,
    ): Result<Unit>
}
