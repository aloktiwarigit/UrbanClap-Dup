package com.homeservices.customer.observability

import io.sentry.SentryEvent
import io.sentry.protocol.SentryException

/**
 * PII redaction utilities for Sentry events (E13-S04, ADR-0018).
 *
 * Applies to all string values captured in Sentry event messages, exception
 * values, and breadcrumb data before transmission.
 *
 * Patterns (Indian context):
 *   - Indian mobile numbers:  \b[6-9]\d{9}\b
 *   - Email addresses:        [\w._%+\-]+@[\w.\-]+\.\w{2,}
 *   - Aadhaar numbers:        \b\d{4}\s?\d{4}\s?\d{4}\b
 *   - PAN card numbers:       \b[A-Z]{5}\d{4}[A-Z]\b
 *   - JWT tokens:             eyJ[A-Za-z0-9_\-]{21,}
 */
public object PiiRedactor {

    private val PHONE_RE = Regex("""\b[6-9]\d{9}\b""")
    private val EMAIL_RE = Regex("""[\w._%+\-]+@[\w.\-]+\.\w{2,}""")
    private val AADHAAR_RE = Regex("""\b\d{4}\s?\d{4}\s?\d{4}\b""")
    private val PAN_RE = Regex("""\b[A-Z]{5}\d{4}[A-Z]\b""")
    private val JWT_RE = Regex("""eyJ[A-Za-z0-9_\-]{21,}""")

    /** Redact all PII patterns in a single string. */
    public fun redact(input: String): String = input
        .replace(PHONE_RE, "[REDACTED_PHONE]")
        .replace(EMAIL_RE, "[REDACTED_EMAIL]")
        .replace(AADHAAR_RE, "[REDACTED_AADHAAR]")
        .replace(PAN_RE, "[REDACTED_PAN]")
        .replace(JWT_RE, "[REDACTED_JWT]")

    /**
     * Scrub a [SentryEvent] in place before it is transmitted.
     *
     * - Redacts the event message.
     * - Redacts exception value messages (stack traces left intact).
     * - Redacts breadcrumb messages.
     * - Returns the mutated event (Sentry SDK requires the same instance).
     */
    public fun scrub(event: SentryEvent): SentryEvent {
        // Scrub top-level message
        event.message?.let { msg ->
            msg.message?.let { text -> msg.message = redact(text) }
            msg.formatted?.let { text -> msg.formatted = redact(text) }
        }

        // Scrub exception value messages (preserve stack frames)
        event.exceptions?.forEach { exc: SentryException ->
            exc.value?.let { value -> exc.value = redact(value) }
        }

        // Scrub breadcrumb messages
        event.breadcrumbs?.forEach { crumb ->
            crumb.message?.let { text -> crumb.message = redact(text) }
        }

        return event
    }
}
