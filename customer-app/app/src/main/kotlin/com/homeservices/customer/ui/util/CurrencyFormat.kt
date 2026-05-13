package com.homeservices.customer.ui.util

import java.text.NumberFormat
import java.util.Locale

private val INR_FORMAT_LOCAL: ThreadLocal<NumberFormat> =
    ThreadLocal.withInitial {
        NumberFormat.getCurrencyInstance(Locale("en", "IN"))
    }

/**
 * Formats a paise amount as Indian Rupees using [NumberFormat.getCurrencyInstance].
 *
 * Returns e.g. "₹1,299.00" for 129900 paise.
 *
 * Thread-safe: uses a [ThreadLocal] [NumberFormat] instance because [NumberFormat] is
 * not thread-safe.
 *
 * AC-2 of E12-S02a: replaces all `formatRupees` / `"Rs ..."` literals.
 */
private const val PAISE_PER_RUPEE = 100.0

public fun formatInr(paise: Long): String {
    val rupees = paise / PAISE_PER_RUPEE
    return INR_FORMAT_LOCAL.get()?.format(rupees) ?: "₹$rupees"
}
