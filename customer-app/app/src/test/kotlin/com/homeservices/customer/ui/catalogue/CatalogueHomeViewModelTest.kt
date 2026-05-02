package com.homeservices.customer.ui.catalogue

import com.google.common.truth.Truth.assertThat
import com.homeservices.customer.domain.catalogue.CatalogueLocalizer
import com.homeservices.customer.domain.catalogue.GetCategoriesUseCase
import com.homeservices.customer.domain.catalogue.model.Category
import com.homeservices.customer.domain.locale.GetCurrentLocaleUseCase
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Before
import org.junit.Test
import java.io.IOException

@OptIn(ExperimentalCoroutinesApi::class)
public class CatalogueHomeViewModelTest {
    private val dispatcher = UnconfinedTestDispatcher()
    private val useCase: GetCategoriesUseCase = mockk()
    private val localizer = CatalogueLocalizer()
    private val getCurrentLocale: GetCurrentLocaleUseCase = mockk()
    private lateinit var sut: CatalogueHomeViewModel

    @Before
    public fun setUp(): Unit {
        Dispatchers.setMain(dispatcher)
        every { getCurrentLocale() } returns flowOf("en")
        every { useCase() } returns
            flowOf(
                Result.success(listOf(Category("1", "Plumbing", "https://cdn.example.com/plumbing.jpg", 3))),
            )
        sut = CatalogueHomeViewModel(useCase, localizer, getCurrentLocale)
    }

    @After
    public fun tearDown(): Unit {
        Dispatchers.resetMain()
    }

    @Test
    public fun `uiState emits Success with categories`(): Unit =
        runTest(dispatcher) {
            val state = sut.uiState.value
            assertThat(state).isInstanceOf(CatalogueHomeUiState.Success::class.java)
            assertThat((state as CatalogueHomeUiState.Success).categories).hasSize(1)
        }

    @Test
    public fun `uiState emits Error on failure`(): Unit =
        runTest(dispatcher) {
            every { useCase() } returns flowOf(Result.failure(IOException("net err")))
            sut = CatalogueHomeViewModel(useCase, localizer, getCurrentLocale)
            assertThat(sut.uiState.value).isInstanceOf(CatalogueHomeUiState.Error::class.java)
        }
}
