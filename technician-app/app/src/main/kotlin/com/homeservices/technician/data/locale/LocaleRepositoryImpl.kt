package com.homeservices.technician.data.locale

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import com.homeservices.technician.data.locale.di.LocalePrefs
import com.homeservices.technician.domain.locale.LocaleRepository
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
            const val DEFAULT_LOCALE = "hi" // ADR-0018: Hindi default for Ayodhya/UP pilot
        }

        override val currentLocale: Flow<String> =
            dataStore.data.map { prefs -> prefs[KEY_LOCALE_TAG] ?: deviceSupportedLocale() }

        override suspend fun setLocale(tag: String) {
            dataStore.edit { prefs -> prefs[KEY_LOCALE_TAG] = tag }
        }

        private fun deviceSupportedLocale(): String =
            when (Locale.getDefault().language) {
                "hi" -> "hi"
                else -> DEFAULT_LOCALE
            }
    }
