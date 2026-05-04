package com.homeservices.technician.domain.integrity.di

import android.content.Context
import com.homeservices.technician.BuildConfig
import com.homeservices.technician.data.integrity.IntegrityApiService
import com.homeservices.technician.domain.integrity.IntegrityAttestor
import com.homeservices.technician.domain.integrity.PlayIntegrityAttestor
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
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
    public fun provideIntegrityApiService(): IntegrityApiService {
        val moshi = Moshi.Builder().addLast(KotlinJsonAdapterFactory()).build()
        val client = OkHttpClient.Builder().build()
        return Retrofit
            .Builder()
            .baseUrl(BuildConfig.API_BASE_URL + "/")
            .addConverterFactory(MoshiConverterFactory.create(moshi))
            .client(client)
            .build()
            .create(IntegrityApiService::class.java)
    }
}
