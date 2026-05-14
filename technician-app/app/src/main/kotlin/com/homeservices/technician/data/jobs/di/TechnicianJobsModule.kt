package com.homeservices.technician.data.jobs.di

import com.homeservices.technician.BuildConfig
import com.homeservices.technician.data.jobs.TechnicianJobsRepositoryImpl
import com.homeservices.technician.data.jobs.remote.TechnicianJobsApiService
import com.homeservices.technician.data.network.defaultMoshi
import com.homeservices.technician.data.rating.di.AuthOkHttpClient
import com.homeservices.technician.domain.jobs.TechnicianJobsRepository
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
public abstract class TechnicianJobsModule {
    @Binds
    internal abstract fun bindTechnicianJobsRepository(impl: TechnicianJobsRepositoryImpl): TechnicianJobsRepository

    public companion object {
        @Provides
        @Singleton
        internal fun provideTechnicianJobsApiService(
            @AuthOkHttpClient client: OkHttpClient,
        ): TechnicianJobsApiService =
            Retrofit
                .Builder()
                .baseUrl(BuildConfig.API_BASE_URL.trimEnd('/') + "/")
                .client(client)
                .addConverterFactory(MoshiConverterFactory.create(defaultMoshi))
                .build()
                .create(TechnicianJobsApiService::class.java)
    }
}
