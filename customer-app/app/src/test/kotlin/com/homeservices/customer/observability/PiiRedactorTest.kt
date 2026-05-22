package com.homeservices.customer.observability

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.Arguments
import org.junit.jupiter.params.provider.MethodSource
import java.util.stream.Stream

/**
 * TDD (E13-S04) — PiiRedactor.redact() table-driven tests.
 *
 * Each row: (input, expected-output) pair.  Tests verify each PII type is
 * scrubbed and that non-PII text passes through unmodified.
 */
public class PiiRedactorTest {
    @ParameterizedTest(name = "{0}")
    @MethodSource("redactCases")
    public fun `redact should replace PII patterns`(
        description: String,
        input: String,
        expected: String,
    ) {
        assertEquals(expected, PiiRedactor.redact(input), description)
    }

    @ParameterizedTest(name = "plain text unchanged: {0}")
    @MethodSource("safeCases")
    public fun `redact should preserve non-PII text`(
        description: String,
        input: String,
    ) {
        val result = PiiRedactor.redact(input)
        // Must not introduce a REDACTED marker
        assertFalse(result.contains("[REDACTED"), "Expected no redaction in: $input → got: $result")
    }

    public companion object {
        @JvmStatic
        public fun redactCases(): Stream<Arguments> =
            Stream.of(
                // Indian mobile number (10 digits starting 6-9)
                Arguments.of(
                    "phone number in sentence",
                    "User 9876543210 called",
                    "User [REDACTED_PHONE] called",
                ),
                Arguments.of(
                    "phone number at string start",
                    "9876543210 is the contact",
                    "[REDACTED_PHONE] is the contact",
                ),
                // Email
                Arguments.of(
                    "email address",
                    "Send invoice to user@example.com now",
                    "Send invoice to [REDACTED_EMAIL] now",
                ),
                Arguments.of(
                    "email with plus sign",
                    "user+tag@domain.co.in signed up",
                    "[REDACTED_EMAIL] signed up",
                ),
                // Aadhaar (12-digit, optionally spaced in groups of 4)
                Arguments.of(
                    "Aadhaar spaced format",
                    "Aadhaar 1234 5678 9012 verified",
                    "Aadhaar [REDACTED_AADHAAR] verified",
                ),
                Arguments.of(
                    "Aadhaar compact format",
                    "Aadhaar 123456789012 submitted",
                    "Aadhaar [REDACTED_AADHAAR] submitted",
                ),
                // PAN
                Arguments.of(
                    "PAN card number",
                    "PAN ABCDE1234F is on file",
                    "PAN [REDACTED_PAN] is on file",
                ),
                // JWT (starts with eyJ…)
                Arguments.of(
                    "JWT Bearer token",
                    "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMTIzIn0.sig",
                    "Bearer [REDACTED_JWT].eyJzdWIiOiJ1c2VyMTIzIn0.sig",
                ),
                // PHONE_INTL_RE — with +91 prefix
                Arguments.of(
                    "phone with +91 country code and hyphen",
                    "Call +91-9876543210 for support",
                    "Call [REDACTED_PHONE] for support",
                ),
                Arguments.of(
                    "phone with +91 space",
                    "+91 9876543210 is the number",
                    "[REDACTED_PHONE] is the number",
                ),
                // IPV4_RE
                Arguments.of(
                    "IPv4 address",
                    "Server at 192.168.1.1 is down",
                    "Server at [REDACTED_IPV4] is down",
                ),
                // RAZORPAY_RE
                Arguments.of(
                    "Razorpay payment ID",
                    "Payment pay_ABCdef1234 processed",
                    "Payment [REDACTED_RAZORPAY] processed",
                ),
                Arguments.of(
                    "Razorpay order ID",
                    "Order order_XYZ987abc created",
                    "Order [REDACTED_RAZORPAY] created",
                ),
                // LATLNG_RE
                Arguments.of(
                    "latitude coordinate",
                    "Location 28.613939 N",
                    "Location [REDACTED_LATLNG] N",
                ),
            )

        @JvmStatic
        public fun safeCases(): Stream<Arguments> =
            Stream.of(
                Arguments.of("plain error message", "Cannot read property x of undefined"),
                Arguments.of("file path", "at com.homeservices.customer.BookingViewModel.createBooking:42"),
                Arguments.of("HTTP status text", "Booking confirmed successfully"),
                Arguments.of("short numeric id", "bookingId: 12345"),
                Arguments.of("short decimal no PII", "score 4.5 out of 5"),
                Arguments.of("price rupees", "price 299.99 INR"),
                Arguments.of("non-Razorpay underscore", "event_tracking_id"),
            )
    }
}
