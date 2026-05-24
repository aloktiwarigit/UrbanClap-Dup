package com.homeservices.technician.data.payout.di

import com.homeservices.technician.data.payout.PayoutRepositoryImpl
import com.homeservices.technician.data.payout.remote.PayoutApiService
import com.homeservices.technician.domain.payout.PayoutRepository
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
public abstract class PayoutModule {
    @Binds
    internal abstract fun bindPayoutRepository(impl: PayoutRepositoryImpl): PayoutRepository

    public companion object {
        @Provides
        @Singleton
        internal fun providePayoutApiService(retrofit: Retrofit): PayoutApiService = retrofit.create(PayoutApiService::class.java)
    }
}
