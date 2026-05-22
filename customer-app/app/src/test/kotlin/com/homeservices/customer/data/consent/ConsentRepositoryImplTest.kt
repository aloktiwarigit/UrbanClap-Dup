package com.homeservices.customer.data.consent

import androidx.datastore.preferences.core.PreferenceDataStoreFactory
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
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

    // ─── Scenario 3: revokeConsent after grant emits Revoked and re-consent required ─

    @Test
    public fun `revokeConsent after grant emits Revoked and isConsentRequired true`(): Unit =
        runTest {
            repo.grantConsent(analyticsOptIn = true, crashOptIn = true, marketingOptIn = true)
            repo.revokeConsent()

            val state = repo.consentState.first()
            assertThat(state).isInstanceOf(ConsentState.Revoked::class.java)
            // Revoked is not Granted, so re-consent must be required.
            val required = repo.isConsentRequired.first()
            assertThat(required).isTrue()
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
            // Grant normally (writes version = CURRENT_CONSENT_VERSION).
            repo.grantConsent(analyticsOptIn = true, crashOptIn = true, marketingOptIn = true)

            // Downgrade the stored version to 0 to simulate stale consent.
            // Mirrors KEY_CONSENT_VERSION — if the key name changes, update this test too.
            val dataStore =
                PreferenceDataStoreFactory.create {
                    tempFolder.newFolder().resolve("consent_prefs.preferences_pb")
                }
            val v0Repo = ConsentRepositoryImpl(dataStore)
            v0Repo.grantConsent(analyticsOptIn = true, crashOptIn = true, marketingOptIn = true)
            dataStore.edit { prefs ->
                prefs[intPreferencesKey("consent_version")] = 0
            }

            val state = v0Repo.consentState.first()
            assertThat(state).isInstanceOf(ConsentState.Granted::class.java)
            assertThat((state as ConsentState.Granted).version).isEqualTo(0)

            val required = v0Repo.isConsentRequired.first()
            assertThat(required).isTrue()
        }
}
