package com.homeservices.technician.notification

import com.homeservices.corenav.PendingActionType
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test

/**
 * JVM unit tests for [TechnicianNotificationRouter].
 *
 * Covers technician FCM types: JOB_OFFER, RATING_PROMPT_TECHNICIAN, EARNINGS_UPDATE,
 * RATING_RECEIVED, COMPLAINT_UPDATE, SUPPORT_FOLLOWUP, KYC_RESUME + deep-link parsing.
 *
 * Manual construction — no Hilt, per docs/patterns/hilt-module-android-test-scope.md.
 */
public class TechnicianNotificationRouterTest {
    private lateinit var router: TechnicianNotificationRouter

    @Before
    public fun setUp() {
        router = TechnicianNotificationRouter()
    }

    // ── parseFcmData ──────────────────────────────────────────────────────────

    @Test
    public fun `parseFcmData returns JOB_OFFER for job offer type`() {
        val data = mapOf("type" to "JOB_OFFER", "bookingId" to "bk1")
        val result = router.parseFcmData(data)

        assertThat(result).isNotNull
        assertThat(result!!.type).isEqualTo(PendingActionType.JOB_OFFER)
        assertThat(result.entityId).isEqualTo("bk1")
    }

    @Test
    public fun `parseFcmData returns RATING_PROMPT_TECHNICIAN for rating-prompt type`() {
        val data = mapOf("type" to "RATING_PROMPT_TECHNICIAN", "bookingId" to "bk2")
        val result = router.parseFcmData(data)

        assertThat(result).isNotNull
        assertThat(result!!.type).isEqualTo(PendingActionType.RATING_PROMPT_TECHNICIAN)
        assertThat(result.entityId).isEqualTo("bk2")
    }

    @Test
    public fun `parseFcmData returns EARNINGS_UPDATE for earnings type`() {
        val data = mapOf("type" to "EARNINGS_UPDATE", "earningsId" to "e1")
        val result = router.parseFcmData(data)

        assertThat(result).isNotNull
        assertThat(result!!.type).isEqualTo(PendingActionType.EARNINGS_UPDATE)
        assertThat(result.entityId).isEqualTo("e1")
    }

    @Test
    public fun `parseFcmData returns RATING_RECEIVED for rating-received type`() {
        val data = mapOf("type" to "RATING_RECEIVED", "bookingId" to "bk3")
        val result = router.parseFcmData(data)

        assertThat(result).isNotNull
        assertThat(result!!.type).isEqualTo(PendingActionType.RATING_RECEIVED)
        assertThat(result.entityId).isEqualTo("bk3")
    }

    @Test
    public fun `parseFcmData returns COMPLAINT_UPDATE for complaint type`() {
        val data = mapOf("type" to "COMPLAINT_UPDATE", "complaintId" to "cmp1")
        val result = router.parseFcmData(data)

        assertThat(result).isNotNull
        assertThat(result!!.type).isEqualTo(PendingActionType.COMPLAINT_UPDATE)
        assertThat(result.entityId).isEqualTo("cmp1")
    }

    @Test
    public fun `parseFcmData returns KYC_RESUME for kyc type`() {
        val data = mapOf("type" to "KYC_RESUME", "techId" to "t1")
        val result = router.parseFcmData(data)

        assertThat(result).isNotNull
        assertThat(result!!.type).isEqualTo(PendingActionType.KYC_RESUME)
        assertThat(result.entityId).isEqualTo("t1")
    }

    @Test
    public fun `parseFcmData returns null for unknown type`() {
        val data = mapOf("type" to "UNKNOWN_FCM_TYPE", "bookingId" to "bk1")
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
    public fun `parseFcmData returns null when entityId is missing`() {
        val data = mapOf("type" to "JOB_OFFER")
        val result = router.parseFcmData(data)
        assertThat(result).isNull()
    }

    @Test
    public fun `parseFcmData preserves rawArgs from FCM payload`() {
        val data =
            mapOf(
                "type" to "JOB_OFFER",
                "bookingId" to "bk4",
                "amountPaise" to "50000",
                "expiresAt" to "2026-05-01T13:00:00Z",
            )
        val result = router.parseFcmData(data)

        assertThat(result).isNotNull
        assertThat(result!!.rawArgs["amountPaise"]).isEqualTo("50000")
        assertThat(result.rawArgs["expiresAt"]).isEqualTo("2026-05-01T13:00:00Z")
    }

    // ── Dual-shape payload (FIX 2 — projector shape) ─────────────────────────

    @Test
    public fun `parseFcmData with projector actionId+sourceId shape resolves JOB_OFFER via sourceId`() {
        // Projector shape — no bookingId hoisted because JOB_OFFER has no legacy compat key
        val data =
            mapOf(
                "type" to "JOB_OFFER",
                "actionId" to "JOB_OFFER:technician:t1:booking:bk10",
                "sourceId" to "bk10",
                "payload" to """{"amountPaise":75000}""",
            )
        val result = router.parseFcmData(data)

        assertThat(result).isNotNull
        assertThat(result!!.type).isEqualTo(PendingActionType.JOB_OFFER)
        assertThat(result.entityId).isEqualTo("bk10")
        assertThat(result.rawArgs["actionId"])
            .isEqualTo("JOB_OFFER:technician:t1:booking:bk10")
    }

    @Test
    public fun `parseFcmData with projector actionId+sourceId shape resolves KYC_RESUME via sourceId`() {
        // KYC_RESUME: legacy key is `techId` — backend does NOT hoist it, so sourceId fallback used
        val data =
            mapOf(
                "type" to "KYC_RESUME",
                "actionId" to "KYC_RESUME:technician:t2:technician:t2",
                "sourceId" to "t2",
            )
        val result = router.parseFcmData(data)

        assertThat(result).isNotNull
        assertThat(result!!.type).isEqualTo(PendingActionType.KYC_RESUME)
        assertThat(result.entityId).isEqualTo("t2")
    }

    @Test
    public fun `parseFcmData legacy bookingId payload takes precedence over sourceId for JOB_OFFER`() {
        // Both legacy and projector keys present — legacy wins
        val data =
            mapOf(
                "type" to "JOB_OFFER",
                "bookingId" to "bk-legacy",
                "actionId" to "JOB_OFFER:technician:t3:booking:bk-proj",
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
                "type" to "JOB_OFFER",
                "actionId" to "JOB_OFFER:technician:t4:booking:bkX",
                // bookingId and sourceId both absent
            )
        val result = router.parseFcmData(data)
        assertThat(result).isNull()
    }

    // ── parseDeepLink ─────────────────────────────────────────────────────────

    @Test
    public fun `parseDeepLink parses valid homeservices deep link for technician`() {
        val uri = "homeservices://action/JOB_OFFER?entityId=bk5"
        val result = router.parseDeepLink(uri)

        assertThat(result).isNotNull
        assertThat(result!!.type).isEqualTo(PendingActionType.JOB_OFFER)
        assertThat(result.entityId).isEqualTo("bk5")
    }

    @Test
    public fun `parseDeepLink returns null for malformed URI`() {
        val result = router.parseDeepLink("bad://??malformed")
        assertThat(result).isNull()
    }

    @Test
    public fun `parseDeepLink returns null for empty string`() {
        val result = router.parseDeepLink("")
        assertThat(result).isNull()
    }
}
