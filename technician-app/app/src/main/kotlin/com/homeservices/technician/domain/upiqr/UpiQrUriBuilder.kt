package com.homeservices.technician.domain.upiqr

import java.math.BigDecimal
import java.math.RoundingMode
import java.net.URLEncoder

/**
 * Builds the `upi://pay` deep-link consumed by every UPI app to render a payment request.
 * `am` must be rupees with exactly two decimal places, not paise — the field name in this
 * function's own parameter (`amountPaise`) is the unit callers pass; the conversion happens here.
 */
public object UpiQrUriBuilder {
    private const val PAISE_PER_RUPEE = 100

    public fun build(
        vpa: String,
        payeeName: String,
        amountPaise: Int,
        bookingId: String,
    ): String {
        val rupees = BigDecimal(amountPaise).divide(BigDecimal(PAISE_PER_RUPEE)).setScale(2, RoundingMode.HALF_UP)

        fun enc(s: String) = URLEncoder.encode(s, "UTF-8").replace("+", "%20")
        return "upi://pay?pa=${enc(vpa)}&pn=${enc(payeeName)}&am=$rupees&cu=INR&tn=${enc(bookingId)}"
    }
}
