package com.homeservices.customer.ui.catalogue

import androidx.lifecycle.SavedStateHandle
import com.google.common.truth.Truth.assertThat
import com.homeservices.customer.data.location.FusedCurrentLocationProvider
import com.homeservices.customer.domain.catalogue.CatalogueLocalizer
import com.homeservices.customer.domain.catalogue.GetServiceDetailUseCase
import com.homeservices.customer.domain.catalogue.model.AddOn
import com.homeservices.customer.domain.catalogue.model.Service
import com.homeservices.customer.domain.locale.GetCurrentLocaleUseCase
import com.homeservices.customer.domain.technician.GetConfidenceScoreUseCase
import com.homeservices.customer.domain.technician.model.ConfidenceScore
import com.homeservices.customer.observability.analytics.NoOpAnalyticsFacade
import io.mockk.clearMocks
import io.mockk.coEvery
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
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
public class ServiceDetailViewModelTest {
    private val dispatcher = UnconfinedTestDispatcher()
    private val serviceDetailUseCase: GetServiceDetailUseCase = mockk()
    private val confidenceScoreUseCase: GetConfidenceScoreUseCase = mockk()

    // Returns null → resolveGps() falls back to (0.0, 0.0), matching the existing test expectations.
    private val locationProvider: FusedCurrentLocationProvider =
        mockk {
            coEvery { getLastLocation() } returns null
        }
    private val localizer = CatalogueLocalizer()
    private val getCurrentLocale: GetCurrentLocaleUseCase = mockk()

    private val testService =
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

    @Before public fun setUp(): Unit {
        Dispatchers.setMain(dispatcher)
        every { getCurrentLocale() } returns flowOf("en")
    }

    @After public fun tearDown(): Unit {
        Dispatchers.resetMain()
    }

    /** Reuses the constructor shape already exercised by every test below. */
    private fun buildViewModel(techId: String? = null): ServiceDetailViewModel {
        val handleMap =
            if (techId != null) {
                mapOf("serviceId" to "svc1", "techId" to techId)
            } else {
                mapOf("serviceId" to "svc1")
            }
        return ServiceDetailViewModel(
            SavedStateHandle(handleMap),
            serviceDetailUseCase,
            confidenceScoreUseCase,
            locationProvider,
            localizer,
            getCurrentLocale,
            NoOpAnalyticsFacade(),
        )
    }

    @Test
    public fun `loads service detail for given serviceId`(): Unit =
        runTest(dispatcher) {
            every { serviceDetailUseCase("svc1") } returns flowOf(Result.success(testService))
            val vm =
                ServiceDetailViewModel(
                    SavedStateHandle(mapOf("serviceId" to "svc1")),
                    serviceDetailUseCase,
                    confidenceScoreUseCase,
                    locationProvider,
                    localizer,
                    getCurrentLocale,
                    NoOpAnalyticsFacade(),
                )
            assertThat(vm.uiState.value).isInstanceOf(ServiceDetailUiState.Success::class.java)
            assertThat((vm.uiState.value as ServiceDetailUiState.Success).service).isEqualTo(testService)
        }

    @Test
    public fun `emits Error on failure`(): Unit =
        runTest(dispatcher) {
            every { serviceDetailUseCase("svc1") } returns flowOf(Result.failure(RuntimeException("not found")))
            val vm =
                ServiceDetailViewModel(
                    SavedStateHandle(mapOf("serviceId" to "svc1")),
                    serviceDetailUseCase,
                    confidenceScoreUseCase,
                    locationProvider,
                    localizer,
                    getCurrentLocale,
                    NoOpAnalyticsFacade(),
                )
            assertThat(vm.uiState.value).isInstanceOf(ServiceDetailUiState.Error::class.java)
            assertThat((vm.uiState.value as ServiceDetailUiState.Error).message).isEqualTo("not found")
        }

    @Test
    public fun `confidenceScoreState is Hidden when no techId`(): Unit =
        runTest(dispatcher) {
            every { serviceDetailUseCase("svc1") } returns flowOf(Result.success(testService))
            val vm =
                ServiceDetailViewModel(
                    SavedStateHandle(mapOf("serviceId" to "svc1")),
                    serviceDetailUseCase,
                    confidenceScoreUseCase,
                    locationProvider,
                    localizer,
                    getCurrentLocale,
                    NoOpAnalyticsFacade(),
                )
            assertThat(vm.confidenceScoreState.value).isInstanceOf(ConfidenceScoreUiState.Hidden::class.java)
        }

    @Test
    public fun `confidenceScoreState is Loaded when techId present and score not limited`(): Unit =
        runTest(dispatcher) {
            val score = ConfidenceScore(94, 4.7, 12, 35, false)
            every { serviceDetailUseCase("svc1") } returns flowOf(Result.success(testService))
            every { confidenceScoreUseCase("tech-1", 0.0, 0.0) } returns flowOf(Result.success(score))
            val vm =
                ServiceDetailViewModel(
                    SavedStateHandle(mapOf("serviceId" to "svc1", "techId" to "tech-1")),
                    serviceDetailUseCase,
                    confidenceScoreUseCase,
                    locationProvider,
                    localizer,
                    getCurrentLocale,
                    NoOpAnalyticsFacade(),
                )
            assertThat(vm.confidenceScoreState.value).isInstanceOf(ConfidenceScoreUiState.Loaded::class.java)
            assertThat((vm.confidenceScoreState.value as ConfidenceScoreUiState.Loaded).score).isEqualTo(score)
        }

    @Test
    public fun `confidenceScoreState is Limited when isLimitedData=true`(): Unit =
        runTest(dispatcher) {
            val score = ConfidenceScore(0, null, null, 3, true)
            every { serviceDetailUseCase("svc1") } returns flowOf(Result.success(testService))
            every { confidenceScoreUseCase("tech-1", 0.0, 0.0) } returns flowOf(Result.success(score))
            val vm =
                ServiceDetailViewModel(
                    SavedStateHandle(mapOf("serviceId" to "svc1", "techId" to "tech-1")),
                    serviceDetailUseCase,
                    confidenceScoreUseCase,
                    locationProvider,
                    localizer,
                    getCurrentLocale,
                    NoOpAnalyticsFacade(),
                )
            assertThat(vm.confidenceScoreState.value).isInstanceOf(ConfidenceScoreUiState.Limited::class.java)
        }

    @Test
    public fun `retry recovers the service detail`(): Unit =
        runTest(dispatcher) {
            every { serviceDetailUseCase("svc1") } returns flowOf(Result.failure(IOException("net err")))
            val sut = buildViewModel()
            assertThat(sut.uiState.value).isInstanceOf(ServiceDetailUiState.Error::class.java)

            every { serviceDetailUseCase("svc1") } returns flowOf(Result.success(testService))
            sut.retry()

            assertThat(sut.uiState.value).isInstanceOf(ServiceDetailUiState.Success::class.java)
        }

    /** Guards the rev-2 correction: retry must re-fire the second coroutine too. */
    @Test
    public fun `retry re-requests the confidence score when a technician is present`(): Unit =
        runTest(dispatcher) {
            every { serviceDetailUseCase("svc1") } returns flowOf(Result.success(testService))
            val score = ConfidenceScore(94, 4.7, 12, 35, false)
            every { confidenceScoreUseCase("tech-1", 0.0, 0.0) } returns flowOf(Result.success(score))
            val sut = buildViewModel(techId = "tech-1")
            clearMocks(confidenceScoreUseCase, answers = false)
            every { confidenceScoreUseCase("tech-1", 0.0, 0.0) } returns flowOf(Result.success(score))

            sut.retry()

            verify(atLeast = 1) { confidenceScoreUseCase(any(), any(), any()) }
        }
}
