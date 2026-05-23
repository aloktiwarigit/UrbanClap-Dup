package com.homeservices.technician.data.rating.di

import com.homeservices.technician.data.rating.RatingRepository
import com.homeservices.technician.data.rating.RatingRepositoryImpl
import com.homeservices.technician.data.rating.remote.RatingApiService
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
public abstract class RatingModule {
    @Binds
    internal abstract fun bindRatingRepository(impl: RatingRepositoryImpl): RatingRepository

    public companion object {
        @Provides
        @Singleton
        public fun provideRatingApiService(retrofit: Retrofit): RatingApiService = retrofit.create(RatingApiService::class.java)
    }
}
