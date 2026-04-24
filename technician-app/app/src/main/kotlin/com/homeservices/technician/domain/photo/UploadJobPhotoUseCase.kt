package com.homeservices.technician.domain.photo

import javax.inject.Inject

public class UploadJobPhotoUseCase @Inject constructor(
    private val repository: JobPhotoRepository,
) {
    /** Upload [localFilePath] and record the resulting URL. Returns the remote URL on success. */
    public suspend fun execute(
        bookingId: String,
        stage: String,
        localFilePath: String,
    ): Result<String> {
        val uploadResult = repository.uploadPhoto(bookingId, stage, localFilePath)
        if (uploadResult.isFailure) return uploadResult
        val remoteUrl = uploadResult.getOrThrow()
        val recordResult = repository.recordPhotoUrl(bookingId, stage, remoteUrl)
        return if (recordResult.isSuccess) Result.success(remoteUrl)
        else Result.failure(recordResult.exceptionOrNull()!!)
    }
}
