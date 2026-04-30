package com.homeservices.technician.data.photo.di

import com.homeservices.technician.data.photo.JobPhotoRepositoryImpl
import com.homeservices.technician.data.photo.PhotoApiService
import com.homeservices.technician.domain.photo.JobPhotoRepository
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
public abstract class PhotoModule {
    @Binds
    @Singleton
    internal abstract fun bindJobPhotoRepository(impl: JobPhotoRepositoryImpl): JobPhotoRepository

    public companion object {
        // FirebaseAuth already provided by AuthModule
        // FirebaseStorage already provided by KycModule

        @Provides
        @Singleton
        internal fun providePhotoApiService(): PhotoApiService =
            Retrofit
                .Builder()
                .baseUrl("https://func-homeservices-prod.azurewebsites.net/api/")
                .client(
                    OkHttpClient
                        .Builder()
                        .addInterceptor(
                            HttpLoggingInterceptor().apply {
                                level = HttpLoggingInterceptor.Level.BODY
                            },
                        ).build(),
                ).addConverterFactory(MoshiConverterFactory.create())
                .build()
                .create(PhotoApiService::class.java)
    }
}
