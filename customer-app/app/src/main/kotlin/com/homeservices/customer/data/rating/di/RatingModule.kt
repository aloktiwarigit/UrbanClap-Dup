package com.homeservices.customer.data.rating.di

import com.homeservices.customer.BuildConfig
import com.homeservices.customer.data.booking.di.AuthOkHttpClient
import com.homeservices.customer.data.rating.RatingRepository
import com.homeservices.customer.data.rating.RatingRepositoryImpl
import com.homeservices.customer.data.rating.remote.RatingApiService
import com.squareup.moshi.Moshi
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
public abstract class RatingModule {
    @Binds
    internal abstract fun bindRatingRepository(impl: RatingRepositoryImpl): RatingRepository

    public companion object {
        @Provides
        @Singleton
        public fun provideRatingApiService(
            @AuthOkHttpClient client: OkHttpClient,
            moshi: Moshi,
        ): RatingApiService =
            Retrofit
                .Builder()
                .baseUrl(BuildConfig.API_BASE_URL + "/")
                .addConverterFactory(MoshiConverterFactory.create(moshi))
                .client(client)
                .build()
                .create(RatingApiService::class.java)
    }
}
