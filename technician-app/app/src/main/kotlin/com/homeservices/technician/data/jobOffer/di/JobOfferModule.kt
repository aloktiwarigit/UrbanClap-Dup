package com.homeservices.technician.data.jobOffer.di

import com.homeservices.technician.data.jobOffer.JobOfferApiService
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
public object JobOfferModule {
    @Provides
    @Singleton
    internal fun provideJobOfferApiService(): JobOfferApiService {
        val logging =
            HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BODY
            }
        val client = OkHttpClient.Builder().addInterceptor(logging).build()
        return Retrofit
            .Builder()
            .baseUrl("https://homeservices-api.azurewebsites.net/api/")
            .client(client)
            .addConverterFactory(MoshiConverterFactory.create())
            .build()
            .create(JobOfferApiService::class.java)
    }
}
