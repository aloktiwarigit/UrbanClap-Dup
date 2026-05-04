package com.homeservices.technician.data.location.di

import com.homeservices.technician.data.location.FusedCurrentLocationProvider
import com.homeservices.technician.domain.location.CurrentLocationProvider
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
public abstract class LocationModule {
    @Binds
    @Singleton
    public abstract fun bindCurrentLocationProvider(impl: FusedCurrentLocationProvider): CurrentLocationProvider
}
