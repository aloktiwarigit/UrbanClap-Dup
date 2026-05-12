package com.homeservices.technician.data.pendingaction.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

/**
 * Room DAO for the `pending_actions` table — technician-app.
 * Mirrors the customer-app DAO contract exactly.
 */
@Dao
public interface PendingActionDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    public suspend fun upsertAll(rows: List<PendingActionEntity>)

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

    @Query("SELECT * FROM pending_actions WHERE id = :id LIMIT 1")
    public suspend fun findById(id: String): PendingActionEntity?

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

    @Query(
        """
        DELETE FROM pending_actions
        WHERE status = 'ACTIVE'
          AND expiresAt IS NOT NULL
          AND expiresAt < :now
        """,
    )
    public suspend fun purgeExpired(now: Long)

    @Query(
        """
        DELETE FROM pending_actions
        WHERE status = 'RESOLVED'
          AND resolvedAt IS NOT NULL
          AND resolvedAt < :cutoff
        """,
    )
    public suspend fun purgeTombstones(cutoff: Long)

    @Query("DELETE FROM pending_actions")
    public suspend fun clearAll()
}
