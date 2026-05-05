package com.homeservices.customer.domain.integrity.di

import android.content.Context
import com.homeservices.customer.BuildConfig
import com.homeservices.customer.data.booking.di.AuthOkHttpClient
import com.homeservices.customer.data.integrity.IntegrityApiService
import com.homeservices.customer.domain.integrity.IntegrityAttestor
import com.homeservices.customer.domain.integrity.PlayIntegrityAttestor
import com.squareup.moshi.Moshi
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
public object IntegrityModule {
    @Provides
    @Singleton
    public fun providePlayIntegrityAttestor(
        @ApplicationContext context: Context,
    ): PlayIntegrityAttestor = PlayIntegrityAttestor(context, debugBypass = BuildConfig.DEBUG)

    @Provides
    @Singleton
    public fun provideIntegrityAttestor(impl: PlayIntegrityAttestor): IntegrityAttestor = impl

    @Provides
    @Singleton
    public fun provideIntegrityApiService(
        @AuthOkHttpClient client: OkHttpClient,
        moshi: Moshi,
    ): IntegrityApiService =
        Retrofit
            .Builder()
            .baseUrl(BuildConfig.API_BASE_URL + "/")
            .addConverterFactory(MoshiConverterFactory.create(moshi))
            .client(client)
            .build()
            .create(IntegrityApiService::class.java)
}
