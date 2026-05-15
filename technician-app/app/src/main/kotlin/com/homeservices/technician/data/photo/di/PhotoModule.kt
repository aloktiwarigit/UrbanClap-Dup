package com.homeservices.technician.data.photo.di

import com.homeservices.technician.data.photo.JobPhotoRepositoryImpl
import com.homeservices.technician.data.photo.PhotoApiService
import com.homeservices.technician.domain.photo.JobPhotoRepository
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
public object PhotoModule {
    @Provides
    @Singleton
    internal fun providePhotoApiService(retrofit: Retrofit): PhotoApiService = retrofit.create(PhotoApiService::class.java)

    @Provides
    @Singleton
    internal fun provideJobPhotoRepository(impl: JobPhotoRepositoryImpl): JobPhotoRepository = impl
}
