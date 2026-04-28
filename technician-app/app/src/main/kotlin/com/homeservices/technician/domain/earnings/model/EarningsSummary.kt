package com.homeservices.technician.domain.earnings.model

public data class EarningsPeriod(
    val techAmountPaise: Long,
    val count: Int,
) {
    public val rupees: Double get() = techAmountPaise / 100.0
}

public data class DailyEarnings(
    val date: String,
    val techAmountPaise: Long,
)

public data class EarningsSummary(
    val today: EarningsPeriod,
    val week: EarningsPeriod,
    val month: EarningsPeriod,
    val lifetime: EarningsPeriod,
    val lastSevenDays: List<DailyEarnings>,
)
