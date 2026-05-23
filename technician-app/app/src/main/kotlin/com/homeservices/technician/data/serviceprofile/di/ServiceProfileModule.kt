package com.homeservices.technician.data.serviceprofile.di

import com.homeservices.technician.data.serviceprofile.ServiceProfileRepositoryImpl
import com.homeservices.technician.data.serviceprofile.remote.ServiceProfileApiService
import com.homeservices.technician.domain.serviceprofile.ServiceProfileRepository
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
internal abstract class ServiceProfileModule {
    @Binds
    abstract fun bindServiceProfileRepository(impl: ServiceProfileRepositoryImpl): ServiceProfileRepository

    companion object {
        @Provides
        @Singleton
        fun provideServiceProfileApiService(retrofit: Retrofit): ServiceProfileApiService =
            retrofit.create(ServiceProfileApiService::class.java)
    }
}
