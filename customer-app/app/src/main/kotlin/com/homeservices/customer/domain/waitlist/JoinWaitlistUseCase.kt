package com.homeservices.customer.domain.waitlist

import javax.inject.Inject

public data class WaitlistRequest(
    val phone: String,
    val lat: Double,
    val lng: Double,
    val serviceId: String,
)

public interface WaitlistRepository {
    public suspend fun joinWaitlist(request: WaitlistRequest): Result<Unit>
}

public class JoinWaitlistUseCase
    @Inject
    constructor(
        private val repository: WaitlistRepository,
    ) {
        public suspend fun invoke(request: WaitlistRequest): Result<Unit> = repository.joinWaitlist(request)
    }
