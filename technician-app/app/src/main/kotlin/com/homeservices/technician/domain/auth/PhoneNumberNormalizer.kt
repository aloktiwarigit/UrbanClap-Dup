package com.homeservices.technician.domain.auth

internal object PhoneNumberNormalizer {
    private const val INDIA_COUNTRY_CODE = "91"
    private val e164Pattern = Regex("""^\+[1-9]\d{9,14}$""")
    private val indianMobilePattern = Regex("""^[6-9]\d{9}$""")

    internal fun normalize(raw: String): String? {
        val compact = raw.trim().filterNot { it.isWhitespace() || it == '-' }
        if (compact.matches(e164Pattern)) {
            return compact
        }

        val digits = compact.filter(Char::isDigit)
        val indianMobile =
            when {
                digits.matches(indianMobilePattern) -> digits
                digits.length == 11 && digits.startsWith("0") ->
                    digits.drop(1).takeIf {
                        it.matches(indianMobilePattern)
                    }
                digits.length == 12 && digits.startsWith(INDIA_COUNTRY_CODE) ->
                    digits.drop(2).takeIf {
                        it.matches(indianMobilePattern)
                    }
                else -> null
            } ?: return null

        return "+$INDIA_COUNTRY_CODE$indianMobile"
    }
}
