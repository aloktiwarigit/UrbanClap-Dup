package com.homeservices.customer.ui.booking

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.customer.domain.booking.ConfirmBookingUseCase
import com.homeservices.customer.domain.booking.CreateBookingUseCase
import com.homeservices.customer.domain.booking.RazorpayPaymentUseCase
import com.homeservices.customer.domain.booking.model.BookingPaymentMethod
import com.homeservices.customer.domain.booking.model.BookingRequest
import com.homeservices.customer.domain.booking.model.BookingSlot
import com.homeservices.customer.domain.booking.model.PaymentResult
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
internal class BookingViewModel
    @Inject
    constructor(
        private val createBooking: CreateBookingUseCase,
        private val confirmBooking: ConfirmBookingUseCase,
        private val razorpayPayment: RazorpayPaymentUseCase,
    ) : ViewModel() {
        private val _uiState = MutableStateFlow<BookingUiState>(BookingUiState.Idle)
        public val uiState: StateFlow<BookingUiState> = _uiState.asStateFlow()

        private var pendingBookingId: String? = null

        public var pendingServiceId: String = ""
        public var pendingCategoryId: String = ""

        init {
            viewModelScope.launch {
                razorpayPayment.resultFlow().collect { result ->
                    val bookingId = pendingBookingId ?: return@collect
                    handlePaymentResult(result, bookingId)
                }
            }
        }

        public fun setSlotAndAddress(
            slot: BookingSlot,
            addressText: String,
            lat: Double,
            lng: Double,
        ) {
            _uiState.value = BookingUiState.Ready(slot, addressText, lat, lng)
        }

        public fun startPayment(
            serviceId: String,
            categoryId: String,
        ) {
            startBooking(serviceId, categoryId, BookingPaymentMethod.RAZORPAY)
        }

        public fun startBooking(
            serviceId: String,
            categoryId: String,
            paymentMethod: BookingPaymentMethod,
        ) {
            val state = _uiState.value as? BookingUiState.Ready ?: return
            viewModelScope.launch {
                _uiState.value = BookingUiState.CreatingBooking
                val request =
                    BookingRequest(
                        serviceId = serviceId,
                        categoryId = categoryId,
                        slot = state.slot,
                        addressText = state.addressText,
                        addressLat = state.lat,
                        addressLng = state.lng,
                        paymentMethod = paymentMethod,
                    )
                createBooking(request).first().fold(
                    onSuccess = { result ->
                        pendingBookingId = result.bookingId
                        _uiState.value =
                            if (result.requiresPayment) {
                                BookingUiState.AwaitingPayment(
                                    bookingId = result.bookingId,
                                    razorpayOrderId = result.razorpayOrderId,
                                    amount = result.amount,
                                )
                            } else {
                                BookingUiState.BookingConfirmed(result.bookingId)
                            }
                    },
                    onFailure = { _uiState.value = BookingUiState.Error(it.message ?: "Booking failed") },
                )
            }
        }

        private suspend fun handlePaymentResult(
            result: PaymentResult,
            bookingId: String,
        ) {
            when (result) {
                is PaymentResult.Success -> {
                    _uiState.value = BookingUiState.ConfirmingPayment
                    confirmBooking(bookingId, result.paymentId, result.orderId, result.signature)
                        .first()
                        .fold(
                            onSuccess = { _uiState.value = BookingUiState.BookingConfirmed(bookingId) },
                            onFailure = { _uiState.value = BookingUiState.Error(it.message ?: "Confirmation failed") },
                        )
                }
                is PaymentResult.Failure ->
                    _uiState.value = BookingUiState.Error("Payment cancelled: ${result.description}")
            }
        }
    }
