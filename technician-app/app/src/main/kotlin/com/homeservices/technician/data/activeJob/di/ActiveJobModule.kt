package com.homeservices.technician.data.activeJob.di

import android.content.Context
import androidx.room.Room
import com.homeservices.technician.BuildConfig
import com.homeservices.technician.data.activeJob.ActiveJobApiService
import com.homeservices.technician.data.activeJob.ActiveJobRepositoryImpl
import com.homeservices.technician.data.activeJob.db.ActiveJobDao
import com.homeservices.technician.data.activeJob.db.ActiveJobDatabase
import com.homeservices.technician.data.network.defaultMoshi
import com.homeservices.technician.data.rating.di.AuthOkHttpClient
import com.homeservices.technician.domain.activeJob.ActiveJobRepository
import dagger.Binds
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
public abstract class ActiveJobModule {
    @Binds
    @Singleton
    public abstract fun bindActiveJobRepository(impl: ActiveJobRepositoryImpl): ActiveJobRepository

    public companion object {
        @Provides
        @Singleton
        internal fun provideActiveJobApiService(
            @AuthOkHttpClient client: OkHttpClient,
        ): ActiveJobApiService =
            Retrofit
                .Builder()
                .baseUrl(BuildConfig.API_BASE_URL.trimEnd('/') + "/")
                .client(client)
                .addConverterFactory(MoshiConverterFactory.create(defaultMoshi))
                .build()
                .create(ActiveJobApiService::class.java)

        @Provides
        @Singleton
        public fun provideActiveJobDatabase(
            @ApplicationContext context: Context,
        ): ActiveJobDatabase =
            Room
                .databaseBuilder(context, ActiveJobDatabase::class.java, "active_job_db")
                .fallbackToDestructiveMigration()
                .build()

        @Provides
        @Singleton
        internal fun provideActiveJobDao(db: ActiveJobDatabase): ActiveJobDao = db.activeJobDao()
    }
}
