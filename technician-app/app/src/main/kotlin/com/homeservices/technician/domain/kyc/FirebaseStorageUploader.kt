package com.homeservices.technician.domain.kyc

import android.net.Uri

public interface FirebaseStorageUploader {
    public suspend fun upload(
        uri: Uri,
        storagePath: String,
    ): String
}
