package com.homeservices.customer.data.tracking.di

import com.homeservices.customer.data.tracking.TrackingRepositoryImpl
import com.homeservices.customer.domain.tracking.TrackingRepository
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
public abstract class TrackingModule {
    @Binds
    @Singleton
    internal abstract fun bindTrackingRepository(impl: TrackingRepositoryImpl): TrackingRepository
}
