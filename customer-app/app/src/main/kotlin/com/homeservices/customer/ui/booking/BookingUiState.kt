package com.homeservices.customer.ui.booking

import com.homeservices.customer.domain.booking.model.BookingSlot

public sealed class BookingUiState {
    public object Idle : BookingUiState()

    public data class Ready(
        val slot: BookingSlot,
        val addressText: String,
        val lat: Double,
        val lng: Double,
    ) : BookingUiState()

    public object CreatingBooking : BookingUiState()

    public data class AwaitingPayment(
        val bookingId: String,
        val razorpayOrderId: String,
        val amount: Int,
        // Snapshot of the Ready state at payment-launch time; used to restore
        // the booking summary if the user cancels from PaymentFailed.
        val slot: BookingSlot,
        val addressText: String,
        val lat: Double,
        val lng: Double,
    ) : BookingUiState()

    public object ConfirmingPayment : BookingUiState()

    public data class BookingConfirmed(
        val bookingId: String,
    ) : BookingUiState()

    /**
     * Emitted when the Razorpay callback returns a failure.
     * The [orderId] and [amount] are preserved from [AwaitingPayment] so the UI can re-open
     * Razorpay checkout on the same order (Razorpay supports retry until server-side capture).
     *
     * @param orderId     Razorpay order ID — unchanged for retry
     * @param amount      Amount in paise (same as original checkout)
     * @param reason      Localised, user-facing reason string (resolved by ViewModel)
     * @param errorCode   Stable Razorpay error code string (e.g. "PAYMENT_CANCELLED")
     */
    public data class PaymentFailed(
        val orderId: String,
        val amount: Int,
        val reason: String,
        val errorCode: String,
        // Snapshot forwarded from AwaitingPayment; used by cancelPaymentFailed()
        // to restore the Ready state so the user can change payment method.
        val slot: BookingSlot,
        val addressText: String,
        val lat: Double,
        val lng: Double,
    ) : BookingUiState()

    public data class Error(
        val message: String,
    ) : BookingUiState()
}
