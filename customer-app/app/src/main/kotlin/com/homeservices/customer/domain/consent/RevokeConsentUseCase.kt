package com.homeservices.customer.domain.consent

import com.homeservices.customer.data.consent.remote.ConsentAuditApiService
import com.homeservices.customer.data.consent.remote.dto.ConsentAuditRequestDto
import io.sentry.Breadcrumb
import io.sentry.Sentry
import java.time.Instant
import javax.inject.Inject

/**
 * Revoke DPDP consent and best-effort post an audit trail to the server.
 *
 * DataStore revocation always happens first. The audit POST is fire-and-forget.
 */
public class RevokeConsentUseCase
    @Inject
    constructor(
        private val consentRepository: ConsentRepository,
        private val consentAuditApiService: ConsentAuditApiService,
    ) {
        public suspend operator fun invoke() {
            // 1. Persist revocation.
            consentRepository.revokeConsent()

            // 2. Fire audit POST — best-effort, never throws to caller.
            try {
                val timestamp = Instant.now().toString() // ISO-8601 UTC
                consentAuditApiService.postConsentAudit(
                    ConsentAuditRequestDto(
                        action = "REVOKED",
                        version = CURRENT_CONSENT_VERSION,
                        timestamp = timestamp,
                        analyticsOptIn = false,
                        crashOptIn = false,
                        marketingOptIn = false,
                    ),
                )
            } catch (e: Exception) {
                Sentry.addBreadcrumb(
                    Breadcrumb.info("consent-audit POST failed (best-effort): ${e.message}"),
                )
            }
        }
    }
