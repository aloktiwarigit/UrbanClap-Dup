package com.homeservices.customer.data.auth

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import java.security.KeyStore

/**
 * One-time migration helper from the deprecated [androidx.security.crypto.MasterKeys]-based
 * EncryptedSharedPreferences (key alias `_androidx_security_master_key_`) to the new
 * [androidx.security.crypto.MasterKey.Builder]-based prefs.
 *
 * Migration is safe and conservative:
 * - If the legacy key alias is absent, this is a no-op.
 * - If the legacy key is present, all key/value pairs are copied to [newPrefs] and the
 *   legacy prefs are cleared.
 * - On any error during migration, [newPrefs] is cleared so the session expires naturally
 *   (180-day TTL means this is a rare edge case).
 *
 * The internal logic is split into [migrateIfNeededInternal] to support unit-testing without
 * Robolectric classloader constraints (objects with @JvmStatic are not intercept-able by
 * mockkObject in a Robolectric sandbox — see [SessionPrefsMigratorTest]).
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
