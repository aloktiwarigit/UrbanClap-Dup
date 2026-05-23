package com.homeservices.technician.data.erasure.di

import com.homeservices.technician.data.erasure.ErasureRepositoryImpl
import com.homeservices.technician.data.erasure.remote.ErasureApiService
import com.homeservices.technician.domain.erasure.ErasureRepository
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
public abstract class ErasureModule {
    @Binds
    internal abstract fun bindErasureRepository(impl: ErasureRepositoryImpl): ErasureRepository

    public companion object {
        @Provides
        @Singleton
        public fun provideErasureApiService(retrofit: Retrofit): ErasureApiService =
            retrofit.create(ErasureApiService::class.java)
    }
}
