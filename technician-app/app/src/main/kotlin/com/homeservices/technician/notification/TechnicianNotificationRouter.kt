package com.homeservices.technician.notification

import com.homeservices.corenav.DeepLinkUri
import com.homeservices.corenav.NotificationIntent
import com.homeservices.corenav.NotificationRouter
import com.homeservices.corenav.PendingActionType
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Technician-app implementation of [NotificationRouter].
 *
 * Parses raw FCM data payloads and `homeservices://` deep-link URIs into
 * [NotificationIntent] values for downstream processing by [PendingActionIngestor].
 *
 * Technician FCM types:
 *   - JOB_OFFER (entityId = bookingId)
 *   - RATING_PROMPT_TECHNICIAN (entityId = bookingId)
 *   - EARNINGS_UPDATE (entityId = earningsId)
 *   - RATING_RECEIVED (entityId = bookingId)
 *   - COMPLAINT_UPDATE (entityId = complaintId)
 *   - SUPPORT_FOLLOWUP (entityId = ticketId)
 *   - KYC_RESUME (entityId = techId)
 *
 * Per E11 spec §2.8: NotificationRouter is a pure parser — no persistence, no network.
 */
@Singleton
public class TechnicianNotificationRouter
    @Inject
    constructor() : NotificationRouter {
        /**
         * Parse a raw FCM data payload into a [NotificationIntent].
         *
         * Entity ID resolution priority:
         *   - COMPLAINT_UPDATE → `complaintId`
         *   - SUPPORT_FOLLOWUP → `ticketId`
         *   - EARNINGS_UPDATE → `earningsId`
         *   - KYC_RESUME → `techId`
         *   - All booking types → `bookingId`
         *
         * Returns null if:
         * - `type` key is absent or maps to an unknown [PendingActionType]
         * - The required entity ID key is absent or empty
         */
        override fun parseFcmData(data: Map<String, String>): NotificationIntent? {
            val typeName = data["type"] ?: return null
            val type = runCatching { PendingActionType.valueOf(typeName) }.getOrNull() ?: return null

            val entityId = resolveEntityId(type, data) ?: return null
            val rawArgs = data.filterKeys { it != "type" }

            return NotificationIntent(
                type = type,
                entityId = entityId,
                rawArgs = rawArgs,
            )
        }

        /**
         * Parse a `homeservices://action/<TYPE>?entityId=<id>` deep-link URI.
         * Delegates to [DeepLinkUri.parse] for scheme/host/query validation.
         */
        override fun parseDeepLink(uri: String): NotificationIntent? = DeepLinkUri.parse(uri)

        // ── Private helpers ───────────────────────────────────────────────────

        private fun resolveEntityId(
            type: PendingActionType,
            data: Map<String, String>,
        ): String? =
            when (type) {
                PendingActionType.COMPLAINT_UPDATE ->
                    data["complaintId"]?.takeIf { it.isNotEmpty() }
                PendingActionType.SUPPORT_FOLLOWUP ->
                    data["ticketId"]?.takeIf { it.isNotEmpty() }
                PendingActionType.EARNINGS_UPDATE ->
                    data["earningsId"]?.takeIf { it.isNotEmpty() }
                PendingActionType.KYC_RESUME ->
                    data["techId"]?.takeIf { it.isNotEmpty() }
                else ->
                    data["bookingId"]?.takeIf { it.isNotEmpty() }
            }
    }
