package com.homeservices.customer.ui.catalogue

import androidx.lifecycle.SavedStateHandle
import com.google.common.truth.Truth.assertThat
import com.homeservices.customer.domain.catalogue.GetServicesForCategoryUseCase
import com.homeservices.customer.domain.catalogue.model.AddOn
import com.homeservices.customer.domain.catalogue.model.Service
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

@OptIn(ExperimentalCoroutinesApi::class)
public class ServiceListViewModelTest {
    private val dispatcher = UnconfinedTestDispatcher()
    private val useCase: GetServicesForCategoryUseCase = mockk()

    @Before
    public fun setUp(): Unit {
        Dispatchers.setMain(dispatcher)
    }

    @After
    public fun tearDown(): Unit {
        Dispatchers.resetMain()
    }

    @Test
    public fun `loads services for given categoryId`(): Unit =
        runTest(dispatcher) {
            val service =
                Service(
                    "svc1",
                    "cat1",
                    "Pipe fix",
                    "desc",
                    50000,
                    60,
                    "url",
                    listOf("Labour"),
                    emptyList<AddOn>(),
                )
            every { useCase("cat1") } returns flowOf(Result.success(listOf(service)))
            val handle = SavedStateHandle(mapOf("categoryId" to "cat1"))
            val vm = ServiceListViewModel(handle, useCase)
            assertThat(vm.uiState.value).isInstanceOf(ServiceListUiState.Success::class.java)
            assertThat((vm.uiState.value as ServiceListUiState.Success).services).hasSize(1)
        }

    @Test
    public fun `emits Error on failure`(): Unit =
        runTest(dispatcher) {
            every { useCase("cat1") } returns flowOf(Result.failure(RuntimeException("err")))
            val handle = SavedStateHandle(mapOf("categoryId" to "cat1"))
            val vm = ServiceListViewModel(handle, useCase)
            assertThat(vm.uiState.value).isInstanceOf(ServiceListUiState.Error::class.java)
        }
}
