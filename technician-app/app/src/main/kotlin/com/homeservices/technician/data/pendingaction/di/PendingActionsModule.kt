package com.homeservices.technician.data.pendingaction.di

import android.content.Context
import androidx.room.Room
import com.homeservices.technician.data.pendingaction.PendingActionStore
import com.homeservices.technician.data.pendingaction.db.PendingActionDao
import com.homeservices.technician.data.pendingaction.db.PendingActionsDatabase
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

/**
 * Hilt module providing the [PendingActionsDatabase] and [PendingActionDao] singletons
 * for the technician-app.
 */
@Module
@InstallIn(SingletonComponent::class)
public object PendingActionsModule {
    @Provides
    @Singleton
    public fun providePendingActionsDatabase(
        @ApplicationContext context: Context,
    ): PendingActionsDatabase {
        val builder =
            Room.databaseBuilder(
                context,
                PendingActionsDatabase::class.java,
                "pending_actions.db",
            )
        return builder.build()
    }

    @Provides
    @Singleton
    public fun providePendingActionDao(database: PendingActionsDatabase): PendingActionDao = database.pendingActionDao()

    @Provides
    @Singleton
    public fun providePendingActionStore(dao: PendingActionDao): PendingActionStore = PendingActionStore(dao)
}
