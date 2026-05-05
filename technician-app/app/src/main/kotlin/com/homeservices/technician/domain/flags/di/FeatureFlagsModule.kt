package com.homeservices.technician.domain.flags.di

import com.homeservices.technician.domain.flags.FeatureFlags
import com.homeservices.technician.domain.flags.GrowthBookFeatureFlags
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
    public abstract fun bindFeatureFlags(impl: GrowthBookFeatureFlags): FeatureFlags
}
