package com.homeservices.customer.notification

import com.homeservices.corenav.DeepLinkUri
import com.homeservices.corenav.NotificationIntent
import com.homeservices.corenav.NotificationRouter
import com.homeservices.corenav.PendingActionType
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Customer-app implementation of [NotificationRouter].
 *
 * Parses raw FCM data payloads and `homeservices://` deep-link URIs into
 * [NotificationIntent] values for downstream processing by [PendingActionIngestor].
 *
 * Customer FCM types:
 *   - ADDON_APPROVAL_REQUESTED (entityId = bookingId)
 *   - RATING_PROMPT_CUSTOMER (entityId = bookingId)
 *   - COMPLAINT_UPDATE (entityId = complaintId)
 *   - SUPPORT_FOLLOWUP (entityId = ticketId)
 *   - (location/tracking types are handled by TrackingEventBus — not persisted as pending actions)
 *
 * Per E11 spec §2.8: NotificationRouter is a pure parser — no persistence, no network.
 *
 * ## Dual-shape payload support (E11-S01b-1 fix)
 *
 * The backend projector emits two overlapping shapes in the same FCM data map:
 *
 * ### Shape 1 — projector shape (always present for projector-delivered events):
 *   `type`, `actionId`, `sourceId`, `payload` (JSON string of PendingActionDoc.payload)
 *
 * ### Shape 2 — legacy per-type top-level IDs (compat fields, present for some types):
 *   `bookingId`, `complaintId`, `ticketId` (hoisted from payload for customer types)
 *
 * Entity ID resolution prefers the per-type legacy field when present (Shape 2), then
 * falls back to `sourceId` from the projector shape (Shape 1).
 */
@Singleton
public class CustomerNotificationRouter
    @Inject
    constructor() : NotificationRouter {
        /**
         * Parse a raw FCM data payload into a [NotificationIntent].
         *
         * Entity ID resolution priority (see class-level KDoc for shape details):
         *   1. Per-type legacy top-level key (bookingId / complaintId / ticketId)
         *   2. `sourceId` (projector shape fallback)
         *
         * Returns null if:
         * - `type` key is absent or maps to a non-customer [PendingActionType]
         * - No entity ID can be resolved from either shape
         */
        override fun parseFcmData(data: Map<String, String>): NotificationIntent? =
            resolveTypeAndEntityId(data)?.let { (type, entityId) ->
                NotificationIntent(
                    type = type,
                    entityId = entityId,
                    rawArgs = data.filterKeys { it != "type" },
                )
            }

        /**
         * Resolve the [PendingActionType] and entity ID from the raw FCM data map.
         *
         * Returns null if `type` is absent/unknown or no entity ID can be resolved.
         * Extracted to satisfy detekt ReturnCount limit on [parseFcmData].
         */
        private fun resolveTypeAndEntityId(data: Map<String, String>): Pair<PendingActionType, String>? {
            val typeName = data["type"] ?: return null
            val type = runCatching { PendingActionType.valueOf(typeName) }.getOrNull()
            return type?.let { t -> resolveEntityId(t, data)?.let { id -> t to id } }
        }

        /**
         * Parse a `homeservices://action/<TYPE>?entityId=<id>` deep-link URI.
         * Delegates to [DeepLinkUri.parse] for scheme/host/query validation.
         */
        override fun parseDeepLink(uri: String): NotificationIntent? = DeepLinkUri.parse(uri)

        // ── Private helpers ───────────────────────────────────────────────────

        /**
         * Resolve the entity ID for a given FCM type from the raw data map.
         *
         * Tries per-type legacy top-level keys first (Shape 2). If absent, falls back
         * to the projector `sourceId` field (Shape 1). Returns null only if both are
         * absent or empty.
         */
        private fun resolveEntityId(
            type: PendingActionType,
            data: Map<String, String>,
        ): String? {
            // Shape 2: per-type legacy top-level key (hoisted by _fcmCompatFields in
            // pending-action-projector.ts for types that older clients need).
            val legacyId =
                when (type) {
                    PendingActionType.COMPLAINT_UPDATE ->
                        data["complaintId"]?.takeIf { it.isNotEmpty() }
                    PendingActionType.SUPPORT_FOLLOWUP ->
                        data["ticketId"]?.takeIf { it.isNotEmpty() }
                    else ->
                        data["bookingId"]?.takeIf { it.isNotEmpty() }
                }

            if (legacyId != null) return legacyId

            // Shape 1 fallback: projector sourceId (present for all projector-delivered
            // events where no legacy compat key is hoisted).
            return data["sourceId"]?.takeIf { it.isNotEmpty() }
        }
    }
