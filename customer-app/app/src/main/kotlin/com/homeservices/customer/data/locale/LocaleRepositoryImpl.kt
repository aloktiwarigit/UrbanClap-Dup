package com.homeservices.customer.data.locale

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import com.homeservices.customer.data.locale.di.LocalePrefs
import com.homeservices.customer.domain.locale.LocaleRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.util.Locale
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class LocaleRepositoryImpl
    @Inject
    constructor(
        @LocalePrefs private val dataStore: DataStore<Preferences>,
    ) : LocaleRepository {
        private companion object {
            val KEY_LOCALE_TAG = stringPreferencesKey("locale_tag")
            val KEY_FIRST_LAUNCH_COMPLETED = booleanPreferencesKey("first_launch_completed")
            const val DEFAULT_LOCALE = "en"
        }

        override val currentLocale: Flow<String> =
            dataStore.data.map { prefs -> prefs[KEY_LOCALE_TAG] ?: deviceSupportedLocale() }

        override val firstLaunchPending: Flow<Boolean> =
            dataStore.data.map { prefs -> !(prefs[KEY_FIRST_LAUNCH_COMPLETED] ?: false) }

        override suspend fun setLocale(tag: String) {
            dataStore.edit { prefs -> prefs[KEY_LOCALE_TAG] = tag }
        }

        override suspend fun markFirstLaunchCompleted() {
            dataStore.edit { prefs -> prefs[KEY_FIRST_LAUNCH_COMPLETED] = true }
        }

        private fun deviceSupportedLocale(): String =
            when (Locale.getDefault().language) {
                "hi" -> "hi"
                else -> DEFAULT_LOCALE
            }
    }
