package com.homeservices.technician.data.jobOffer.di

import com.homeservices.technician.data.jobOffer.JobOfferApiService
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
public object JobOfferModule {
    @Provides
    @Singleton
    internal fun provideJobOfferApiService(retrofit: Retrofit): JobOfferApiService =
        retrofit.create(JobOfferApiService::class.java)
}
