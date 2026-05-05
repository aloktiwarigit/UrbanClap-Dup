package com.homeservices.technician.data.availability.di

import com.homeservices.technician.data.availability.TechnicianAvailabilityRepositoryImpl
import com.homeservices.technician.data.availability.remote.TechnicianAvailabilityApiService
import com.homeservices.technician.data.network.defaultMoshi
import com.homeservices.technician.data.rating.di.AuthOkHttpClient
import com.homeservices.technician.domain.availability.TechnicianAvailabilityRepository
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
internal abstract class TechnicianAvailabilityModule {
    @Binds
    abstract fun bindTechnicianAvailabilityRepository(impl: TechnicianAvailabilityRepositoryImpl): TechnicianAvailabilityRepository

    companion object {
        @Provides
        @Singleton
        fun provideTechnicianAvailabilityApiService(
            @AuthOkHttpClient client: OkHttpClient,
        ): TechnicianAvailabilityApiService =
            Retrofit
                .Builder()
                .baseUrl("https://func-homeservices-prod.azurewebsites.net/api/")
                .client(client)
                .addConverterFactory(MoshiConverterFactory.create(defaultMoshi))
                .build()
                .create(TechnicianAvailabilityApiService::class.java)
    }
}
