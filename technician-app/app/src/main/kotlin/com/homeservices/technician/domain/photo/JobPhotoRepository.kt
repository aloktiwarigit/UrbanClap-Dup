package com.homeservices.technician.domain.photo

public interface JobPhotoRepository {
    /**
     * Compress image at [localFilePath] to 1024x1024 JPEG 80% and upload to
     * Firebase Storage at bookings/{bookingId}/photos/{stage}/{timestamp}.jpg.
     * Returns the Firebase download URL on success.
     */
    public suspend fun uploadPhoto(
        bookingId: String,
        stage: String,
        localFilePath: String,
    ): Result<String>

    /**
     * Record [photoUrl] in the Cosmos booking document via
     * POST /v1/technicians/active-job/{bookingId}/photos.
     */
    public suspend fun recordPhotoUrl(
        bookingId: String,
        stage: String,
        photoUrl: String,
    ): Result<Unit>
}
