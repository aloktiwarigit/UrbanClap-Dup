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
import com.homeservices.customer.domain.booking.model.RazorpayErrorCode
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

private const val BOOKING_FAILED_FALLBACK = "Booking failed"
private const val CONFIRMATION_FAILED_FALLBACK = "Confirmation failed"

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
                                    slot = state.slot,
                                    addressText = state.addressText,
                                    lat = state.lat,
                                    lng = state.lng,
                                )
                            } else {
                                BookingUiState.BookingConfirmed(result.bookingId)
                            }
                    },
                    // Error message key: R.string.booking_error_failed surfaced in UI layer
                    onFailure = { _uiState.value = BookingUiState.Error(it.message ?: BOOKING_FAILED_FALLBACK) },
                )
            }
        }

        /**
         * Re-opens the Razorpay checkout for the same order.
         * Razorpay supports retrying payment on the same [orderId] until the server captures it.
         * The UI (BookingSummaryScreen) must trigger the actual checkout open via a LaunchedEffect
         * that reacts to [BookingUiState.AwaitingPayment].
         */
        public fun retryPayment() {
            val failed = _uiState.value as? BookingUiState.PaymentFailed ?: return
            _uiState.value =
                BookingUiState.AwaitingPayment(
                    bookingId = pendingBookingId ?: return,
                    razorpayOrderId = failed.orderId,
                    amount = failed.amount,
                    slot = failed.slot,
                    addressText = failed.addressText,
                    lat = failed.lat,
                    lng = failed.lng,
                )
        }

        /**
         * Cancels from [BookingUiState.PaymentFailed] back to [BookingUiState.Ready] so the user
         * can change payment method (e.g. switch to Cash on Service).
         * The slot/address snapshot is embedded in [BookingUiState.PaymentFailed] (forwarded from
         * [BookingUiState.AwaitingPayment]) so we restore it directly — no navigation re-entry needed.
         */
        public fun cancelPaymentFailed() {
            val failed = _uiState.value as? BookingUiState.PaymentFailed ?: return
            _uiState.value =
                BookingUiState.Ready(
                    slot = failed.slot,
                    addressText = failed.addressText,
                    lat = failed.lat,
                    lng = failed.lng,
                )
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
                            // Error message key: R.string.booking_error_confirmation_failed surfaced in UI layer
                            onFailure = { _uiState.value = BookingUiState.Error(it.message ?: CONFIRMATION_FAILED_FALLBACK) },
                        )
                }
                is PaymentResult.Failure -> {
                    // Resolve a stable error-code string from the SDK integer code + description.
                    // The prior AwaitingPayment state holds the orderId, amount, and the Ready
                    // snapshot (slot/address) — forward all into PaymentFailed so cancelPaymentFailed()
                    // can restore Ready without losing the user's booking context.
                    val awaitingSnapshot = _uiState.value as? BookingUiState.AwaitingPayment
                    val errorCode = RazorpayErrorCode.resolve(result.code, result.description)
                    _uiState.value =
                        BookingUiState.PaymentFailed(
                            orderId = awaitingSnapshot?.razorpayOrderId ?: "",
                            amount = awaitingSnapshot?.amount ?: 0,
                            reason = result.description,
                            errorCode = errorCode,
                            slot = awaitingSnapshot?.slot ?: BookingSlot("", ""),
                            addressText = awaitingSnapshot?.addressText ?: "",
                            lat = awaitingSnapshot?.lat ?: 0.0,
                            lng = awaitingSnapshot?.lng ?: 0.0,
                        )
                }
            }
        }
    }
