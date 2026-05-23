package com.homeservices.customer.data.consent.remote.di

import com.homeservices.customer.BuildConfig
import com.homeservices.customer.data.booking.di.AuthOkHttpClient
import com.homeservices.customer.data.consent.remote.ConsentAuditApiService
import com.squareup.moshi.Moshi
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
public object ConsentApiModule {
    @Provides
    @Singleton
    public fun provideConsentAuditApiService(
        @AuthOkHttpClient client: OkHttpClient,
        moshi: Moshi,
    ): ConsentAuditApiService =
        Retrofit
            .Builder()
            .baseUrl(BuildConfig.API_BASE_URL + "/")
            .addConverterFactory(MoshiConverterFactory.create(moshi))
            .client(client)
            .build()
            .create(ConsentAuditApiService::class.java)
}
