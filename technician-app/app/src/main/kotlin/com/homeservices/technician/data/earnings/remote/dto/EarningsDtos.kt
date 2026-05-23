package com.homeservices.technician.data.earnings.remote.dto

import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
public data class EarningsPeriodDto(
    val amountPaise: Long,
    val jobs: Int,
)

@JsonClass(generateAdapter = true)
public data class MonthEarningsPeriodDto(
    val amountPaise: Long,
    val jobs: Int,
    val goalPaise: Long,
)

@JsonClass(generateAdapter = true)
public data class DailyEarningsDto(
    val date: String,
    val amountPaise: Long,
    val jobs: Int,
)

@JsonClass(generateAdapter = true)
public data class EarningsResponseDto(
    val today: EarningsPeriodDto,
    val week: EarningsPeriodDto,
    val month: MonthEarningsPeriodDto,
    val lifetime: EarningsPeriodDto,
    val dailyLast7: List<DailyEarningsDto>,
    val pendingHeld: Long = 0L,
)
