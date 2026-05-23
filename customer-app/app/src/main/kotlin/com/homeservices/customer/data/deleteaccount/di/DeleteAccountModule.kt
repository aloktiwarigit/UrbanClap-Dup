package com.homeservices.customer.data.deleteaccount.di

import com.homeservices.customer.BuildConfig
import com.homeservices.customer.data.booking.di.AuthOkHttpClient
import com.homeservices.customer.data.deleteaccount.DeleteAccountRepositoryImpl
import com.homeservices.customer.data.deleteaccount.remote.ErasureApiService
import com.homeservices.customer.domain.deleteaccount.DeleteAccountRepository
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
public abstract class DeleteAccountModule {
    @Binds
    internal abstract fun bindDeleteAccountRepository(impl: DeleteAccountRepositoryImpl): DeleteAccountRepository

    public companion object {
        @Provides
        @Singleton
        internal fun provideErasureApiService(
            @AuthOkHttpClient client: OkHttpClient,
            moshi: Moshi,
        ): ErasureApiService =
            Retrofit
                .Builder()
                .baseUrl(BuildConfig.API_BASE_URL + "/")
                .addConverterFactory(MoshiConverterFactory.create(moshi))
                .client(client)
                .build()
                .create(ErasureApiService::class.java)
    }
}
