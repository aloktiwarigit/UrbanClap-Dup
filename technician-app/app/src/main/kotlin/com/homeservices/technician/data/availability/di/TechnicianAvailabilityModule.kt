package com.homeservices.technician.data.availability.di

import com.homeservices.technician.data.availability.TechnicianAvailabilityRepositoryImpl
import com.homeservices.technician.data.availability.remote.TechnicianAvailabilityApiService
import com.homeservices.technician.domain.availability.TechnicianAvailabilityRepository
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
internal abstract class TechnicianAvailabilityModule {
    @Binds
    abstract fun bindTechnicianAvailabilityRepository(impl: TechnicianAvailabilityRepositoryImpl): TechnicianAvailabilityRepository

    companion object {
        @Provides
        @Singleton
        fun provideTechnicianAvailabilityApiService(retrofit: Retrofit): TechnicianAvailabilityApiService =
            retrofit.create(TechnicianAvailabilityApiService::class.java)
    }
}
