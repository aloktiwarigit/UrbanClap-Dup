package com.homeservices.technician.domain.jobOffer

import com.homeservices.technician.data.jobOffer.JobOfferApiService
import com.homeservices.technician.domain.jobOffer.model.JobOfferResult
import com.homeservices.technician.observability.analytics.AnalyticsTracker
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class AcceptJobOfferUseCase
    @Inject
    internal constructor(
        private val api: JobOfferApiService,
    ) {
        public suspend operator fun invoke(bookingId: String): JobOfferResult {
            val response = api.acceptOffer(bookingId)
            return when {
                response.isSuccessful -> {
                    AnalyticsTracker.capture("job_offer_accepted", mapOf("bookingId" to bookingId))
                    JobOfferResult.Accepted(bookingId)
                }
                response.code() == HTTP_CONFLICT -> JobOfferResult.Conflict(bookingId)
                response.code() == HTTP_GONE -> JobOfferResult.Expired(bookingId)
                else -> JobOfferResult.UnknownError(response.code())
            }
        }

        private companion object {
            private const val HTTP_CONFLICT = 409
            private const val HTTP_GONE = 410
        }
    }
