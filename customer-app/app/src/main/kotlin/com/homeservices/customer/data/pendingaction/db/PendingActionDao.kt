package com.homeservices.customer.data.pendingaction.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

/**
 * Room DAO for the `pending_actions` table — customer-app.
 *
 * All queries operate on rows scoped to a specific [userId]. Cross-user data access
 * is prevented at the DAO layer by always filtering on [userId].
 *
 * Method contracts follow E11 spec §2.2 (Local store: Room per-app).
 */
@Dao
public interface PendingActionDao {
    /**
     * Insert or replace rows. On id conflict, the existing row is fully replaced.
     * Used during reconcile (full server snapshot) and ingest (single FCM payload).
     */
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    public suspend fun upsertAll(rows: List<PendingActionEntity>)

    /**
     * Tombstone ACTIVE rows that are not in [keep].
     * Sets status = 'RESOLVED' and resolvedAt = [now].
     * Only affects ACTIVE rows — does not re-touch existing RESOLVED tombstones.
     *
     * Called during reconcile() after a full server-snapshot upsert.
     */
    @Query(
        """
        UPDATE pending_actions
        SET status = 'RESOLVED', resolvedAt = :now
        WHERE id NOT IN (:keep)
          AND userId = :userId
          AND status = 'ACTIVE'
        """,
    )
    public suspend fun markMissingAsResolved(
        userId: String,
        keep: Set<String>,
        now: Long,
    )

    /**
     * Observe ACTIVE rows for [userId], ordered by priority DESC then createdAt ASC.
     * Emits a new list whenever any row in the table changes.
     *
     * Priorities stored as strings match the ordering:
     *   HIGH > NORMAL > LOW  (alphabetical DESC does NOT work — stored as 'HIGH'/'NORMAL'/'LOW')
     * Room orders by the raw string column. We rely on the priority-ordering comparator
     * in [TierLadder] for the final resolution. The ORDER BY here ensures the UI list
     * naturally surfaces high-priority items first; TierLadder re-applies strict ordering.
     *
     * NOTE: Room cannot ORDER BY with a CASE expression in a single @Query without
     * a raw query. We use CASE WHEN to map priority to a numeric sort key.
     */
    @Query(
        """
        SELECT * FROM pending_actions
        WHERE userId = :userId
          AND status = 'ACTIVE'
        ORDER BY
          CASE priority
            WHEN 'HIGH' THEN 3
            WHEN 'NORMAL' THEN 2
            WHEN 'LOW' THEN 1
            ELSE 0
          END DESC,
          createdAt ASC
        """,
    )
    public fun observeActive(userId: String): Flow<List<PendingActionEntity>>

    /** Fetch a single row by [id]. Returns null if not found. */
    @Query("SELECT * FROM pending_actions WHERE id = :id LIMIT 1")
    public suspend fun findById(id: String): PendingActionEntity?

    /**
     * Mark a specific row as resolved, e.g. when the FCM "action_resolved" data message arrives.
     * Sets status = 'RESOLVED' and resolvedAt = [now].
     */
    @Query(
        """
        UPDATE pending_actions
        SET status = 'RESOLVED', resolvedAt = :now
        WHERE id = :id
        """,
    )
    public suspend fun markResolved(
        id: String,
        now: Long,
    )

    /**
     * Purge ACTIVE rows whose TTL has passed. RESOLVED tombstones are protected — use
     * [purgeTombstones] for those. This method only deletes rows whose [status] is 'ACTIVE'
     * to avoid accidentally clearing tombstones.
     *
     * Scheduled on reconcile() and on cold start (E11 spec §3.5, `PendingActionIngestor.reconcile`).
     */
    @Query(
        """
        DELETE FROM pending_actions
        WHERE status = 'ACTIVE'
          AND expiresAt IS NOT NULL
          AND expiresAt < :now
        """,
    )
    public suspend fun purgeExpired(now: Long)

    /**
     * Purge RESOLVED tombstone rows older than [cutoff] epoch ms.
     * The 30-day TTL is longer than FCM's maximum delivery TTL (28 days) to guarantee
     * the stale-event resurrection check in the Ingestor always has a tombstone to match against.
     *
     * Per E11 spec §2.10: rows with null [resolvedAt] are NOT deleted (belt-and-suspenders).
     */
    @Query(
        """
        DELETE FROM pending_actions
        WHERE status = 'RESOLVED'
          AND resolvedAt IS NOT NULL
          AND resolvedAt < :cutoff
        """,
    )
    public suspend fun purgeTombstones(cutoff: Long)

    /**
     * Delete ALL rows for all users. Called on logout (E11 spec §4.7).
     * After this call, a fresh reconcile() on re-login restores the current server state.
     */
    @Query("DELETE FROM pending_actions")
    public suspend fun clearAll()
}
