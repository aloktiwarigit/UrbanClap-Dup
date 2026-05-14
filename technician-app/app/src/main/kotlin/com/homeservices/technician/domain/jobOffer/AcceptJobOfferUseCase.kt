package com.homeservices.technician.domain.jobOffer

import com.homeservices.technician.data.jobOffer.JobOfferApiService
import com.homeservices.technician.domain.jobOffer.model.JobOfferResult
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
                response.isSuccessful -> JobOfferResult.Accepted(bookingId)
                response.code() == 409 -> JobOfferResult.Conflict(bookingId)
                response.code() == 410 -> JobOfferResult.Expired(bookingId)
                else -> throw RuntimeException("Accept offer failed: HTTP ${response.code()}")
            }
        }
    }
