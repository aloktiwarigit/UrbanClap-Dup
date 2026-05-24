package com.homeservices.technician.domain.integrity.di

import android.content.Context
import com.homeservices.technician.BuildConfig
import com.homeservices.technician.data.integrity.IntegrityApiService
import com.homeservices.technician.domain.integrity.IntegrityAttestor
import com.homeservices.technician.domain.integrity.PlayIntegrityAttestor
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
public object IntegrityModule {
    @Provides
    @Singleton
    public fun providePlayIntegrityAttestor(
        @ApplicationContext context: Context,
    ): PlayIntegrityAttestor = PlayIntegrityAttestor(context, debugBypass = BuildConfig.DEBUG)

    @Provides
    @Singleton
    public fun provideIntegrityAttestor(impl: PlayIntegrityAttestor): IntegrityAttestor = impl

    @Provides
    @Singleton
    internal fun provideIntegrityApiService(retrofit: Retrofit): IntegrityApiService = retrofit.create(IntegrityApiService::class.java)
}
