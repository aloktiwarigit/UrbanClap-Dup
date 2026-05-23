package com.homeservices.customer.notification

import com.homeservices.corenav.PendingActionType
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test

/**
 * JVM unit tests for [CustomerNotificationRouter].
 *
 * Covers all 5 customer FCM types + deep-link parsing.
 * Manual construction — no Hilt, per docs/patterns/hilt-module-android-test-scope.md.
 */
public class CustomerNotificationRouterTest {
    private lateinit var router: CustomerNotificationRouter

    @Before
    public fun setUp() {
        router = CustomerNotificationRouter()
    }

    // ── parseFcmData ──────────────────────────────────────────────────────────

    @Test
    public fun `parseFcmData returns ADDON_APPROVAL_REQUESTED for price-approval type`() {
        val data = mapOf("type" to "ADDON_APPROVAL_REQUESTED", "bookingId" to "bk1")
        val result = router.parseFcmData(data)

        assertThat(result).isNotNull
        assertThat(result!!.type).isEqualTo(PendingActionType.ADDON_APPROVAL_REQUESTED)
        assertThat(result.entityId).isEqualTo("bk1")
    }

    @Test
    public fun `parseFcmData returns RATING_PROMPT_CUSTOMER for rating type`() {
        val data = mapOf("type" to "RATING_PROMPT_CUSTOMER", "bookingId" to "bk2")
        val result = router.parseFcmData(data)

        assertThat(result).isNotNull
        assertThat(result!!.type).isEqualTo(PendingActionType.RATING_PROMPT_CUSTOMER)
        assertThat(result.entityId).isEqualTo("bk2")
    }

    @Test
    public fun `parseFcmData returns COMPLAINT_UPDATE for complaint type`() {
        val data = mapOf("type" to "COMPLAINT_UPDATE", "complaintId" to "cmp1", "bookingId" to "bk3")
        val result = router.parseFcmData(data)

        assertThat(result).isNotNull
        assertThat(result!!.type).isEqualTo(PendingActionType.COMPLAINT_UPDATE)
        assertThat(result.entityId).isEqualTo("cmp1")
    }

    @Test
    public fun `parseFcmData returns SUPPORT_FOLLOWUP for support type`() {
        val data = mapOf("type" to "SUPPORT_FOLLOWUP", "ticketId" to "t1")
        val result = router.parseFcmData(data)

        assertThat(result).isNotNull
        assertThat(result!!.type).isEqualTo(PendingActionType.SUPPORT_FOLLOWUP)
        assertThat(result.entityId).isEqualTo("t1")
    }

    @Test
    public fun `parseFcmData returns null for unknown type`() {
        val data = mapOf("type" to "UNKNOWN_TYPE", "bookingId" to "bk1")
        val result = router.parseFcmData(data)
        assertThat(result).isNull()
    }

    @Test
    public fun `parseFcmData returns null when type is missing`() {
        val data = mapOf("bookingId" to "bk1")
        val result = router.parseFcmData(data)
        assertThat(result).isNull()
    }

    @Test
    public fun `parseFcmData returns null when entityId is missing for booking type`() {
        val data = mapOf("type" to "ADDON_APPROVAL_REQUESTED")
        val result = router.parseFcmData(data)
        assertThat(result).isNull()
    }

    @Test
    public fun `parseFcmData preserves rawArgs from FCM payload`() {
        val data =
            mapOf(
                "type" to "COMPLAINT_UPDATE",
                "complaintId" to "cmp2",
                "sourceStatus" to "OPEN",
                "version" to "3",
            )
        val result = router.parseFcmData(data)

        assertThat(result).isNotNull
        assertThat(result!!.rawArgs["sourceStatus"]).isEqualTo("OPEN")
        assertThat(result.rawArgs["version"]).isEqualTo("3")
    }

    // ── Dual-shape payload (FIX 2 — projector shape) ─────────────────────────

    @Test
    public fun `parseFcmData with projector actionId+sourceId shape resolves entityId from sourceId`() {
        // Projector shape for ADDON_APPROVAL_REQUESTED without legacy bookingId hoisted
        val data =
            mapOf(
                "type" to "ADDON_APPROVAL_REQUESTED",
                "actionId" to "ADDON_APPROVAL_REQUESTED:customer:u1:booking:bk99",
                "sourceId" to "bk99",
                "payload" to """{"price":500}""",
            )
        val result = router.parseFcmData(data)

        assertThat(result).isNotNull
        assertThat(result!!.type).isEqualTo(PendingActionType.ADDON_APPROVAL_REQUESTED)
        assertThat(result.entityId).isEqualTo("bk99")
        assertThat(result.rawArgs["actionId"])
            .isEqualTo("ADDON_APPROVAL_REQUESTED:customer:u1:booking:bk99")
    }

    @Test
    public fun `parseFcmData legacy bookingId payload takes precedence over sourceId`() {
        // Both legacy and projector keys present — legacy wins (Shape 2 priority)
        val data =
            mapOf(
                "type" to "RATING_PROMPT_CUSTOMER",
                "bookingId" to "bk-legacy",
                "actionId" to "RATING_PROMPT_CUSTOMER:customer:u2:booking:bk-proj",
                "sourceId" to "bk-proj",
            )
        val result = router.parseFcmData(data)

        assertThat(result).isNotNull
        assertThat(result!!.entityId).isEqualTo("bk-legacy")
    }

    @Test
    public fun `parseFcmData with projector payload missing sourceId returns null`() {
        // Malformed projector payload — no legacy key and no sourceId
        val data =
            mapOf(
                "type" to "COMPLAINT_UPDATE",
                "actionId" to "COMPLAINT_UPDATE:customer:u3:complaint:cmpX",
                // sourceId and complaintId both absent
            )
        val result = router.parseFcmData(data)
        assertThat(result).isNull()
    }

    // ── parseDeepLink ─────────────────────────────────────────────────────────

    @Test
    public fun `parseDeepLink parses valid homeservices deep link`() {
        val uri = "homeservices://action/COMPLAINT_UPDATE?entityId=cmp3"
        val result = router.parseDeepLink(uri)

        assertThat(result).isNotNull
        assertThat(result!!.type).isEqualTo(PendingActionType.COMPLAINT_UPDATE)
        assertThat(result.entityId).isEqualTo("cmp3")
    }

    @Test
    public fun `parseDeepLink returns null for malformed URI`() {
        val result = router.parseDeepLink("not-a-valid-uri://??")
        assertThat(result).isNull()
    }

    @Test
    public fun `parseDeepLink returns null for unknown action type`() {
        val result = router.parseDeepLink("homeservices://action/DOES_NOT_EXIST?entityId=x")
        assertThat(result).isNull()
    }

    @Test
    public fun `parseDeepLink returns null for empty string`() {
        val result = router.parseDeepLink("")
        assertThat(result).isNull()
    }
}
