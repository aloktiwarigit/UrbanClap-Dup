package com.homeservices.customer.data.pendingaction.db

import androidx.room.Database
import androidx.room.RoomDatabase

/**
 * Room database — customer-app pending_actions table.
 *
 * Version 1: initial schema. No migration path required for v1 (fresh install).
 * If the schema changes in a future story, add a [androidx.room.migration.Migration]
 * and bump [version].
 *
 * Provided via Hilt as a singleton by [com.homeservices.customer.data.pendingaction.di.PendingActionsModule].
 * Consumers should always depend on [PendingActionDao], not on this class directly.
 */
@Database(
    entities = [PendingActionEntity::class],
    version = 1,
    exportSchema = false,
)
public abstract class PendingActionsDatabase : RoomDatabase() {
    public abstract fun pendingActionDao(): PendingActionDao
}
