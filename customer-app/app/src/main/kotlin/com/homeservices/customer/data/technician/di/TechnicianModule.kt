package com.homeservices.customer.data.technician.di

import com.homeservices.customer.BuildConfig
import com.homeservices.customer.data.technician.ConfidenceScoreRepository
import com.homeservices.customer.data.technician.ConfidenceScoreRepositoryImpl
import com.homeservices.customer.data.technician.remote.TechnicianApiService
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
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
public annotation class TechnicianHttpClient

@Module
@InstallIn(SingletonComponent::class)
public abstract class TechnicianModule {
    @Binds
    internal abstract fun bindConfidenceScoreRepository(
        impl: ConfidenceScoreRepositoryImpl,
    ): ConfidenceScoreRepository

    public companion object {
        @Provides
        @Singleton
        public fun provideMoshi(): Moshi = Moshi.Builder().addLast(KotlinJsonAdapterFactory()).build()

        // Known limitation (E04-S02): this client has no Firebase auth interceptor because
        // customer auth (FirebaseAuth) is not wired into this branch yet (branches from main
        // at E02-S04, predating E02-S01 customer auth). The `requireCustomer` middleware will
        // return 401 until the Firebase ID-token interceptor is added when customer auth merges.
        // Fix: replace this client with one that mirrors BookingModule's @AuthOkHttpClient
        // (reads FirebaseAuth.getInstance().currentUser?.getIdToken(false)?.await()?.token).
        @Provides
        @Singleton
        @TechnicianHttpClient
        public fun provideTechnicianOkHttpClient(): OkHttpClient =
            OkHttpClient.Builder()
                .addInterceptor(
                    HttpLoggingInterceptor().apply {
                        level = if (BuildConfig.DEBUG) HttpLoggingInterceptor.Level.BODY
                               else HttpLoggingInterceptor.Level.NONE
                    },
                ).build()

        @Provides
        @Singleton
        public fun provideTechnicianApiService(
            @TechnicianHttpClient client: OkHttpClient,
            moshi: Moshi,
        ): TechnicianApiService =
            Retrofit.Builder()
                .baseUrl(BuildConfig.API_BASE_URL + "/")
                .addConverterFactory(MoshiConverterFactory.create(moshi))
                .client(client)
                .build()
                .create(TechnicianApiService::class.java)
    }
}
