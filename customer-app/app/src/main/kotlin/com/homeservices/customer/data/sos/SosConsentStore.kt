package com.homeservices.customer.data.sos

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class SosConsentStore @Inject constructor(
    private val dataStore: DataStore<Preferences>,
) {
    private val key = booleanPreferencesKey("sos_audio_consent_given")

    public suspend fun getAudioConsent(): Boolean? =
        dataStore.data.map { it[key] }.firstOrNull()

    public suspend fun setAudioConsent(granted: Boolean) {
        dataStore.edit { it[key] = granted }
    }
}
