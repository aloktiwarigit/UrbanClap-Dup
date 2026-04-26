package com.homeservices.customer.domain.sos

import com.homeservices.customer.data.sos.remote.SosApiService
import javax.inject.Inject

public class SosUseCase
    @Inject
    constructor(
        private val api: SosApiService,
    ) {
        public suspend fun execute(bookingId: String): Result<Unit> = runCatching { api.triggerSos(bookingId) }
    }
