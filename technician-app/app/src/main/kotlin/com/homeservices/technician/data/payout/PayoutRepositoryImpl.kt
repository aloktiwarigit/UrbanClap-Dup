package com.homeservices.technician.data.payout

import com.homeservices.technician.data.payout.remote.PayoutApiService
import com.homeservices.technician.data.payout.remote.dto.UpdatePayoutCadenceRequestDto
import com.homeservices.technician.domain.payout.PayoutCadenceResult
import com.homeservices.technician.domain.payout.PayoutRepository
import javax.inject.Inject

public class PayoutRepositoryImpl
    @Inject
    constructor(
        private val apiService: PayoutApiService,
    ) : PayoutRepository {
        public override suspend fun updatePayoutCadence(cadence: String): Result<PayoutCadenceResult> =
            runCatching {
                val dto = apiService.updatePayoutCadence(UpdatePayoutCadenceRequestDto(cadence = cadence))
                PayoutCadenceResult(cadence = dto.cadence, nextPayoutAt = dto.nextPayoutAt)
            }
    }
