package com.homeservices.technician.data.complaint.di

import com.homeservices.technician.data.complaint.ComplaintRepository
import com.homeservices.technician.data.complaint.ComplaintRepositoryImpl
import com.homeservices.technician.data.complaint.remote.ComplaintApiService
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
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
        public fun provideComplaintApiService(retrofit: Retrofit): ComplaintApiService = retrofit.create(ComplaintApiService::class.java)
    }
}
