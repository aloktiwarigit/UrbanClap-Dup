package com.homeservices.customer.domain.catalogue

import com.google.common.truth.Truth.assertThat
import com.homeservices.customer.data.catalogue.CatalogueRepository
import com.homeservices.customer.domain.catalogue.model.Category
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import org.junit.Test

public class GetCategoriesUseCaseTest {
    private val repo: CatalogueRepository = mockk()
    private val sut = GetCategoriesUseCase(repo)

    @Test
    public fun `invoke delegates to repository and returns categories`(): Unit =
        runTest {
            val cats = listOf(Category("1", "Plumbing", "url", 3, minPricePaise = 39900))
            every { repo.getCategories() } returns flowOf(Result.success(cats))
            val result = sut().first()
            assertThat(result.getOrThrow()).isEqualTo(cats)
        }
}
