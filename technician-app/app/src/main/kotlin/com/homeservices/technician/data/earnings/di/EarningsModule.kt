package com.homeservices.technician.data.earnings.di

import com.homeservices.technician.data.earnings.EarningsRepositoryImpl
import com.homeservices.technician.data.earnings.remote.EarningsApiService
import com.homeservices.technician.domain.earnings.EarningsRepository
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
public abstract class EarningsModule {
    @Binds
    internal abstract fun bindEarningsRepository(impl: EarningsRepositoryImpl): EarningsRepository

    public companion object {
        @Provides
        @Singleton
        internal fun provideEarningsApiService(retrofit: Retrofit): EarningsApiService = retrofit.create(EarningsApiService::class.java)
    }
}
