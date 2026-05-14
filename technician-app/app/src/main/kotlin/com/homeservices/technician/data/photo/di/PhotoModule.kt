package com.homeservices.technician.data.photo.di

import com.homeservices.technician.BuildConfig
import com.homeservices.technician.data.network.defaultMoshi
import com.homeservices.technician.data.photo.JobPhotoRepositoryImpl
import com.homeservices.technician.data.photo.PhotoApiService
import com.homeservices.technician.data.rating.di.AuthOkHttpClient
import com.homeservices.technician.domain.photo.JobPhotoRepository
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
public abstract class PhotoModule {
    @Binds
    @Singleton
    internal abstract fun bindJobPhotoRepository(impl: JobPhotoRepositoryImpl): JobPhotoRepository

    public companion object {
        // FirebaseAuth already provided by AuthModule
        // FirebaseStorage already provided by KycModule

        @Provides
        @Singleton
        internal fun providePhotoApiService(
            @AuthOkHttpClient client: OkHttpClient,
        ): PhotoApiService =
            Retrofit
                .Builder()
                .baseUrl(BuildConfig.API_BASE_URL.trimEnd('/') + "/")
                .client(client)
                .addConverterFactory(MoshiConverterFactory.create(defaultMoshi))
                .build()
                .create(PhotoApiService::class.java)
    }
}
