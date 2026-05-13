package com.homeservices.customer.domain.deleteaccount

import javax.inject.Inject

/**
 * Revoke an in-flight account-deletion / erasure request during the 7-day cool-off.
 *
 * Delegates directly to [DeleteAccountRepository.revokeErasureRequest].
 */
public class RevokeErasureUseCase
    @Inject
    constructor(
        private val repository: DeleteAccountRepository,
    ) {
        public suspend operator fun invoke(): Result<Unit> = repository.revokeErasureRequest()
    }
