package com.homeservices.customer.data.booking.di

import com.homeservices.customer.BuildConfig
import com.homeservices.customer.data.booking.BookingRepository
import com.homeservices.customer.data.booking.BookingRepositoryImpl
import com.homeservices.customer.data.booking.SlotAvailabilityRepository
import com.homeservices.customer.data.booking.SlotAvailabilityRepositoryImpl
import com.homeservices.customer.data.booking.remote.BookingApiService
import com.homeservices.customer.data.network.auth.FirebaseTokenAuthenticator
import com.homeservices.customer.data.network.auth.IdTokenCache
import com.squareup.moshi.Moshi
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import java.time.Clock
import java.time.ZoneId
import javax.inject.Qualifier
import javax.inject.Singleton

@Qualifier
@Retention(AnnotationRetention.BINARY)
public annotation class AuthOkHttpClient

@Qualifier
@Retention(AnnotationRetention.BINARY)
public annotation class IstClock

private val IST_ZONE: ZoneId = ZoneId.of("Asia/Kolkata")

@Module
@InstallIn(SingletonComponent::class)
public abstract class BookingModule {
    @Binds
    internal abstract fun bindBookingRepository(impl: BookingRepositoryImpl): BookingRepository

    @Binds
    internal abstract fun bindSlotAvailabilityRepository(impl: SlotAvailabilityRepositoryImpl): SlotAvailabilityRepository

    public companion object {
        @Provides
        @Singleton
        @IstClock
        public fun provideIstClock(): Clock = Clock.system(IST_ZONE)

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
                        level =
                            if (BuildConfig.DEBUG) {
                                HttpLoggingInterceptor.Level.BODY
                            } else {
                                HttpLoggingInterceptor.Level.NONE
                            }
                    },
                ).authenticator(authenticator)
                .build()

        @Provides
        @Singleton
        public fun provideBookingApiService(
            @AuthOkHttpClient client: OkHttpClient,
            moshi: Moshi,
        ): BookingApiService =
            Retrofit
                .Builder()
                .baseUrl(BuildConfig.API_BASE_URL + "/")
                .addConverterFactory(MoshiConverterFactory.create(moshi))
                .client(client)
                .build()
                .create(BookingApiService::class.java)
    }
}
