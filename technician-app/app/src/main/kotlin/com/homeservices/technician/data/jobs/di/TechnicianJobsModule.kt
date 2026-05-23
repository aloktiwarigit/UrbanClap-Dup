package com.homeservices.technician.data.jobs.di

import com.homeservices.technician.data.jobs.TechnicianJobsRepositoryImpl
import com.homeservices.technician.data.jobs.remote.TechnicianJobsApiService
import com.homeservices.technician.domain.jobs.TechnicianJobsRepository
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
public abstract class TechnicianJobsModule {
    @Binds
    internal abstract fun bindTechnicianJobsRepository(impl: TechnicianJobsRepositoryImpl): TechnicianJobsRepository

    public companion object {
        @Provides
        @Singleton
        internal fun provideTechnicianJobsApiService(retrofit: Retrofit): TechnicianJobsApiService =
            retrofit.create(TechnicianJobsApiService::class.java)
    }
}
