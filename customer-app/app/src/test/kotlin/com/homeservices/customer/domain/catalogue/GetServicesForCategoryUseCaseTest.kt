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

public class GetServicesForCategoryUseCaseTest {
    private val repo: CatalogueRepository = mockk()
    private val sut = GetServicesForCategoryUseCase(repo)

    @Test
    public fun `invoke passes categoryId to repository and returns services`(): Unit =
        runTest {
            val services =
                listOf(
                    Service("svc1", "cat1", "Pipe Fix", "desc", 50000, 60, "url", listOf("Labour"), emptyList<AddOn>()),
                )
            every { repo.getServicesForCategory("cat1") } returns flowOf(Result.success(services))
            val result = sut("cat1").first()
            assertThat(result.getOrThrow()).isEqualTo(services)
            verify(exactly = 1) { repo.getServicesForCategory("cat1") }
        }

    @Test
    public fun `invoke propagates failure from repository`(): Unit =
        runTest {
            val error = RuntimeException("network error")
            every { repo.getServicesForCategory("cat1") } returns flowOf(Result.failure(error))
            val result = sut("cat1").first()
            assertThat(result.isFailure).isTrue()
            assertThat(result.exceptionOrNull()).isEqualTo(error)
        }
}
