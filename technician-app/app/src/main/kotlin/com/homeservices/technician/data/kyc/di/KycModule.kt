package com.homeservices.technician.data.kyc.di

import com.google.firebase.storage.FirebaseStorage
import com.homeservices.technician.BuildConfig
import com.homeservices.technician.data.kyc.FirebaseStorageUploaderImpl
import com.homeservices.technician.data.kyc.KycApiService
import com.homeservices.technician.data.kyc.KycRepository
import com.homeservices.technician.data.kyc.KycRepositoryImpl
import com.homeservices.technician.data.network.defaultMoshi
import com.homeservices.technician.data.rating.di.AuthOkHttpClient
import com.homeservices.technician.domain.kyc.FirebaseStorageUploader
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
        internal fun provideKycApiService(
            @AuthOkHttpClient client: OkHttpClient,
        ): KycApiService =
            Retrofit
                .Builder()
                .baseUrl(BuildConfig.API_BASE_URL.trimEnd('/') + "/")
                .client(client)
                .addConverterFactory(MoshiConverterFactory.create(defaultMoshi))
                .build()
                .create(KycApiService::class.java)

        @Provides
        @Singleton
        public fun provideFirebaseStorage(): FirebaseStorage = FirebaseStorage.getInstance()
    }
}
