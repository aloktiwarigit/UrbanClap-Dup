package com.homeservices.corenav

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test

/**
 * Unit tests for [DeepLinkUri.build] and [DeepLinkUri.parse].
 *
 * Covers:
 *  - round-trip fidelity
 *  - URL encoding of special characters in arg values
 *  - null return on malformed URIs
 *  - empty args map
 *  - multiple args
 */
public class DeepLinkUriTest {
    private fun intent(
        type: PendingActionType = PendingActionType.JOB_OFFER,
        entityId: String = "entity-1",
        rawArgs: Map<String, String> = emptyMap(),
    ) = NotificationIntent(type = type, entityId = entityId, rawArgs = rawArgs)

    // ── Build → Parse round-trips ─────────────────────────────────────────────

    @Nested
    public inner class RoundTripTests {
        @Test
        public fun `simple intent with no args round-trips`() {
            val original = intent(PendingActionType.JOB_OFFER, "entity-abc")
            val uri = DeepLinkUri.build(original)
            val parsed = DeepLinkUri.parse(uri)

            assertThat(parsed).isNotNull
            assertThat(parsed!!.type).isEqualTo(original.type)
            assertThat(parsed.entityId).isEqualTo(original.entityId)
        }

        @Test
        public fun `intent with single arg round-trips`() {
            val original =
                intent(
                    type = PendingActionType.ADDON_APPROVAL_REQUESTED,
                    entityId = "booking-123",
                    rawArgs = mapOf("bookingId" to "booking-123"),
                )
            val uri = DeepLinkUri.build(original)
            val parsed = DeepLinkUri.parse(uri)

            assertThat(parsed).isNotNull
            assertThat(parsed!!.type).isEqualTo(original.type)
            assertThat(parsed.entityId).isEqualTo(original.entityId)
            assertThat(parsed.rawArgs["bookingId"]).isEqualTo("booking-123")
        }

        @Test
        public fun `intent with multiple args round-trips`() {
            val original =
                intent(
                    type = PendingActionType.COMPLAINT_UPDATE,
                    entityId = "complaint-99",
                    rawArgs = mapOf("complaintId" to "complaint-99", "role" to "customer"),
                )
            val uri = DeepLinkUri.build(original)
            val parsed = DeepLinkUri.parse(uri)

            assertThat(parsed).isNotNull
            assertThat(parsed!!.rawArgs).containsEntry("complaintId", "complaint-99")
            assertThat(parsed.rawArgs).containsEntry("role", "customer")
        }

        @Test
        public fun `entityId is always included in rawArgs after parse`() {
            val original = intent(PendingActionType.RATING_PROMPT_CUSTOMER, "bk-777")
            val uri = DeepLinkUri.build(original)
            val parsed = DeepLinkUri.parse(uri)

            assertThat(parsed).isNotNull
            assertThat(parsed!!.entityId).isEqualTo("bk-777")
        }
    }

    // ── URL Encoding ──────────────────────────────────────────────────────────

    @Nested
    public inner class UrlEncodingTests {
        @Test
        public fun `arg value with spaces round-trips via percent encoding`() {
            val original =
                intent(
                    type = PendingActionType.SUPPORT_FOLLOWUP,
                    entityId = "ticket-1",
                    rawArgs = mapOf("title" to "Hello World"),
                )
            val uri = DeepLinkUri.build(original)
            assertThat(uri).doesNotContain(" ") // must be encoded
            val parsed = DeepLinkUri.parse(uri)
            assertThat(parsed!!.rawArgs["title"]).isEqualTo("Hello World")
        }

        @Test
        public fun `arg value with ampersand does not corrupt other args`() {
            val original =
                intent(
                    type = PendingActionType.SUPPORT_FOLLOWUP,
                    entityId = "ticket-2",
                    rawArgs = mapOf("note" to "a&b", "other" to "value"),
                )
            val uri = DeepLinkUri.build(original)
            val parsed = DeepLinkUri.parse(uri)

            assertThat(parsed).isNotNull
            assertThat(parsed!!.rawArgs["note"]).isEqualTo("a&b")
            assertThat(parsed.rawArgs["other"]).isEqualTo("value")
        }

        @Test
        public fun `arg value with equals sign round-trips`() {
            val original =
                intent(
                    type = PendingActionType.SUPPORT_FOLLOWUP,
                    entityId = "ticket-3",
                    rawArgs = mapOf("data" to "key=value"),
                )
            val uri = DeepLinkUri.build(original)
            val parsed = DeepLinkUri.parse(uri)
            assertThat(parsed!!.rawArgs["data"]).isEqualTo("key=value")
        }

        @Test
        public fun `arg value with Hindi characters round-trips`() {
            val original =
                intent(
                    type = PendingActionType.SUPPORT_FOLLOWUP,
                    entityId = "ticket-4",
                    rawArgs = mapOf("label" to "सेवा"), // "service" in Hindi
                )
            val uri = DeepLinkUri.build(original)
            val parsed = DeepLinkUri.parse(uri)
            assertThat(parsed!!.rawArgs["label"]).isEqualTo("सेवा")
        }
    }

    // ── URI Schema Validation ─────────────────────────────────────────────────

    @Nested
    public inner class SchemaValidationTests {
        @Test
        public fun `built URI starts with homeservices scheme`() {
            val uri = DeepLinkUri.build(intent())
            assertThat(uri).startsWith("homeservices://action/")
        }

        @Test
        public fun `built URI contains type name`() {
            val uri = DeepLinkUri.build(intent(PendingActionType.JOB_OFFER))
            assertThat(uri).contains("JOB_OFFER")
        }
    }

    // ── Parse Error Handling ──────────────────────────────────────────────────

    @Nested
    public inner class ParseErrorTests {
        @Test
        public fun `parse returns null for completely malformed URI`() {
            val result = DeepLinkUri.parse("not-a-uri")
            assertThat(result).isNull()
        }

        @Test
        public fun `parse returns null for wrong scheme`() {
            val result = DeepLinkUri.parse("https://action/JOB_OFFER?entityId=x")
            assertThat(result).isNull()
        }

        @Test
        public fun `parse returns null for wrong host`() {
            val result = DeepLinkUri.parse("homeservices://other/JOB_OFFER?entityId=x")
            assertThat(result).isNull()
        }

        @Test
        public fun `parse returns null for unknown action type`() {
            val result = DeepLinkUri.parse("homeservices://action/UNKNOWN_TYPE?entityId=x")
            assertThat(result).isNull()
        }

        @Test
        public fun `parse returns null for missing entityId`() {
            val result = DeepLinkUri.parse("homeservices://action/JOB_OFFER")
            assertThat(result).isNull()
        }

        @Test
        public fun `parse returns null for empty string`() {
            val result = DeepLinkUri.parse("")
            assertThat(result).isNull()
        }
    }
}
