package com.homeservices.customer.domain.deleteaccount

import com.homeservices.customer.domain.deleteaccount.model.ErasureRequest
import javax.inject.Inject

/**
 * Submit an account-deletion / erasure request to the server.
 *
 * Delegates directly to [DeleteAccountRepository.submitErasureRequest].
 * Exists as a named use case so it can be injected and tested independently.
 */
public class RequestErasureUseCase
    @Inject
    constructor(
        private val repository: DeleteAccountRepository,
    ) {
        public suspend operator fun invoke(reason: String? = null): Result<ErasureRequest> = repository.submitErasureRequest(reason)
    }
