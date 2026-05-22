package com.homeservices.customer.data.auth.remote.di

import com.homeservices.customer.BuildConfig
import com.homeservices.customer.data.auth.remote.AuthApi
import com.squareup.moshi.Moshi
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import javax.inject.Qualifier
import javax.inject.Singleton

/**
 * Qualifier for an OkHttpClient that carries NO authentication tokens.
 * Used for public / pre-auth API endpoints (e.g. Truecaller verify).
 */
@Qualifier
@Retention(AnnotationRetention.BINARY)
public annotation class PublicOkHttpClient

@Module
@InstallIn(SingletonComponent::class)
public object AuthApiModule {
    @Provides
    @Singleton
    @PublicOkHttpClient
    public fun providePublicOkHttpClient(): OkHttpClient =
        OkHttpClient
            .Builder()
            .addInterceptor(
                HttpLoggingInterceptor().apply {
                    level =
                        if (BuildConfig.DEBUG) {
                            HttpLoggingInterceptor.Level.BODY
                        } else {
                            HttpLoggingInterceptor.Level.NONE
                        }
                },
            ).connectTimeout(15, java.util.concurrent.TimeUnit.SECONDS)
            .readTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
            .writeTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
            .callTimeout(60, java.util.concurrent.TimeUnit.SECONDS)
            .retryOnConnectionFailure(true)
            .build()

    @Provides
    @Singleton
    public fun provideAuthApi(
        @PublicOkHttpClient okHttpClient: OkHttpClient,
        moshi: Moshi,
    ): AuthApi =
        Retrofit
            .Builder()
            .baseUrl(BuildConfig.API_BASE_URL + "/")
            .addConverterFactory(MoshiConverterFactory.create(moshi))
            .client(okHttpClient)
            .build()
            .create(AuthApi::class.java)
}
