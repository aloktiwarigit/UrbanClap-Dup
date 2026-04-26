package com.homeservices.technician.data.earnings.remote.dto

import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
public data class EarningsPeriodDto(val techAmount: Long, val count: Int)

@JsonClass(generateAdapter = true)
public data class DailyEarningsDto(val date: String, val techAmount: Long)

@JsonClass(generateAdapter = true)
public data class EarningsResponseDto(
    val today: EarningsPeriodDto,
    val week: EarningsPeriodDto,
    val month: EarningsPeriodDto,
    val lifetime: EarningsPeriodDto,
    val lastSevenDays: List<DailyEarningsDto>,
)
