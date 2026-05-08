package com.homeservices.customer.domain.auth

internal object PhoneNumberNormalizer {
    private const val INDIA_COUNTRY_CODE = "91"
    private const val STD_DIALLED_LENGTH = 11 // "0" prefix + 10-digit mobile
    private const val ISD_DIALLED_LENGTH = 12 // "91" prefix + 10-digit mobile
    private val e164Pattern = Regex("""^\+[1-9]\d{9,14}$""")
    private val indianMobilePattern = Regex("""^[6-9]\d{9}$""")

    @Suppress("ReturnCount") // Three returns are the clearest expression of this normalisation logic.
    internal fun normalize(raw: String): String? {
        val compact = raw.trim().filterNot { it.isWhitespace() || it == '-' }
        if (compact.matches(e164Pattern)) {
            return compact
        }

        val digits = compact.filter(Char::isDigit)
        val indianMobile =
            when {
                digits.matches(indianMobilePattern) -> digits
                digits.length == STD_DIALLED_LENGTH && digits.startsWith("0") ->
                    digits.drop(1).takeIf {
                        it.matches(indianMobilePattern)
                    }
                digits.length == ISD_DIALLED_LENGTH && digits.startsWith(INDIA_COUNTRY_CODE) ->
                    digits.drop(2).takeIf {
                        it.matches(indianMobilePattern)
                    }
                else -> null
            } ?: return null

        return "+$INDIA_COUNTRY_CODE$indianMobile"
    }
}
