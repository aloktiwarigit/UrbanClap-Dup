package com.homeservices.customer.notification

import com.homeservices.corenav.PendingAction
import com.homeservices.corenav.PendingActionStatus
import com.homeservices.customer.data.pendingaction.PendingActionStore
import java.time.Clock
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Orchestrates FCM-driven persistence of [PendingAction] rows — customer-app.
 *
 * Implements the stale-event ruleset from E11 spec §2.10:
 *   1. RESOLVED tombstone drop — if existing row is RESOLVED, the incoming event is dropped
 *      to prevent stale-FCM resurrection.
 *   2. Version stale drop — incoming version <= existing version means no new information.
 *   3. Age gate — events older than [MAX_EVENT_AGE_MS] are dropped (configurable, default 7 days).
 *      This prevents late-delivered FCM (held for up to 28 days by GCM) from resurrecting
 *      long-dead actions.
 *   4. Fresh upsert — no existing row → upsert unconditionally.
 *   5. Version upgrade — incoming version > existing version → upsert.
 *
 * Callers:
 *   - [com.homeservices.customer.firebase.CustomerFirebaseMessagingService.onMessageReceived]
 *     calls [ingest] per FCM data message.
 *   - Repository (E11-S01b-2) calls [reconcile] after fetching the server snapshot.
 *
 * Hilt-injected as a [Singleton] — safe because all state is in Room (via [PendingActionStore]).
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
            val existing = store.findById(incoming.id)
            if (shouldDrop(incoming, existing, nowMs)) return
            store.upsert(incoming)
        }

        /**
         * Returns true when the incoming action must be dropped without persisting.
         *
         * Rule 3: Age gate — event older than MAX_EVENT_AGE_MS.
         * Rule 1: RESOLVED tombstone — never resurrect a resolved action.
         * Rule 2: Version stale — incoming version carries no new information.
         */
        private fun shouldDrop(
            incoming: PendingAction,
            existing: PendingAction?,
            nowMs: Long,
        ): Boolean =
            when {
                isStaleByAge(incoming, nowMs) -> true
                existing?.status == PendingActionStatus.RESOLVED -> true
                existing != null && incoming.version <= existing.version -> true
                else -> false
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
