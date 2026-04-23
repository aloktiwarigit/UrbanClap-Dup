package com.homeservices.technician.domain.jobOffer

import com.google.firebase.auth.FirebaseAuth
import com.homeservices.technician.data.jobOffer.JobOfferApiService
import com.homeservices.technician.domain.jobOffer.model.JobOfferResult
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

// Per Karnataka FR-9.1: decline is logged server-side to booking_events but
// NEVER fed back to ranking. Decline counts MUST NEVER appear in any UI label,
// sort order, or analytics event.
@Singleton
public class DeclineJobOfferUseCase @Inject constructor(
    private val api: JobOfferApiService,
    private val firebaseAuth: FirebaseAuth,
) {
    public suspend operator fun invoke(bookingId: String): JobOfferResult {
        val token = firebaseAuth.currentUser?.getIdToken(false)?.await()?.token.orEmpty()
        return try {
            api.declineOffer("Bearer $token", bookingId)
            // Response code is intentionally ignored — user intention to decline is the source of truth
            JobOfferResult.Declined(bookingId)
        } catch (_: Exception) {
            // Network error on decline — user intention is known; return Declined anyway
            JobOfferResult.Declined(bookingId)
        }
    }
}
