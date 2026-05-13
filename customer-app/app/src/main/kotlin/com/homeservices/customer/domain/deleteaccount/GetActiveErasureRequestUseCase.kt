package com.homeservices.customer.domain.deleteaccount

import com.homeservices.customer.domain.deleteaccount.model.ErasureRequest
import javax.inject.Inject

/**
 * Retrieve the active erasure request for the signed-in user, if any.
 *
 * Returns `null` (inside the [Result]) when there is no active request.
 * Returns a [ErasureRequest] when the user already has a PENDING deletion in flight.
 *
 * Used by the delete-account entry screen to route directly to the cool-off
 * screen when re-entering settings after a prior submission.
 */
public class GetActiveErasureRequestUseCase
    @Inject
    constructor(
        private val repository: DeleteAccountRepository,
    ) {
        public suspend operator fun invoke(): Result<ErasureRequest?> = repository.getActiveErasureRequest()
    }
