package com.homeservices.technician.data.serviceprofile.di

import com.homeservices.technician.data.rating.di.AuthOkHttpClient
import com.homeservices.technician.data.serviceprofile.ServiceProfileRepositoryImpl
import com.homeservices.technician.data.serviceprofile.remote.ServiceProfileApiService
import com.homeservices.technician.domain.serviceprofile.ServiceProfileRepository
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
internal abstract class ServiceProfileModule {
    @Binds
    abstract fun bindServiceProfileRepository(impl: ServiceProfileRepositoryImpl): ServiceProfileRepository

    companion object {
        @Provides
        @Singleton
        fun provideServiceProfileApiService(
            @AuthOkHttpClient client: OkHttpClient,
        ): ServiceProfileApiService {
            val moshi = Moshi.Builder().addLast(KotlinJsonAdapterFactory()).build()
            return Retrofit
                .Builder()
                .baseUrl("https://func-homeservices-prod.azurewebsites.net/api/")
                .client(client)
                .addConverterFactory(MoshiConverterFactory.create(moshi))
                .build()
                .create(ServiceProfileApiService::class.java)
        }
    }
}
