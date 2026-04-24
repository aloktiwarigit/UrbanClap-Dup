package com.homeservices.technician.domain.photo

import javax.inject.Inject

public class UploadJobPhotoUseCase
    @Inject
    constructor(
        private val repository: JobPhotoRepository,
    ) {
        /** Upload [localFilePath] and record the resulting storage path. Returns the storage path on success. */
        public suspend fun execute(
            bookingId: String,
            stage: String,
            localFilePath: String,
        ): Result<String> {
            val uploadResult = repository.uploadPhoto(bookingId, stage, localFilePath)
            if (uploadResult.isFailure) return uploadResult
            val storagePath = uploadResult.getOrThrow()
            val recordResult = repository.recordPhotoPath(bookingId, stage, storagePath)
            return if (recordResult.isSuccess) {
                Result.success(storagePath)
            } else {
                Result.failure(recordResult.exceptionOrNull()!!)
            }
        }
    }
