package com.homeservices.customer.data.device.di

import com.homeservices.customer.BuildConfig
import com.homeservices.customer.data.booking.di.AuthOkHttpClient
import com.homeservices.customer.data.device.DeviceApi
import com.squareup.moshi.Moshi
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import javax.inject.Singleton

/**
 * Hilt module that provides [DeviceApi] for device-token registration.
 *
 * Uses the shared [AuthOkHttpClient] so every request carries a Firebase Bearer token.
 * [DeviceTokenRegistrar] itself is `@Singleton` + `@Inject constructor` and does not
 * need an explicit `@Provides` binding.
 */
@Module
@InstallIn(SingletonComponent::class)
public object DeviceModule {
    @Provides
    @Singleton
    public fun provideDeviceApi(
        @AuthOkHttpClient client: OkHttpClient,
        moshi: Moshi,
    ): DeviceApi =
        Retrofit
            .Builder()
            .baseUrl(BuildConfig.API_BASE_URL + "/")
            .addConverterFactory(MoshiConverterFactory.create(moshi))
            .client(client)
            .build()
            .create(DeviceApi::class.java)
}
