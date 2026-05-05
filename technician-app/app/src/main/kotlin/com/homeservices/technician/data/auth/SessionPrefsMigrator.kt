package com.homeservices.technician.data.auth

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import java.security.KeyStore

/**
 * One-time migration helper from the deprecated [androidx.security.crypto.MasterKeys]-based
 * EncryptedSharedPreferences (key alias `_androidx_security_master_key_`) to the new
 * [androidx.security.crypto.MasterKey.Builder]-based prefs.
 *
 * See customer-app's [com.homeservices.customer.data.auth.SessionPrefsMigrator] for full
 * design rationale. This is the technician-app sibling, operating on "tech_auth_session".
 */
public object SessionPrefsMigrator {
    private const val TAG = "TechSessionPrefsMig"

    private const val LEGACY_KEY_ALIAS = "_androidx_security_master_key_"
    private const val LEGACY_PREFS_NAME = "tech_auth_session"

    public fun isLegacyKeyPresent(): Boolean =
        try {
            val keyStore = KeyStore.getInstance("AndroidKeyStore")
            keyStore.load(null)
            keyStore.containsAlias(LEGACY_KEY_ALIAS)
        } catch (e: Exception) {
            Log.w(TAG, "KeyStore probe failed", e)
            false
        }

    public fun migrateIfNeeded(
        context: Context,
        newPrefs: SharedPreferences,
        newPrefsName: String,
    ) {
        migrateIfNeededInternal(
            context = context,
            newPrefs = newPrefs,
            newPrefsName = newPrefsName,
            legacyKeyPresent = isLegacyKeyPresent(),
        )
    }

    /**
     * Internal migration logic — accepts [legacyKeyPresent] as a parameter so unit tests
     * can drive both paths without needing to mock the KeyStore or the outer object.
     */
    internal fun migrateIfNeededInternal(
        context: Context,
        newPrefs: SharedPreferences,
        newPrefsName: String,
        legacyKeyPresent: Boolean,
    ) {
        if (!legacyKeyPresent) {
            Log.d(TAG, "No legacy key found — skipping migration for $newPrefsName")
            return
        }

        Log.i(TAG, "Legacy MasterKey alias found — migrating $newPrefsName")
        try {
            val legacyPrefs =
                context.getSharedPreferences(LEGACY_PREFS_NAME, Context.MODE_PRIVATE)
            val allEntries = legacyPrefs.all

            if (allEntries.isNotEmpty()) {
                val editor = newPrefs.edit()
                for ((key, value) in allEntries) {
                    when (value) {
                        is String -> editor.putString(key, value)
                        is Long -> editor.putLong(key, value)
                        is Int -> editor.putInt(key, value)
                        is Boolean -> editor.putBoolean(key, value)
                        is Float -> editor.putFloat(key, value)
                        else -> Log.w(TAG, "Skipping unsupported pref type for key=$key")
                    }
                }
                editor.apply()
                Log.i(TAG, "Migrated ${allEntries.size} entries to $newPrefsName")

                legacyPrefs.edit().clear().apply()
                Log.i(TAG, "Cleared legacy prefs $LEGACY_PREFS_NAME")
            } else {
                Log.d(TAG, "Legacy prefs empty — nothing to migrate")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Migration failed — clearing new prefs to force re-login", e)
            newPrefs.edit().clear().apply()
        }
    }
}
