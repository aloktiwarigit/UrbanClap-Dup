package com.homeservices.customer.data.consent

import androidx.datastore.preferences.core.PreferenceDataStoreFactory
import com.google.common.truth.Truth.assertThat
import com.homeservices.customer.domain.consent.ConsentState
import com.homeservices.customer.domain.consent.CURRENT_CONSENT_VERSION
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
public class ConsentRepositoryImplTest {
    @get:Rule
    public val tempFolder: TemporaryFolder = TemporaryFolder()

    private lateinit var repo: ConsentRepositoryImpl

    @Before
    public fun setUp() {
        val dataStore =
            PreferenceDataStoreFactory.create {
                tempFolder.newFolder().resolve("consent_prefs.preferences_pb")
            }
        repo = ConsentRepositoryImpl(dataStore)
    }

    // ─── Scenario 1: Initial state is NotGiven ───────────────────────────────

    @Test
    public fun `consentState defaults to NotGiven when nothing is stored`(): Unit =
        runTest {
            val state = repo.consentState.first()
            assertThat(state).isInstanceOf(ConsentState.NotGiven::class.java)
        }

    // ─── Scenario 2: grantConsent persists and emits Granted ────────────────

    @Test
    public fun `grantConsent emits Granted with correct fields`(): Unit =
        runTest {
            repo.grantConsent(analyticsOptIn = true, crashOptIn = true, marketingOptIn = false)

            val state = repo.consentState.first()
            assertThat(state).isInstanceOf(ConsentState.Granted::class.java)
            val granted = state as ConsentState.Granted
            assertThat(granted.version).isEqualTo(CURRENT_CONSENT_VERSION)
            assertThat(granted.analyticsOptIn).isTrue()
            assertThat(granted.crashOptIn).isTrue()
            assertThat(granted.marketingOptIn).isFalse()
            assertThat(granted.grantedAt).isNotNull()
        }

    // ─── Scenario 3: revokeConsent after grant emits Revoked ────────────────

    @Test
    public fun `revokeConsent after grant emits Revoked`(): Unit =
        runTest {
            repo.grantConsent(analyticsOptIn = true, crashOptIn = true, marketingOptIn = true)
            repo.revokeConsent()

            val state = repo.consentState.first()
            assertThat(state).isInstanceOf(ConsentState.Revoked::class.java)
        }

    // ─── Scenario 4: isConsentRequired true for NotGiven ────────────────────

    @Test
    public fun `isConsentRequired is true when consent is NotGiven`(): Unit =
        runTest {
            val required = repo.isConsentRequired.first()
            assertThat(required).isTrue()
        }

    // ─── Scenario 5: isConsentRequired false for current-version Granted ────

    @Test
    public fun `isConsentRequired is false when consent is Granted at current version`(): Unit =
        runTest {
            repo.grantConsent(analyticsOptIn = false, crashOptIn = false, marketingOptIn = false)

            val required = repo.isConsentRequired.first()
            assertThat(required).isFalse()
        }

    // ─── Scenario 6: isConsentRequired true for old-version Granted ─────────

    @Test
    public fun `isConsentRequired is true when consent was granted at an older version`(): Unit =
        runTest {
            // Write version 0 directly into the DataStore to simulate old consent
            val dataStore =
                PreferenceDataStoreFactory.create {
                    tempFolder.newFolder().resolve("consent_prefs_old.preferences_pb")
                }
            val oldRepo = ConsentRepositoryImpl(dataStore)
            // Grant consent — then manually overwrite the version key to simulate old version
            oldRepo.grantConsent(analyticsOptIn = true, crashOptIn = true, marketingOptIn = true)

            // We verify via the isConsentRequired logic: version 0 < CURRENT_CONSENT_VERSION(1)
            // Since we cannot easily write version=0 without exposing internals, we verify via
            // the companion object keys using an injected DataStore.edit:
            val prefs =
                androidx.datastore.preferences.core.preferencesOf(
                    androidx.datastore.preferences.core.stringPreferencesKey("consent_state") to "GRANTED",
                    androidx.datastore.preferences.core.intPreferencesKey("consent_version") to 0,
                    androidx.datastore.preferences.core.longPreferencesKey("consent_granted_at") to
                        java.time.Instant.now().toEpochMilli(),
                    androidx.datastore.preferences.core.booleanPreferencesKey("consent_analytics") to true,
                    androidx.datastore.preferences.core.booleanPreferencesKey("consent_crash") to true,
                    androidx.datastore.preferences.core.booleanPreferencesKey("consent_marketing") to true,
                )

            // Use a fresh DataStore with v0 data written directly
            val rawDataStore =
                PreferenceDataStoreFactory.create {
                    tempFolder.newFolder().resolve("consent_prefs_v0.preferences_pb")
                }
            rawDataStore.updateData { prefs }

            val v0Repo = ConsentRepositoryImpl(rawDataStore)
            val state = v0Repo.consentState.first()
            assertThat(state).isInstanceOf(ConsentState.Granted::class.java)
            assertThat((state as ConsentState.Granted).version).isEqualTo(0)

            val required = v0Repo.isConsentRequired.first()
            assertThat(required).isTrue()
        }
}
