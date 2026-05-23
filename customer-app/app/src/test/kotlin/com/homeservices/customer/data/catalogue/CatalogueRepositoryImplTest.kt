package com.homeservices.customer.data.catalogue

import com.google.common.truth.Truth.assertThat
import com.homeservices.customer.data.catalogue.remote.CatalogueApiService
import com.homeservices.customer.data.catalogue.remote.dto.AddOnDto
import com.homeservices.customer.data.catalogue.remote.dto.CategoriesResponse
import com.homeservices.customer.data.catalogue.remote.dto.CategoryDto
import com.homeservices.customer.data.catalogue.remote.dto.ServiceCardDto
import com.homeservices.customer.data.catalogue.remote.dto.ServiceDto
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
                CategoriesResponse(
                    categories =
                        listOf(
                            CategoryDto(
                                id = "cat1",
                                name = "Plumbing",
                                heroImageUrl = "https://cdn.example.com/plumbing.jpg",
                                sortOrder = 1,
                                services =
                                    listOf(
                                        sampleCard(id = "svc1", categoryId = "cat1"),
                                        sampleCard(id = "svc2", categoryId = "cat1"),
                                        sampleCard(id = "svc3", categoryId = "cat1"),
                                        sampleCard(id = "svc4", categoryId = "cat1"),
                                        sampleCard(id = "svc5", categoryId = "cat1"),
                                    ),
                            ),
                        ),
                )
            val result = sut.getCategories().first()
            assertThat(result.isSuccess).isTrue()
            val first = result.getOrThrow().first()
            assertThat(first.id).isEqualTo("cat1")
            assertThat(first.name).isEqualTo("Plumbing")
            // serviceCount derived from embedded services array
            assertThat(first.serviceCount).isEqualTo(5)
            assertThat(first.imageUrl).isEqualTo("https://cdn.example.com/plumbing.jpg")
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
                    shortDescription = "desc",
                    basePrice = 50000,
                    durationMinutes = 60,
                    heroImageUrl = "https://cdn/img.jpg",
                    includes = listOf("Tools", "Labour"),
                    addOns =
                        listOf(
                            AddOnDto(
                                id = "extra-pipe",
                                name = "Extra pipe",
                                price = 10000,
                                triggerCondition = "if existing pipe is corroded",
                            ),
                        ),
                    isActive = true,
                )
            val result = sut.getServiceDetail("svc1").first()
            assertThat(
                result
                    .getOrThrow()
                    .addOns
                    .first()
                    .price,
            ).isEqualTo(10000)
            assertThat(result.getOrThrow().description).isEqualTo("desc")
            assertThat(result.getOrThrow().imageUrl).isEqualTo("https://cdn/img.jpg")
        }

    @Test
    public fun `getServicesForCategory filters from embedded categories response`(): Unit =
        runTest {
            coEvery { api.getCategories() } returns
                CategoriesResponse(
                    categories =
                        listOf(
                            CategoryDto(
                                id = "cat1",
                                name = "Plumbing",
                                heroImageUrl = "https://cdn/p.jpg",
                                sortOrder = 1,
                                services =
                                    listOf(
                                        sampleCard(id = "svc1", categoryId = "cat1"),
                                        sampleCard(id = "svc2", categoryId = "cat1"),
                                    ),
                            ),
                            CategoryDto(
                                id = "cat2",
                                name = "AC Repair",
                                heroImageUrl = "https://cdn/ac.jpg",
                                sortOrder = 2,
                                services = listOf(sampleCard(id = "svc3", categoryId = "cat2")),
                            ),
                        ),
                )
            val result = sut.getServicesForCategory("cat1").first()
            assertThat(result.isSuccess).isTrue()
            assertThat(result.getOrThrow()).hasSize(2)
            assertThat(result.getOrThrow().map { it.id }).containsExactly("svc1", "svc2")
        }

    @Test
    public fun `getServicesForCategory emits failure when category id not found`(): Unit =
        runTest {
            coEvery { api.getCategories() } returns CategoriesResponse(categories = emptyList())
            val result = sut.getServicesForCategory("missing").first()
            assertThat(result.isFailure).isTrue()
            assertThat(result.exceptionOrNull()).isInstanceOf(NoSuchElementException::class.java)
        }

    private fun sampleCard(
        id: String,
        categoryId: String,
    ): ServiceCardDto =
        ServiceCardDto(
            id = id,
            categoryId = categoryId,
            name = "Service $id",
            shortDescription = "desc",
            heroImageUrl = "https://cdn/$id.jpg",
            basePrice = 49900,
            durationMinutes = 60,
        )
}
