package com.homeservices.customer.ui.catalogue

import androidx.lifecycle.SavedStateHandle
import com.google.common.truth.Truth.assertThat
import com.homeservices.customer.domain.catalogue.GetServiceDetailUseCase
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
public class ServiceDetailViewModelTest {
    private val dispatcher = UnconfinedTestDispatcher()
    private val useCase: GetServiceDetailUseCase = mockk()

    @Before
    public fun setUp(): Unit {
        Dispatchers.setMain(dispatcher)
    }

    @After
    public fun tearDown(): Unit {
        Dispatchers.resetMain()
    }

    @Test
    public fun `loads service detail for given serviceId`(): Unit =
        runTest(dispatcher) {
            val service =
                Service(
                    "svc1",
                    "cat1",
                    "Pipe Fix",
                    "Full pipe replacement",
                    150000,
                    120,
                    "url",
                    listOf("Labour", "Parts"),
                    emptyList<AddOn>(),
                )
            every { useCase("svc1") } returns flowOf(Result.success(service))
            val handle = SavedStateHandle(mapOf("serviceId" to "svc1"))
            val vm = ServiceDetailViewModel(handle, useCase)
            assertThat(vm.uiState.value).isInstanceOf(ServiceDetailUiState.Success::class.java)
            assertThat((vm.uiState.value as ServiceDetailUiState.Success).service).isEqualTo(service)
        }

    @Test
    public fun `emits Error on failure`(): Unit =
        runTest(dispatcher) {
            every { useCase("svc1") } returns flowOf(Result.failure(RuntimeException("not found")))
            val handle = SavedStateHandle(mapOf("serviceId" to "svc1"))
            val vm = ServiceDetailViewModel(handle, useCase)
            assertThat(vm.uiState.value).isInstanceOf(ServiceDetailUiState.Error::class.java)
            assertThat((vm.uiState.value as ServiceDetailUiState.Error).message).isEqualTo("not found")
        }
}
