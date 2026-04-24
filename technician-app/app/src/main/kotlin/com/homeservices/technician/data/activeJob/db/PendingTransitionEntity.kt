package com.homeservices.technician.data.activeJob.db

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "pending_transitions")
public data class PendingTransitionEntity(
    @PrimaryKey val id: String,
    val bookingId: String,
    val targetStatus: String,
    val createdAt: Long,
    val retryCount: Int = 0,
)
