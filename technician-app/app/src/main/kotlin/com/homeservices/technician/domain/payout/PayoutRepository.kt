package com.homeservices.technician.domain.payout

public interface PayoutRepository {
    public suspend fun updatePayoutCadence(cadence: String): Result<PayoutCadenceResult>
}
