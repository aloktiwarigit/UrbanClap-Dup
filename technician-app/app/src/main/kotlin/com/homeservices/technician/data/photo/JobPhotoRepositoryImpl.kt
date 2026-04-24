package com.homeservices.technician.data.photo

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.storage.FirebaseStorage
import com.homeservices.technician.domain.photo.JobPhotoRepository
import kotlinx.coroutines.tasks.await
import java.io.ByteArrayOutputStream
import javax.inject.Inject

internal class JobPhotoRepositoryImpl @Inject constructor(
    private val storage: FirebaseStorage,
    private val auth: FirebaseAuth,
    private val api: PhotoApiService,
) : JobPhotoRepository {

    override suspend fun uploadPhoto(
        bookingId: String,
        stage: String,
        localFilePath: String,
    ): Result<String> = runCatching {
        val bytes = compressToJpeg(localFilePath)
        val ref = storage.reference
            .child("bookings/$bookingId/photos/$stage/${System.currentTimeMillis()}.jpg")
        ref.putBytes(bytes).await()
        ref.downloadUrl.await().toString()
    }

    override suspend fun recordPhotoUrl(
        bookingId: String,
        stage: String,
        photoUrl: String,
    ): Result<Unit> = runCatching {
        val token = auth.currentUser
            ?.getIdToken(false)
            ?.await()
            ?.token
            ?: error("No authenticated user")
        val response = api.recordPhoto(
            "Bearer $token",
            bookingId,
            RecordPhotoBody(stage, photoUrl),
        )
        if (!response.isSuccessful) error("recordPhoto API failed: ${response.code()}")
    }

    private fun compressToJpeg(filePath: String): ByteArray {
        val original = BitmapFactory.decodeFile(filePath)
            ?: error("Cannot decode image at $filePath")
        val scaled = Bitmap.createScaledBitmap(original, 1024, 1024, true)
        return ByteArrayOutputStream().also { out ->
            scaled.compress(Bitmap.CompressFormat.JPEG, 80, out)
            if (scaled !== original) scaled.recycle()
            original.recycle()
        }.toByteArray()
    }
}
