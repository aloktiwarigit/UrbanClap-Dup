package com.homeservices.customer.data.booking.di

import com.google.firebase.auth.FirebaseAuth
import com.homeservices.customer.BuildConfig
import com.homeservices.customer.data.booking.BookingRepository
import com.homeservices.customer.data.booking.BookingRepositoryImpl
import com.homeservices.customer.data.booking.remote.BookingApiService
import com.squareup.moshi.Moshi
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.tasks.await
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
public abstract class BookingModule {

    @Binds
    internal abstract fun bindBookingRepository(impl: BookingRepositoryImpl): BookingRepository

    public companion object {

        @Provides
        @Singleton
        @AuthOkHttpClient
        public fun provideAuthOkHttpClient(): OkHttpClient =
            OkHttpClient.Builder()
                .addInterceptor { chain ->
                    val token = runBlocking {
                        FirebaseAuth.getInstance().currentUser
                            ?.getIdToken(false)
                            ?.await()
                            ?.token
                    }
                    val req =
                        if (token != null) {
                            chain.request().newBuilder()
                                .header("Authorization", "Bearer $token")
                                .build()
                        } else {
                            chain.request()
                        }
                    chain.proceed(req)
                }
                .addInterceptor(
                    HttpLoggingInterceptor().apply {
                        level =
                            if (BuildConfig.DEBUG) {
                                HttpLoggingInterceptor.Level.BODY
                            } else {
                                HttpLoggingInterceptor.Level.NONE
                            }
                    },
                )
                .build()

        @Provides
        @Singleton
        public fun provideBookingApiService(
            @AuthOkHttpClient client: OkHttpClient,
            moshi: Moshi,
        ): BookingApiService =
            Retrofit.Builder()
                .baseUrl(BuildConfig.API_BASE_URL + "/")
                .addConverterFactory(MoshiConverterFactory.create(moshi))
                .client(client)
                .build()
                .create(BookingApiService::class.java)
    }
}
