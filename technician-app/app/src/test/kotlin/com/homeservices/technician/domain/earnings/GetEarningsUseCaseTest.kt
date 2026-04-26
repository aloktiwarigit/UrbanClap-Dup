package com.homeservices.technician.domain.earnings

import com.homeservices.technician.domain.earnings.model.DailyEarnings
import com.homeservices.technician.domain.earnings.model.EarningsPeriod
import com.homeservices.technician.domain.earnings.model.EarningsSummary
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

public class GetEarningsUseCaseTest {
    private val repository: EarningsRepository = mockk()
    private val useCase = GetEarningsUseCase(repository)

    private val fakeSummary = EarningsSummary(
        today = EarningsPeriod(0L, 0), week = EarningsPeriod(0L, 0),
        month = EarningsPeriod(0L, 0), lifetime = EarningsPeriod(0L, 0),
        lastSevenDays = emptyList(),
    )

    @Test
    public fun `invoke delegates to repository and returns result`(): Unit = runTest {
        coEvery { repository.getEarnings() } returns Result.success(fakeSummary)
        val result = useCase.invoke()
        assertTrue(result.isSuccess)
        coVerify(exactly = 1) { repository.getEarnings() }
    }

    @Test
    public fun `invoke propagates repository failure`(): Unit = runTest {
        coEvery { repository.getEarnings() } returns Result.failure(RuntimeException())
        assertTrue(useCase.invoke().isFailure)
    }
}
