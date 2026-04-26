package com.homeservices.technician.data.earnings

import com.homeservices.technician.data.earnings.remote.EarningsApiService
import com.homeservices.technician.domain.earnings.EarningsRepository
import com.homeservices.technician.domain.earnings.model.DailyEarnings
import com.homeservices.technician.domain.earnings.model.EarningsPeriod
import com.homeservices.technician.domain.earnings.model.EarningsSummary
import javax.inject.Inject

public class EarningsRepositoryImpl
    @Inject
    constructor(
        private val apiService: EarningsApiService,
    ) : EarningsRepository {
        public override suspend fun getEarnings(): Result<EarningsSummary> =
            runCatching {
                val dto = apiService.getEarnings()
                EarningsSummary(
                    today = EarningsPeriod(dto.today.techAmount, dto.today.count),
                    week = EarningsPeriod(dto.week.techAmount, dto.week.count),
                    month = EarningsPeriod(dto.month.techAmount, dto.month.count),
                    lifetime = EarningsPeriod(dto.lifetime.techAmount, dto.lifetime.count),
                    lastSevenDays = dto.lastSevenDays.map { DailyEarnings(it.date, it.techAmount) },
                )
            }
    }
