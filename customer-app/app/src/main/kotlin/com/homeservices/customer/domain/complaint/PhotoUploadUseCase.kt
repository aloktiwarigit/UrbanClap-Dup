package com.homeservices.customer.domain.complaint

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.storage.FirebaseStorage
import com.google.firebase.storage.StorageMetadata
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream
import javax.inject.Inject

public class PhotoUploadUseCase
    @Inject
    constructor(
        private val storage: FirebaseStorage,
        private val auth: FirebaseAuth,
    ) {
        public suspend operator fun invoke(
            bookingId: String,
            localFilePath: String,
        ): Result<String> =
            runCatching {
                val uid = auth.currentUser?.uid ?: error("No authenticated user")
                val bytes = withContext(Dispatchers.IO) { compressToJpeg(localFilePath) }
                val timestamp = System.currentTimeMillis()
                val storagePath = "complaints/$bookingId/$uid/$timestamp.jpg"
                val ref = storage.reference.child(storagePath)
                val metadata = StorageMetadata.Builder().setContentType("image/jpeg").build()
                ref.putBytes(bytes, metadata).await()
                storagePath
            }

        private fun compressToJpeg(filePath: String): ByteArray {
            val original =
                BitmapFactory.decodeFile(filePath)
                    ?: error("Cannot decode image at $filePath")
            val scaled = Bitmap.createScaledBitmap(original, 1024, 1024, true)
            return ByteArrayOutputStream()
                .also { out ->
                    scaled.compress(Bitmap.CompressFormat.JPEG, 80, out)
                    if (scaled !== original) scaled.recycle()
                    original.recycle()
                }.toByteArray()
        }
    }
