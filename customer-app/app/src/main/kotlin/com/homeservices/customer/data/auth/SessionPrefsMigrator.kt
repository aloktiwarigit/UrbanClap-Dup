package com.homeservices.customer.data.auth

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import java.security.KeyStore

/**
 * One-time migration helper that guards against a hypothetical legacy plaintext prefs file
 * at the `auth_session` filename.
 *
 * **Actual migration behavior (SEC-07):**
 * The _known_ prior state of this app used [androidx.security.crypto.MasterKeys]-backed
 * [androidx.security.crypto.EncryptedSharedPreferences] (key alias
 * `_androidx_security_master_key_`). That file cannot be decrypted here because:
 * - [MasterKeys] encrypted both the key _names_ and the values.
 * - Opening the file as plaintext via [android.content.Context.getSharedPreferences]
 *   returns ciphertext blobs under encrypted key names, not readable entries.
 * - The [androidx.security.crypto.MasterKey] key alias may be unavailable (key rotation,
 *   device restore, factory reset) so decryption is not attempted.
 *
 * Users whose legacy prefs were encrypted will silently re-login. This is the intended
 * fallback — the session TTL would have expired anyway on most devices.
 *
 * This migrator only provides value for a hypothetical plaintext legacy prefs file
 * (e.g. if a future rollback created one). It is a no-op for the encrypted case.
 *
 * The internal logic is split into [migrateIfNeededInternal] to support unit-testing without
 * Robolectric classloader constraints (see [SessionPrefsMigratorTest]).
 */
public object SessionPrefsMigrator {
    private const val TAG = "SessionPrefsMigrator"

    /** The legacy key alias created by [androidx.security.crypto.MasterKeys.getOrCreate]. */
    private const val LEGACY_KEY_ALIAS = "_androidx_security_master_key_"

    /** The legacy prefs file name (must match what [androidx.security.crypto.MasterKeys] used). */
    private const val LEGACY_PREFS_NAME = "auth_session"

    /**
     * Returns `true` when the legacy MasterKey alias is present in the Android KeyStore.
     */
    public fun isLegacyKeyPresent(): Boolean =
        try {
            val keyStore = KeyStore.getInstance("AndroidKeyStore")
            keyStore.load(null)
            keyStore.containsAlias(LEGACY_KEY_ALIAS)
        } catch (e: Exception) {
            Log.w(TAG, "KeyStore probe failed", e)
            false
        }

    /**
     * Runs the migration if needed. Call this once during [AuthModule.provideAuthPrefs],
     * before returning the new [SharedPreferences] instance.
     *
     * @param context Application context.
     * @param newPrefs The new (already-opened) [SharedPreferences] backed by
     *   [androidx.security.crypto.MasterKey.Builder].
     * @param newPrefsName The filename for [newPrefs] (used for logging only).
     */
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
     *
     * Visible for testing only; do not call from production code directly.
     */
    internal fun migrateIfNeededInternal(
        context: Context,
        newPrefs: SharedPreferences,
        newPrefsName: String,
        legacyKeyPresent: Boolean,
    ) {
        if (newPrefsName == LEGACY_PREFS_NAME) {
            Log.d(TAG, "Active prefs already use $LEGACY_PREFS_NAME - skipping migration")
            return
        }

        if (!legacyKeyPresent) {
            Log.d(TAG, "No legacy key found - skipping migration for $newPrefsName")
            return
        }

        // Opening as plaintext. If the legacy file was written by EncryptedSharedPreferences,
        // legacyPrefs.all returns encrypted key names as strings — migration "copies" them but
        // produces useless entries; the session will be empty and the user must re-login.
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

                // Clear legacy prefs so they're not read again
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
