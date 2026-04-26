package com.homeservices.customer.data.sos.di

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.preferencesDataStore
import com.homeservices.customer.BuildConfig
import com.homeservices.customer.data.booking.di.AuthOkHttpClient
import com.homeservices.customer.data.sos.remote.SosApiService
import com.squareup.moshi.Moshi
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import javax.inject.Named
import javax.inject.Singleton

private val Context.sosDataStore: DataStore<Preferences> by preferencesDataStore(name = "sos_consent")

@Module
@InstallIn(SingletonComponent::class)
public object SosModule {
    @Provides
    @Singleton
    @Named("sos_consent")
    public fun provideSosDataStore(
        @ApplicationContext context: Context,
    ): DataStore<Preferences> = context.sosDataStore

    @Provides
    @Singleton
    public fun provideSosApiService(
        @AuthOkHttpClient client: OkHttpClient,
        moshi: Moshi,
    ): SosApiService =
        Retrofit
            .Builder()
            .baseUrl(BuildConfig.API_BASE_URL + "/")
            .addConverterFactory(MoshiConverterFactory.create(moshi))
            .client(client)
            .build()
            .create(SosApiService::class.java)
}
