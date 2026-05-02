package com.homeservices.customer.data.locale.di

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.preferencesDataStore
import com.homeservices.customer.data.locale.LocaleRepositoryImpl
import com.homeservices.customer.domain.locale.LocaleRepository
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

private val Context.localePreferencesDataStore: DataStore<Preferences> by preferencesDataStore(name = "locale_prefs")

@Module
@InstallIn(SingletonComponent::class)
public object LocaleModule {
    @Provides
    @Singleton
    @LocalePrefs
    public fun provideLocaleDataStore(
        @ApplicationContext context: Context,
    ): DataStore<Preferences> = context.localePreferencesDataStore
}

@Module
@InstallIn(SingletonComponent::class)
public abstract class LocaleBindings {
    @Binds
    @Singleton
    public abstract fun bindLocaleRepository(impl: LocaleRepositoryImpl): LocaleRepository
}
