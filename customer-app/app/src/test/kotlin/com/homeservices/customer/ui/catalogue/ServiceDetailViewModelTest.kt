package com.homeservices.customer.ui.catalogue

import androidx.lifecycle.SavedStateHandle
import org.assertj.core.api.Assertions.assertThat
import com.homeservices.customer.domain.technician.GetConfidenceScoreUseCase
import com.homeservices.customer.domain.technician.model.ConfidenceScore
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
    private val confidenceScoreUseCase: GetConfidenceScoreUseCase = mockk()

    @Before public fun setUp(): Unit { Dispatchers.setMain(dispatcher) }
    @After public fun tearDown(): Unit { Dispatchers.resetMain() }

    @Test
    public fun `uiState is Success with serviceId when initialized`(): Unit = runTest(dispatcher) {
        val vm = ServiceDetailViewModel(
            SavedStateHandle(mapOf("serviceId" to "svc1")),
            confidenceScoreUseCase,
        )
        assertThat(vm.uiState.value).isInstanceOf(ServiceDetailUiState.Success::class.java)
        assertThat((vm.uiState.value as ServiceDetailUiState.Success).serviceId).isEqualTo("svc1")
    }

    @Test
    public fun `confidenceScoreState is Hidden when no techId`(): Unit = runTest(dispatcher) {
        val vm = ServiceDetailViewModel(
            SavedStateHandle(mapOf("serviceId" to "svc1")),
            confidenceScoreUseCase,
        )
        assertThat(vm.confidenceScoreState.value).isInstanceOf(ConfidenceScoreUiState.Hidden::class.java)
    }

    @Test
    public fun `confidenceScoreState is Loaded when techId present and score not limited`(): Unit = runTest(dispatcher) {
        val score = ConfidenceScore(94, 4.7, 12, 35, false)
        every { confidenceScoreUseCase("tech-1", 0.0, 0.0) } returns flowOf(Result.success(score))
        val vm = ServiceDetailViewModel(
            SavedStateHandle(mapOf("serviceId" to "svc1", "techId" to "tech-1")),
            confidenceScoreUseCase,
        )
        assertThat(vm.confidenceScoreState.value).isInstanceOf(ConfidenceScoreUiState.Loaded::class.java)
        assertThat((vm.confidenceScoreState.value as ConfidenceScoreUiState.Loaded).score).isEqualTo(score)
    }

    @Test
    public fun `confidenceScoreState is Limited when isLimitedData=true`(): Unit = runTest(dispatcher) {
        val score = ConfidenceScore(0, null, null, 3, true)
        every { confidenceScoreUseCase("tech-1", 0.0, 0.0) } returns flowOf(Result.success(score))
        val vm = ServiceDetailViewModel(
            SavedStateHandle(mapOf("serviceId" to "svc1", "techId" to "tech-1")),
            confidenceScoreUseCase,
        )
        assertThat(vm.confidenceScoreState.value).isInstanceOf(ConfidenceScoreUiState.Limited::class.java)
    }
}
