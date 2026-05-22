package com.homeservices.customer.domain.consent

import com.homeservices.customer.data.consent.remote.ConsentAuditApiService
import com.homeservices.customer.data.consent.remote.dto.ConsentAuditRequestDto
import io.sentry.Breadcrumb
import io.sentry.Sentry
import java.time.Instant
import javax.inject.Inject

/**
 * Grant DPDP consent and best-effort post an audit trail to the server.
 *
 * DataStore write always happens first and is the source of truth. The audit
 * POST is fire-and-forget — a network failure is caught, logged as a Sentry
 * breadcrumb, and not surfaced to the caller.
 */
public class GrantConsentUseCase
    @Inject
    constructor(
        private val consentRepository: ConsentRepository,
        private val consentAuditApiService: ConsentAuditApiService,
    ) {
        public suspend operator fun invoke(
            analyticsOptIn: Boolean,
            crashOptIn: Boolean,
            marketingOptIn: Boolean,
        ) {
            // 1. Persist consent — must succeed before anything else.
            consentRepository.grantConsent(
                analyticsOptIn = analyticsOptIn,
                crashOptIn = crashOptIn,
                marketingOptIn = marketingOptIn,
            )

            // 2. Fire audit POST — best-effort, never throws to caller.
            try {
                val timestamp = Instant.now().toString() // ISO-8601 UTC
                consentAuditApiService.postConsentAudit(
                    ConsentAuditRequestDto(
                        action = "GRANTED",
                        version = CURRENT_CONSENT_VERSION,
                        timestamp = timestamp,
                        analyticsOptIn = analyticsOptIn,
                        crashOptIn = crashOptIn,
                        marketingOptIn = marketingOptIn,
                    ),
                )
            } catch (e: Exception) {
                Sentry.addBreadcrumb(
                    Breadcrumb.info("consent-audit POST failed (best-effort): ${e.message}"),
                )
            }
        }
    }
