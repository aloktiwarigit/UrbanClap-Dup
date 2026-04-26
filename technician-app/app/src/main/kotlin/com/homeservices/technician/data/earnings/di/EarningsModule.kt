package com.homeservices.technician.data.earnings.di

import com.homeservices.technician.data.earnings.EarningsRepositoryImpl
import com.homeservices.technician.data.earnings.remote.EarningsApiService
import com.homeservices.technician.data.rating.di.AuthOkHttpClient
import com.homeservices.technician.domain.earnings.EarningsRepository
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
public abstract class EarningsModule {
    @Binds
    internal abstract fun bindEarningsRepository(impl: EarningsRepositoryImpl): EarningsRepository

    public companion object {
        @Provides
        @Singleton
        public fun provideEarningsApiService(
            @AuthOkHttpClient client: OkHttpClient,
        ): EarningsApiService =
            Retrofit.Builder()
                .baseUrl("https://homeservices-api.azurewebsites.net/api/")
                .client(client)
                .addConverterFactory(MoshiConverterFactory.create())
                .build()
                .create(EarningsApiService::class.java)
    }
}
