package com.homeservices.technician.data.activeJob.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
internal interface ActiveJobDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(entity: PendingTransitionEntity)

    @Query("SELECT * FROM pending_transitions ORDER BY createdAt ASC")
    suspend fun getPending(): List<PendingTransitionEntity>

    @Query("SELECT * FROM pending_transitions ORDER BY createdAt ASC")
    fun getPendingFlow(): Flow<List<PendingTransitionEntity>>

    @Query("DELETE FROM pending_transitions WHERE id = :id")
    suspend fun delete(id: String)
}
