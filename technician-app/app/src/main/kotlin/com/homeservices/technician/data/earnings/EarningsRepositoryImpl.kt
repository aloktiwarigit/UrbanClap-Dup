package com.homeservices.technician.data.earnings

import com.homeservices.technician.data.earnings.remote.EarningsApiService
import com.homeservices.technician.domain.earnings.EarningsRepository
import com.homeservices.technician.domain.earnings.model.DailyEarnings
import com.homeservices.technician.domain.earnings.model.EarningsPeriod
import com.homeservices.technician.domain.earnings.model.EarningsSummary
import com.homeservices.technician.domain.earnings.model.MonthEarningsPeriod
import javax.inject.Inject

public class EarningsRepositoryImpl
    @Inject
    internal constructor(
        private val apiService: EarningsApiService,
    ) : EarningsRepository {
        public override suspend fun getEarnings(): Result<EarningsSummary> =
            runCatching {
                val dto = apiService.getEarnings()
                EarningsSummary(
                    today = EarningsPeriod(dto.today.amountPaise, dto.today.jobs),
                    week = EarningsPeriod(dto.week.amountPaise, dto.week.jobs),
                    month = MonthEarningsPeriod(dto.month.amountPaise, dto.month.jobs, dto.month.goalPaise),
                    lifetime = EarningsPeriod(dto.lifetime.amountPaise, dto.lifetime.jobs),
                    lastSevenDays = dto.dailyLast7.map { DailyEarnings(it.date, it.amountPaise, it.jobs) },
                    pendingHeldPaise = dto.pendingHeld,
                )
            }
    }
