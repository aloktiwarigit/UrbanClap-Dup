package com.homeservices.customer.data.catalogue.di

import com.homeservices.customer.BuildConfig
import com.homeservices.customer.data.catalogue.CatalogueRepository
import com.homeservices.customer.data.catalogue.CatalogueRepositoryImpl
import com.homeservices.customer.data.catalogue.remote.CatalogueApiService
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
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
public abstract class CatalogueModule {

    @Binds
    internal abstract fun bindCatalogueRepository(
        impl: CatalogueRepositoryImpl,
    ): CatalogueRepository

    public companion object {

        @Provides
        @Singleton
        public fun provideMoshi(): Moshi = Moshi.Builder()
            .addLast(KotlinJsonAdapterFactory())
            .build()

        @Provides
        @Singleton
        public fun provideOkHttpClient(): OkHttpClient = OkHttpClient.Builder()
            .addInterceptor(HttpLoggingInterceptor().apply {
                level = if (BuildConfig.DEBUG) HttpLoggingInterceptor.Level.BODY
                        else HttpLoggingInterceptor.Level.NONE
            })
            .build()

        @Provides
        @Singleton
        public fun provideCatalogueApiService(moshi: Moshi, client: OkHttpClient): CatalogueApiService =
            Retrofit.Builder()
                .baseUrl(BuildConfig.API_BASE_URL + "/")
                .addConverterFactory(MoshiConverterFactory.create(moshi))
                .client(client)
                .build()
                .create(CatalogueApiService::class.java)
    }
}
