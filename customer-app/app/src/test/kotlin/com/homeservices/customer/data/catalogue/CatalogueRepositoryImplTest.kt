package com.homeservices.customer.data.catalogue

import com.google.common.truth.Truth.assertThat
import com.homeservices.customer.data.catalogue.remote.CatalogueApiService
import com.homeservices.customer.data.catalogue.remote.dto.AddOnDto
import com.homeservices.customer.data.catalogue.remote.dto.CatalogueListResponse
import com.homeservices.customer.data.catalogue.remote.dto.CategoryDto
import com.homeservices.customer.data.catalogue.remote.dto.ServiceDto
import com.homeservices.customer.data.catalogue.remote.dto.ServiceSummaryDto
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import org.junit.Test
import java.io.IOException

public class CatalogueRepositoryImplTest {
    private val api: CatalogueApiService = mockk()
    private val sut = CatalogueRepositoryImpl(api)

    @Test
    public fun `getCategories emits success with mapped domain models`(): Unit =
        runTest {
            coEvery { api.getCategories() } returns
                CatalogueListResponse(
                    categories =
                        listOf(
                            CategoryDto(
                                "cat1",
                                "Plumbing",
                                "https://cdn.example.com/plumbing.jpg",
                                listOf(
                                    ServiceSummaryDto(
                                        id = "s1",
                                        categoryId = "cat1",
                                        name = "Leak Fix",
                                        shortDescription = "Fix visible pipe leaks",
                                        heroImageUrl = "https://cdn.example.com/leak.jpg",
                                        basePrice = 39900,
                                        durationMinutes = 45,
                                    ),
                                    ServiceSummaryDto(
                                        id = "s2",
                                        categoryId = "cat1",
                                        name = "Tap Install",
                                        shortDescription = "Install a customer supplied tap",
                                        heroImageUrl = "https://cdn.example.com/tap.jpg",
                                        basePrice = 59900,
                                        durationMinutes = 60,
                                    ),
                                ),
                            ),
                        ),
                )
            val result = sut.getCategories().first()
            assertThat(result.isSuccess).isTrue()
            assertThat(result.getOrThrow().first().id).isEqualTo("cat1")
            assertThat(result.getOrThrow().first().name).isEqualTo("Plumbing")
            assertThat(result.getOrThrow().first().serviceCount).isEqualTo(2)
            assertThat(result.getOrThrow().first().minPricePaise).isEqualTo(39900)
        }

    @Test
    public fun `getCategories emits failure on network exception`(): Unit =
        runTest {
            coEvery { api.getCategories() } throws IOException("timeout")
            val result = sut.getCategories().first()
            assertThat(result.isFailure).isTrue()
        }

    @Test
    public fun `getServiceDetail maps addOns correctly`(): Unit =
        runTest {
            coEvery { api.getServiceDetail("svc1") } returns
                ServiceDto(
                    id = "svc1",
                    categoryId = "cat1",
                    name = "Pipe fix",
                    description = "desc",
                    basePrice = 50000,
                    durationMinutes = 60,
                    imageUrl = "https://cdn/img.jpg",
                    includes = listOf("Tools", "Labour"),
                    addOns = listOf(AddOnDto("Extra pipe", 10000)),
                )
            val result = sut.getServiceDetail("svc1").first()
            assertThat(
                result
                    .getOrThrow()
                    .addOns
                    .first()
                    .price,
            ).isEqualTo(10000)
        }

    @Test
    public fun `getServicesForCategory returns list for category`(): Unit =
        runTest {
            coEvery { api.getCategories() } returns
                CatalogueListResponse(
                    categories =
                        listOf(
                            CategoryDto(
                                id = "cat1",
                                name = "Plumbing",
                                imageUrl = "https://cdn.example.com/plumbing.jpg",
                                services =
                                    listOf(
                                        ServiceSummaryDto(
                                            id = "svc1",
                                            categoryId = "cat1",
                                            name = "Pipe fix",
                                            shortDescription = "desc",
                                            heroImageUrl = "https://cdn/img.jpg",
                                            basePrice = 50000,
                                            durationMinutes = 60,
                                        ),
                                    ),
                            ),
                        ),
                )
            val result = sut.getServicesForCategory("cat1").first()
            val services = result.getOrThrow()
            assertThat(services).hasSize(1)
            assertThat(services.first().id).isEqualTo("svc1")
            assertThat(services.first().name).isEqualTo("Pipe fix")
        }
}
