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
import com.homeservices.customer.domain.booking.model.RazorpayErrorCode
import com.homeservices.customer.observability.analytics.AnalyticsEvents
import com.homeservices.customer.observability.analytics.AnalyticsFacade
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
        private val analytics: AnalyticsFacade,
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
        private var pendingAppliedCredit: Int = 0
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

        /** Sets the available wallet balance in paise. Auto-enables the toggle when balance > 0. */
        public fun setWalletBalance(paise: Long) {
            _walletBalanceInPaise.value = paise
            if (paise > 0L) {
                _applyCreditToggle.value = true
            }
        }

        /** Called by the UI when the user flips the "Apply credit" toggle. */
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
                    slot = BookingSlot("", ""),
                    addressText = "",
                    lat = 0.0,
                    lng = 0.0,
                )
        }

        /**
         * Initiates online (Razorpay) payment with biometric gate.
         *
         * Security gate (fires every call):
         * - null activity: fail closed, do NOT proceed.
         * - canUseBiometric=true: require Authenticated; non-Authenticated blocks.
         * - canUseBiometric=false: skip gate, proceed.
         */
        public fun startPayment(
            serviceId: String,
            categoryId: String,
            activity: FragmentActivity?,
        ) {
            if (activity == null) return
            viewModelScope.launch {
                if (biometricGate.canUseBiometric(activity)) {
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

        /** Creates a booking. Cash bookings call this directly - no biometric gate. */
        @Suppress("LongMethod")
        public fun startBooking(
            serviceId: String,
            categoryId: String,
            paymentMethod: BookingPaymentMethod,
        ) {
            val state = _uiState.value as? BookingUiState.Ready ?: return
            // Synchronous transition BEFORE viewModelScope.launch to close the duplicate-tap
            // race: a second tap within the same frame must see CreatingBooking, not Ready,
            // and bail at the `as? Ready ?: return` guard above. See PRD-03.
            _uiState.value = BookingUiState.CreatingBooking
            runCatching {
                analytics.track(
                    AnalyticsEvents.BOOKING_CREATE_START,
                    mapOf("service_id" to serviceId, "category_id" to categoryId),
                )
            }
            viewModelScope.launch {
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
                executeCreateBooking(request)
            }
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
                    pendingAppliedCredit = result.appliedCreditAmount
                    if (result.requiresPayment) {
                        runCatching {
                            analytics.track(
                                AnalyticsEvents.PAYMENT_INITIATED,
                                mapOf("booking_id" to result.bookingId),
                            )
                        }
                        _uiState.value =
                            BookingUiState.AwaitingPayment(
                                bookingId = result.bookingId,
                                razorpayOrderId = result.razorpayOrderId,
                                amount = result.amount,
                                slot = request.slot,
                                addressText = request.addressText,
                                lat = request.addressLat,
                                lng = request.addressLng,
                            )
                    } else {
                        runCatching {
                            analytics.track(
                                AnalyticsEvents.BOOKING_CREATE_SUCCESS,
                                mapOf("booking_id" to result.bookingId),
                            )
                        }
                        _uiState.value =
                            BookingUiState.BookingConfirmed(
                                bookingId = result.bookingId,
                                appliedCreditAmount = result.appliedCreditAmount,
                            )
                    }
                },
                onFailure = { error ->
                    if (error is IOException) {
                        lastNetworkErrorRequest = request
                        _uiState.value =
                            BookingUiState.NetworkError(
                                message = error.message ?: BOOKING_FAILED_FALLBACK,
                                pendingRequest = request,
                            )
                    } else {
                        _uiState.value = BookingUiState.Error(error.message ?: BOOKING_FAILED_FALLBACK)
                    }
                },
            )
        }

        /** Re-opens the Razorpay checkout for the same order. */
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

        /** Cancels from PaymentFailed back to Ready so the user can change payment method. */
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
                            onSuccess = {
                                runCatching {
                                    analytics.track(
                                        AnalyticsEvents.PAYMENT_SUCCESS,
                                        mapOf("booking_id" to bookingId),
                                    )
                                }
                                runCatching {
                                    analytics.track(
                                        AnalyticsEvents.BOOKING_CREATE_SUCCESS,
                                        mapOf("booking_id" to bookingId),
                                    )
                                }
                                _uiState.value =
                                    BookingUiState.BookingConfirmed(
                                        bookingId = bookingId,
                                        appliedCreditAmount = pendingAppliedCredit,
                                    )
                            },
                            // Error message key: R.string.booking_error_confirmation_failed surfaced in UI layer
                            onFailure = { _uiState.value = BookingUiState.Error(it.message ?: CONFIRMATION_FAILED_FALLBACK) },
                        )
                }
                is PaymentResult.Failure -> {
                    val awaitingSnapshot = _uiState.value as? BookingUiState.AwaitingPayment
                    val errorCode = RazorpayErrorCode.resolve(result.code, result.description)
                    runCatching {
                        analytics.track(
                            AnalyticsEvents.PAYMENT_FAILURE,
                            mapOf("booking_id" to bookingId, "reason" to result.description),
                        )
                    }
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

        private fun updateWomenSafeContext(slot: BookingSlot) {
            viewModelScope.launch {
                val slotHour = parseSlotStartHour(slot.window)
                val categories = catalogueRepository.getCategories().first().getOrNull() ?: emptyList()
                val isSafetyCategory =
                    categories.firstOrNull { it.id == pendingCategoryId }?.safetyTag ?: false
                _showWomenSafeToggle.value = slotHour >= WOMEN_SAFE_HOUR_THRESHOLD || isSafetyCategory
            }
        }

        private fun parseSlotStartHour(window: String): Int = runCatching { window.substringBefore(":").toInt() }.getOrDefault(0)
    }
