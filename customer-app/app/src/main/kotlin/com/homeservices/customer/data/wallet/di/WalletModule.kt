package com.homeservices.customer.data.wallet.di

import com.homeservices.customer.BuildConfig
import com.homeservices.customer.data.booking.di.AuthOkHttpClient
import com.homeservices.customer.data.wallet.WalletRepository
import com.homeservices.customer.data.wallet.WalletRepositoryImpl
import com.homeservices.customer.data.wallet.remote.WalletApiService
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
public abstract class WalletModule {
    @Binds
    internal abstract fun bindWalletRepository(impl: WalletRepositoryImpl): WalletRepository

    public companion object {
        @Provides
        @Singleton
        public fun provideWalletApiService(
            @AuthOkHttpClient client: OkHttpClient,
            moshi: Moshi,
        ): WalletApiService =
            Retrofit
                .Builder()
                .baseUrl(BuildConfig.API_BASE_URL + "/")
                .addConverterFactory(MoshiConverterFactory.create(moshi))
                .client(client)
                .build()
                .create(WalletApiService::class.java)
    }
}
