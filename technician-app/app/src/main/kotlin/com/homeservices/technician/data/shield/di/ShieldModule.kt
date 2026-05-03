package com.homeservices.technician.data.shield.di

import com.homeservices.technician.data.rating.di.AuthOkHttpClient
import com.homeservices.technician.data.shield.ShieldRepositoryImpl
import com.homeservices.technician.data.shield.remote.ShieldApiService
import com.homeservices.technician.domain.shield.ShieldRepository
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
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
public abstract class ShieldModule {
    @Binds
    internal abstract fun bindShieldRepository(impl: ShieldRepositoryImpl): ShieldRepository

    public companion object {
        @Provides
        @Singleton
        public fun provideShieldApiService(
            @AuthOkHttpClient client: OkHttpClient,
        ): ShieldApiService =
            Retrofit
                .Builder()
                .baseUrl("https://func-homeservices-prod.azurewebsites.net/api/")
                .client(client)
                .addConverterFactory(MoshiConverterFactory.create())
                .build()
                .create(ShieldApiService::class.java)

        @Provides
        @Singleton
        public fun provideMoshi(): Moshi = Moshi.Builder().add(KotlinJsonAdapterFactory()).build()
    }
}
