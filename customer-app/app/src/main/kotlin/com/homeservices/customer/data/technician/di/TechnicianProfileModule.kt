package com.homeservices.customer.data.technician.di

import com.homeservices.customer.BuildConfig
import com.homeservices.customer.data.technician.TechnicianProfileRepositoryImpl
import com.homeservices.customer.data.technician.remote.TechnicianProfileApiService
import com.homeservices.customer.domain.technician.TechnicianProfileRepository
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
public abstract class TechnicianProfileModule {
    @Binds
    internal abstract fun bindTechnicianProfileRepository(impl: TechnicianProfileRepositoryImpl): TechnicianProfileRepository

    public companion object {
        @Provides
        @Singleton
        public fun provideTechnicianProfileApiService(
            moshi: Moshi,
            client: OkHttpClient,
        ): TechnicianProfileApiService =
            Retrofit
                .Builder()
                .baseUrl(BuildConfig.API_BASE_URL + "/")
                .addConverterFactory(MoshiConverterFactory.create(moshi))
                .client(client)
                .build()
                .create(TechnicianProfileApiService::class.java)
    }
}
