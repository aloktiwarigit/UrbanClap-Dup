package com.homeservices.customer.data.pendingaction.di

import android.content.Context
import androidx.room.Room
import com.homeservices.customer.data.pendingaction.PendingActionStore
import com.homeservices.customer.data.pendingaction.db.PendingActionDao
import com.homeservices.customer.data.pendingaction.db.PendingActionsDatabase
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

/**
 * Hilt module providing the [PendingActionsDatabase] and [PendingActionDao] singletons.
 *
 * Per docs/patterns/hilt-module-android-test-scope.md: unit tests for
 * [PendingActionStore] and [PendingActionDao] construct them manually
 * with an in-memory database (Robolectric). This module is only loaded in
 * the production DI graph.
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
