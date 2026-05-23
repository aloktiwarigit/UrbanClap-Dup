package com.homeservices.technician.data.location.di

import android.content.Context
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import com.homeservices.technician.data.location.FusedCurrentLocationProvider
import com.homeservices.technician.domain.location.CurrentLocationProvider
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
public abstract class LocationModule {
    @Binds
    @Singleton
    public abstract fun bindCurrentLocationProvider(impl: FusedCurrentLocationProvider): CurrentLocationProvider

    public companion object {
        @Provides
        @Singleton
        public fun provideFusedLocationClient(
            @ApplicationContext context: Context,
        ): FusedLocationProviderClient = LocationServices.getFusedLocationProviderClient(context)
    }
}
