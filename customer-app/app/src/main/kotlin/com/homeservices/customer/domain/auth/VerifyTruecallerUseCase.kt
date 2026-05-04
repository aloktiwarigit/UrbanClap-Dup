package com.homeservices.customer.domain.auth

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.homeservices.customer.data.auth.remote.AuthApi
import com.homeservices.customer.data.auth.remote.dto.TruecallerVerifyRequest
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Phase 2 Truecaller auth use case (ADR-0005).
 *
 * POSTs the Truecaller SDK-provided (payload, signature, signatureAlgorithm) to
 * `POST /v1/auth/truecaller/verify`. The API verifies the RSA signature against
 * the Truecaller public key and returns a Firebase custom token. This use case
 * then signs into Firebase using that custom token.
 *
 * This use case is invoked from [AuthViewModel] when the GrowthBook flag
 * `truecaller_server_verify_v2` is ON. The anonymous sign-in fallback path
 * (Phase 1) remains active when the flag is OFF.
 */
@Singleton
public class VerifyTruecallerUseCase
    @Inject
    constructor(
        private val authApi: AuthApi,
        private val firebaseAuth: FirebaseAuth,
    ) {
        /**
         * Verifies the Truecaller profile server-side and signs into Firebase.
         *
         * @param payload base64-encoded Truecaller profile payload from SDK callback
         * @param signature base64-encoded RSA signature from SDK callback
         * @param signatureAlgorithm algorithm string (e.g. "SHA512withRSA")
         * @return [Result.success] with the signed-in [FirebaseUser], or
         *         [Result.failure] with the upstream exception.
         */
        @Suppress("TooGenericExceptionCaught")
        public suspend fun invoke(
            payload: String,
            signature: String,
            signatureAlgorithm: String,
        ): Result<FirebaseUser> =
            try {
                val response =
                    authApi.verifyTruecaller(
                        TruecallerVerifyRequest(
                            payload = payload,
                            signature = signature,
                            signatureAlgorithm = signatureAlgorithm,
                        ),
                    )

                val authResult = firebaseAuth.signInWithCustomToken(response.firebaseCustomToken).await()
                val user =
                    authResult.user
                        ?: return Result.failure(
                            IllegalStateException("null user after custom token sign-in"),
                        )
                Result.success(user)
            } catch (e: Exception) {
                Result.failure(e)
            }
    }
