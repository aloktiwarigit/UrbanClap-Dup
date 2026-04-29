package com.homeservices.technician.data.earnings

import com.homeservices.technician.data.earnings.remote.EarningsApiService
import com.homeservices.technician.data.earnings.remote.dto.DailyEarningsDto
import com.homeservices.technician.data.earnings.remote.dto.EarningsPeriodDto
import com.homeservices.technician.data.earnings.remote.dto.EarningsResponseDto
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

public class EarningsRepositoryImplTest {
    private val apiService: EarningsApiService = mockk()
    private val repository = EarningsRepositoryImpl(apiService)

    private val dto =
        EarningsResponseDto(
            today = EarningsPeriodDto(120000L, 1),
            week = EarningsPeriodDto(360000L, 3),
            month = EarningsPeriodDto(360000L, 3),
            lifetime = EarningsPeriodDto(960000L, 8),
            lastSevenDays = listOf(DailyEarningsDto("2026-04-26", 120000L)),
            pendingHeld = 50000L,
        )

    @Test
    public fun `getEarnings maps DTO fields to domain model`(): Unit =
        runTest {
            coEvery { apiService.getEarnings() } returns dto
            val result = repository.getEarnings()
            assertTrue(result.isSuccess)
            val s = result.getOrThrow()
            assertEquals(120000L, s.today.techAmountPaise)
            assertEquals(1, s.today.count)
            assertEquals(8, s.lifetime.count)
            assertEquals(1, s.lastSevenDays.size)
            assertEquals("2026-04-26", s.lastSevenDays[0].date)
            assertEquals(120000L, s.lastSevenDays[0].techAmountPaise)
        }

    @Test
    public fun `getEarnings maps pendingHeld to pendingHeldPaise`(): Unit =
        runTest {
            coEvery { apiService.getEarnings() } returns dto
            val result = repository.getEarnings()
            assertEquals(50000L, result.getOrThrow().pendingHeldPaise)
        }

    @Test
    public fun `getEarnings maps zero pendingHeld`(): Unit =
        runTest {
            coEvery { apiService.getEarnings() } returns dto.copy(pendingHeld = 0L)
            val result = repository.getEarnings()
            assertEquals(0L, result.getOrThrow().pendingHeldPaise)
        }

    @Test
    public fun `getEarnings maps multiple lastSevenDays entries`(): Unit =
        runTest {
            val entries =
                listOf(
                    DailyEarningsDto("2026-04-23", 0L),
                    DailyEarningsDto("2026-04-24", 60000L),
                    DailyEarningsDto("2026-04-25", 80000L),
                )
            coEvery { apiService.getEarnings() } returns dto.copy(lastSevenDays = entries)
            val result = repository.getEarnings()
            val days = result.getOrThrow().lastSevenDays
            assertEquals(3, days.size)
            assertEquals(0L, days[0].techAmountPaise)
            assertEquals(60000L, days[1].techAmountPaise)
            assertEquals(80000L, days[2].techAmountPaise)
        }

    @Test
    public fun `getEarnings returns failure on API exception`(): Unit =
        runTest {
            coEvery { apiService.getEarnings() } throws RuntimeException("Network error")
            val result = repository.getEarnings()
            assertTrue(result.isFailure)
        }
}
