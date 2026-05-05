package com.homeservices.technician.observability

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
            )

        @JvmStatic
        public fun safeCases(): Stream<Arguments> =
            Stream.of(
                Arguments.of("plain error message", "Cannot complete job without photo"),
                Arguments.of("file path", "at com.homeservices.technician.JobViewModel.markReached:55"),
                Arguments.of("HTTP status text", "Job accepted successfully"),
                Arguments.of("short numeric id", "jobId: 12345"),
            )
    }
}
