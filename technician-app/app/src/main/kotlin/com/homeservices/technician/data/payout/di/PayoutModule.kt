package com.homeservices.technician.data.payout.di

import com.homeservices.technician.data.payout.PayoutRepositoryImpl
import com.homeservices.technician.data.payout.remote.PayoutApiService
import com.homeservices.technician.data.rating.di.AuthOkHttpClient
import com.homeservices.technician.domain.payout.PayoutRepository
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
public abstract class PayoutModule {
    @Binds
    internal abstract fun bindPayoutRepository(impl: PayoutRepositoryImpl): PayoutRepository

    public companion object {
        @Provides
        @Singleton
        public fun providePayoutApiService(
            @AuthOkHttpClient client: OkHttpClient,
        ): PayoutApiService =
            Retrofit
                .Builder()
                .baseUrl("https://homeservices-api.azurewebsites.net/api/")
                .client(client)
                .addConverterFactory(MoshiConverterFactory.create())
                .build()
                .create(PayoutApiService::class.java)
    }
}
