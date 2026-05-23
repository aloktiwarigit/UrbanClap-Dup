package com.homeservices.customer.notification.di

import com.homeservices.corenav.NotificationRouter
import com.homeservices.customer.data.pendingaction.PendingActionStore
import com.homeservices.customer.notification.CustomerNotificationRouter
import com.homeservices.customer.notification.PendingActionIngestor
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import java.time.Clock
import javax.inject.Singleton

/**
 * Hilt DI module wiring the notification layer — customer-app.
 *
 * Provides:
 *   - [NotificationRouter] bound to [CustomerNotificationRouter]
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
     * Bind [CustomerNotificationRouter] to the [NotificationRouter] interface
     * so injection sites depend on the interface, not the concrete class.
     */
    @Binds
    @Singleton
    public abstract fun bindNotificationRouter(impl: CustomerNotificationRouter): NotificationRouter

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
