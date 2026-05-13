package com.homeservices.customer.domain.deleteaccount

import com.homeservices.customer.domain.deleteaccount.model.ErasureRequest
import javax.inject.Inject

/**
 * DEPRECATED — no longer in active use.
 *
 * This use case previously called [DeleteAccountRepository.getActiveErasureRequest], which
 * used a POST-probe strategy that created erasure requests on screen entry (DPDP-CRITICAL
 * defect). The method has been removed from the repository interface.
 *
 * This class is kept as a historical marker only. It now always returns `null` (no active
 * request). A future sprint will add a proper server-side GET endpoint and introduce a
 * replacement use case at that time.
 *
 * TODO(follow-up): remove this class once the GET endpoint ships and a proper
 *   GetActiveErasureRequestUseCase v2 is implemented.
 */
@Deprecated("POST-probe removed; always returns null. See DeleteAccountRepository for context.")
public class GetActiveErasureRequestUseCase
    @Inject
    constructor(
        @Suppress("UnusedPrivateMember")
        private val repository: DeleteAccountRepository,
    ) {
        @Suppress("RedundantSuspendModifier")
        public suspend operator fun invoke(): Result<ErasureRequest?> = Result.success(null)
    }
