package com.homeservices.technician.data.pendingaction

import com.homeservices.corenav.PendingAction
import com.homeservices.corenav.PendingActionPriority
import com.homeservices.corenav.PendingActionStatus
import com.homeservices.corenav.PendingActionType
import com.homeservices.technician.data.pendingaction.db.PendingActionDao
import com.homeservices.technician.data.pendingaction.db.PendingActionEntity
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

/**
 * Local persistence abstraction for pending actions — technician-app.
 * Mirrors the customer-app [com.homeservices.customer.data.pendingaction.PendingActionStore].
 *
 * Provided by [com.homeservices.technician.data.pendingaction.di.PendingActionsModule].
 * detekt: deliberate facade over store + DAO; splitting would invert call sites unnecessarily
 */
@Suppress("TooManyFunctions")
public class PendingActionStore(
    private val dao: PendingActionDao,
) {
    public fun observeActive(userId: String): Flow<List<PendingAction>> =
        dao.observeActive(userId = userId).map { entities ->
            entities.map { it.toDomain() }
        }

    public suspend fun findById(id: String): PendingAction? = dao.findById(id)?.toDomain()

    public suspend fun upsertAll(actions: List<PendingAction>) {
        dao.upsertAll(actions.map { it.toEntity() })
    }

    public suspend fun upsert(action: PendingAction) {
        upsertAll(listOf(action))
    }

    public suspend fun markMissingAsResolved(
        userId: String,
        keepIds: Set<String>,
        now: Long,
    ) {
        dao.markMissingAsResolved(userId = userId, keep = keepIds, now = now)
    }

    public suspend fun markResolved(
        id: String,
        now: Long,
    ) {
        dao.markResolved(id = id, now = now)
    }

    public suspend fun purgeExpired(now: Long) {
        dao.purgeExpired(now)
    }

    public suspend fun purgeTombstones(cutoff: Long) {
        dao.purgeTombstones(cutoff)
    }

    public suspend fun clearAll() {
        dao.clearAll()
    }

    // ── E11-S05a job-execution durable hooks ──────────────────────────────────

    /**
     * Returns the single active PHOTO_UPLOAD_PENDING [PendingAction] for the given
     * booking, or `null` if none exists. Used by retry orchestrators to decide
     * whether to re-attempt a queued upload.
     */
    public suspend fun pendingPhotoUploadForBooking(bookingId: String): PendingAction? =
        dao.findActivePhotoUploadForBooking(bookingId)?.toDomain()

    /**
     * Tombstones any active PHOTO_UPLOAD_PENDING row for [bookingId]. Call once the
     * queued upload succeeds so the retry banner stops surfacing.
     */
    public suspend fun clearPhotoUploadPending(
        bookingId: String,
        now: Long = System.currentTimeMillis(),
    ) {
        dao.clearActivePhotoUploadForBooking(bookingId = bookingId, now = now)
    }

    // ── Mapping helpers ───────────────────────────────────────────────────────

    private fun PendingActionEntity.toDomain(): PendingAction =
        PendingAction(
            id = id,
            userId = userId,
            role = role,
            type = PendingActionType.valueOf(type),
            entityType = entityType,
            entityId = entityId,
            routeUri = routeUri,
            priority = PendingActionPriority.valueOf(priority),
            status = PendingActionStatus.valueOf(status),
            sourceStatus = sourceStatus,
            version = version,
            createdAt = createdAt,
            updatedAt = updatedAt,
            expiresAt = expiresAt,
            resolvedAt = resolvedAt,
        )

    private fun PendingAction.toEntity(): PendingActionEntity =
        PendingActionEntity(
            id = id,
            userId = userId,
            role = role,
            type = type.name,
            entityType = entityType,
            entityId = entityId,
            routeUri = routeUri,
            priority = priority.name,
            status = status.name,
            sourceStatus = sourceStatus,
            version = version,
            createdAt = createdAt,
            updatedAt = updatedAt,
            expiresAt = expiresAt,
            resolvedAt = resolvedAt,
            lastFetchedAt = System.currentTimeMillis(),
        )
}
