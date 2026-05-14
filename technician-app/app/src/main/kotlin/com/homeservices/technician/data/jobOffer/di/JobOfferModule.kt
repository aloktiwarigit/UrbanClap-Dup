package com.homeservices.technician.data.jobOffer.di

import com.homeservices.technician.BuildConfig
import com.homeservices.technician.data.jobOffer.JobOfferApiService
import com.homeservices.technician.data.network.defaultMoshi
import com.homeservices.technician.data.rating.di.AuthOkHttpClient
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
public object JobOfferModule {
    @Provides
    @Singleton
    internal fun provideJobOfferApiService(
        @AuthOkHttpClient client: OkHttpClient,
    ): JobOfferApiService =
        Retrofit
            .Builder()
            .baseUrl(BuildConfig.API_BASE_URL.trimEnd('/') + "/")
            .client(client)
            .addConverterFactory(MoshiConverterFactory.create(defaultMoshi))
            .build()
            .create(JobOfferApiService::class.java)
}
