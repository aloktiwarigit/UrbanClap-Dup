package com.homeservices.technician.data.locale

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import com.homeservices.technician.data.locale.di.LocalePrefs
import com.homeservices.technician.domain.locale.LocaleRepository
import dagger.hilt.android.qualifiers.ApplicationContext
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
        @ApplicationContext private val context: Context,
    ) : LocaleRepository {
        public companion object {
            internal val KEY_LOCALE_TAG = stringPreferencesKey("locale_tag")
            public const val DEFAULT_LOCALE: String = "hi" // ADR-0018: Hindi default for Ayodhya/UP pilot

            // SharedPreferences mirror for synchronous cold-start read in Application.onCreate.
            // Written on every setLocale() call so Application.onCreate can apply the locale
            // synchronously before the first Compose frame, eliminating the DataStore-race flash.
            private const val MIRROR_PREFS = "locale_mirror"
            private const val MIRROR_KEY = "locale_tag"

            public fun readMirrorLocale(context: Context): String? {
                val prefs = context.getSharedPreferences(MIRROR_PREFS, Context.MODE_PRIVATE)
                return prefs.getString(MIRROR_KEY, null)
            }

            internal fun writeMirrorLocale(
                context: Context,
                tag: String,
            ) {
                val editor = context.getSharedPreferences(MIRROR_PREFS, Context.MODE_PRIVATE).edit()
                editor.putString(MIRROR_KEY, tag)
                editor.apply()
            }
        }

        override val currentLocale: Flow<String> =
            dataStore.data.map { prefs -> prefs[KEY_LOCALE_TAG] ?: deviceSupportedLocale() }

        override suspend fun setLocale(tag: String) {
            writeMirrorLocale(context, tag)
            dataStore.edit { prefs -> prefs[KEY_LOCALE_TAG] = tag }
        }

        private fun deviceSupportedLocale(): String =
            when (Locale.getDefault().language) {
                "hi" -> "hi"
                else -> DEFAULT_LOCALE
            }
    }
