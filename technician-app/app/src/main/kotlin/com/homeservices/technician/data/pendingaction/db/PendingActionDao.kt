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
@Suppress("TooManyFunctions") // Room DAOs grow with per-feature query needs; splitting would invert call sites
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

    /**
     * Look up the single active PHOTO_UPLOAD_PENDING row for a booking, if any.
     * Used by the active-job ViewModel to decide whether to surface the retry banner.
     */
    @Query(
        """
        SELECT * FROM pending_actions
        WHERE type = 'PHOTO_UPLOAD_PENDING'
          AND entityId = :bookingId
          AND status = 'ACTIVE'
        LIMIT 1
        """,
    )
    public suspend fun findActivePhotoUploadForBooking(bookingId: String): PendingActionEntity?

    /**
     * Tombstone any active PHOTO_UPLOAD_PENDING rows for this booking. Called once
     * the queued upload succeeds — the technician should no longer see the banner.
     */
    @Query(
        """
        UPDATE pending_actions
        SET status = 'RESOLVED', resolvedAt = :now
        WHERE type = 'PHOTO_UPLOAD_PENDING'
          AND entityId = :bookingId
          AND status = 'ACTIVE'
        """,
    )
    public suspend fun clearActivePhotoUploadForBooking(
        bookingId: String,
        now: Long,
    )

    /**
     * Look up the single active PHOTO_UPLOAD_RETRY row for a technician, if any.
     * Used by the KYC ViewModel to decide whether to surface the retry banner
     * (E11-S05c onboarding durable hooks).
     */
    @Query(
        """
        SELECT * FROM pending_actions
        WHERE type = 'PHOTO_UPLOAD_RETRY'
          AND entityId = :techId
          AND status = 'ACTIVE'
        LIMIT 1
        """,
    )
    public suspend fun findActivePhotoRetryForTech(techId: String): PendingActionEntity?

    /**
     * Tombstone any active PHOTO_UPLOAD_RETRY rows for this technician. Called once
     * the queued KYC photo upload succeeds — the technician should no longer see the
     * banner (E11-S05c onboarding durable hooks).
     */
    @Query(
        """
        UPDATE pending_actions
        SET status = 'RESOLVED', resolvedAt = :now
        WHERE type = 'PHOTO_UPLOAD_RETRY'
          AND entityId = :techId
          AND status = 'ACTIVE'
        """,
    )
    public suspend fun clearActivePhotoRetryForTech(
        techId: String,
        now: Long,
    )

    /**
     * Tombstone any active KYC_SUBMIT_PENDING rows for this technician. Called once
     * the server returns a final verdict (KYC_VERIFIED or KYC_REJECTED) — the
     * onboarding-screen offline chip should no longer surface.
     */
    @Query(
        """
        UPDATE pending_actions
        SET status = 'RESOLVED', resolvedAt = :now
        WHERE type = 'KYC_SUBMIT_PENDING'
          AND entityId = :techId
          AND status = 'ACTIVE'
        """,
    )
    public suspend fun clearActiveKycSubmitPendingForTech(
        techId: String,
        now: Long,
    )

    /**
     * Tombstone any active KYC_RESUME rows for this technician. Called once the
     * server returns a final verdict so the DigiLocker resumption nudge does not
     * outlive the verdict.
     */
    @Query(
        """
        UPDATE pending_actions
        SET status = 'RESOLVED', resolvedAt = :now
        WHERE type = 'KYC_RESUME'
          AND entityId = :techId
          AND status = 'ACTIVE'
        """,
    )
    public suspend fun clearActiveKycResumeForTech(
        techId: String,
        now: Long,
    )
}
