package com.homeservices.customer.data.consent.di

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.PreferenceDataStoreFactory
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.preferencesDataStoreFile
import com.homeservices.customer.data.consent.ConsentRepositoryImpl
import com.homeservices.customer.domain.consent.ConsentRepository
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
public abstract class ConsentModule {
    @Binds
    @Singleton
    public abstract fun bindConsentRepository(impl: ConsentRepositoryImpl): ConsentRepository

    public companion object {
        @Provides
        @Singleton
        @ConsentPrefs
        public fun provideConsentDataStore(
            @ApplicationContext context: Context,
        ): DataStore<Preferences> =
            PreferenceDataStoreFactory.create(
                produceFile = { context.preferencesDataStoreFile("consent_prefs") },
            )
    }
}
