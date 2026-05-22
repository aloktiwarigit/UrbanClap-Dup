package com.homeservices.customer.observability.analytics.di

import com.homeservices.customer.observability.analytics.AnalyticsFacade
import com.homeservices.customer.observability.analytics.PostHogAnalyticsFacade
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
public abstract class AnalyticsModule {
    @Binds
    @Singleton
    public abstract fun bindAnalyticsFacade(impl: PostHogAnalyticsFacade): AnalyticsFacade
}
