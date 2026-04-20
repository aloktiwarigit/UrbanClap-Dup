package com.homeservices.technician.data.kyc

import android.net.Uri
import com.google.firebase.storage.FirebaseStorage
import com.homeservices.technician.domain.kyc.FirebaseStorageUploader
import kotlinx.coroutines.tasks.await
import javax.inject.Inject

public class FirebaseStorageUploaderImpl @Inject constructor(
    private val storage: FirebaseStorage,
) : FirebaseStorageUploader {
    override suspend fun upload(uri: Uri, storagePath: String): String {
        val ref = storage.reference.child(storagePath)
        ref.putFile(uri).await()
        return storagePath
    }
}
