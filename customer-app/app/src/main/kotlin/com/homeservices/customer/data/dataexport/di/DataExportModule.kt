package com.homeservices.customer.data.dataexport.di

import com.homeservices.customer.BuildConfig
import com.homeservices.customer.data.booking.di.AuthOkHttpClient
import com.homeservices.customer.data.dataexport.DataExportRepository
import com.homeservices.customer.data.dataexport.DataExportRepositoryImpl
import com.homeservices.customer.data.dataexport.remote.DataExportApiService
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import javax.inject.Singleton

/**
 * Hilt module for the data-export feature.
 *
 * Uses a plain [Retrofit] instance without a JSON converter because the endpoint
 * returns [okhttp3.ResponseBody] — the raw bytes are streamed directly to the
 * user-selected file via the Storage Access Framework without re-parsing.
 */
@Module
@InstallIn(SingletonComponent::class)
public abstract class DataExportModule {
    @Binds
    internal abstract fun bindDataExportRepository(impl: DataExportRepositoryImpl): DataExportRepository

    public companion object {
        @Provides
        @Singleton
        public fun provideDataExportApiService(
            @AuthOkHttpClient client: OkHttpClient,
        ): DataExportApiService =
            Retrofit
                .Builder()
                .baseUrl(BuildConfig.API_BASE_URL + "/")
                .client(client)
                .build()
                .create(DataExportApiService::class.java)
    }
}
