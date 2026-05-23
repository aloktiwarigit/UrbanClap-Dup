package com.homeservices.customer.domain.booking.model

/**
 * Stable Razorpay Android SDK error code strings derived from the integer code
 * returned by [com.razorpay.PaymentResultWithDataListener.onPaymentError].
 *
 * Razorpay SDK (com.razorpay:checkout:1.6.x) integer constants
 * from [com.razorpay.Checkout]:
 *
 *   Checkout.PAYMENT_CANCELED = 0  — user dismissed the checkout sheet
 *   Checkout.INVALID_OPTIONS  = 1  — bad merchant config / invalid Razorpay options
 *   Checkout.NETWORK_ERROR    = 2  — network timeout / no connectivity
 *   Checkout.TLS_ERROR        = 6  — TLS handshake failure (network-adjacent)
 *
 * Note: the Android SDK does NOT surface a SERVER_ERROR integer in onPaymentError.
 * Razorpay gateway outages are reported via webhook on the backend, not in-app.
 * SERVER_ERROR has therefore been removed to keep this model tight to actual SDK
 * behavior (see commit: fix(E18-S04): use real Razorpay SDK error codes).
 *
 * References:
 *  - https://razorpay.com/docs/payments/payment-gateway/android-integration/standard/#handle-payment-success-failure
 */
public object RazorpayErrorCode {
    public const val PAYMENT_CANCELLED: String = "PAYMENT_CANCELLED"
    public const val NETWORK_ERROR: String = "NETWORK_ERROR"
    public const val BAD_REQUEST_ERROR: String = "BAD_REQUEST_ERROR"

    /**
     * Checkout.PAYMENT_CANCELED = 0
     * User dismissed the checkout sheet (SDK's own cancellation constant).
     */
    private const val SDK_CODE_PAYMENT_CANCELED: Int = 0

    /**
     * Checkout.INVALID_OPTIONS = 1
     * Bad merchant configuration or invalid options passed to Razorpay.
     */
    private const val SDK_CODE_INVALID_OPTIONS: Int = 1

    /**
     * Checkout.NETWORK_ERROR = 2
     * Network timeout or no connectivity during payment.
     */
    private const val SDK_CODE_NETWORK: Int = 2

    /**
     * Checkout.TLS_ERROR = 6
     * TLS handshake failure — treated as a network-adjacent retryable error.
     */
    private const val SDK_CODE_TLS: Int = 6

    /**
     * Resolves a [code] from the Razorpay SDK into a stable error-code string
     * that can be used for string-resource look-up.
     *
     * Mapping (aligned to Checkout constants):
     *   code 0 (PAYMENT_CANCELED)  → PAYMENT_CANCELLED
     *   code 1 (INVALID_OPTIONS)   → BAD_REQUEST_ERROR
     *   code 2 (NETWORK_ERROR)     → NETWORK_ERROR
     *   code 6 (TLS_ERROR)         → NETWORK_ERROR  (retryable, network-adjacent)
     *   other                      → BAD_REQUEST_ERROR
     *
     * The [description] parameter is retained for logging purposes but is NOT
     * used for error-code resolution. Cancellation is detected via SDK code 0,
     * not by string-matching the description.
     */
    public fun resolve(
        code: Int,
        @Suppress("UNUSED_PARAMETER") description: String,
    ): String =
        when (code) {
            SDK_CODE_PAYMENT_CANCELED -> PAYMENT_CANCELLED
            SDK_CODE_NETWORK -> NETWORK_ERROR
            SDK_CODE_TLS -> NETWORK_ERROR
            SDK_CODE_INVALID_OPTIONS -> BAD_REQUEST_ERROR
            else -> BAD_REQUEST_ERROR
        }
}
