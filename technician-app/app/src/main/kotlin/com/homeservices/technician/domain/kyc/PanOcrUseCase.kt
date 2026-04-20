package com.homeservices.technician.domain.kyc

import android.net.Uri
import com.homeservices.technician.data.kyc.KycRepository
import com.homeservices.technician.domain.kyc.model.PanOcrResult
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject

public class PanOcrUseCase @Inject constructor(
    private val repository: KycRepository,
    private val uploader: FirebaseStorageUploader,
) {
    public operator fun invoke(
        imageUri: Uri,
        technicianId: String,
    ): Flow<PanOcrResult> = flow {
        val storagePath = "technicians/$technicianId/pan_${System.currentTimeMillis()}.jpg"
        val uploadedPath = runCatching { uploader.upload(imageUri, storagePath) }
            .getOrElse { emit(PanOcrResult.UploadError(it)); return@flow }
        emit(repository.submitPanOcr(uploadedPath))
    }
}
