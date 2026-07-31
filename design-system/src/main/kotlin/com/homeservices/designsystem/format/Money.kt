package com.homeservices.designsystem.format

/**
 * The single money formatter for every Android surface. D1 §Content:
 * "Money must be formatted with locale-aware INR helpers, including Indian digit grouping and paise
 * handling. Do not render ASCII `Rs` or truncate paise with integer division."
 *
 * Before S-31 money was rendered seven different ways across the two apps and the design system,
 * disagreeing on the glyph, on paise, and on digit grouping. Three defect classes were live:
 *
 * 1. ASCII `"Rs"` instead of ₹ (`TechnicianHomeScreen`, `HsPriceText`).
 * 2. Integer division truncating paise — `₹${paise / 100}` rendered 129999 as "₹1299", silently
 *    losing ₹0.99. This product collects cash at the door, so a technician reconciles physical notes
 *    against the on-screen figure; a silent sub-rupee discrepancy is an accounting defect.
 * 3. `"%,.0f"` inheriting `Locale.getDefault()`, so grouping was Western on any device not set to an
 *    Indian locale — `1,234,567` where the user expects `12,34,567`.
 *
 * ## Why grouping is locale-INDEPENDENT here
 *
 * Deliberately not `NumberFormat.getCurrencyInstance(Locale.getDefault())`. Indian digit grouping is
 * a property of the currency and the market, not of the user's interface language: a Hindi-reading
 * and an English-reading customer in Ayodhya both expect `12,34,567`. Deriving grouping from the UI
 * locale is exactly the bug above, one level up. [groupIndian] applies 2,2,3 grouping directly, so it
 * is identical regardless of device settings; a test asserts that under en-US, en-IN, hi-IN and de-DE.
 *
 * ## Why paise are conditional
 *
 * Catalogue prices are whole rupees and `₹599.00` adds noise to every card. Ledger and settlement
 * figures genuinely carry paise. Showing the decimal only when non-zero keeps both honest without
 * making callers choose — a caller who has to pick a format is a caller who will pick differently
 * from the next one, which is how seven formatters happened.
 *
 * Render with [com.homeservices.designsystem.theme.HomeservicesMonoFontFamily] wherever amounts are
 * columnar (earnings rows, ledgers, admin tables); proportional digits will not align down a column.
 */
private const val PAISE_PER_RUPEE = 100L

/**
 * Indian 2,2,3 grouping is applied by hand. Two approaches were tried first and both failed:
 *
 * 1. **A `DecimalFormat` pattern** (`"##,##,##,##0"`). Java honours only the *rightmost* grouping
 *    size and repeats it, so the pattern silently yields Western `1,234,567`.
 * 2. **JDK locale data** (`NumberFormat.getNumberInstance(Locale("en","IN"))`). Measured on the
 *    JDK 17 that runs these tests: `1,234,567`. Western again.
 *
 * That second result matters beyond this function. `customer-app`'s existing
 * `CurrencyFormat.formatInr` is built on `NumberFormat.getCurrencyInstance(Locale("en","IN"))` and
 * was treated — by the audit and by this story's brief — as the one *correct* implementation to
 * converge on. It is not: it renders `₹1,234,567.00`. All seven Android formatters got Indian
 * grouping wrong; they merely disagreed about how.
 *
 * Doing it explicitly also removes a portability hazard: locale data differs between the local JDK
 * 17 and CI's JDK 21, so anything derived from it could format differently in CI than on a
 * developer's machine — and differently again on a handset.
 *
 * The rule: rightmost group of 3, then groups of 2.
 */
private const val FIRST_GROUP_DIGITS = 3

private const val SUBSEQUENT_GROUP_DIGITS = 2

private fun groupIndian(digits: String): String {
    if (digits.length <= FIRST_GROUP_DIGITS) return digits
    val head = digits.dropLast(FIRST_GROUP_DIGITS)
    val tail = digits.takeLast(FIRST_GROUP_DIGITS)
    val grouped = StringBuilder()
    var index = head.length
    while (index > SUBSEQUENT_GROUP_DIGITS) {
        grouped.insert(0, "," + head.substring(index - SUBSEQUENT_GROUP_DIGITS, index))
        index -= SUBSEQUENT_GROUP_DIGITS
    }
    grouped.insert(0, head.substring(0, index))
    return "$grouped,$tail"
}

/**
 * Formats [paise] as Indian Rupees.
 *
 * Whole amounts render without a decimal tail (`₹599`); amounts carrying paise keep both digits
 * (`₹1,299.99`). Negative amounts place the sign outside the glyph (`-₹500`), which reads correctly
 * for refunds and adjustments — `₹-500` does not.
 *
 * @param paise the amount in paise. Never pass rupees.
 */
public fun formatRupees(paise: Long): String {
    val negative = paise < 0L
    val magnitude = if (negative) -paise else paise

    val remainder = magnitude % PAISE_PER_RUPEE
    val body =
        if (remainder == 0L) {
            groupIndian((magnitude / PAISE_PER_RUPEE).toString())
        } else {
            // Integer arithmetic only. No Double anywhere: a Double cannot represent every paise
            // value exactly, and rounding error in a money figure is the defect this exists to stop.
            val rupees = groupIndian((magnitude / PAISE_PER_RUPEE).toString())
            val paisePart = (magnitude % PAISE_PER_RUPEE).toString().padStart(2, '0')
            "$rupees.$paisePart"
        }

    return if (negative) "-₹$body" else "₹$body"
}

/**
 * [Int] overload for callers holding `pricePaise` as an `Int` — the catalogue screens and
 * [com.homeservices.designsystem.components.HsPriceText].
 *
 * Provided so those call sites do not each write their own `.toLong()` conversion, which is how the
 * formatters diverged in the first place.
 */
public fun formatRupees(paise: Int): String = formatRupees(paise.toLong())
