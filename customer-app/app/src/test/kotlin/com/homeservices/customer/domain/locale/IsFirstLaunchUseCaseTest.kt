package com.homeservices.customer.domain.locale

import com.google.common.truth.Truth.assertThat
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import org.junit.Test

public class IsFirstLaunchUseCaseTest {
    private val repo: LocaleRepository = mockk()

    @Test
    public fun `returns repo firstLaunchPending flow`(): Unit =
        runTest {
            every { repo.firstLaunchPending } returns flowOf(true)
            val useCase = IsFirstLaunchUseCase(repo)
            assertThat(useCase().first()).isTrue()
        }
}
