package com.homeservices.customer.domain.booking

import com.homeservices.customer.data.booking.BookingRepository
import com.homeservices.customer.data.integrity.IntegrityApiService
import com.homeservices.customer.domain.integrity.IntegrityAttestor
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject

public class ConfirmBookingUseCase
    @Inject
    constructor(
        private val repo: BookingRepository,
        private val integrityAttestor: IntegrityAttestor,
        private val integrityApiService: IntegrityApiService,
    ) {
        public operator fun invoke(
            bookingId: String,
            paymentId: String,
            orderId: String,
            signature: String,
        ): Flow<Result<String>> =
            flow {
                // Fetch nonce → attest → attach integrity token.
                // If attestation fails, proceed without the token (fail-open, server will warn but allow).
                val integrityToken: String? =
                    runCatching {
                        val nonce = integrityApiService.getNonce().nonce
                        integrityAttestor.attest(nonce).getOrThrow()
                    }.getOrNull()

                val result =
                    repo.confirmBooking(
                        bookingId = bookingId,
                        paymentId = paymentId,
                        orderId = orderId,
                        signature = signature,
                        integrityToken = integrityToken,
                    )
                result.collect { emit(it) }
            }
    }
