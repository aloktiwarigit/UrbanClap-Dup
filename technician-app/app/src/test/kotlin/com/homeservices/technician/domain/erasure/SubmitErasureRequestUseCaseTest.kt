package com.homeservices.technician.domain.erasure

import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

public class SubmitErasureRequestUseCaseTest {
    private val erasureRepository: ErasureRepository = mockk()
    private lateinit var useCase: SubmitErasureRequestUseCase

    @BeforeEach
    public fun setUp() {
        useCase = SubmitErasureRequestUseCase(erasureRepository)
    }

    @Test
    public fun `delegates to repository and returns Success`(): Unit =
        runTest {
            coEvery { erasureRepository.submitRequest(null) } returns
                ErasureSubmitResult.Success("2026-05-29T02:00:00.000Z")

            val result = useCase()

            assertThat(result).isEqualTo(ErasureSubmitResult.Success("2026-05-29T02:00:00.000Z"))
            coVerify(exactly = 1) { erasureRepository.submitRequest(null) }
        }

    @Test
    public fun `passes reason argument to repository`(): Unit =
        runTest {
            coEvery { erasureRepository.submitRequest("moving abroad") } returns
                ErasureSubmitResult.Success("2026-05-29T02:00:00.000Z")

            val result = useCase(reason = "moving abroad")

            assertThat(result).isEqualTo(ErasureSubmitResult.Success("2026-05-29T02:00:00.000Z"))
            coVerify(exactly = 1) { erasureRepository.submitRequest("moving abroad") }
        }

    @Test
    public fun `propagates ActiveJobExists from server — server gate is authoritative`(): Unit =
        runTest {
            coEvery { erasureRepository.submitRequest(null) } returns ErasureSubmitResult.ActiveJobExists

            val result = useCase()

            assertThat(result).isEqualTo(ErasureSubmitResult.ActiveJobExists)
        }

    @Test
    public fun `propagates DuplicatePending from repository`(): Unit =
        runTest {
            coEvery { erasureRepository.submitRequest(null) } returns ErasureSubmitResult.DuplicatePending

            val result = useCase()

            assertThat(result).isEqualTo(ErasureSubmitResult.DuplicatePending)
        }

    @Test
    public fun `propagates UnknownError from repository`(): Unit =
        runTest {
            coEvery { erasureRepository.submitRequest(null) } returns
                ErasureSubmitResult.UnknownError("HTTP 500")

            val result = useCase()

            assertThat(result).isEqualTo(ErasureSubmitResult.UnknownError("HTTP 500"))
        }
}
