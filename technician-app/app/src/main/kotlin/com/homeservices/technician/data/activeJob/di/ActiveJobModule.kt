package com.homeservices.technician.data.activeJob.di

import android.content.Context
import androidx.room.Room
import com.homeservices.technician.data.activeJob.ActiveJobApiService
import com.homeservices.technician.data.activeJob.ActiveJobRepositoryImpl
import com.homeservices.technician.data.activeJob.db.ActiveJobDao
import com.homeservices.technician.data.activeJob.db.ActiveJobDatabase
import com.homeservices.technician.domain.activeJob.ActiveJobRepository
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
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
        internal fun provideActiveJobApiService(retrofit: Retrofit): ActiveJobApiService =
            retrofit.create(ActiveJobApiService::class.java)

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
