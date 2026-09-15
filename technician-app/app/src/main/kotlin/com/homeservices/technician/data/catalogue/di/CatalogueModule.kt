package com.homeservices.technician.data.catalogue.di

import com.homeservices.technician.data.catalogue.CatalogueRepositoryImpl
import com.homeservices.technician.data.catalogue.remote.CatalogueApiService
import com.homeservices.technician.domain.catalogue.CatalogueRepository
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
internal abstract class CatalogueModule {
    @Binds
    abstract fun bindCatalogueRepository(impl: CatalogueRepositoryImpl): CatalogueRepository

    companion object {
        @Provides
        @Singleton
        fun provideCatalogueApiService(retrofit: Retrofit): CatalogueApiService = retrofit.create(CatalogueApiService::class.java)
    }
}
