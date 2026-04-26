package com.homeservices.customer.data.complaint.di

import com.google.firebase.storage.FirebaseStorage
import com.homeservices.customer.BuildConfig
import com.homeservices.customer.data.booking.di.AuthOkHttpClient
import com.homeservices.customer.data.complaint.ComplaintRepository
import com.homeservices.customer.data.complaint.ComplaintRepositoryImpl
import com.homeservices.customer.data.complaint.remote.ComplaintApiService
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
public abstract class ComplaintModule {
    @Binds
    internal abstract fun bindComplaintRepository(impl: ComplaintRepositoryImpl): ComplaintRepository

    public companion object {
        @Provides
        @Singleton
        public fun provideComplaintApiService(
            @AuthOkHttpClient client: OkHttpClient,
            moshi: Moshi,
        ): ComplaintApiService =
            Retrofit
                .Builder()
                .baseUrl(BuildConfig.API_BASE_URL + "/")
                .addConverterFactory(MoshiConverterFactory.create(moshi))
                .client(client)
                .build()
                .create(ComplaintApiService::class.java)

        @Provides
        @Singleton
        public fun provideFirebaseStorage(): FirebaseStorage = FirebaseStorage.getInstance()
    }
}
