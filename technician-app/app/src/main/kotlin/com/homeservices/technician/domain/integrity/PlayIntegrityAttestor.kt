package com.homeservices.technician.domain.integrity

import android.content.Context
import com.google.android.play.core.integrity.IntegrityManagerFactory
import com.google.android.play.core.integrity.IntegrityTokenRequest
import kotlinx.coroutines.tasks.await
import javax.inject.Singleton

/**
 * Production implementation of [IntegrityAttestor] backed by the Play Integrity API.
 *
 * Debug-bypass mode: when [debugBypass] is true, [attest] returns
 * `Result.success("debug-bypass")` immediately without calling the Play Integrity SDK.
 * The API server accepts this value when `PLAY_INTEGRITY_STRICT=false` (staging/dev).
 */
@Singleton
public class PlayIntegrityAttestor(
    private val context: Context,
    private val debugBypass: Boolean = false,
) : IntegrityAttestor {

    override suspend fun attest(nonce: String): Result<String> {
        if (debugBypass) return Result.success("debug-bypass")
        return runCatching {
            val manager = IntegrityManagerFactory.create(context)
            val request =
                IntegrityTokenRequest.builder()
                    .setNonce(nonce)
                    .build()
            manager.requestIntegrityToken(request).await().token()
        }
    }
}
