package com.homeservices.technician.data.pendingaction.db

import androidx.room.Database
import androidx.room.RoomDatabase

/**
 * Room database — technician-app pending_actions table.
 *
 * Version 1: initial schema. Mirrors the customer-app database structure.
 * Provided via Hilt by [com.homeservices.technician.data.pendingaction.di.PendingActionsModule].
 */
@Database(
    entities = [PendingActionEntity::class],
    version = 1,
    exportSchema = false,
)
public abstract class PendingActionsDatabase : RoomDatabase() {
    public abstract fun pendingActionDao(): PendingActionDao
}
