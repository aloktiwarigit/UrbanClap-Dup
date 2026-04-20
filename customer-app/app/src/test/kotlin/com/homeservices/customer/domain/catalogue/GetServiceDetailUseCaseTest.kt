package com.homeservices.customer.domain.catalogue

import com.google.common.truth.Truth.assertThat
import com.homeservices.customer.data.catalogue.CatalogueRepository
import com.homeservices.customer.domain.catalogue.model.AddOn
import com.homeservices.customer.domain.catalogue.model.Service
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import org.junit.Test

public class GetServiceDetailUseCaseTest {
    private val repo: CatalogueRepository = mockk()
    private val sut = GetServiceDetailUseCase(repo)

    @Test
    public fun `invoke passes serviceId to repository and returns service`(): Unit =
        runTest {
            val service = Service("svc1", "cat1", "Pipe Fix", "desc", 50000, 60, "url", listOf("Labour"), emptyList<AddOn>())
            every { repo.getServiceDetail("svc1") } returns flowOf(Result.success(service))
            val result = sut("svc1").first()
            assertThat(result.getOrThrow()).isEqualTo(service)
            verify(exactly = 1) { repo.getServiceDetail("svc1") }
        }

    @Test
    public fun `invoke propagates failure from repository`(): Unit =
        runTest {
            val error = RuntimeException("not found")
            every { repo.getServiceDetail("svc1") } returns flowOf(Result.failure(error))
            val result = sut("svc1").first()
            assertThat(result.isFailure).isTrue()
            assertThat(result.exceptionOrNull()).isEqualTo(error)
        }
}
