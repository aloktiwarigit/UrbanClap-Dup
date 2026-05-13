package com.homeservices.technician.notification

import com.homeservices.corenav.PendingAction
import com.homeservices.corenav.PendingActionStatus
import com.homeservices.technician.data.pendingaction.PendingActionStore
import java.time.Clock
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Orchestrates FCM-driven persistence of [PendingAction] rows — technician-app.
 *
 * Mirrors the customer-app [com.homeservices.customer.notification.PendingActionIngestor].
 * Implements the same stale-event ruleset from E11 spec §2.10:
 *   1. RESOLVED tombstone drop
 *   2. Version stale drop (incoming version <= existing)
 *   3. Age gate (default 7 days)
 *   4. Fresh upsert
 *   5. Version upgrade upsert
 *
 * Callers:
 *   - [com.homeservices.technician.data.fcm.HomeservicesFcmService.onMessageReceived]
 *     calls [ingest] per FCM data message.
 *   - Repository (E11-S01b-2) calls [reconcile] after fetching the server snapshot.
 */
@Singleton
public class PendingActionIngestor
    @Inject
    constructor(
        private val store: PendingActionStore,
        private val clock: Clock,
    ) {
        /**
         * Apply the stale-event ruleset to a single incoming [PendingAction].
         *
         * @param incoming The action parsed from an FCM data message.
         */
        public suspend fun ingest(incoming: PendingAction) {
            val nowMs = clock.millis()

            // Rule 3: Age gate — drop events older than MAX_EVENT_AGE_MS
            if (isStaleByAge(incoming, nowMs)) return

            val existing = store.findById(incoming.id)

            // Rule 1: RESOLVED tombstone drop — never resurrect tombstoned actions
            if (existing?.status == PendingActionStatus.RESOLVED) return

            // Rule 2: Version stale drop — no new information
            if (existing != null && incoming.version <= existing.version) return

            // Rules 4 & 5: Fresh upsert or version upgrade
            store.upsert(incoming)
        }

        /**
         * Reconcile the local Room table with a full server snapshot.
         *
         * Steps (per E11 spec §3.5):
         *   1. Upsert all actions from the server snapshot.
         *   2. Tombstone local ACTIVE rows absent from the snapshot.
         *   3. Purge ACTIVE rows past their TTL.
         *   4. Purge RESOLVED tombstones older than 30 days.
         *
         * @param userId The authenticated user's ID (scopes all Room operations).
         * @param serverSnapshot The full list of ACTIVE actions returned by the API.
         */
        public suspend fun reconcile(
            userId: String,
            serverSnapshot: List<PendingAction>,
        ) {
            val nowMs = clock.millis()
            val keepIds = serverSnapshot.map { it.id }.toSet()

            store.upsertAll(serverSnapshot)
            store.markMissingAsResolved(userId = userId, keepIds = keepIds, now = nowMs)
            store.purgeExpired(nowMs)
            store.purgeTombstones(nowMs - THIRTY_DAYS_MS)
        }

        // ── Private helpers ───────────────────────────────────────────────────

        private fun isStaleByAge(
            action: PendingAction,
            nowMs: Long,
        ): Boolean = (nowMs - action.updatedAt) > MAX_EVENT_AGE_MS

        public companion object {
            /** Default age gate: 7 days in milliseconds. */
            public const val MAX_EVENT_AGE_MS: Long = 7L * 24 * 60 * 60 * 1000

            private const val THIRTY_DAYS_MS: Long = 30L * 24 * 60 * 60 * 1000
        }
    }
