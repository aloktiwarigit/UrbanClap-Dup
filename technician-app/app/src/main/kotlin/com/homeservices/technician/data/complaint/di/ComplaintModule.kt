package com.homeservices.technician.data.complaint.di

import com.homeservices.technician.data.complaint.ComplaintRepository
import com.homeservices.technician.data.complaint.ComplaintRepositoryImpl
import com.homeservices.technician.data.complaint.remote.ComplaintApiService
import com.homeservices.technician.data.rating.di.AuthOkHttpClient
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
public abstract class ComplaintModule {
    @Binds
    internal abstract fun bindComplaintRepository(impl: ComplaintRepositoryImpl): ComplaintRepository

    public companion object {
        // FirebaseStorage already provided by KycModule
        // FirebaseAuth already provided by AuthModule

        @Provides
        @Singleton
        public fun provideComplaintApiService(
            @AuthOkHttpClient client: OkHttpClient,
        ): ComplaintApiService =
            Retrofit
                .Builder()
                .baseUrl("https://homeservices-api.azurewebsites.net/api/")
                .client(client)
                .addConverterFactory(MoshiConverterFactory.create())
                .build()
                .create(ComplaintApiService::class.java)
    }
}
