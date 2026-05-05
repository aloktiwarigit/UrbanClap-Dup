package com.homeservices.technician.data.auth

import android.content.Context
import android.content.SharedPreferences
import androidx.test.core.app.ApplicationProvider
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

/**
 * Tests for [SessionPrefsMigrator] (technician-app variant).
 *
 * Migration contract:
 * 1. When legacy key alias is absent: no-op (new prefs untouched).
 * 2. When legacy key alias is present: values are copied to new prefs.
 * 3. On migration with no legacy data: new prefs unchanged.
 *
 * Tests call [SessionPrefsMigrator.migrateIfNeededInternal] directly, passing [legacyKeyPresent]
 * as a parameter, to avoid Robolectric classloader constraints on Kotlin objects.
 */
@RunWith(RobolectricTestRunner::class)
public class SessionPrefsMigratorTest {
    private lateinit var context: Context

    @Before
    public fun setUp() {
        context = ApplicationProvider.getApplicationContext()
    }

    @After
    public fun tearDown() {
        context
            .getSharedPreferences("tech_auth_session", Context.MODE_PRIVATE)
            .edit()
            .clear()
            .commit()
        context
            .getSharedPreferences("tech_auth_session_new", Context.MODE_PRIVATE)
            .edit()
            .clear()
            .commit()
    }

    @Test
    public fun `isLegacyKeyPresent returns false when AndroidKeyStore has no matching alias`() {
        val result = SessionPrefsMigrator.isLegacyKeyPresent()
        assertThat(result).isFalse()
    }

    @Test
    public fun `migrateIfNeeded is no-op when legacy key is absent`() {
        val newPrefs: SharedPreferences =
            context.getSharedPreferences("tech_auth_session_new", Context.MODE_PRIVATE)

        newPrefs.edit().putString("uid", "existing-uid").commit()

        SessionPrefsMigrator.migrateIfNeededInternal(
            context = context,
            newPrefs = newPrefs,
            newPrefsName = "tech_auth_session_new",
            legacyKeyPresent = false,
        )

        assertThat(newPrefs.getString("uid", null)).isEqualTo("existing-uid")
    }

    @Test
    public fun `migrateIfNeeded copies values from legacy prefs when legacy key present`() {
        val legacyPrefs: SharedPreferences =
            context.getSharedPreferences("tech_auth_session", Context.MODE_PRIVATE)
        legacyPrefs
            .edit()
            .putString("uid", "uid-tech-legacy")
            .putString("phone_last_four", "5678")
            .putLong("session_created_at_epoch_ms", 2_000_000L)
            .commit()

        val newPrefs: SharedPreferences =
            context.getSharedPreferences("tech_auth_session_new", Context.MODE_PRIVATE)

        SessionPrefsMigrator.migrateIfNeededInternal(
            context = context,
            newPrefs = newPrefs,
            newPrefsName = "tech_auth_session_new",
            legacyKeyPresent = true,
        )

        assertThat(newPrefs.getString("uid", null)).isEqualTo("uid-tech-legacy")
        assertThat(newPrefs.getString("phone_last_four", null)).isEqualTo("5678")
        assertThat(newPrefs.getLong("session_created_at_epoch_ms", 0L)).isEqualTo(2_000_000L)

        assertThat(legacyPrefs.all).isEmpty()
    }

    @Test
    public fun `migrateIfNeeded leaves new prefs intact when legacy prefs are empty`() {
        val newPrefs: SharedPreferences =
            context.getSharedPreferences("tech_auth_session_new", Context.MODE_PRIVATE)
        newPrefs.edit().putString("uid", "existing-uid").commit()

        // Legacy prefs file is empty — nothing to copy; new prefs should survive.
        SessionPrefsMigrator.migrateIfNeededInternal(
            context = context,
            newPrefs = newPrefs,
            newPrefsName = "tech_auth_session_new",
            legacyKeyPresent = true,
        )

        assertThat(newPrefs.getString("uid", null)).isEqualTo("existing-uid")
    }
}
