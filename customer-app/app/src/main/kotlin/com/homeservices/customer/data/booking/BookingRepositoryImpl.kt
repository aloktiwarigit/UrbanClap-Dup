package com.homeservices.customer.data.booking

import com.homeservices.customer.data.booking.remote.BookingApiService
import com.homeservices.customer.data.booking.remote.dto.AddOnDecisionDto
import com.homeservices.customer.data.booking.remote.dto.ApproveFinalPriceRequestDto
import com.homeservices.customer.data.booking.remote.dto.ConfirmBookingRequestDto
import com.homeservices.customer.data.booking.remote.dto.CreateBookingRequestDto
import com.homeservices.customer.data.booking.remote.dto.LatLngDto
import com.homeservices.customer.domain.booking.model.AddOnDecision
import com.homeservices.customer.domain.booking.model.BookingRequest
import com.homeservices.customer.domain.booking.model.BookingResult
import com.homeservices.customer.domain.booking.model.PendingAddOn
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject

internal class BookingRepositoryImpl
    @Inject
    constructor(
        private val api: BookingApiService,
    ) : BookingRepository {
        override fun createBooking(request: BookingRequest): Flow<Result<BookingResult>> =
            flow {
                emit(
                    runCatching {
                        api
                            .createBooking(
                                CreateBookingRequestDto(
                                    serviceId = request.serviceId,
                                    categoryId = request.categoryId,
                                    slotDate = request.slot.date,
                                    slotWindow = request.slot.window,
                                    addressText = request.addressText,
                                    addressLatLng = LatLngDto(lat = request.addressLat, lng = request.addressLng),
                                ),
                            ).toDomain()
                    },
                )
            }

        override fun confirmBooking(
            bookingId: String,
            paymentId: String,
            orderId: String,
            signature: String,
        ): Flow<Result<String>> =
            flow {
                emit(
                    runCatching {
                        api
                            .confirmBooking(
                                bookingId,
                                ConfirmBookingRequestDto(
                                    razorpayPaymentId = paymentId,
                                    razorpayOrderId = orderId,
                                    razorpaySignature = signature,
                                ),
                            ).bookingId
                    },
                )
            }

        override fun getPendingAddOns(bookingId: String): Flow<Result<List<PendingAddOn>>> = flow {
            emit(runCatching { api.getBooking(bookingId).pendingAddOns.map { it.toDomain() } })
        }

        override fun approveFinalPrice(bookingId: String, decisions: List<AddOnDecision>): Flow<Result<Int>> = flow {
            emit(
                runCatching {
                    api.approveFinalPrice(
                        bookingId,
                        ApproveFinalPriceRequestDto(decisions.map { AddOnDecisionDto(it.name, it.approved) }),
                    ).finalAmount ?: error("finalAmount missing in approve-final-price response")
                },
            )
        }
    }
