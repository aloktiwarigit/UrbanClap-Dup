package com.homeservices.technician.data.kyc.di

import com.homeservices.technician.data.kyc.FirebaseStorageUploaderImpl
import com.homeservices.technician.data.kyc.KycApiService
import com.homeservices.technician.data.kyc.KycRepository
import com.homeservices.technician.data.kyc.KycRepositoryImpl
import com.homeservices.technician.domain.kyc.FirebaseStorageUploader
import com.google.firebase.storage.FirebaseStorage
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
public abstract class KycModule {

    @Binds
    @Singleton
    public abstract fun bindKycRepository(impl: KycRepositoryImpl): KycRepository

    @Binds
    @Singleton
    public abstract fun bindFirebaseStorageUploader(impl: FirebaseStorageUploaderImpl): FirebaseStorageUploader

    public companion object {

        @Provides
        @Singleton
        internal fun provideKycApiService(): KycApiService {
            val logging = HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BODY
            }
            val client = OkHttpClient.Builder().addInterceptor(logging).build()
            return Retrofit.Builder()
                .baseUrl("https://homeservices-api.azurewebsites.net/api/")
                .client(client)
                .addConverterFactory(MoshiConverterFactory.create())
                .build()
                .create(KycApiService::class.java)
        }

        @Provides
        @Singleton
        public fun provideFirebaseStorage(): FirebaseStorage = FirebaseStorage.getInstance()
    }
}
