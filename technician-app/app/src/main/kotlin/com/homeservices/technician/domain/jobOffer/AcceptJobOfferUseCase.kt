package com.homeservices.technician.domain.jobOffer

import com.google.firebase.auth.FirebaseAuth
import com.homeservices.technician.data.jobOffer.JobOfferApiService
import com.homeservices.technician.domain.jobOffer.model.JobOfferResult
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class AcceptJobOfferUseCase
    @Inject
    internal constructor(
        private val api: JobOfferApiService,
        private val firebaseAuth: FirebaseAuth,
    ) {
        public suspend operator fun invoke(bookingId: String): JobOfferResult {
            val token =
                firebaseAuth.currentUser
                    ?.getIdToken(false)
                    ?.await()
                    ?.token
                    ?: throw IllegalStateException("No authenticated user for job offer acceptance")
            val response = api.acceptOffer("Bearer $token", bookingId)
            return when {
                response.isSuccessful -> JobOfferResult.Accepted(bookingId)
                response.code() == HTTP_CONFLICT -> JobOfferResult.Conflict(bookingId)
                response.code() == HTTP_GONE -> JobOfferResult.Expired(bookingId)
                else -> throw RuntimeException("Accept offer failed: HTTP ${response.code()}")
            }
        }

        private companion object {
            private const val HTTP_CONFLICT = 409
            private const val HTTP_GONE = 410
        }
    }
