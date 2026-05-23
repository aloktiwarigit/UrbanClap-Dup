package com.homeservices.technician.domain.erasure

import com.homeservices.technician.domain.activeJob.ActiveJobRepository
import com.homeservices.technician.domain.activeJob.model.ActiveJob
import com.homeservices.technician.domain.activeJob.model.ActiveJobStatus
import com.homeservices.technician.domain.activeJob.model.LatLng
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

public class SubmitErasureRequestUseCaseTest {
    private val erasureRepository: ErasureRepository = mockk()
    private val activeJobRepository: ActiveJobRepository = mockk()
    private lateinit var useCase: SubmitErasureRequestUseCase

    private fun activeJob() = ActiveJob(
        bookingId = "bk-1", customerId = "c-1", serviceId = "svc-1",
        serviceName = "AC Repair", addressText = "12 Main St",
        addressLatLng = LatLng(12.0, 77.0),
        status = ActiveJobStatus.IN_PROGRESS,
        slotDate = "2026-05-22", slotWindow = "10:00-12:00",
    )

    @BeforeEach
    public fun setUp() {
        useCase = SubmitErasureRequestUseCase(erasureRepository, activeJobRepository)
    }

    @Test
    public fun `returns ActiveJobExists without network call when activeJobState is non-null`(): Unit = runTest {
        every { activeJobRepository.activeJobState } returns MutableStateFlow(activeJob())

        val result = useCase()

        assertThat(result).isEqualTo(ErasureSubmitResult.ActiveJobExists)
        coVerify(exactly = 0) { erasureRepository.submitRequest(any()) }
    }

    @Test
    public fun `calls repository when activeJobState is null and returns Success`(): Unit = runTest {
        every { activeJobRepository.activeJobState } returns MutableStateFlow(null)
        coEvery { erasureRepository.submitRequest(null) } returns
            ErasureSubmitResult.Success("2026-05-29T02:00:00.000Z")

        val result = useCase()

        assertThat(result).isEqualTo(ErasureSubmitResult.Success("2026-05-29T02:00:00.000Z"))
    }

    @Test
    public fun `propagates ActiveJobExists from server when activeJobState is null`(): Unit = runTest {
        every { activeJobRepository.activeJobState } returns MutableStateFlow(null)
        coEvery { erasureRepository.submitRequest(null) } returns ErasureSubmitResult.ActiveJobExists

        val result = useCase()

        assertThat(result).isEqualTo(ErasureSubmitResult.ActiveJobExists)
    }

    @Test
    public fun `propagates UnknownError from repository`(): Unit = runTest {
        every { activeJobRepository.activeJobState } returns MutableStateFlow(null)
        coEvery { erasureRepository.submitRequest(null) } returns
            ErasureSubmitResult.UnknownError("HTTP 500")

        val result = useCase()

        assertThat(result).isEqualTo(ErasureSubmitResult.UnknownError("HTTP 500"))
    }
}
