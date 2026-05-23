package com.homeservices.customer.data.consent

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import com.homeservices.customer.data.consent.di.ConsentPrefs
import com.homeservices.customer.data.consent.remote.ConsentAuditApiService
import com.homeservices.customer.data.consent.remote.dto.ConsentAuditRequestDto
import com.homeservices.customer.domain.consent.CURRENT_CONSENT_VERSION
import com.homeservices.customer.domain.consent.ConsentRepository
import com.homeservices.customer.domain.consent.ConsentState
import io.sentry.Breadcrumb
import io.sentry.Sentry
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.time.Instant
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class ConsentRepositoryImpl
    @Inject
    constructor(
        @ConsentPrefs private val dataStore: DataStore<Preferences>,
        private val consentAuditApiService: ConsentAuditApiService,
    ) : ConsentRepository {
        private companion object {
            val KEY_CONSENT_STATE = stringPreferencesKey("consent_state")
            val KEY_CONSENT_VERSION = intPreferencesKey("consent_version")
            val KEY_GRANTED_AT = longPreferencesKey("consent_granted_at")
            val KEY_ANALYTICS = booleanPreferencesKey("consent_analytics")
            val KEY_CRASH = booleanPreferencesKey("consent_crash")
            val KEY_MARKETING = booleanPreferencesKey("consent_marketing")

            const val STATE_GRANTED = "GRANTED"
            const val STATE_REVOKED = "REVOKED"
        }

        override val consentState: Flow<ConsentState> =
            dataStore.data.map { prefs ->
                when (prefs[KEY_CONSENT_STATE]) {
                    STATE_GRANTED -> {
                        val version = prefs[KEY_CONSENT_VERSION]
                        val grantedAt = prefs[KEY_GRANTED_AT]
                        if (version != null && grantedAt != null) {
                            ConsentState.Granted(
                                version = version,
                                grantedAt = Instant.ofEpochMilli(grantedAt),
                                analyticsOptIn = prefs[KEY_ANALYTICS] ?: false,
                                crashOptIn = prefs[KEY_CRASH] ?: false,
                                marketingOptIn = prefs[KEY_MARKETING] ?: false,
                            )
                        } else {
                            ConsentState.NotGiven
                        }
                    }
                    STATE_REVOKED -> ConsentState.Revoked
                    else -> ConsentState.NotGiven
                }
            }

        override val isConsentRequired: Flow<Boolean> =
            consentState.map { state ->
                state is ConsentState.NotGiven ||
                    state is ConsentState.Revoked ||
                    (state is ConsentState.Granted && state.version < CURRENT_CONSENT_VERSION)
            }

        @Suppress("TooGenericExceptionCaught")
        override suspend fun grantConsent(
            analyticsOptIn: Boolean,
            crashOptIn: Boolean,
            marketingOptIn: Boolean,
        ) {
            dataStore.edit { prefs ->
                prefs[KEY_CONSENT_STATE] = STATE_GRANTED
                prefs[KEY_CONSENT_VERSION] = CURRENT_CONSENT_VERSION
                prefs[KEY_GRANTED_AT] = Instant.now().toEpochMilli()
                prefs[KEY_ANALYTICS] = analyticsOptIn
                prefs[KEY_CRASH] = crashOptIn
                prefs[KEY_MARKETING] = marketingOptIn
            }

            // Best-effort audit POST — never throws to caller.
            try {
                consentAuditApiService.postConsentAudit(
                    ConsentAuditRequestDto(
                        action = "GRANTED",
                        version = CURRENT_CONSENT_VERSION,
                        timestamp = Instant.now().toString(), // ISO-8601 UTC
                        analyticsOptIn = analyticsOptIn,
                        crashOptIn = crashOptIn,
                        marketingOptIn = marketingOptIn,
                    ),
                )
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                Sentry.addBreadcrumb(
                    Breadcrumb.info("consent-audit POST failed (best-effort): ${e.message}"),
                )
            }
        }

        @Suppress("TooGenericExceptionCaught")
        override suspend fun revokeConsent() {
            dataStore.edit { prefs ->
                prefs[KEY_CONSENT_STATE] = STATE_REVOKED
                prefs.remove(KEY_CONSENT_VERSION)
                prefs.remove(KEY_GRANTED_AT)
                prefs.remove(KEY_ANALYTICS)
                prefs.remove(KEY_CRASH)
                prefs.remove(KEY_MARKETING)
            }

            // Best-effort audit POST — never throws to caller.
            try {
                consentAuditApiService.postConsentAudit(
                    ConsentAuditRequestDto(
                        action = "REVOKED",
                        version = CURRENT_CONSENT_VERSION,
                        timestamp = Instant.now().toString(), // ISO-8601 UTC
                        analyticsOptIn = false,
                        crashOptIn = false,
                        marketingOptIn = false,
                    ),
                )
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                Sentry.addBreadcrumb(
                    Breadcrumb.info("consent-audit POST failed (best-effort): ${e.message}"),
                )
            }
        }
    }
