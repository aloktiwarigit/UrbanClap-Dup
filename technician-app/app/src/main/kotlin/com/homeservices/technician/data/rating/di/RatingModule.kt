package com.homeservices.technician.data.rating.di

import com.homeservices.technician.BuildConfig
import com.homeservices.technician.data.network.auth.FirebaseTokenAuthenticator
import com.homeservices.technician.data.network.auth.IdTokenCache
import com.homeservices.technician.data.network.defaultMoshi
import com.homeservices.technician.data.rating.RatingRepository
import com.homeservices.technician.data.rating.RatingRepositoryImpl
import com.homeservices.technician.data.rating.remote.RatingApiService
import dagger.Binds
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

@Qualifier
@Retention(AnnotationRetention.BINARY)
public annotation class AuthOkHttpClient

@Module
@InstallIn(SingletonComponent::class)
public abstract class RatingModule {
    @Binds
    internal abstract fun bindRatingRepository(impl: RatingRepositoryImpl): RatingRepository

    public companion object {
        @Provides
        @Singleton
        @AuthOkHttpClient
        public fun provideAuthOkHttpClient(
            idTokenCache: IdTokenCache,
            authenticator: FirebaseTokenAuthenticator,
        ): OkHttpClient =
            OkHttpClient
                .Builder()
                .addInterceptor { chain ->
                    // Non-blocking: reads the pre-fetched cached token.
                    // IdTokenCache refreshes every 55 min in the background so
                    // this read never blocks a dispatcher thread.
                    val token = idTokenCache.cachedToken
                    val req =
                        if (token != null) {
                            chain
                                .request()
                                .newBuilder()
                                .header("Authorization", "Bearer $token")
                                .build()
                        } else {
                            chain.request()
                        }
                    chain.proceed(req)
                }.addInterceptor(
                    HttpLoggingInterceptor().apply {
                        level = HttpLoggingInterceptor.Level.BODY
                    },
                ).authenticator(authenticator)
                .build()

        @Provides
        @Singleton
        public fun provideRatingApiService(
            @AuthOkHttpClient client: OkHttpClient,
        ): RatingApiService =
            Retrofit
                .Builder()
                .baseUrl(BuildConfig.API_BASE_URL.trimEnd('/') + "/")
                .client(client)
                .addConverterFactory(MoshiConverterFactory.create(defaultMoshi))
                .build()
                .create(RatingApiService::class.java)
    }
}
