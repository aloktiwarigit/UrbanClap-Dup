package com.homeservices.technician.data.activeJob.db

import androidx.room.Database
import androidx.room.RoomDatabase

@Database(
    entities = [PendingTransitionEntity::class],
    version = 1,
    exportSchema = false,
)
public abstract class ActiveJobDatabase : RoomDatabase() {
    public abstract fun activeJobDao(): ActiveJobDao
}
