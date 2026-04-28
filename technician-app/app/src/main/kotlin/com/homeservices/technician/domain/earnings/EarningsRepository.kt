package com.homeservices.technician.domain.earnings

import com.homeservices.technician.domain.earnings.model.EarningsSummary

public interface EarningsRepository {
    public suspend fun getEarnings(): Result<EarningsSummary>
}
