package com.homeservices.technician.notification.di

import com.homeservices.corenav.NotificationRouter
import com.homeservices.technician.notification.TechnicianNotificationRouter
import com.homeservices.technician.notification.PendingActionIngestor
import com.homeservices.technician.data.pendingaction.PendingActionStore
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import java.time.Clock
import javax.inject.Singleton

/**
 * Hilt DI module wiring the notification layer — technician-app.
 *
 * Provides:
 *   - [NotificationRouter] bound to [TechnicianNotificationRouter]
 *   - [java.time.Clock] as system clock (injectable for testability)
 *   - [PendingActionIngestor] assembled from [PendingActionStore] + [Clock]
 *
 * Per docs/patterns/hilt-module-android-test-scope.md: unit tests
 * construct [PendingActionIngestor] manually with MockK fakes — this module
 * is not loaded in JVM unit tests.
 */
@Module
@InstallIn(SingletonComponent::class)
public abstract class NotificationModule {
    /**
     * Bind [TechnicianNotificationRouter] to the [NotificationRouter] interface.
     */
    @Binds
    @Singleton
    public abstract fun bindNotificationRouter(impl: TechnicianNotificationRouter): NotificationRouter

    public companion object {
        @Provides
        @Singleton
        public fun provideSystemClock(): Clock = Clock.systemUTC()

        @Provides
        @Singleton
        public fun providePendingActionIngestor(
            store: PendingActionStore,
            clock: Clock,
        ): PendingActionIngestor = PendingActionIngestor(store = store, clock = clock)
    }
}
