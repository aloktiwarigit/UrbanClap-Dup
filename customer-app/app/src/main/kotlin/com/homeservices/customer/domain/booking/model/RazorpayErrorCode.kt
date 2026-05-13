package com.homeservices.customer.domain.booking.model

/**
 * Stable Razorpay Android SDK error code strings derived from the integer code
 * returned by [com.razorpay.PaymentResultWithDataListener.onPaymentError].
 *
 * Razorpay SDK integer → string mapping:
 *  0 = BAD_REQUEST_ERROR (covers bad-request failures)
 *  1 = NETWORK_ERROR     (covers network timeouts / no connectivity)
 *  2 = SERVER_ERROR      (Razorpay server-side error)
 *
 * PAYMENT_CANCELLED is a logical sub-case of BAD_REQUEST_ERROR (code 0) where
 * the description indicates the user dismissed the checkout sheet. We detect it
 * by examining the description string — the Razorpay SDK does not provide a
 * separate integer constant for user-initiated cancellation.
 *
 * References:
 *  - https://razorpay.com/docs/payments/payment-gateway/android-integration/standard/#handle-payment-success-failure
 */
public object RazorpayErrorCode {
    public const val PAYMENT_CANCELLED: String = "PAYMENT_CANCELLED"
    public const val NETWORK_ERROR: String = "NETWORK_ERROR"
    public const val BAD_REQUEST_ERROR: String = "BAD_REQUEST_ERROR"
    public const val SERVER_ERROR: String = "SERVER_ERROR"

    /** Razorpay SDK integer code for network failures. */
    private const val SDK_CODE_NETWORK: Int = 1

    /**
     * Resolves a [code] + [description] pair from the Razorpay SDK into a stable
     * error-code string that can be used for string-resource look-up.
     */
    public fun resolve(
        code: Int,
        description: String,
    ): String =
        when {
            code == SDK_CODE_NETWORK -> NETWORK_ERROR
            isCancellation(description) -> PAYMENT_CANCELLED
            else -> BAD_REQUEST_ERROR
        }

    /**
     * Returns true when the description text indicates the user actively dismissed
     * the Razorpay checkout sheet rather than a system/network error.
     *
     * Razorpay SDK v1.6.x emits one of these descriptions on manual dismissal:
     *   "Payment cancelled by user."
     *   "Payment cancelled."
     *   The sentence is stable across SDK versions per the Razorpay changelog.
     */
    private fun isCancellation(description: String): Boolean {
        val lower = description.lowercase()
        return lower.contains("cancelled") || lower.contains("canceled")
    }
}
