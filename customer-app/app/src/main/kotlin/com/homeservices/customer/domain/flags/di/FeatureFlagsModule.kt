package com.homeservices.customer.domain.flags.di

import com.homeservices.customer.domain.flags.BuildConfigFeatureFlags
import com.homeservices.customer.domain.flags.FeatureFlags
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
public abstract class FeatureFlagsModule {
    @Binds
    @Singleton
    public abstract fun bindFeatureFlags(impl: BuildConfigFeatureFlags): FeatureFlags
}
