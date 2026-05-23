package com.homeservices.customer.ui.booking

import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.customer.data.catalogue.CatalogueRepository
import com.homeservices.customer.domain.auth.BiometricGateUseCase
import com.homeservices.customer.domain.auth.model.BiometricResult
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
import java.io.IOException
import javax.inject.Inject

private const val BOOKING_FAILED_FALLBACK = "Booking failed"
private const val CONFIRMATION_FAILED_FALLBACK = "Confirmation failed"
private const val WOMEN_SAFE_HOUR_THRESHOLD = 19

@HiltViewModel
internal class BookingViewModel
    @Inject
    constructor(
        private val createBooking: CreateBookingUseCase,
        private val confirmBooking: ConfirmBookingUseCase,
        private val razorpayPayment: RazorpayPaymentUseCase,
        private val biometricGate: BiometricGateUseCase,
        private val catalogueRepository: CatalogueRepository,
    ) : ViewModel() {
        private val _uiState = MutableStateFlow<BookingUiState>(BookingUiState.Idle)
        public val uiState: StateFlow<BookingUiState> = _uiState.asStateFlow()

        private val _walletBalanceInPaise = MutableStateFlow(0L)
        public val walletBalanceInPaise: StateFlow<Long> = _walletBalanceInPaise.asStateFlow()

        private val _applyCreditToggle = MutableStateFlow(false)
        public val applyCreditToggle: StateFlow<Boolean> = _applyCreditToggle.asStateFlow()

        private val _showWomenSafeToggle = MutableStateFlow(false)
        public val showWomenSafeToggle: StateFlow<Boolean> = _showWomenSafeToggle.asStateFlow()

        private val _preferFemaleTechnician = MutableStateFlow(false)
        public val preferFemaleTechnician: StateFlow<Boolean> = _preferFemaleTechnician.asStateFlow()

        private var pendingBookingId: String? = null
        private var lastNetworkErrorRequest: BookingRequest? = null

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

        public fun setWalletBalance(paise: Long) {
            _walletBalanceInPaise.value = paise
            if (paise > 0L) _applyCreditToggle.value = true
        }

        public fun setApplyCreditToggle(checked: Boolean) {
            _applyCreditToggle.value = checked
        }

        public fun setPreferFemaleTechnician(checked: Boolean) {
            _preferFemaleTechnician.value = checked
        }

        public fun setSlotAndAddress(
            slot: BookingSlot,
            addressText: String,
            lat: Double,
            lng: Double,
        ) {
            _uiState.value = BookingUiState.Ready(slot, addressText, lat, lng)
            updateWomenSafeContext(slot)
        }

        /**
         * Pre-populates the VM into AwaitingPayment state for resuming a PENDING_PAYMENT booking
         * after process death. BookingSummaryScreen's LaunchedEffect auto-launches Razorpay.
         */
        public fun resumeFromPendingPayment(
            bookingId: String,
            razorpayOrderId: String,
            amount: Int,
        ) {
            pendingBookingId = bookingId
            _uiState.value =
                BookingUiState.AwaitingPayment(
                    bookingId = bookingId,
                    razorpayOrderId = razorpayOrderId,
                    amount = amount,
                )
        }

        public fun startPayment(
            serviceId: String,
            categoryId: String,
            activity: FragmentActivity? = null,
        ) {
            viewModelScope.launch {
                if (activity != null && biometricGate.canUseBiometric(activity)) {
                    val result =
                        biometricGate.requestAuth(
                            activity,
                            "Confirm Payment",
                            "Authenticate to authorise this booking payment",
                        )
                    if (result !is BiometricResult.Authenticated) return@launch
                }
                startBooking(serviceId, categoryId, BookingPaymentMethod.RAZORPAY)
            }
        }

        public fun startBooking(
            serviceId: String,
            categoryId: String,
            paymentMethod: BookingPaymentMethod,
        ) {
            val state = _uiState.value as? BookingUiState.Ready ?: return
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
                    applyCredit = _applyCreditToggle.value,
                    preferFemaleTechnician = _preferFemaleTechnician.value,
                )
            viewModelScope.launch { executeCreateBooking(request) }
        }

        public fun retryNetworkError() {
            val request = lastNetworkErrorRequest ?: return
            _uiState.value = BookingUiState.CreatingBooking
            viewModelScope.launch { executeCreateBooking(request) }
        }

        private suspend fun executeCreateBooking(request: BookingRequest) {
            createBooking(request).first().fold(
                onSuccess = { result ->
                    lastNetworkErrorRequest = null
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
                onFailure = { e ->
                    if (e is IOException) {
                        lastNetworkErrorRequest = request
                        _uiState.value =
                            BookingUiState.NetworkError(
                                message = e.message ?: BOOKING_FAILED_FALLBACK,
                                pendingRequest = request,
                            )
                    } else {
                        _uiState.value = BookingUiState.Error(e.message ?: BOOKING_FAILED_FALLBACK)
                    }
                },
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
                            onSuccess = {
                                _uiState.value = BookingUiState.BookingConfirmed(bookingId)
                            },
                            onFailure = {
                                _uiState.value =
                                    BookingUiState.Error(
                                        it.message ?: CONFIRMATION_FAILED_FALLBACK,
                                    )
                            },
                        )
                }
                is PaymentResult.Failure ->
                    _uiState.value = BookingUiState.Error("PAYMENT_CANCELLED:${result.description}")
            }
        }

        private fun updateWomenSafeContext(slot: BookingSlot) {
            viewModelScope.launch {
                val slotHour = parseSlotStartHour(slot.window)
                val categories = catalogueRepository.getCategories().first().getOrNull() ?: emptyList()
                val isSafetyCategory =
                    categories.firstOrNull { it.id == pendingCategoryId }?.safetyTag ?: false
                _showWomenSafeToggle.value = slotHour >= WOMEN_SAFE_HOUR_THRESHOLD || isSafetyCategory
            }
        }

        private fun parseSlotStartHour(window: String): Int =
            // window format: "HH:mm-HH:mm" e.g. "19:00-21:00"
            runCatching { window.substringBefore(":").toInt() }.getOrDefault(0)
    }
