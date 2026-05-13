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
import io.mockk.coEvery
import io.mockk.coVerify
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

/**
 * Verifies that [ServiceDetailViewModel] fetches real GPS coordinates from
 * [FusedCurrentLocationProvider] on init and passes them to [GetConfidenceScoreUseCase].
 *
 * Fallback: when GPS is unavailable (null), coordinates (0.0, 0.0) are used.
 */
@OptIn(ExperimentalCoroutinesApi::class)
public class ServiceDetailViewModelConfidenceScoreTest {

    private val dispatcher = UnconfinedTestDispatcher()
    private val serviceDetailUseCase: GetServiceDetailUseCase = mockk()
    private val confidenceScoreUseCase: GetConfidenceScoreUseCase = mockk()
    private val locationProvider: FusedCurrentLocationProvider = mockk()
    private val localizer = CatalogueLocalizer()
    private val getCurrentLocale: GetCurrentLocaleUseCase = mockk()

    private val testService = Service(
        id = "svc1",
        categoryId = "cat1",
        name = "Pipe Fix",
        description = "Full pipe replacement",
        basePrice = 150000,
        durationMinutes = 120,
        imageUrl = "url",
        includes = listOf("Labour", "Parts"),
        addOns = emptyList<AddOn>(),
    )

    @Before
    public fun setUp() {
        Dispatchers.setMain(dispatcher)
        every { getCurrentLocale() } returns flowOf("en")
        every { serviceDetailUseCase("svc1") } returns flowOf(Result.success(testService))
    }

    @After
    public fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    public fun `GPS coordinates are fetched on init when techId is present`(): Unit =
        runTest(dispatcher) {
            val score = ConfidenceScore(87, 4.5, 8, 42, false)
            coEvery { locationProvider.getLastLocation() } returns Pair(26.793, 82.194)
            every { confidenceScoreUseCase("tech-1", 26.793, 82.194) } returns flowOf(Result.success(score))

            ServiceDetailViewModel(
                savedStateHandle = SavedStateHandle(mapOf("serviceId" to "svc1", "techId" to "tech-1")),
                getServiceDetail = serviceDetailUseCase,
                getConfidenceScore = confidenceScoreUseCase,
                locationProvider = locationProvider,
                localizer = localizer,
                getCurrentLocale = getCurrentLocale,
            )

            coVerify { locationProvider.getLastLocation() }
        }

    @Test
    public fun `GPS fallback to (0,0) when location provider returns null`(): Unit =
        runTest(dispatcher) {
            val score = ConfidenceScore(0, null, null, 5, true)
            coEvery { locationProvider.getLastLocation() } returns null
            every { confidenceScoreUseCase("tech-1", 0.0, 0.0) } returns flowOf(Result.success(score))

            ServiceDetailViewModel(
                savedStateHandle = SavedStateHandle(mapOf("serviceId" to "svc1", "techId" to "tech-1")),
                getServiceDetail = serviceDetailUseCase,
                getConfidenceScore = confidenceScoreUseCase,
                locationProvider = locationProvider,
                localizer = localizer,
                getCurrentLocale = getCurrentLocale,
            )

            coVerify { locationProvider.getLastLocation() }
            every { confidenceScoreUseCase("tech-1", 0.0, 0.0) } returns flowOf(Result.success(score))
        }

    @Test
    public fun `confidence score emits Loaded when GPS available and score not limited`(): Unit =
        runTest(dispatcher) {
            val score = ConfidenceScore(92, 4.8, 10, 55, false)
            coEvery { locationProvider.getLastLocation() } returns Pair(26.793, 82.194)
            every { confidenceScoreUseCase("tech-1", 26.793, 82.194) } returns flowOf(Result.success(score))

            val vm = ServiceDetailViewModel(
                savedStateHandle = SavedStateHandle(mapOf("serviceId" to "svc1", "techId" to "tech-1")),
                getServiceDetail = serviceDetailUseCase,
                getConfidenceScore = confidenceScoreUseCase,
                locationProvider = locationProvider,
                localizer = localizer,
                getCurrentLocale = getCurrentLocale,
            )

            assertThat(vm.confidenceScoreState.value).isInstanceOf(ConfidenceScoreUiState.Loaded::class.java)
            assertThat((vm.confidenceScoreState.value as ConfidenceScoreUiState.Loaded).score.onTimePercent)
                .isEqualTo(92)
        }

    @Test
    public fun `confidence score Hidden when no techId regardless of GPS`(): Unit =
        runTest(dispatcher) {
            coEvery { locationProvider.getLastLocation() } returns Pair(26.0, 82.0)

            val vm = ServiceDetailViewModel(
                savedStateHandle = SavedStateHandle(mapOf("serviceId" to "svc1")),
                getServiceDetail = serviceDetailUseCase,
                getConfidenceScore = confidenceScoreUseCase,
                locationProvider = locationProvider,
                localizer = localizer,
                getCurrentLocale = getCurrentLocale,
            )

            assertThat(vm.confidenceScoreState.value).isEqualTo(ConfidenceScoreUiState.Hidden)
        }
}
