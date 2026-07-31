package com.homeservices.designsystem.format

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

/**
 * S-31 — one money formatter for every Android surface.
 *
 * Before this story money was rendered seven different ways, disagreeing on all three of the things
 * that matter:
 *
 * | site                              | glyph | paise      | grouping        |
 * |-----------------------------------|-------|------------|-----------------|
 * | customer `CurrencyFormat.formatInr` | ₹   | correct    | en-IN (correct) |
 * | `ServiceDetailScreen:621`         | ₹     | TRUNCATED  | none            |
 * | `ServiceListScreen:400`           | ₹     | TRUNCATED  | none            |
 * | `EarningsScreen:384`              | ₹     | rounded    | DEFAULT locale  |
 * | `TechnicianHomeScreen:1350`       | "Rs"  | rounded    | DEFAULT locale  |
 * | `HsComponents.HsPriceText:207`    | "Rs"  | TRUNCATED  | none            |
 *
 * Three distinct defect classes, each shipped to real users:
 *
 * 1. **ASCII "Rs"** instead of ₹ — flagged in the audit as failing the Hindi-first bar.
 * 2. **Integer division truncates paise.** `₹${paise / 100}` renders 129999 paise as "₹1299",
 *    silently losing ₹0.99. On a cash-collection product where the technician counts physical notes
 *    against an on-screen figure, that is a reconciliation defect, not a formatting nit.
 * 3. **`"%,.0f"` uses `Locale.getDefault()`**, so grouping is Western on any device not set to an
 *    Indian locale: `1,234,567` where an Indian user expects `12,34,567`. This is the subtle one —
 *    it looks correct on a developer's machine and wrong in the field.
 *
 * This formatter is deliberately locale-INDEPENDENT for grouping: Indian digit grouping is a
 * property of the currency and the market, not of the user's UI language. A Hindi user and an
 * English user in Ayodhya both expect 12,34,567.
 */
internal class MoneyTest {
    @Test
    internal fun `renders the rupee glyph, never ASCII Rs`() {
        val out = formatRupees(59900L)
        assertThat(out).startsWith("₹")
        assertThat(out).doesNotContain("Rs")
    }

    @Test
    internal fun `whole rupees render without a decimal tail`() {
        assertThat(formatRupees(59900L)).isEqualTo("₹599")
    }

    @Test
    internal fun `paise are preserved, not truncated`() {
        // The old `₹${paise / 100}` rendered this as ₹1299, silently dropping ₹0.99.
        assertThat(formatRupees(129999L)).isEqualTo("₹1,299.99")
    }

    @Test
    internal fun `a single trailing paisa still shows`() {
        assertThat(formatRupees(59901L)).isEqualTo("₹599.01")
    }

    @Test
    internal fun `uses Indian lakh grouping, not Western thousands`() {
        // Western grouping would give ₹1,234,567 — the bug in every "%,.0f" call site.
        assertThat(formatRupees(123456700L)).isEqualTo("₹12,34,567")
    }

    @Test
    internal fun `uses Indian crore grouping`() {
        assertThat(formatRupees(1234567800L)).isEqualTo("₹1,23,45,678")
    }

    @Test
    internal fun `grouping does not depend on the device locale`() {
        // Regression guard for the "%,.0f" class of bug: identical output regardless of default
        // locale. Indian grouping is a property of the currency, not the UI language.
        val defaults = listOf("en-US", "en-IN", "hi-IN", "de-DE")
        val outputs =
            defaults.map { tag ->
                val previous = java.util.Locale.getDefault()
                try {
                    java.util.Locale.setDefault(java.util.Locale.forLanguageTag(tag))
                    formatRupees(123456700L)
                } finally {
                    java.util.Locale.setDefault(previous)
                }
            }
        assertThat(outputs.distinct())
            .`as`("formatter must not inherit device grouping: %s", outputs)
            .containsExactly("₹12,34,567")
    }

    @Test
    internal fun `zero renders as zero rupees, not blank`() {
        assertThat(formatRupees(0L)).isEqualTo("₹0")
    }

    @Test
    internal fun `negative amounts keep the sign outside the glyph`() {
        // Refunds and adjustments are negative. "-₹500" reads correctly; "₹-500" does not.
        assertThat(formatRupees(-50000L)).isEqualTo("-₹500")
    }

    @Test
    internal fun `small paise-only amounts do not collapse to zero`() {
        assertThat(formatRupees(45L)).isEqualTo("₹0.45")
    }

    /**
     * Codex review MAJOR — `Long.MIN_VALUE` has no positive counterpart, so negating it overflows
     * back to itself. The first implementation negated before splitting, which sent a minus sign
     * into the grouping routine and produced `-₹-,92,23,37,20,36,85,47,758.-8`.
     *
     * Not reachable with real money, but a shared money formatter should have no input that yields
     * nonsense — a corrupt value or an upstream overflow reaching UI state should still render as
     * something, not as a malformed string a user might read as an amount.
     */
    @Test
    internal fun `extreme negative input does not overflow`() {
        val out = formatRupees(Long.MIN_VALUE)
        assertThat(out).startsWith("-₹")
        assertThat(out.drop(2)).doesNotContain("-")
        assertThat(out).isEqualTo("-₹92,23,37,20,36,85,47,758.08")
    }

    @Test
    internal fun `extreme positive input formats cleanly`() {
        assertThat(formatRupees(Long.MAX_VALUE)).isEqualTo("₹92,23,37,20,36,85,47,758.07")
    }

    @Test
    internal fun `Int overload exists for callers holding pricePaise as Int`() {
        // HsPriceText and the catalogue screens hold Int; without this overload they would each
        // write their own `.toLong()` conversion and drift again.
        assertThat(formatRupees(59900)).isEqualTo("₹599")
    }
}
