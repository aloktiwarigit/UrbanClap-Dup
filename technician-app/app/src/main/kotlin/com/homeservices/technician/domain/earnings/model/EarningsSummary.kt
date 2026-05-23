package com.homeservices.technician.domain.earnings.model

public sealed interface BaseEarningsPeriod {
    public val techAmountPaise: Long
    public val count: Int
    public val rupees: Double get() = techAmountPaise / 100.0
}

public data class EarningsPeriod(
    override val techAmountPaise: Long,
    override val count: Int,
) : BaseEarningsPeriod

public data class MonthEarningsPeriod(
    override val techAmountPaise: Long,
    override val count: Int,
    val goalPaise: Long,
) : BaseEarningsPeriod

public data class DailyEarnings(
    val date: String,
    val techAmountPaise: Long,
    val jobs: Int,
)

public data class EarningsSummary(
    val today: EarningsPeriod,
    val week: EarningsPeriod,
    val month: MonthEarningsPeriod,
    val lifetime: EarningsPeriod,
    val lastSevenDays: List<DailyEarnings>,
    val pendingHeldPaise: Long = 0L,
)
