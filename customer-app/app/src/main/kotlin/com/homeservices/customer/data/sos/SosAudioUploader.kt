package com.homeservices.customer.data.sos

import com.google.firebase.storage.FirebaseStorage
import com.homeservices.customer.data.sos.remote.SosApiService
import com.homeservices.customer.data.sos.remote.SosKeyUploadRequest
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

public sealed interface SosUploadProgress {
    public data class Progress(
        public val pct: Int,
    ) : SosUploadProgress

    public data object Success : SosUploadProgress

    public data class Failure(
        public val cause: Throwable,
    ) : SosUploadProgress
}

public class SosAudioUploader
    @Inject
    constructor(
        private val storage: FirebaseStorage,
        private val sosApi: SosApiService,
        private val cipher: SosAudioCipher,
    ) {
        private companion object {
            const val PCT_MAX = 100
        }

        public fun upload(
            customerId: String,
            incidentId: String,
            plaintextAudio: ByteArray,
        ): Flow<SosUploadProgress> =
            callbackFlow {
                val encrypted = cipher.encrypt(plaintextAudio)
                plaintextAudio.fill(0)

                val path = "sos-audio/$customerId/$incidentId.enc"
                val task = storage.reference.child(path).putBytes(encrypted.ciphertext)
                val scope = this

                task.addOnProgressListener { snapshot ->
                    val total = snapshot.totalByteCount
                    val pct = if (total > 0) ((snapshot.bytesTransferred * PCT_MAX) / total).toInt() else 0
                    trySend(SosUploadProgress.Progress(pct))
                }

                task.addOnFailureListener { e ->
                    trySend(SosUploadProgress.Failure(e))
                    close()
                }

                task.addOnSuccessListener {
                    scope.launch {
                        runCatching {
                            sosApi.uploadKey(
                                incidentId,
                                SosKeyUploadRequest(encrypted.keyB64, encrypted.ivB64, path),
                            )
                        }.fold(
                            onSuccess = {
                                trySend(SosUploadProgress.Success)
                                close()
                            },
                            onFailure = { e ->
                                trySend(SosUploadProgress.Failure(e))
                                close()
                            },
                        )
                    }
                }

                awaitClose {
                    if (!task.isComplete) task.cancel()
                }
            }
    }
