package com.homeservices.customer.di

import com.homeservices.customer.BuildConfig
import com.homeservices.customer.data.booking.di.AuthOkHttpClient
import com.homeservices.customer.data.waitlist.WaitlistApiService
import com.homeservices.customer.data.waitlist.WaitlistRepositoryImpl
import com.homeservices.customer.domain.waitlist.WaitlistRepository
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
public abstract class WaitlistModule {
    @Binds
    public abstract fun bindWaitlistRepository(impl: WaitlistRepositoryImpl): WaitlistRepository

    public companion object {
        @Provides
        @Singleton
        public fun provideWaitlistApiService(
            @AuthOkHttpClient client: OkHttpClient,
            moshi: Moshi,
        ): WaitlistApiService =
            Retrofit
                .Builder()
                .baseUrl(BuildConfig.API_BASE_URL + "/")
                .addConverterFactory(MoshiConverterFactory.create(moshi))
                .client(client)
                .build()
                .create(WaitlistApiService::class.java)
    }
}
