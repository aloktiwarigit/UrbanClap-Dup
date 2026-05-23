package com.homeservices.technician.data.shield.di

import com.homeservices.technician.data.shield.ShieldRepositoryImpl
import com.homeservices.technician.data.shield.remote.ShieldApiService
import com.homeservices.technician.domain.shield.ShieldRepository
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
public abstract class ShieldModule {
    @Binds
    internal abstract fun bindShieldRepository(impl: ShieldRepositoryImpl): ShieldRepository

    public companion object {
        @Provides
        @Singleton
        public fun provideShieldApiService(retrofit: Retrofit): ShieldApiService = retrofit.create(ShieldApiService::class.java)
    }
}
